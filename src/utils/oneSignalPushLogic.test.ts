import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildOneSignalNotificationPayload,
  buildOrderPushMessage,
  buildTestPushMessage,
  computeOrderAndLifetimeSavingsForPush,
  extractOneSignalErrorMessage,
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

  it('builds OneSignal payload using include_subscription_ids when subscriptionId exists, else include_aliases.external_id', () => {
    const bySub = buildOneSignalNotificationPayload({
      appId: '  11111111-2222-3333-4444-555555555555  ',
      externalUserId: 'uid_abc_123',
      subscriptionId: 'sub_device_999',
      title: 'داواکارییەکەت گەیشت!',
      body: 'سوپاس بۆ کڕینت!',
      url: 'https://example.com/?view=orders',
    });

    assert.equal(bySub.app_id, '11111111-2222-3333-4444-555555555555');
    assert.deepEqual(bySub.include_subscription_ids, ['sub_device_999']);
    assert.equal(bySub.include_aliases, undefined);
    assert.equal(bySub.target_channel, 'push');
    assert.equal(bySub.headings.en, 'داواکارییەکەت گەیشت!');
    assert.equal(bySub.contents.en, 'سوپاس بۆ کڕینت!');
    assert.equal(bySub.url, 'https://example.com/?view=orders');

    const byAlias = buildOneSignalNotificationPayload({
      appId: '11111111-2222-3333-4444-555555555555',
      externalUserId: 'uid_abc_123',
      subscriptionId: null,
      title: 'Confirmed',
      body: 'Preparing your groceries',
    });
    assert.deepEqual(byAlias.include_aliases?.external_id, ['uid_abc_123']);
    assert.equal(byAlias.include_subscription_ids, undefined);
  });

  it('extracts clear readable errors from OneSignal responses including HTTP 200 unsubscribed errors', () => {
    assert.equal(
      extractOneSignalErrorMessage(200, { id: 'notif_123', recipients: 1 }),
      null
    );

    const notSubscribed = extractOneSignalErrorMessage(200, {
      id: '',
      recipients: 0,
      errors: ['All included players are not subscribed'],
    });
    assert.ok(notSubscribed?.includes('All included players are not subscribed'));
    assert.ok(notSubscribed?.includes('Median Android APK'));

    const invalidAliases = extractOneSignalErrorMessage(200, {
      errors: { invalid_aliases: { external_id: ['uid_123'] } },
    });
    assert.ok(invalidAliases?.includes('not registered in OneSignal yet'));

    const unauthorized = extractOneSignalErrorMessage(401, {});
    assert.ok(unauthorized?.includes('401'));
    assert.ok(unauthorized?.includes('os_v2_app_'));
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

    const alreadyDelivered = { ...currentTransitioning, status: 'Delivered' as const };
    const resultAlready = computeOrderAndLifetimeSavingsForPush(
      [prevDelivered, alreadyDelivered, otherCustomer],
      alreadyDelivered,
      'Delivered'
    );
    assert.equal(resultAlready.lifetimeSavings, 6500);
  });

  it('resolves customer UID and subscriptionId from Iraqi phone input or raw Firebase UID', () => {
    const users = [
      {
        uid: 'uid_erbil_99',
        fullName: 'Arevan',
        phoneDisplay: '0750 123 4567',
        phoneNormalized: '9647501234567',
        language: 'ku' as const,
        onesignalSubscriptionId: 'sub_erbil_001',
      },
    ];

    const byPhone = resolveTargetUidFromInput('0750 123 4567', users);
    assert.equal(byPhone.uid, 'uid_erbil_99');
    assert.equal(byPhone.matchedUser?.language, 'ku');
    assert.equal(byPhone.matchedUser?.onesignalSubscriptionId, 'sub_erbil_001');

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
