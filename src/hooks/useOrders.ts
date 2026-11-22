import { useCallback, useEffect, useRef, useState } from 'react';
import {
  OrderGuardError,
  placeCashOnDeliveryOrder,
  subscribeToCustomerOrders,
} from '../services/firestoreService';
import type {
  OrderRecord,
  ResolvedCartLine,
  StoreSettings,
  UserProfile,
} from '../types/grocery';

export type OrderSubmitErrorCode =
  | 'PHONE_BLOCKED'
  | 'RATE_LIMIT_EXCEEDED'
  | 'STORE_CLOSED'
  | 'BELOW_MINIMUM'
  | 'PROFILE_REQUIRED'
  | 'OFFLINE'
  | 'GENERIC';

export function useOrders(uid: string | null, authReady: boolean) {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const [submitErrorCode, setSubmitErrorCode] =
    useState<OrderSubmitErrorCode | null>(null);

  useEffect(() => {
    if (!authReady) return;
    if (!uid) {
      setOrders([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToCustomerOrders(
      uid,
      (liveOrders) => {
        setOrders(liveOrders);
        setLoading(false);
      },
      () => {
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [authReady, uid]);

  const placeOrder = useCallback(
    async (params: {
      profile: UserProfile | null;
      lines: ResolvedCartLine[];
      settings: StoreSettings;
    }): Promise<OrderRecord | null> => {
      if (submittingRef.current) return null;
      if (!params.profile) {
        setSubmitErrorCode('PROFILE_REQUIRED');
        return null;
      }

      submittingRef.current = true;
      setIsSubmitting(true);
      setSubmitErrorCode(null);

      try {
        const order = await placeCashOnDeliveryOrder({
          uid,
          profile: params.profile,
          lines: params.lines,
          settings: params.settings,
        });
        return order;
      } catch (err) {
        if (err instanceof OrderGuardError) {
          if (err.code === 'PHONE_BLOCKED') setSubmitErrorCode('PHONE_BLOCKED');
          else if (err.code === 'RATE_LIMIT_EXCEEDED')
            setSubmitErrorCode('RATE_LIMIT_EXCEEDED');
          else if (err.code === 'STORE_CLOSED') setSubmitErrorCode('STORE_CLOSED');
          else if (err.code === 'BELOW_MINIMUM') setSubmitErrorCode('BELOW_MINIMUM');
          else if (err.code === 'OFFLINE') setSubmitErrorCode('OFFLINE');
          else setSubmitErrorCode('GENERIC');
        } else {
          const msg = err instanceof Error ? err.message : String(err);
          if (msg.includes('permission-denied') || msg.includes('insufficient permissions')) {
            setSubmitErrorCode('PHONE_BLOCKED');
          } else {
            setSubmitErrorCode('GENERIC');
          }
        }
        return null;
      } finally {
        submittingRef.current = false;
        setIsSubmitting(false);
      }
    },
    [uid]
  );

  return {
    orders,
    loading,
    isSubmitting,
    submitErrorCode,
    clearSubmitError: () => setSubmitErrorCode(null),
    placeOrder,
  };
}
