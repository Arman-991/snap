import { useCallback, useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '../lib/firebase';
import {
  clearCachedCartEverywhere,
  ensureAnonymousCustomerAuth,
  fetchUserProfile,
  loadCachedCart,
  loadCachedProfile,
  saveCachedProfile,
  signOutCurrentUser,
  upsertUserProfile,
} from '../services/firestoreService';
import type {
  CartItem,
  Language,
  ProfileFormInput,
  UserProfile,
} from '../types/grocery';
import { normalizeIraqiPhone } from '../utils/supermarketLogic';

export function useAuthProfile(
  language: Language,
  onSyncLanguage: (lang: Language) => void
) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [anonymousDisabled, setAnonymousDisabled] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(() =>
    loadCachedProfile()
  );
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!active) return;

      if (!currentUser) {
        const silent = await ensureAnonymousCustomerAuth();
        if (!active) return;
        setAnonymousDisabled(silent.anonymousDisabled);
        if (!silent.user) {
          setUser(null);
          setAuthReady(true);
          setProfileLoading(false);
          return;
        }
        // onAuthStateChanged will fire again with the signed-in anonymous user
        return;
      }

      setUser(currentUser);
      setAnonymousDisabled(false);
      setAuthReady(true);

      const remoteProfile = await fetchUserProfile(currentUser.uid).catch(
        () => null
      );

      if (!active) return;

      if (remoteProfile) {
        setProfile(remoteProfile);
        onSyncLanguage(remoteProfile.language);
      } else {
        const cached = loadCachedProfile();
        if (cached) {
          setProfile({ ...cached, uid: currentUser.uid });
        }
      }
      setProfileLoading(false);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [onSyncLanguage]);

  const saveProfile = useCallback(
    async (
      input: ProfileFormInput,
      currentCart?: CartItem[]
    ): Promise<UserProfile> => {
      const normalized = normalizeIraqiPhone(input.phoneInput);
      const cartToSave = currentCart ?? loadCachedCart();

      const saved = await upsertUserProfile(user?.uid ?? null, {
        fullName: input.fullName.trim(),
        phoneDisplay: normalized.phoneDisplay,
        phoneNormalized: normalized.phoneNormalized,
        addressText: input.addressText.trim(),
        buildingNotes: input.buildingNotes.trim(),
        gps: input.gps,
        language: input.language || language,
        cart: cartToSave,
      });

      setProfile(saved);
      onSyncLanguage(saved.language);
      return saved;
    },
    [language, onSyncLanguage, user?.uid]
  );

  const clearProfileCartLocal = useCallback(() => {
    setProfile((prev) => (prev ? { ...prev, cart: [] } : prev));
  }, []);

  const logoutAndReset = useCallback(async () => {
    saveCachedProfile(null);
    clearCachedCartEverywhere();
    setProfile(null);
    try {
      await signOutCurrentUser();
    } catch {
      // ignore sign-out error on offline reset
    }
  }, []);

  return {
    user,
    authReady,
    anonymousDisabled,
    profile,
    profileLoading,
    saveProfile,
    clearProfileCartLocal,
    logoutAndReset,
  };
}
