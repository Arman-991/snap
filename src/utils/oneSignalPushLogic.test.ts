import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildOneSignalNotificationPayload,
  buildOrderPushMessage,
  buildTestPushMessage,
  computeOrderAndLifetimeSavingsForPush,
  resolveTargetUidFromInput,
} from './oneSignalPushLogic.ts';
import type { OrderRecord } from '../types/grocery.ts';

function makeOrder(overrides: Partial<OrderRecord>): OrderRecord {
  return {
    id: 'ord_1',
    orderNumber: 'SM-1001',
    userId: 'uid_customer_1',
    customerName: 'Dara Karim',
    phoneDisplay: '0750 123 4567',
    phoneNormalized: '9647501234567',
    addressText: 'Empire World',
    buildingNotes: '',
    gps: null,
    googleMapsUrl: '',
    items: [],
    subtotal: 25000,
    totalSavings: 3500,
    deliveryFee: 2000,
    grandTotal: 27000,
    status: 'Confirmed',
    createdAtMs: 1700000000000,
    updatedAtMs: 1700000000000,
    ...overrides,
  };
}

describe('OneSignal Push Logic', () => {
  it('builds warm Confirmed push notifications in ku, ar, and en', () => {
    const ku = buildOrderPushMessage({
      status: 'Confirmed',
      orderNumber: 'SM-4021',
      customerName: 'ئارەڤان',
      orderSavings: 2000,
      lifetimeSavings: 8000,
      language: 'ku',
    });
    assert.ok(ku.title.includes('SM-4021'));
    assert.ok(ku.body.includes('ئارەڤان'));

    const ar = buildOrderPushMessage({
      status: 'Confirmed',
      orderNumber: 'SM-4021',
      customerName: 'دارا',
      orderSavings: 2000,
      lifetimeSavings: 8000,
      language: 'ar',
    });
    assert.ok(ar.title.includes('SM-4021'));
    assert.ok(ar.body.includes('دارا'));

    const en = buildOrderPushMessage({
      status: 'Confirmed',
      orderNumber: 'SM-4021',
      customerName: 'Dara',
      orderSavings: 2000,
      lifetimeSavings: 8000,
      language: 'en',
    });
    assert.ok(en.title.includes('SM-4021'));
    assert.ok(en.body.includes('Dara'));
  });

  it('builds Delivered push notifications with order + lifetime savings and omits savings cleanly when 0', () => {
    const withSavings = buildOrderPushMessage({
      status: 'Delivered',
      orderNumber: 'SM-5001',
      customerName: 'Dara',
      orderSavings: 3500,
      lifetimeSavings: 14500,
      language: 'en',
    });
    assert.ok(withSavings.title.includes('Dara'));
    assert.ok(withSavings.body.includes('3,500'));
    assert.ok(withSavings.body.includes('14,500'));

    const zeroSavingsKu = buildOrderPushMessage({
      status: 'Delivered',
      orderNumber: 'SM-5002',
      customerName: 'شیرین',
      orderSavings: 0,
      lifetimeSavings: 0,
      language: 'ku',
    });
    assert.ok(zeroSavingsKu.title.includes('شیرین'));
    assert.ok(!zeroSavingsKu.body.includes('0 د.ع'));

    const onlyLifetimeAr = buildOrderPushMessage({
      status: 'Delivered',
      orderNumber: 'SM-5003',
      customerName: 'سارة',
      orderSavings: 0,
      lifetimeSavings: 9000,
      language: 'ar',
    });
    assert.ok(onlyLifetimeAr.body.includes('9,000'));
  });

  it('builds valid OneSignal v16 REST payload targeting External User ID', () => {
    const payload = buildOneSignalNotificationPayload({
      appId: '  11111111-2222-3333-4444-555555555555  ',
      externalUserId: 'uid_abc_123',
      title: 'داواکارییەکەت گەیشت!',
      body: 'سوپاس بۆ کڕینت!',
      url: 'https://example.com/?view=orders',
    });

    assert.equal(payload.app_id, '11111111-2222-3333-4444-555555555555');
    assert.deepEqual(payload.include_aliases.external_id, ['uid_abc_123']);
    assert.equal(payload.target_channel, 'push');
    assert.equal(payload.headings.en, 'داواکارییەکەت گەیشت!');
    assert.equal(payload.contents.en, 'سوپاس بۆ کڕینت!');
    assert.equal(payload.url, 'https://example.com/?view=orders');
  });

  it('computes lifetimeSavings on Delivered transition without double counting', () => {
    const prevDelivered = makeOrder({
      id: 'ord_prev',
      status: 'Delivered',
      totalSavings: 4000,
    });
    const currentTransitioning = makeOrder({
      id: 'ord_curr',
      status: 'Bought',
      totalSavings: 2500,
    });
    const otherCustomer = makeOrder({
      id: 'ord_other',
      userId: 'uid_other',
      phoneNormalized: '9647709998888',
      status: 'Delivered',
      totalSavings: 99000,
    });

    const result = computeOrderAndLifetimeSavingsForPush(
      [prevDelivered, currentTransitioning, otherCustomer],
      currentTransitioning,
      'Delivered'
    );
    assert.equal(result.orderSavings, 2500);
    assert.equal(result.lifetimeSavings, 6500);

    // If order already reflects Delivered in snapshot, still no double-counting
    const alreadyDelivered = { ...currentTransitioning, status: 'Delivered' as const };
    const resultAlready = computeOrderAndLifetimeSavingsForPush(
      [prevDelivered, alreadyDelivered, otherCustomer],
      alreadyDelivered,
      'Delivered'
    );
    assert.equal(resultAlready.lifetimeSavings, 6500);
  });

  it('resolves customer UID from Iraqi phone input or raw Firebase UID', () => {
    const users = [
      {
        uid: 'uid_erbil_99',
        fullName: 'Arevan',
        phoneDisplay: '0750 123 4567',
        phoneNormalized: '9647501234567',
        language: 'ku' as const,
      },
    ];

    const byPhone = resolveTargetUidFromInput('0750 123 4567', users);
    assert.equal(byPhone.uid, 'uid_erbil_99');
    assert.equal(byPhone.matchedUser?.language, 'ku');

    const byIntlPhone = resolveTargetUidFromInput('+9647501234567', users);
    assert.equal(byIntlPhone.uid, 'uid_erbil_99');

    const byRawUid = resolveTargetUidFromInput('customUid_987654', users);
    assert.equal(byRawUid.uid, 'customUid_987654');
    assert.equal(byRawUid.matchedUser, null);

    const unknownPhone = resolveTargetUidFromInput('0750 999 0000', users);
    assert.equal(unknownPhone.uid, null);
  });

  it('builds localized test push copy for all 3 languages', () => {
    for (const lang of ['ku', 'ar', 'en'] as const) {
      const msg = buildTestPushMessage(lang);
      assert.ok(msg.title.length > 3);
      assert.ok(msg.body.length > 10);
    }
  });
});
