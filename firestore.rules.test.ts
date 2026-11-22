import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const rulesPath = path.resolve(process.cwd(), 'firestore.rules');
const rulesText = fs.readFileSync(rulesPath, 'utf8');

test('firestore.rules includes default-deny global safety net', () => {
  assert.match(rulesText, /match \/\{document=\*\*\}\s*\{\s*allow read, write: if false;\s*\}/);
});

test('firestore.rules secures all 12 required supermarket and admin collections', () => {
  const requiredMatches = [
    'match /settings/{settingId}',
    'match /cms/{docId}',
    'match /categories/{categoryId}',
    'match /products/{productId}',
    'match /banners/{bannerId}',
    'match /users/{uid}',
    'match /orders/{orderId}',
    'match /adminNotes/{noteId}',
    'match /blockedPhones/{phoneNormalized}',
    'match /orderRateLimits/{phoneNormalized}',
    'match /admins/{uid}',
    'match /auditLogs/{logId}',
  ];

  for (const m of requiredMatches) {
    assert.ok(rulesText.includes(m), `Missing rule block: ${m}`);
  }
});

test('firestore.rules enforces strict owner vs staff RBAC and adminNotes isolation', () => {
  assert.ok(rulesText.includes('function isOwner()'), 'Missing isOwner() helper');
  assert.ok(rulesText.includes('function isStaff()'), 'Missing isStaff() helper');
  assert.ok(rulesText.includes('function isAdmin()'), 'Missing isAdmin() helper');
  assert.ok(
    rulesText.includes("get(/databases/$(database)/documents/admins/$(request.auth.uid)).data.role"),
    'Must resolve role from admins/{uid} document'
  );
  assert.ok(
    rulesText.includes('request.auth.token.email_verified == true'),
    'Must enforce email_verified == true for bootstrapped owner'
  );
  assert.ok(
    rulesText.includes("incoming().status == 'New'"),
    'Customer orders must start with New status'
  );
  assert.ok(
    rulesText.includes('!exists(/databases/$(database)/documents/blockedPhones/$(incoming().phoneNormalized))'),
    'Must block orders from blockedPhones'
  );
  assert.ok(
    rulesText.includes("incoming().diff(existing()).affectedKeys().hasOnly(['status', 'updatedAt'])"),
    'Order updates must only affect status and updatedAt'
  );

  // Verify auditLogs is owner-read-only, admin-create, immutable
  const auditSection = rulesText.slice(rulesText.indexOf('match /auditLogs/{logId}'));
  assert.ok(auditSection.includes('allow get, list: if isOwner();'), 'auditLogs read must be owner-only');
  assert.ok(auditSection.includes('allow update, delete: if false;'), 'auditLogs must be immutable');

  // Verify anonymous customers cannot read admins/{uid}
  const adminsSection = rulesText.slice(
    rulesText.indexOf('match /admins/{uid}'),
    rulesText.indexOf('match /auditLogs/{logId}')
  );
  assert.ok(
    adminsSection.includes('isNonAnonymous() && request.auth.uid == uid'),
    'admins/{uid} get must require non-anonymous auth'
  );
  assert.ok(adminsSection.includes('allow list: if isOwner();'), 'admins list must be owner-only');

  // Verify staff cannot list customer PII or blockedPhones, but admins can clear cart to []
  const usersSection = rulesText.slice(
    rulesText.indexOf('match /users/{uid}'),
    rulesText.indexOf('match /orders/{orderId}')
  );
  assert.ok(usersSection.includes('allow get: if isValidId(uid) && (isUserSelf(uid) || isOwner());'));
  assert.ok(usersSection.includes('allow list: if isOwner();'));
  assert.ok(
    usersSection.includes("incoming().diff(existing()).affectedKeys().hasOnly(['cart', 'updatedAt'])"),
    'admins must only be allowed to touch cart and updatedAt on users/{uid}'
  );
  assert.ok(
    usersSection.includes('incoming().cart.size() == 0'),
    'admin cart update on users/{uid} must enforce empty cart []'
  );

  const blockedSection = rulesText.slice(
    rulesText.indexOf('match /blockedPhones/{phoneNormalized}'),
    rulesText.indexOf('match /orderRateLimits/{phoneNormalized}')
  );
  assert.ok(blockedSection.includes('allow list: if isOwner();'));

  // Verify orders/{orderId}/adminNotes blocks customers completely
  const notesSection = rulesText.slice(
    rulesText.indexOf('match /adminNotes/{noteId}'),
    rulesText.indexOf('match /blockedPhones/{phoneNormalized}')
  );
  assert.ok(!notesSection.includes('isUserSelf'), 'customers must never read adminNotes');
  assert.ok(notesSection.includes('isAdmin()'), 'adminNotes must require isAdmin()');
  assert.ok(notesSection.includes('allow update: if false;'), 'adminNotes must disallow updates');

  // Verify owner-only writes on categories, banners, settings, cms, blockedPhones, admins
  const ownerOnlyPaths = [
    'match /settings/{settingId}',
    'match /cms/{docId}',
    'match /categories/{categoryId}',
    'match /banners/{bannerId}',
    'match /blockedPhones/{phoneNormalized}',
    'match /admins/{uid}',
  ];
  for (const sectionStart of ownerOnlyPaths) {
    const startIdx = rulesText.indexOf(sectionStart);
    const slice = rulesText.slice(startIdx, startIdx + 700);
    assert.ok(
      slice.includes('isOwner()'),
      `Expected owner-only guard inside ${sectionStart}`
    );
  }
});
