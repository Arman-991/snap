import type { Language, OrderStatus, TextDirection } from '../types/grocery';

export interface TranslationDictionary {
  brandName: string;
  nav: {
    market: string;
    deals: string;
    orders: string;
    profile: string;
    cart: string;
  };
  languageNames: {
    ku: string;
    ar: string;
    en: string;
  };
  onboarding: {
    kicker: string;
    title: string;
    subtitle: string;
    fullNameLabel: string;
    fullNamePlaceholder: string;
    phoneLabel: string;
    phonePlaceholder: string;
    phoneHint: string;
    gpsButton: string;
    gpsLocating: string;
    gpsCaptured: string;
    gpsDeniedFallback: string;
    gpsUnsupportedFallback: string;
    addressLabel: string;
    addressPlaceholder: string;
    buildingNotesLabel: string;
    buildingNotesPlaceholder: string;
    submitCta: string;
    saving: string;
    anonAuthHint: string;
    errors: {
      nameRequired: string;
      nameTooShort: string;
      phoneRequired: string;
      phoneInvalid: string;
      addressRequired: string;
      addressTooShort: string;
      saveFailed: string;
    };
  };
  storefront: {
    storeClosedTitle: string;
    storeClosedBody: string;
    offlineBanner: string;
    searchPlaceholder: string;
    clearSearch: string;
    allCategories: string;
    allSubcategories: string;
    itemsCount: string;
    sections: {
      all: string;
      deals: string;
      popular: string;
      new: string;
      recommended: string;
    };
    loadMore: string;
    loadingMore: string;
    endOfCatalog: string;
    seedBannerTitle: string;
    seedBannerBody: string;
    seedButton: string;
    seedingButton: string;
    seedSuccess: string;
    seedAdminRequired: string;
    signInAdminGoogle: string;
    retry: string;
    loadErrorTitle: string;
    loadErrorBody: string;
    emptyTitle: string;
    emptyBody: string;
    resetFilters: string;
    deliveryHoursLabel: string;
    minOrderLabel: string;
  };
  product: {
    add: string;
    increaseQty: string;
    decreaseQty: string;
    viewDetails: string;
    closeDetails: string;
    ourPriceLabel: string;
    marketPriceLabel: string;
    youSaveLabel: string;
    sizeLabel: string;
    sectionLabel: string;
    codNote: string;
    outOfStock: string;
  };
  cart: {
    title: string;
    close: string;
    clear: string;
    remove: string;
    emptyTitle: string;
    emptyBody: string;
    browseCta: string;
    savingsPrefix: string;
    savingsSuffix: string;
    subtotal: string;
    deliveryFee: string;
    free: string;
    grandTotal: string;
    codLabel: string;
    minimumOrderNoticePrefix: string;
    minimumOrderNoticeSuffix: string;
    storeClosedNotice: string;
    deliverToLabel: string;
    editProfile: string;
    buyButton: string;
    placingOrder: string;
    errors: {
      blockedPhone: string;
      rateLimit: string;
      storeClosed: string;
      belowMinimum: string;
      profileRequired: string;
      offlineOrder: string;
      genericOrderError: string;
    };
  };
  confirmation: {
    title: string;
    callNotice: string;
    orderNumberLabel: string;
    totalLabel: string;
    paymentMethodValue: string;
    whatsappCta: string;
    viewOrdersCta: string;
    continueCta: string;
  };
  orders: {
    title: string;
    subtitle: string;
    emptyTitle: string;
    emptyBody: string;
    startShopping: string;
    orderAgain: string;
    unavailableNotice: string;
    addedBackNotice: string;
    itemsLabel: string;
    codBadge: string;
    confirmedBanner: string;
    deliveredBanner: string;
    dismissAlert: string;
    statuses: Record<Exclude<OrderStatus, 'Fake'>, string>;
  };
  profile: {
    title: string;
    subtitle: string;
    saveChanges: string;
    savedToast: string;
    logoutReset: string;
    logoutConfirmHint: string;
    languageSection: string;
    pwaSectionTitle: string;
    pwaInstallCta: string;
    pwaInstallIOS: string;
    pwaIOSModalTitle: string;
    pwaIOSModalStep1: string;
    pwaIOSModalStep2: string;
    pwaClose: string;
    adminToolsTitle: string;
    adminToolsSubtitle: string;
    adminSignedInAs: string;
    adminRoleLabel: string;
    adminEmailPlaceholder: string;
    adminPasswordPlaceholder: string;
    adminSignInEmail: string;
    adminSignOut: string;
    adminSeedNote: string;
    anonStatusNote: string;
    contactHelpTitle: string;
  };
  retention: {
    lifetimeSavingsTitle: string;
    lifetimeSavingsLine: string;
    thankYouTitle: string;
    thankYouBody: string;
    thankYouBodyNoOrderSavings: string;
    thankYouBodySimple: string;
    mobileNotifTitle: string;
    mobileNotifBody: string;
    mobileNotifBodyNoOrderSavings: string;
    mobileNotifBodySimple: string;
    savedThisOrderLabel: string;
    totalSavedSoFarLabel: string;
    continueShoppingCta: string;
    closeCta: string;
    notificationsTitle: string;
    notificationsEmpty: string;
    markAllRead: string;
    notificationsBellAria: string;
    enableAlertsLabel: string;
    alertsEnabledLabel: string;
    alertsBlockedHint: string;
    alertsUnsupportedHint: string;
    alertsIosInstallHint: string;
  };
  footer: {
    tagline: string;
    copyright: string;
  };
}

export const LANGUAGE_DIRECTION: Record<Language, TextDirection> = {
  ku: 'rtl',
  ar: 'rtl',
  en: 'ltr',
};

export const HTML_LANG_CODE: Record<Language, string> = {
  ku: 'ckb',
  ar: 'ar',
  en: 'en',
};

export const TRANSLATIONS: Record<Language, TranslationDictionary> = {
  ku: {
    brandName: 'بازاڕ فرێش',
    nav: {
      market: 'سوپەرمارکێت',
      deals: 'داشکاندن',
      orders: 'داواکارییەکان',
      profile: 'پڕۆفایل',
      cart: 'سەبەتە',
    },
    languageNames: {
      ku: 'کوردی',
      ar: 'العربية',
      en: 'English',
    },
    onboarding: {
      kicker: 'سوپەرمارکێتی هەولێر · گەیاندنی خێرا',
      title: 'بەخێربێیت بۆ بازاڕ فرێش',
      subtitle:
        'یەک جار زانیارییەکانت تۆمار بکە بێ وشەی نهێنی و بێ کۆدی SMS. هەموو کات پارەدان لە کاتی گەیشتندایە.',
      fullNameLabel: 'ناوی تەواو',
      fullNamePlaceholder: 'بۆ نموونە: ئارەڤان کەریم',
      phoneLabel: 'ژمارەی مۆبایلی عێراقی',
      phonePlaceholder: '0750 123 4567',
      phoneHint: 'پشتگیری 0750 / 0770 / 0780 / 0790 یان +9647 دەکات',
      gpsButton: 'بەکارهێنانی شوێنی GPSی من',
      gpsLocating: 'دۆزینەوەی شوێنەکەت…',
      gpsCaptured: 'شوێنی GPS دیاریکرا',
      gpsDeniedFallback:
        'ڕێگەپێدانی GPS ڕەتکرایەوە. تکایە ناوی گەڕەک و نزیکترین نیشانە بە دەست بنووسە.',
      gpsUnsupportedFallback:
        'ئەم وێبگەڕە پشتگیری GPS ناکات. تکایە ناونیشان بە دەست بنووسە.',
      addressLabel: 'گەڕەک / نزیکترین نیشانە',
      addressPlaceholder: 'بۆ نموونە: ئیمپایەر، نزیک دەروازەی دووەم',
      buildingNotesLabel: 'تێبینی باڵەخانە / نهۆم (ئارەزوومەندانە)',
      buildingNotesPlaceholder: 'بۆ نموونە: باڵەخانەی B، نهۆمی ٣، شوقەی ١٢',
      submitCta: 'دەستپێکردنی کڕین',
      saving: 'پاشەکەوتکردن…',
      anonAuthHint:
        'چوونەژوورەوەی بێ‌ناو (Anonymous Auth) لە Firebase چالاک نەکراوە. زانیاری لەسەر مۆبایلەکەت پاشەکەوت دەکرێت تا لە Firebase Console چالاکی دەکەیت.',
      errors: {
        nameRequired: 'تکایە ناوی تەواوت بنووسە.',
        nameTooShort: 'ناو دەبێت لانیکەم ٢ پیت بێت.',
        phoneRequired: 'تکایە ژمارەی مۆبایل بنووسە.',
        phoneInvalid: 'تکایە ژمارەی مۆبایلی دروستی عێراقی بنووسە (وەک 07501234567).',
        addressRequired: 'تکایە گەڕەک یان نزیکترین نیشانە بنووسە.',
        addressTooShort: 'تکایە ناونیشانێکی ڕوونتر بنووسە.',
        saveFailed: 'پاشەکەوتکردن سەرکەوتوو نەبوو. تکایە دووبارە هەوڵ بدەرەوە.',
      },
    },
    storefront: {
      storeClosedTitle: 'سوپەرمارکێت لە ئێستادا داخراوە',
      storeClosedBody:
        'دەتوانیت کاڵاکان ببینیت و سەبەتەکەت ئامادە بکەیت، بەڵام ناردنی داواکاری لە کاتی کردنەوەدا چالاک دەبێت.',
      offlineBanner: 'ئینتەرنێتت نییە — بەرهەمە پاشەکەوتکراوەکان پیشان دەدرێن.',
      searchPlaceholder: 'گەڕان بە کوردی، عەرەبی یان ئینگلیزی…',
      clearSearch: 'سڕینەوەی گەڕان',
      allCategories: 'هەموو بەشەکان',
      allSubcategories: 'هەمووی',
      itemsCount: 'بەرهەم',
      sections: {
        all: 'هەموو بەرهەمەکان',
        deals: 'داشکاندنەکان',
        popular: 'باوترینەکان',
        new: 'نوێیەکان',
        recommended: 'پێشنیارکراو',
      },
      loadMore: 'پیشاندانی بەرهەمی زیاتر',
      loadingMore: 'بارکردنی زیاتر…',
      endOfCatalog: 'هەموو بەرهەمە بەردەستەکان پیشان دران.',
      seedBannerTitle: 'لیستی Firestore هێشتا بەتاڵە',
      seedBannerBody:
        'دەتوانیت بە یەک کرتە ١٢ بەش، ٦٠ بەرهەمی نموونەی هەولێر، ٣ بانەر و ڕێکخستنی فرۆشگا بخەیتە ناو Firestore.',
      seedButton: 'ناردنی لیستی نموونە (Seed Sample Catalog)',
      seedingButton: 'خەریکی ناردنی ٦٠ بەرهەم بۆ Firestore…',
      seedSuccess: '١٢ بەش و ٦٠ بەرهەمی هەولێر بە سەرکەوتوویی بۆ Firestore نێردران.',
      seedAdminRequired: 'بۆ ناردنی لیستی نموونە، سەرەتا وەک خاوەنی فرۆشگا (Admin) بچۆ ژوورەوە.',
      signInAdminGoogle: 'چوونەژوورەوەی ئەدمین بە Google',
      retry: 'هەوڵدانەوە',
      loadErrorTitle: 'بارکردنی بەرهەمەکان سەرکەوتوو نەبوو',
      loadErrorBody: 'تۆڕەکەت خاوە یان پچڕاوە. تکایە دووبارە هەوڵ بدەرەوە.',
      emptyTitle: 'هیچ بەرهەمێک نەدۆزرایەوە',
      emptyBody: 'وشەیەکی تر بنووسە یان بگەڕێوە بۆ هەموو بەشەکان.',
      resetFilters: 'پیشاندانی هەموو بەرهەمەکان',
      deliveryHoursLabel: 'کاتی گەیاندن',
      minOrderLabel: 'کەمترین داواکاری',
    },
    product: {
      add: 'زیادکردن',
      increaseQty: 'زیادکردنی بڕ',
      decreaseQty: 'کەمکردنەوەی بڕ',
      viewDetails: 'وردەکاری',
      closeDetails: 'داخستن',
      ourPriceLabel: 'نرخی ئێمە',
      marketPriceLabel: 'نرخی بازاڕ',
      youSaveLabel: 'پاشەکەوت دەکەیت',
      sizeLabel: 'قەبارە / کێش',
      sectionLabel: 'بەش',
      codNote: 'پارەدان لە کاتی گەیشتندا (کاش)',
      outOfStock: 'نەماوە',
    },
    cart: {
      title: 'سەبەتەی کڕین',
      close: 'داخستن',
      clear: 'بەتاڵکردن',
      remove: 'سڕینەوە',
      emptyTitle: 'سەبەتەکەت بەتاڵە',
      emptyBody: 'پێداویستییەکانی ڕۆژانەت زیاد بکە و لە کاتی گەیشتن پارە بدە.',
      browseCta: 'گەڕان لە سوپەرمارکێت',
      savingsPrefix: 'نرخەکانمان لە نرخی بازاڕ هەرزانترن. بڕی',
      savingsSuffix: 'مان بۆ پاشەکەوت کردیت.',
      subtotal: 'کۆی بەرهەمەکان',
      deliveryFee: 'کرێی گەیاندن',
      free: 'خۆڕایی',
      grandTotal: 'کۆی گشتی (کاش)',
      codLabel: 'پارەدان لە کاتی گەیشتندا',
      minimumOrderNoticePrefix: 'کەمترین بڕی داواکاری',
      minimumOrderNoticeSuffix: 'زیاد بکە بۆ ناردنی داواکاری.',
      storeClosedNotice: 'فرۆشگا لە ئێستادا داخراوە و ناتوانرێت داواکاری بنێردرێت.',
      deliverToLabel: 'گەیاندن بۆ',
      editProfile: 'دەستکاری',
      buyButton: 'کڕین و تۆمارکردنی داواکاری',
      placingOrder: 'تۆمارکردنی داواکاری…',
      errors: {
        blockedPhone:
          'ببورە، ئەم ژمارە مۆبایلە لە ئێستادا ناتوانێت داواکاری بنێرێت. تکایە پەیوەندی بە پشتگیری فرۆشگاوە بکە.',
        rateLimit:
          'گەیشتوویتە زۆرترین ژمارەی داواکاری لە کاتژمێرێکدا. تکایە کەمێک چاوەڕێ بکە پێش داواکارییەکی نوێ.',
        storeClosed: 'فرۆشگا لە ئێستادا داخراوە. تکایە لە کاتی کارکردندا دووبارە هەوڵ بدەرەوە.',
        belowMinimum: 'کۆی سەبەتەکەت کەمترە لە کەمترین بڕی داواکاری.',
        profileRequired: 'تکایە سەرەتا زانیارییەکانی ناو و ناونیشانت تەواو بکە.',
        offlineOrder: 'بۆ ناردنی داواکاری پێویستە پەیوەندی ئینتەرنێتت هەبێت.',
        genericOrderError: 'تۆمارکردنی داواکاری سەرکەوتوو نەبوو. تکایە دووبارە هەوڵ بدەرەوە.',
      },
    },
    confirmation: {
      title: 'داواکارییەکەت تۆمارکرا',
      callNotice:
        'سوپاس! پێش ئەوەی بەرهەمەکان بکڕین و بیگەیەنین، بەم زووانە پەیوەندیت پێوە دەکەین بۆ دڵنیابوونەوە.',
      orderNumberLabel: 'ژمارەی داواکاری',
      totalLabel: 'کۆی گشتی',
      paymentMethodValue: 'پارەدان لە کاتی گەیشتن (کاش)',
      whatsappCta: 'ناردنی داواکاری لەسەر واتساپ',
      viewOrdersCta: 'بینینی داواکارییەکانم',
      continueCta: 'بەردەوامبوون لە کڕین',
    },
    orders: {
      title: 'داواکارییەکانم',
      subtitle: 'بەدواداچوونی ڕاستەوخۆ بۆ دۆخی داواکارییەکانت و دووبارە کڕینەوە.',
      emptyTitle: 'هێشتا هیچ داواکارییەکت نییە',
      emptyBody: 'کاتێک داواکارییەک تۆمار دەکەیت، دۆخی ڕاستەوخۆ و وردەکارییەکانی لێرە دەردەکەون.',
      startShopping: 'چوونە ناو سوپەرمارکێت',
      orderAgain: 'داواکردنەوە',
      unavailableNotice: 'هەندێک بەرهەم چیتر بەردەست نین و زیاد نەکران.',
      addedBackNotice: 'بەرهەمە بەردەستەکان خرانەوە ناو سەبەتەکەت.',
      itemsLabel: 'بەرهەم',
      codBadge: 'کاش لە کاتی گەیشتن',
      confirmedBanner:
        'داواکارییەکەت پەسەند کرا! داواکاری #{orderNumber} پشتڕاست کرایەوە و ئامادە دەکرێت.',
      deliveredBanner:
        'داواکارییەکەت گەیەندرا! داواکاری #{orderNumber} گەیشت و سەبەتەکەت بەتاڵە بۆ داواکاری نوێ.',
      dismissAlert: 'داخستنی ئاگادارکردنەوە',
      statuses: {
        New: 'نوێ',
        Called: 'پەیوەندی کرا',
        Confirmed: 'دڵنیاکرایەوە',
        Bought: 'کڕدرا',
        Delivered: 'گەیەندرا',
        Cancelled: 'هەڵوەشێنرایەوە',
      },
    },
    profile: {
      title: 'پڕۆفایل و ناونیشان',
      subtitle: 'ناو، مۆبایل، شوێنی GPS و زمانی ئەپەکە هەر کاتێک بتەوێت دەستکاری بکە.',
      saveChanges: 'پاشەکەوتکردنی گۆڕانکارییەکان',
      savedToast: 'زانیارییەکانت بە سەرکەوتوویی پاشەکەوت کران.',
      logoutReset: 'چوونەدەرەوە / ڕێسێتکردن',
      logoutConfirmHint: 'دەتگەڕێنێتەوە بۆ شاشەی سەرەتایی تۆمارکردن.',
      languageSection: 'زمانی ئەپ',
      pwaSectionTitle: 'دابەزاندنی ئەپ لەسەر مۆبایل (PWA)',
      pwaInstallCta: 'دابەزاندنی ئەپەکە',
      pwaInstallIOS: 'چۆنیەتی دابەزاندن لەسەر ئایفۆن',
      pwaIOSModalTitle: 'دابەزاندن لەسەر iPhone / iPad',
      pwaIOSModalStep1: '١. لە Safari کرتە لە دوگمەی Share بکە.',
      pwaIOSModalStep2: '٢. بڕۆ خوارەوە و کرتە لە Add to Home Screen بکە.',
      pwaClose: 'داخستن',
      adminToolsTitle: 'ئامرازەکانی خاوەنی فرۆشگا (Dev / First-Run)',
      adminToolsSubtitle:
        'تەنها بۆ ئەدمینە تۆمارکراوەکان لە admins/{uid} بۆ ناردنی لیستی نموونەی هەولێر.',
      adminSignedInAs: 'چوویتەتە ژوورەوە وەک',
      adminRoleLabel: 'ئەدمینی پشتڕاستکراوە',
      adminEmailPlaceholder: 'ئیمەیڵی ئەدمین',
      adminPasswordPlaceholder: 'وشەی نهێنی',
      adminSignInEmail: 'چوونەژوورەوە بە ئیمەیڵ',
      adminSignOut: 'چوونەدەرەوەی ئەدمین',
      adminSeedNote: 'ئەگەر بەشەکانی Firestore بەتاڵ بن، ١٢ بەش و ٦٠ بەرهەم زیاد دەکات.',
      anonStatusNote: 'ناسنامەی کڕیار (Anonymous UID)',
      contactHelpTitle: 'پەیوەندی و یارمەتی',
    },
    retention: {
      lifetimeSavingsTitle: 'کۆی پاشەکەوتت لەگەڵ ئێمە',
      lifetimeSavingsLine: 'کۆی پاشەکەوتت لەگەڵ ئێمە: {amount} د.ع (لە {count} داواکاریدا)',
      thankYouTitle: 'سوپاس {name}، بە خۆشی بەکاریبهێنن!',
      thankYouBody:
        'داواکارییەکەت گەیشتە دەستت و هیوادارین هەموو شتەکان تازە و بە دڵت بووبن. زۆر خۆشحاڵین کە ئەمڕۆ {orderSavings} د.ع پاشەکەوتمان بۆ کردیت — تا ئێستا کۆی {lifetimeSavings} د.ع لە گیرفانتدا ماوەتەوە. هەر کاتێک ماڵەوە پێویستی بە شتێک بوو، ئێمە هەمیشە لێرەین تا بە نرخی هەرزانتر و بێ ماندووبوون بۆتی بهێنینە بەر دەرگا.',
      thankYouBodyNoOrderSavings:
        'داواکارییەکەت گەیشتە دەستت و هیوادارین هەموو شتەکان بە دڵت بووبن. تا ئێستا لەگەڵ ئێمە کۆی {lifetimeSavings} د.ع پاشەکەوتت کردووە. هەر کاتێک پێویستت بە شتێک بوو، بە خۆشحاڵییەوە خزمەتت دەکەین.',
      thankYouBodySimple:
        'داواکارییەکەت گەیشتە دەستت و هیوادارین هەموو شتەکان تازە و بە دڵت بووبن. هەر کاتێک ماڵەوە پێویستی بە شتێک بوو، بە خۆشحاڵییەوە خزمەتت دەکەین.',
      mobileNotifTitle: 'داواکارییەکەت گەیشت، {name}!',
      mobileNotifBody:
        'ئەمڕۆ {orderSavings} د.ع پاشەکەوتت کرد (کۆی گشتی: {lifetimeSavings} د.ع). سوپاس کە لەگەڵ ئێمەیت!',
      mobileNotifBodyNoOrderSavings:
        'داواکارییەکەت گەیشتە دەستت! تا ئێستا {lifetimeSavings} د.ع پاشەکەوتت کردووە. سوپاس کە لەگەڵ ئێمەیت!',
      mobileNotifBodySimple:
        'داواکارییەکەت گەیشتە دەستت و هیوادارین بە دڵت بێت. سوپاس کە لەگەڵ ئێمەیت!',
      savedThisOrderLabel: 'پاشەکەوتی ئەم داواکارییە',
      totalSavedSoFarLabel: 'کۆی پاشەکەوت تا ئێستا',
      continueShoppingCta: 'بەردەوامبە لە کڕین و پاشەکەوت',
      closeCta: 'سوپاس، دایبخە',
      notificationsTitle: 'ئاگادارکردنەوەکان',
      notificationsEmpty: 'هێشتا هیچ ئاگادارکردنەوەیەکی گەیشتن نییە.',
      markAllRead: 'هەمووی خوێنرایەوە',
      notificationsBellAria: 'ئاگادارکردنەوەکانی داواکاری',
      enableAlertsLabel: 'چالاککردنی ئاگادارکردنەوەی داواکاری',
      alertsEnabledLabel: 'ئاگادارکردنەوەکان چالاکن',
      alertsBlockedHint: 'ئاگادارکردنەوەکان لە ڕێکخستنی وێبگەڕدا داخراون.',
      alertsUnsupportedHint: 'وێبگەڕەکەت پشتگیری ئاگادارکردنەوەی ڕاستەوخۆ ناکات.',
      alertsIosInstallHint:
        'لەسەر ئایفۆن، کرتە لە Share ← Add to Home Screen بکە بۆ وەرگرتنی ئاگادارکردنەوە.',
    },
    footer: {
      tagline: 'سوپەرمارکێتی ڕۆژانەی هەولێر بە نرخی گونجاو و پارەدان لە کاتی گەیشتن.',
      copyright: '© ٢٠٢٦ بازاڕ فرێش',
    },
  },
  ar: {
    brandName: 'بازار فريش',
    nav: {
      market: 'السوبرماركت',
      deals: 'العروض',
      orders: 'طلباتي',
      profile: 'حسابي',
      cart: 'السلة',
    },
    languageNames: {
      ku: 'کوردی',
      ar: 'العربية',
      en: 'English',
    },
    onboarding: {
      kicker: 'سوبرماركت أربيل · توصيل سريع',
      title: 'أهلاً بك في بازار فريش',
      subtitle:
        'سجّل بياناتك مرة واحدة بدون كلمة مرور أو رمز SMS. الدفع دائماً نقداً عند الاستلام.',
      fullNameLabel: 'الاسم الكامل',
      fullNamePlaceholder: 'مثال: دارا كريم',
      phoneLabel: 'رقم الهاتف العراقي',
      phonePlaceholder: '0750 123 4567',
      phoneHint: 'يقبل 0750 / 0770 / 0780 / 0790 أو +9647',
      gpsButton: 'استخدام موقعي عبر GPS',
      gpsLocating: 'جاري تحديد موقعك…',
      gpsCaptured: 'تم حفظ موقع GPS',
      gpsDeniedFallback:
        'تم رفض إذن الموقع. يرجى كتابة اسم الحي وأقرب نقطة دالة يدوياً.',
      gpsUnsupportedFallback:
        'المتصفح لا يدعم تحديد الموقع. يرجى إدخال العنوان يدوياً.',
      addressLabel: 'الحي / أقرب نقطة دالة',
      addressPlaceholder: 'مثال: إمباير، قرب البوابة الثانية',
      buildingNotesLabel: 'ملاحظات البناية / الطابق (اختياري)',
      buildingNotesPlaceholder: 'مثال: بناية B، الطابق 3، شقة 12',
      submitCta: 'ابدأ التسوق',
      saving: 'جاري الحفظ…',
      anonAuthHint:
        'الدخول المجهول (Anonymous Auth) غير مفعّل في Firebase بعد. سيتم الحفظ محلياً حتى تفعيله من Firebase Console.',
      errors: {
        nameRequired: 'يرجى إدخال الاسم الكامل.',
        nameTooShort: 'يجب أن يتكون الاسم من حرفين على الأقل.',
        phoneRequired: 'يرجى إدخال رقم الهاتف.',
        phoneInvalid: 'يرجى إدخال رقم موبايل عراقي صحيح (مثال: 07501234567).',
        addressRequired: 'يرجى إدخال الحي أو أقرب نقطة دالة.',
        addressTooShort: 'يرجى كتابة عنوان أكثر وضوحاً.',
        saveFailed: 'تعذر حفظ البيانات. يرجى المحاولة مرة أخرى.',
      },
    },
    storefront: {
      storeClosedTitle: 'المتجر مغلق حالياً',
      storeClosedBody:
        'يمكنك تصفح المنتجات وتجهيز سلتك، لكن إرسال الطلبات متاح فقط خلال ساعات العمل.',
      offlineBanner: 'أنت غير متصل بالإنترنت — يتم عرض المنتجات المحفوظة.',
      searchPlaceholder: 'ابحث بالكردية أو العربية أو الإنجليزية…',
      clearSearch: 'مسح البحث',
      allCategories: 'كل الأقسام',
      allSubcategories: 'الكل',
      itemsCount: 'منتج',
      sections: {
        all: 'جميع المنتجات',
        deals: 'العروض',
        popular: 'الأكثر طلباً',
        new: 'جديدنا',
        recommended: 'مقترح لك',
      },
      loadMore: 'عرض المزيد من المنتجات',
      loadingMore: 'جاري التحميل…',
      endOfCatalog: 'تم عرض جميع المنتجات المتوفرة.',
      seedBannerTitle: 'قاعدة بيانات Firestore فارغة حالياً',
      seedBannerBody:
        'يمكنك بنقرة واحدة إضافة 12 قسماً و60 منتجاً نموذجياً لأربيل و3 بانرات وإعدادات المتجر إلى Firestore.',
      seedButton: 'إضافة القائمة النموذجية (Seed Sample Catalog)',
      seedingButton: 'جاري رفع 60 منتجاً إلى Firestore…',
      seedSuccess: 'تمت إضافة 12 قسماً و60 منتجاً إلى Firestore بنجاح.',
      seedAdminRequired: 'لرفع القائمة النموذجية، سجّل الدخول كمدير (Admin) أولاً.',
      signInAdminGoogle: 'دخول المدير عبر Google',
      retry: 'إعادة المحاولة',
      loadErrorTitle: 'تعذر تحميل المنتجات',
      loadErrorBody: 'الاتصال بطيء أو متقطع. يرجى المحاولة مجدداً.',
      emptyTitle: 'لم يتم العثور على منتجات مطابقة',
      emptyBody: 'جرّب كلمة بحث أخرى أو اعرض جميع الأقسام.',
      resetFilters: 'عرض جميع المنتجات',
      deliveryHoursLabel: 'أوقات التوصيل',
      minOrderLabel: 'الحد الأدنى للطلب',
    },
    product: {
      add: 'إضافة',
      increaseQty: 'زيادة الكمية',
      decreaseQty: 'تقليل الكمية',
      viewDetails: 'التفاصيل',
      closeDetails: 'إغلاق',
      ourPriceLabel: 'سعرنا',
      marketPriceLabel: 'سعر السوق',
      youSaveLabel: 'توفّر',
      sizeLabel: 'الحجم / الوزن',
      sectionLabel: 'القسم',
      codNote: 'الدفع نقداً عند الاستلام',
      outOfStock: 'نفد المخزون',
    },
    cart: {
      title: 'سلة التسوق',
      close: 'إغلاق',
      clear: 'إفراغ',
      remove: 'حذف',
      emptyTitle: 'سلتك فارغة حالياً',
      emptyBody: 'أضف مقاضيك اليومية وادفع نقداً عند الاستلام.',
      browseCta: 'تصفح السوبرماركت',
      savingsPrefix: 'سعرنا أقل من سعر السوق. لقد وفّرنا لك',
      savingsSuffix: '.',
      subtotal: 'مجموع المنتجات',
      deliveryFee: 'رسوم التوصيل',
      free: 'مجاني',
      grandTotal: 'الإجمالي النهائي (نقداً)',
      codLabel: 'الدفع نقداً عند الاستلام',
      minimumOrderNoticePrefix: 'الحد الأدنى للطلب',
      minimumOrderNoticeSuffix: 'أضف المزيد لإتمام الطلب.',
      storeClosedNotice: 'المتجر مغلق حالياً ولا يمكن إرسال طلبات جديدة.',
      deliverToLabel: 'التوصيل إلى',
      editProfile: 'تعديل',
      buyButton: 'شراء وتأكيد الطلب',
      placingOrder: 'جاري تسجيل الطلب…',
      errors: {
        blockedPhone:
          'عذراً، هذا الرقم غير مسموح له بإرسال الطلبات حالياً. يرجى التواصل مع دعم المتجر.',
        rateLimit:
          'لقد وصلت إلى الحد الأقصى للطلبات في الساعة. يرجى الانتظار قليلاً قبل الطلب مجدداً.',
        storeClosed: 'المتجر مغلق حالياً. يرجى المحاولة خلال ساعات العمل.',
        belowMinimum: 'قيمة سلتك أقل من الحد الأدنى للطلب.',
        profileRequired: 'يرجى إكمال بيانات الاسم والعنوان أولاً.',
        offlineOrder: 'يلزم توفر اتصال بالإنترنت لإرسال الطلب.',
        genericOrderError: 'تعذر إرسال الطلب. يرجى المحاولة مرة أخرى.',
      },
    },
    confirmation: {
      title: 'تم استلام طلبك',
      callNotice:
        'شكراً لك! سنتصل بك قريباً لتأكيد طلبك قبل شرائه وتوصيله إليك.',
      orderNumberLabel: 'رقم الطلب',
      totalLabel: 'الإجمالي النهائي',
      paymentMethodValue: 'الدفع نقداً عند الاستلام',
      whatsappCta: 'إرسال الطلب عبر واتساب',
      viewOrdersCta: 'متابعة طلباتي',
      continueCta: 'متابعة التسوق',
    },
    orders: {
      title: 'طلباتي',
      subtitle: 'متابعة مباشرة لحالة طلباتك مع إمكانية إعادة الطلب بنقرة واحدة.',
      emptyTitle: 'لا توجد طلبات سابقة بعد',
      emptyBody: 'عند إتمام طلبك الأول ستظهر تفاصيله وحالته المباشرة هنا.',
      startShopping: 'ابدأ التسوق',
      orderAgain: 'اطلب مرة أخرى',
      unavailableNotice: 'بعض المنتجات لم تعد متوفرة ولم تتم إضافتها.',
      addedBackNotice: 'تمت إعادة المنتجات المتوفرة إلى سلتك.',
      itemsLabel: 'منتجات',
      codBadge: 'الدفع عند الاستلام',
      confirmedBanner:
        'تم قبول طلبك! تم تأكيد الطلب #{orderNumber} وجارٍ تجهيزه.',
      deliveredBanner:
        'تم توصيل الطلب! وصل طلبك #{orderNumber} بنجاح، وسلتك فارغة وجاهزة لطلب جديد.',
      dismissAlert: 'إغلاق الإشعار',
      statuses: {
        New: 'جديد',
        Called: 'تم الاتصال',
        Confirmed: 'مؤكد',
        Bought: 'تم الشراء',
        Delivered: 'تم التوصيل',
        Cancelled: 'ملغي',
      },
    },
    profile: {
      title: 'الملف الشخصي والعنوان',
      subtitle: 'حدّث اسمك ورقمك وموقع GPS ولغة التطبيق في أي وقت.',
      saveChanges: 'حفظ التغييرات',
      savedToast: 'تم حفظ بياناتك بنجاح.',
      logoutReset: 'تسجيل الخروج / إعادة ضبط',
      logoutConfirmHint: 'سيعيدك إلى شاشة التسجيل الأولى.',
      languageSection: 'لغة التطبيق',
      pwaSectionTitle: 'تثبيت التطبيق على الهاتف (PWA)',
      pwaInstallCta: 'تثبيت التطبيق',
      pwaInstallIOS: 'طريقة التثبيت على آيفون',
      pwaIOSModalTitle: 'التثبيت على iPhone / iPad',
      pwaIOSModalStep1: '1. اضغط على زر المشاركة (Share) في شريط Safari.',
      pwaIOSModalStep2: '2. اختر إضافة إلى الشاشة الرئيسية (Add to Home Screen).',
      pwaClose: 'إغلاق',
      adminToolsTitle: 'أدوات مدير المتجر (Dev / First-Run)',
      adminToolsSubtitle:
        'مخصصة لحسابات الإدارة في admins/{uid} لإضافة قائمة أربيل النموذجية.',
      adminSignedInAs: 'مسجل الدخول بحساب',
      adminRoleLabel: 'مدير موثّق',
      adminEmailPlaceholder: 'بريد المدير الإلكتروني',
      adminPasswordPlaceholder: 'كلمة المرور',
      adminSignInEmail: 'دخول بالبريد وكلمة المرور',
      adminSignOut: 'خروج المدير',
      adminSeedNote: 'يضيف 12 قسماً و60 منتجاً و3 بانرات إذا كانت الأقسام فارغة.',
      anonStatusNote: 'معرّف العميل (Anonymous UID)',
      contactHelpTitle: 'التواصل والمساعدة',
    },
    retention: {
      lifetimeSavingsTitle: 'إجمالي توفيرك معنا',
      lifetimeSavingsLine: 'إجمالي توفيرك معنا: {amount} د.ع (في {count} طلبات)',
      thankYouTitle: 'وصلت أغراضك بالسلامة، شكراً يا {name}!',
      thankYouBody:
        'نتمنى أن تكون كل الأغراض طازجة وعلى ذوقك. يسعدنا أننا وفّرنا لك {orderSavings} د.ع في هذا الطلب، ليصل مجموع ما وفّرته معنا حتى اليوم إلى {lifetimeSavings} د.ع. متى ما احتاج بيتك أي شيء، نحن دائماً قريبون منك وبأسعار أرخص وراحة أكبر.',
      thankYouBodyNoOrderSavings:
        'نتمنى أن تكون كل الأغراض طازجة وعلى ذوقك. مجموع ما وفّرته معنا حتى اليوم وصل إلى {lifetimeSavings} د.ع. متى ما احتجت أي شيء للبيت، يسعدنا دائماً خدمتك.',
      thankYouBodySimple:
        'نتمنى أن تكون كل الأغراض طازجة وعلى ذوقك. متى ما احتاج بيتك أي شيء، يسعدنا دائماً خدمتك وبكل سرور.',
      mobileNotifTitle: 'وصلت أغراضك بالسلامة يا {name}!',
      mobileNotifBody:
        'وفّرت اليوم {orderSavings} د.ع (المجموع معنا: {lifetimeSavings} د.ع). شكراً لثقتك بنا!',
      mobileNotifBodyNoOrderSavings:
        'وصلت أغراضك بالسلامة! مجموع توفيرك معنا وصل إلى {lifetimeSavings} د.ع. شكراً لثقتك بنا!',
      mobileNotifBodySimple:
        'وصلت أغراضك بالسلامة ونتمنى أن تكون على ذوقك. شكراً لثقتك بنا!',
      savedThisOrderLabel: 'وفّرت في هذا الطلب',
      totalSavedSoFarLabel: 'إجمالي التوفير حتى الآن',
      continueShoppingCta: 'تسوق مجدداً ووفّر أكثر',
      closeCta: 'شكراً، إغلاق',
      notificationsTitle: 'الإشعارات',
      notificationsEmpty: 'لا توجد إشعارات توصيل بعد.',
      markAllRead: 'تحديد الكل كمقروء',
      notificationsBellAria: 'إشعارات الطلبات',
      enableAlertsLabel: 'تفعيل تنبيهات الطلبات',
      alertsEnabledLabel: 'تنبيهات الطلبات مفعّلة',
      alertsBlockedHint: 'التنبيهات محظورة في إعدادات المتصفح.',
      alertsUnsupportedHint: 'متصفحك لا يدعم إشعارات المتصفح.',
      alertsIosInstallHint:
        'على الآيفون، اضغط مشاركة (Share) ← إضافة إلى الشاشة الرئيسية لتصلك التنبيهات.',
    },
    footer: {
      tagline: 'سوبرماركت أربيل اليومي بأسعار أقل من السوق والدفع عند الاستلام.',
      copyright: '© 2026 بازار فريش',
    },
  },
  en: {
    brandName: 'Bazar Fresh',
    nav: {
      market: 'Market',
      deals: 'Deals',
      orders: 'Orders',
      profile: 'Profile',
      cart: 'Cart',
    },
    languageNames: {
      ku: 'کوردی',
      ar: 'العربية',
      en: 'English',
    },
    onboarding: {
      kicker: 'Erbil Supermarket · Fast Delivery',
      title: 'Welcome to Bazar Fresh',
      subtitle:
        'Set up your delivery details once — no passwords, no SMS codes. Always Cash on Delivery.',
      fullNameLabel: 'Full name',
      fullNamePlaceholder: 'e.g. Dara Karim',
      phoneLabel: 'Iraqi mobile number',
      phonePlaceholder: '0750 123 4567',
      phoneHint: 'Accepts 0750 / 0770 / 0780 / 0790 or +9647',
      gpsButton: 'Use My GPS Location',
      gpsLocating: 'Finding your location…',
      gpsCaptured: 'GPS location pinned',
      gpsDeniedFallback:
        'Location permission was denied. Please type your neighborhood and nearest landmark below.',
      gpsUnsupportedFallback:
        'GPS is not available in this browser. Please enter your address manually.',
      addressLabel: 'Neighborhood / Nearest landmark',
      addressPlaceholder: 'e.g. Empire World, near Gate 2',
      buildingNotesLabel: 'Building / Floor notes (optional)',
      buildingNotesPlaceholder: 'e.g. Building B, Floor 3, Apt 12',
      submitCta: 'Start shopping',
      saving: 'Saving profile…',
      anonAuthHint:
        'Anonymous Auth is not enabled in Firebase Console yet. Profile is saved locally until you enable Anonymous sign-in.',
      errors: {
        nameRequired: 'Please enter your full name.',
        nameTooShort: 'Name must be at least 2 characters.',
        phoneRequired: 'Please enter your Iraqi mobile number.',
        phoneInvalid: 'Enter a valid Iraqi mobile number (e.g. 0750 123 4567).',
        addressRequired: 'Please enter your neighborhood or nearest landmark.',
        addressTooShort: 'Please add a clearer neighborhood or landmark.',
        saveFailed: 'Could not save your profile. Please try again.',
      },
    },
    storefront: {
      storeClosedTitle: 'The store is currently closed',
      storeClosedBody:
        'You can browse groceries and build your basket, but checkout is paused until opening hours.',
      offlineBanner: 'You are offline — showing cached catalog data.',
      searchPlaceholder: 'Search in Kurdish, Arabic, or English…',
      clearSearch: 'Clear search',
      allCategories: 'All categories',
      allSubcategories: 'All',
      itemsCount: 'items',
      sections: {
        all: 'All items',
        deals: 'Deals',
        popular: 'Popular',
        new: 'New arrivals',
        recommended: 'Recommended',
      },
      loadMore: 'Load more products',
      loadingMore: 'Loading more…',
      endOfCatalog: 'You have reached the end of available products.',
      seedBannerTitle: 'Your Firestore catalog is empty',
      seedBannerBody:
        'First-run utility: push 12 categories, 60 Erbil sample products, 3 banners, and default store settings into Firestore.',
      seedButton: 'Seed Sample Catalog (60 Erbil Items)',
      seedingButton: 'Seeding 60 products to Firestore…',
      seedSuccess: 'Seeded 12 categories, 60 Erbil products, 3 banners, and store settings.',
      seedAdminRequired: 'Sign in as Store Admin first to seed Firestore.',
      signInAdminGoogle: 'Admin Sign-In with Google',
      retry: 'Try again',
      loadErrorTitle: 'Unable to load products',
      loadErrorBody: 'Your mobile connection may be slow or interrupted. Tap retry.',
      emptyTitle: 'No matching groceries found',
      emptyBody: 'Try another spelling or reset your category filters.',
      resetFilters: 'Show all groceries',
      deliveryHoursLabel: 'Delivery hours',
      minOrderLabel: 'Minimum order',
    },
    product: {
      add: 'Add',
      increaseQty: 'Increase quantity',
      decreaseQty: 'Decrease quantity',
      viewDetails: 'Details',
      closeDetails: 'Close',
      ourPriceLabel: 'Our price',
      marketPriceLabel: 'Market price',
      youSaveLabel: 'You save',
      sizeLabel: 'Pack size',
      sectionLabel: 'Collection',
      codNote: 'Cash on Delivery only',
      outOfStock: 'Out of Stock',
    },
    cart: {
      title: 'Your basket',
      close: 'Close',
      clear: 'Clear',
      remove: 'Remove',
      emptyTitle: 'Your basket is empty',
      emptyBody: 'Add daily groceries and pay Cash on Delivery at your door.',
      browseCta: 'Browse supermarket',
      savingsPrefix: 'Our price is lower than the market price. We saved you',
      savingsSuffix: '.',
      subtotal: 'Subtotal',
      deliveryFee: 'Delivery fee',
      free: 'Free',
      grandTotal: 'Grand total (Cash)',
      codLabel: 'Cash on Delivery',
      minimumOrderNoticePrefix: 'Minimum order is',
      minimumOrderNoticeSuffix: 'more to place your order.',
      storeClosedNotice: 'Store is currently closed. Checkout will resume when open.',
      deliverToLabel: 'Deliver to',
      editProfile: 'Edit',
      buyButton: 'Buy & Place Order',
      placingOrder: 'Submitting order…',
      errors: {
        blockedPhone:
          'Sorry, this phone number cannot place orders right now. Please contact store support.',
        rateLimit:
          'You have reached the maximum orders allowed per hour. Please wait before placing another order.',
        storeClosed: 'Store is currently closed. Please try again during delivery hours.',
        belowMinimum: 'Your basket subtotal is below the minimum order amount.',
        profileRequired: 'Please complete your profile and delivery address first.',
        offlineOrder: 'An internet connection is required to submit your order.',
        genericOrderError: 'Could not place your order. Please try again.',
      },
    },
    confirmation: {
      title: 'Order received',
      callNotice:
        'Thank you! We will call you shortly to confirm your order before we buy and deliver it.',
      orderNumberLabel: 'Order number',
      totalLabel: 'Grand total',
      paymentMethodValue: 'Cash on Delivery',
      whatsappCta: 'Send Order on WhatsApp',
      viewOrdersCta: 'View my orders',
      continueCta: 'Continue shopping',
    },
    orders: {
      title: 'My orders',
      subtitle: 'Live order tracking and one-tap reordering from your past baskets.',
      emptyTitle: 'No orders yet',
      emptyBody: 'Once you place an order, live status updates and receipts appear here.',
      startShopping: 'Shop the market',
      orderAgain: 'Order Again',
      unavailableNotice: 'Some items are no longer available and were skipped.',
      addedBackNotice: 'Available items were added back to your basket.',
      itemsLabel: 'items',
      codBadge: 'Cash on Delivery',
      confirmedBanner:
        'Order Accepted! Your order #{orderNumber} is confirmed and being prepared.',
      deliveredBanner:
        'Order Delivered! Your order #{orderNumber} has arrived. Your cart is cleared and ready for a new order.',
      dismissAlert: 'Dismiss notification',
      statuses: {
        New: 'New',
        Called: 'Called',
        Confirmed: 'Confirmed',
        Bought: 'Bought',
        Delivered: 'Delivered',
        Cancelled: 'Cancelled',
      },
    },
    profile: {
      title: 'Profile & delivery address',
      subtitle: 'Update your name, Iraqi phone, GPS pin, or language anytime.',
      saveChanges: 'Save changes',
      savedToast: 'Profile updated successfully.',
      logoutReset: 'Log out / Reset',
      logoutConfirmHint: 'Clears your saved profile on this device and returns to onboarding.',
      languageSection: 'App language',
      pwaSectionTitle: 'Install Mobile App (PWA)',
      pwaInstallCta: 'Install App',
      pwaInstallIOS: 'Install on iPhone',
      pwaIOSModalTitle: 'Install on iPhone / iPad',
      pwaIOSModalStep1: '1. Tap the Share button in Safari’s toolbar.',
      pwaIOSModalStep2: '2. Scroll down and tap Add to Home Screen.',
      pwaClose: 'Close',
      adminToolsTitle: 'Store Admin Tools (Dev / First-Run)',
      adminToolsSubtitle:
        'Restricted to accounts in admins/{uid} for seeding the Erbil sample catalog.',
      adminSignedInAs: 'Signed in as',
      adminRoleLabel: 'Verified Admin',
      adminEmailPlaceholder: 'Admin email',
      adminPasswordPlaceholder: 'Password',
      adminSignInEmail: 'Sign in with Email',
      adminSignOut: 'Sign out Admin',
      adminSeedNote: 'Seeds 12 categories, 60 Erbil products, 3 banners, and settings/store if empty.',
      anonStatusNote: 'Customer session UID',
      contactHelpTitle: 'Contact & Help',
    },
    retention: {
      lifetimeSavingsTitle: 'Your Total Savings With Us',
      lifetimeSavingsLine: 'Your total savings with us: {amount} IQD (across {count} orders)',
      thankYouTitle: 'Thank you, {name} — hope you love your order!',
      thankYouBody:
        "Your groceries have arrived, and we hope everything is fresh and just how you like it. We're so happy we could save you {orderSavings} IQD today — bringing your total savings with us to {lifetimeSavings} IQD so far. Whenever your home needs anything again, we're always here to keep shopping simple and lighter on your budget.",
      thankYouBodyNoOrderSavings:
        "Your groceries have arrived, and we hope everything is fresh and just how you like it. You've saved {lifetimeSavings} IQD with us so far — whenever your home needs anything again, we're always happy to help.",
      thankYouBodySimple:
        "Your groceries have arrived, and we hope everything is fresh and just how you like it. Whenever your home needs anything again, we're always happy to help.",
      mobileNotifTitle: 'Your order arrived, {name}!',
      mobileNotifBody:
        'You saved {orderSavings} IQD today ({lifetimeSavings} IQD total with us). Thank you for shopping with us!',
      mobileNotifBodyNoOrderSavings:
        'Your groceries have arrived ({lifetimeSavings} IQD saved with us so far). Thank you for shopping with us!',
      mobileNotifBodySimple:
        'Your groceries have arrived — we hope everything is fresh and just how you like it!',
      savedThisOrderLabel: 'Saved This Order',
      totalSavedSoFarLabel: 'Total Saved So Far',
      continueShoppingCta: 'Shop Again & Keep Saving',
      closeCta: 'Thanks, Close',
      notificationsTitle: 'Notifications',
      notificationsEmpty: 'No delivery notifications yet.',
      markAllRead: 'Mark all read',
      notificationsBellAria: 'Order notifications',
      enableAlertsLabel: 'Enable Order Alerts',
      alertsEnabledLabel: 'Order Alerts Enabled',
      alertsBlockedHint: 'Browser alerts are blocked in your browser settings.',
      alertsUnsupportedHint: 'Browser alerts are not supported on this device.',
      alertsIosInstallHint:
        'On iPhone, tap Share → Add to Home Screen to receive alerts.',
    },
    footer: {
      tagline: 'Daily Erbil neighborhood supermarket with transparent savings and Cash on Delivery.',
      copyright: '© 2026 Bazar Fresh',
    },
  },
};
