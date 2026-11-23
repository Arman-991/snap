import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express, { type Request, type Response } from 'express';
import {
  buildOneSignalNotificationPayload,
  extractOneSignalErrorMessage,
} from './src/utils/oneSignalPayload.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT) || 3000;
const ONESIGNAL_API_URL = 'https://api.onesignal.com/notifications';
const FIREBASE_CERTS_URL =
  'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';
const BOOTSTRAPPED_OWNER_EMAIL = 'arevan.dg@gmail.com';

interface FirebaseAppletConfig {
  projectId: string;
  firestoreDatabaseId?: string;
}

function loadFirebaseConfig(): FirebaseAppletConfig {
  const configPath = path.resolve(__dirname, 'firebase-applet-config.json');
  const raw = fs.readFileSync(configPath, 'utf-8');
  return JSON.parse(raw) as FirebaseAppletConfig;
}

const FIREBASE_CONFIG = loadFirebaseConfig();

// Cached Google public X.509 certificates for verifying Firebase Auth ID tokens
let cachedCerts: Record<string, string> = {};
let certsExpiresAtMs = 0;

async function getFirebasePublicCerts(): Promise<Record<string, string>> {
  const now = Date.now();
  if (now < certsExpiresAtMs && Object.keys(cachedCerts).length > 0) {
    return cachedCerts;
  }

  const resp = await fetch(FIREBASE_CERTS_URL);
  if (!resp.ok) {
    throw new Error(`Unable to fetch Firebase public keys (HTTP ${resp.status})`);
  }

  const cacheControl = resp.headers.get('cache-control') || '';
  const maxAgeMatch = cacheControl.match(/max-age=(\d+)/i);
  const maxAgeSec = maxAgeMatch ? Number(maxAgeMatch[1]) : 3600;
  cachedCerts = (await resp.json()) as Record<string, string>;
  certsExpiresAtMs = now + Math.max(60, maxAgeSec) * 1000;
  return cachedCerts;
}

interface VerifiedFirebaseToken {
  uid: string;
  email?: string;
  emailVerified: boolean;
  signInProvider?: string;
}

function decodeBase64UrlJson<T>(segment: string): T {
  const normalized = segment.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  return JSON.parse(Buffer.from(padded, 'base64').toString('utf-8')) as T;
}

async function verifyFirebaseIdToken(
  idToken: string
): Promise<VerifiedFirebaseToken | null> {
  const parts = idToken.split('.');
  if (parts.length !== 3) return null;

  try {
    const [headerB64, payloadB64, signatureB64] = parts;
    const header = decodeBase64UrlJson<{ alg?: string; kid?: string }>(headerB64);
    if (header.alg !== 'RS256' || !header.kid) return null;

    const certs = await getFirebasePublicCerts();
    const certPem = certs[header.kid];
    if (!certPem) return null;

    const verifier = crypto.createVerify('RSA-SHA256');
    verifier.update(`${headerB64}.${payloadB64}`);
    verifier.end();

    const sigBuf = Buffer.from(
      signatureB64.replace(/-/g, '+').replace(/_/g, '/'),
      'base64'
    );
    const validSig = verifier.verify(certPem, sigBuf);
    if (!validSig) return null;

    const payload = decodeBase64UrlJson<{
      aud?: string;
      iss?: string;
      sub?: string;
      exp?: number;
      iat?: number;
      email?: string;
      email_verified?: boolean;
      firebase?: { sign_in_provider?: string };
    }>(payloadB64);

    const nowSec = Math.floor(Date.now() / 1000);
    const expectedIss = `https://securetoken.google.com/${FIREBASE_CONFIG.projectId}`;

    if (payload.aud !== FIREBASE_CONFIG.projectId) return null;
    if (payload.iss !== expectedIss) return null;
    if (!payload.sub || typeof payload.sub !== 'string') return null;
    if (typeof payload.exp !== 'number' || payload.exp <= nowSec) return null;
    if (typeof payload.iat !== 'number' || payload.iat > nowSec + 300) return null;

    return {
      uid: payload.sub,
      email: typeof payload.email === 'string' ? payload.email : undefined,
      emailVerified: payload.email_verified === true,
      signInProvider: payload.firebase?.sign_in_provider,
    };
  } catch {
    return null;
  }
}

async function verifyAdminCaller(
  req: Request
): Promise<{ authorized: true; uid: string } | { authorized: false; reason: string }> {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    return {
      authorized: false,
      reason: 'Missing Admin authentication token. Please sign in to /admin again.',
    };
  }

  const idToken = authHeader.slice('Bearer '.length).trim();
  if (!idToken || idToken.length > 4096) {
    return { authorized: false, reason: 'Invalid Admin authentication token.' };
  }

  const verified = await verifyFirebaseIdToken(idToken);
  if (!verified) {
    return {
      authorized: false,
      reason: 'Admin session expired or invalid. Please sign in again.',
    };
  }

  if (verified.signInProvider === 'anonymous') {
    return { authorized: false, reason: 'Admin account required.' };
  }

  // Bootstrapped owner fast-path (matches firestore.rules)
  if (
    verified.email?.toLowerCase() === BOOTSTRAPPED_OWNER_EMAIL &&
    verified.emailVerified
  ) {
    return { authorized: true, uid: verified.uid };
  }

  // Verify admins/{uid} document using the caller's own verified Firebase ID token
  const dbId = encodeURIComponent(
    FIREBASE_CONFIG.firestoreDatabaseId || '(default)'
  );
  const adminDocUrl = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
    FIREBASE_CONFIG.projectId
  )}/databases/${dbId}/documents/admins/${encodeURIComponent(verified.uid)}`;

  try {
    const resp = await fetch(adminDocUrl, {
      headers: { Authorization: `Bearer ${idToken}` },
    });
    if (!resp.ok) {
      return {
        authorized: false,
        reason: 'Account is not authorized in admins/{uid}.',
      };
    }
    const docData = (await resp.json()) as {
      fields?: { role?: { stringValue?: string } };
    };
    const role = docData.fields?.role?.stringValue;
    if (role === 'owner' || role === 'staff') {
      return { authorized: true, uid: verified.uid };
    }
    return { authorized: false, reason: 'Invalid admin role.' };
  } catch {
    return {
      authorized: false,
      reason: 'Could not verify admin authorization.',
    };
  }
}

function sanitizeSafeHttpUrl(raw: unknown): string | undefined {
  if (typeof raw !== 'string') return undefined;
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > 400) return undefined;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed.toString();
    }
    return undefined;
  } catch {
    return undefined;
  }
}

function isValidTargetIdentifier(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.trim().length > 0 &&
    value.trim().length <= 128 &&
    /^[a-zA-Z0-9_\-]+$/.test(value.trim())
  );
}

async function startServer() {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '64kb' }));

  // 1. Health check so Admin Settings can confirm the Node push backend is online
  app.get('/api/push-health', (_req: Request, res: Response) => {
    const hasEnvAppId = Boolean(process.env.ONESIGNAL_APP_ID?.trim());
    const hasEnvApiKey = Boolean(process.env.ONESIGNAL_REST_API_KEY?.trim());
    res.json({
      ok: true,
      backend: 'express',
      envConfigured: hasEnvAppId && hasEnvApiKey,
      timestamp: Date.now(),
    });
  });

  // 2. Server-side OneSignal Push Notification Proxy (eliminates browser CORS "Failed to fetch")
  app.post('/api/send-push', async (req: Request, res: Response) => {
    const adminCheck = await verifyAdminCaller(req);
    if (!adminCheck.authorized) {
      res.status(403).json({
        ok: false,
        httpStatus: 403,
        error: adminCheck.reason,
      });
      return;
    }

    const body = (req.body ?? {}) as Record<string, unknown>;
    const rawAppId =
      typeof body.appId === 'string' && body.appId.trim()
        ? body.appId.trim()
        : (process.env.ONESIGNAL_APP_ID || '').trim();
    const rawApiKey =
      typeof body.apiKey === 'string' && body.apiKey.trim()
        ? body.apiKey.trim()
        : (process.env.ONESIGNAL_REST_API_KEY || '').trim();

    if (!rawAppId || rawAppId.length > 128 || !rawApiKey || rawApiKey.length > 256) {
      res.status(400).json({
        ok: false,
        httpStatus: 400,
        error:
          'OneSignal App ID and REST API Key are required (configure in Admin Settings or AI Studio Secrets).',
      });
      return;
    }

    const subscriptionId = isValidTargetIdentifier(body.subscriptionId)
      ? body.subscriptionId.trim()
      : '';
    const targetUid = isValidTargetIdentifier(body.targetUid)
      ? body.targetUid.trim()
      : '';

    if (!subscriptionId && !targetUid) {
      res.status(400).json({
        ok: false,
        httpStatus: 400,
        error: 'A valid targetUid or subscriptionId is required to send a push notification.',
      });
      return;
    }

    const title = typeof body.title === 'string' ? body.title.trim().slice(0, 200) : '';
    const messageBody =
      typeof body.body === 'string' ? body.body.trim().slice(0, 500) : '';

    if (!title || !messageBody) {
      res.status(400).json({
        ok: false,
        httpStatus: 400,
        error: 'Notification title and body are required.',
      });
      return;
    }

    const safeUrl = sanitizeSafeHttpUrl(body.url);
    const payload = buildOneSignalNotificationPayload({
      appId: rawAppId,
      externalUserId: targetUid || undefined,
      subscriptionId: subscriptionId || undefined,
      title,
      body: messageBody,
      url: safeUrl,
    });

    try {
      const osResponse = await fetch(ONESIGNAL_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          Authorization: `Key ${rawApiKey}`,
        },
        body: JSON.stringify(payload),
      });

      const rawText = await osResponse.text();
      let osData: Record<string, unknown> = {};
      try {
        osData = rawText ? (JSON.parse(rawText) as Record<string, unknown>) : {};
      } catch {
        osData = { rawText: rawText.slice(0, 300) };
      }

      const extractedError = extractOneSignalErrorMessage(osResponse.status, osData);

      if (!osResponse.ok || extractedError) {
        res.status(osResponse.ok ? 422 : osResponse.status).json({
          ok: false,
          httpStatus: osResponse.status,
          error: extractedError || `OneSignal returned HTTP ${osResponse.status}`,
          onesignal: osData,
        });
        return;
      }

      res.status(200).json({
        ok: true,
        httpStatus: osResponse.status,
        id: typeof osData.id === 'string' ? osData.id : undefined,
        recipients:
          typeof osData.recipients === 'number' ? osData.recipients : undefined,
        targetingMode: subscriptionId ? 'subscription_id' : 'external_id',
        onesignal: osData,
      });
    } catch (err) {
      const detail =
        err instanceof Error ? err.message : 'Unable to reach api.onesignal.com';
      res.status(502).json({
        ok: false,
        httpStatus: 502,
        error: `Server could not reach OneSignal API: ${detail}`,
      });
    }
  });

  const distDir = path.resolve(__dirname, 'dist');
  const useViteDev =
    process.env.NODE_ENV === 'development' ||
    !fs.existsSync(path.join(distDir, 'index.html'));

  if (useViteDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Supermarket server listening on http://0.0.0.0:${PORT}`);
  });
}

void startServer();
