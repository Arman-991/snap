export interface Point2D {
  x: number;
  y: number;
}

export interface FlyToBasketOptions {
  /** Product image element (preferred) or tapped button element to launch from. */
  sourceEl: HTMLElement | null;
  /** Product photo URL; falls back to a crisp green "+1" badge if missing or broken. */
  imageUrl?: string | null;
  /** Animation duration in ms (default ~520ms). */
  durationMs?: number;
}

export const BOTTOM_FLOATING_BASKET_ID = 'bottom-floating-basket';
export const TOP_HEADER_BASKET_ID = 'top-header-basket';

const DEFAULT_DURATION_MS = 520;
const THUMB_SIZE_PX = 48; // w-12 h-12
const HALF_THUMB_PX = THUMB_SIZE_PX / 2;

const activeBounceTimers = new WeakMap<HTMLElement, number>();

/**
 * Pure quadratic Bézier interpolation:
 * B(t) = (1 - t)^2 * P0 + 2(1 - t)t * P1 + t^2 * P2
 */
export function computeQuadraticBezierPoint(
  t: number,
  p0: Point2D,
  p1: Point2D,
  p2: Point2D
): Point2D {
  const clampedT = Math.max(0, Math.min(1, t));
  const inv = 1 - clampedT;
  const invSq = inv * inv;
  const tSq = clampedT * clampedT;
  const mid = 2 * inv * clampedT;

  return {
    x: invSq * p0.x + mid * p1.x + tSq * p2.x,
    y: invSq * p0.y + mid * p1.y + tSq * p2.y,
  };
}

/**
 * Computes an elevated control point so the flying thumbnail arcs gently upward
 * first, then swoops smoothly down into the bottom floating basket.
 */
export function computeFlightArcControlPoint(
  start: Point2D,
  end: Point2D
): Point2D {
  const dx = end.x - start.x;
  const dy = Math.abs(end.y - start.y);
  // Shift control X slightly toward the launch point for a lively parabolic toss
  const ctrlX = start.x + dx * 0.42;
  // Lift above the higher of start/end so even bottom-of-screen taps curve upward cleanly
  const lift = Math.max(76, Math.min(165, dy * 0.24 + 72));
  const ctrlY = Math.min(start.y, end.y) - lift;
  return { x: ctrlX, y: ctrlY };
}

/**
 * Smooth ease-in-out curve that lifts gently out of the product card and accelerates
 * cleanly into the basket catch.
 */
export function easeFlightProgress(rawT: number): number {
  const t = Math.max(0, Math.min(1, rawT));
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function replayCssClass(
  el: HTMLElement | null,
  className: string,
  durationMs: number
): void {
  if (!el) return;
  const prevTimer = activeBounceTimers.get(el);
  if (prevTimer !== undefined) {
    window.clearTimeout(prevTimer);
  }
  el.classList.remove(className);
  // Force reflow so rapid consecutive landings always replay from 0%
  void el.offsetWidth;
  el.classList.add(className);

  const timer = window.setTimeout(() => {
    el.classList.remove(className);
    activeBounceTimers.delete(el);
  }, durationMs);
  activeBounceTimers.set(el, timer);
}

/**
 * Simultaneously triggers the catch bounce on BOTH the bottom floating basket
 * and the top header basket (and pops their live item count badges).
 */
export function triggerSyncedBasketBounce(): void {
  if (typeof document === 'undefined') return;

  const bottomBasket = document.getElementById(BOTTOM_FLOATING_BASKET_ID);
  const topBasket = document.getElementById(TOP_HEADER_BASKET_ID);

  replayCssClass(bottomBasket, 'animate-basket-catch', 340);
  replayCssClass(topBasket, 'animate-basket-catch', 340);

  const bottomBadge = bottomBasket?.querySelector<HTMLElement>(
    '[data-testid="floating-cart-count"]'
  );
  const topBadge = topBasket?.querySelector<HTMLElement>(
    '[data-testid="header-cart-count"]'
  );

  replayCssClass(bottomBadge ?? null, 'animate-basket-count-pop', 280);
  replayCssClass(topBadge ?? null, 'animate-basket-count-pop', 280);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('snapmarket:basket-land'));
  }
}

function resolveTargetBasketCenter(): Point2D {
  const bottomEl = document.getElementById(BOTTOM_FLOATING_BASKET_ID);
  if (bottomEl) {
    const rect = bottomEl.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
    }
  }

  // Exact fallback matching FloatingCartBar geometry inside max-w-[480px] shell:
  // bottom: 4.75rem (76px) + radius 28px; end-4 (16px) + radius 28px
  const shell = document.querySelector<HTMLElement>(
    '[data-testid="customer-app-shell"]'
  );
  const shellRect = shell?.getBoundingClientRect();
  const isRtl = document.documentElement.dir === 'rtl';
  const leftEdge = shellRect ? shellRect.left : Math.max(0, (window.innerWidth - 480) / 2);
  const rightEdge = shellRect
    ? shellRect.right
    : Math.min(window.innerWidth, (window.innerWidth + 480) / 2);

  return {
    x: isRtl ? leftEdge + 16 + 28 : rightEdge - 16 - 28,
    y: window.innerHeight - 76 - 28,
  };
}

function createFlyingNode(imageUrl?: string | null): HTMLDivElement {
  const wrapper = document.createElement('div');
  wrapper.setAttribute('aria-hidden', 'true');
  wrapper.setAttribute('data-flying-basket-thumb', '1');
  wrapper.className =
    'fixed top-0 left-0 z-[9999] pointer-events-none flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border-2 border-green-500 bg-green-600 text-xs font-extrabold text-white shadow-lg';
  wrapper.style.willChange = 'transform, opacity';

  const trimmedUrl = imageUrl?.trim() || '';
  if (trimmedUrl) {
    const img = document.createElement('img');
    img.src = trimmedUrl;
    img.alt = '';
    img.decoding = 'async';
    img.className = 'h-full w-full rounded-full object-cover';
    img.onerror = () => {
      wrapper.textContent = '+1';
    };
    wrapper.appendChild(img);
  } else {
    wrapper.textContent = '+1';
  }

  return wrapper;
}

/**
 * Launches an independent GPU-only curved fly-to-basket animation from `sourceEl`
 * into `#bottom-floating-basket`, then fires the simultaneous catch bounce on
 * both `#bottom-floating-basket` and `#top-header-basket` upon landing.
 */
export function triggerFlyToBasket({
  sourceEl,
  imageUrl,
  durationMs = DEFAULT_DURATION_MS,
}: FlyToBasketOptions): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  if (prefersReducedMotion()) {
    // Wait 1 frame so first-item floating basket is mounted before syncing
    window.requestAnimationFrame(() => {
      triggerSyncedBasketBounce();
    });
    return;
  }

  // Capture start coordinates immediately on click before any scroll/re-render shifts layout
  let start: Point2D;
  if (sourceEl) {
    const rect = sourceEl.getBoundingClientRect();
    start = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
  } else {
    start = {
      x: window.innerWidth / 2,
      y: window.innerHeight * 0.4,
    };
  }

  const startFlight = () => {
    const end = resolveTargetBasketCenter();
    const control = computeFlightArcControlPoint(start, end);
    const flyer = createFlyingNode(imageUrl);

    flyer.style.transform = `translate3d(${start.x - HALF_THUMB_PX}px, ${start.y - HALF_THUMB_PX}px, 0) scale(1)`;
    flyer.style.opacity = '1';
    document.body.appendChild(flyer);

    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const rawT = Math.min(1, elapsed / durationMs);
      const easedT = easeFlightProgress(rawT);

      const pos = computeQuadraticBezierPoint(easedT, start, control, end);
      const scale = 1 - 0.68 * easedT; // 1.0 -> 0.32
      const opacity = rawT < 0.78 ? 1 : Math.max(0.28, 1 - ((rawT - 0.78) / 0.22) * 0.72);

      flyer.style.transform = `translate3d(${(pos.x - HALF_THUMB_PX).toFixed(2)}px, ${(pos.y - HALF_THUMB_PX).toFixed(2)}px, 0) scale(${scale.toFixed(3)})`;
      flyer.style.opacity = opacity.toFixed(3);

      if (rawT < 1) {
        window.requestAnimationFrame(step);
      } else {
        flyer.remove();
        triggerSyncedBasketBounce();
      }
    };

    window.requestAnimationFrame(step);
  };

  // On 0 -> 1 first item, #bottom-floating-basket mounts on this React commit.
  // Waiting 1 animation frame lets React mount it so we read its exact DOM coordinates.
  if (!document.getElementById(BOTTOM_FLOATING_BASKET_ID)) {
    window.requestAnimationFrame(startFlight);
  } else {
    startFlight();
  }
}
