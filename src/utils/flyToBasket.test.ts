import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  computeFlightArcControlPoint,
  computeQuadraticBezierPoint,
  easeFlightProgress,
} from './flyToBasket';

describe('flyToBasket curve math', () => {
  it('starts at exact launch point and lands at exact target point', () => {
    const start = { x: 110, y: 260 };
    const end = { x: 346, y: 740 };
    const ctrl = computeFlightArcControlPoint(start, end);

    const pStart = computeQuadraticBezierPoint(0, start, ctrl, end);
    const pEnd = computeQuadraticBezierPoint(1, start, ctrl, end);

    assert.equal(pStart.x, start.x);
    assert.equal(pStart.y, start.y);
    assert.equal(pEnd.x, end.x);
    assert.equal(pEnd.y, end.y);
  });

  it('curves upward before swooping down into the bottom floating basket', () => {
    const start = { x: 120, y: 300 };
    const end = { x: 350, y: 720 };
    const ctrl = computeFlightArcControlPoint(start, end);

    assert.ok(ctrl.y < start.y, 'control point should sit above start Y');
    assert.ok(ctrl.y < end.y, 'control point should sit above end Y');

    const earlyPoint = computeQuadraticBezierPoint(0.15, start, ctrl, end);
    assert.ok(
      earlyPoint.y < start.y,
      'flying thumbnail should initially arc upward slightly before descending'
    );
  });

  it('clamps easing progress cleanly between 0 and 1', () => {
    assert.equal(easeFlightProgress(-0.2), 0);
    assert.equal(easeFlightProgress(0), 0);
    assert.equal(easeFlightProgress(0.5), 0.5);
    assert.equal(easeFlightProgress(1), 1);
    assert.equal(easeFlightProgress(1.5), 1);
  });
});
