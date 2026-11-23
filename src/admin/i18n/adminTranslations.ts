import type { AdminTabId, Language } from '../../types/grocery';

export interface AdminDictionary {
  panelTitle: string;
  ownerRole: string;
  staffRole: string;
  signOut: string;
  openMenu: string;
  closeMenu: string;
  login: {
    title: string;
    subtitle: string;
    emailLabel: string;
    passwordLabel: string;
    signInEmail: string;
    signInGoogle: string;
    signingIn: string;
    invalidCreds: string;
  };
  accessDenied: {
    title: string;
    body: string;
    backToLogin: string;
    goToStore: string;
  };
  tabs: Record<AdminTabId, string>;
  common: {
    search: string;
    save: string;
    saving: string;
    saved: string;
    cancel: string;
    delete: string;
    edit: string;
    add: string;
    close: string;
    confirm: string;
    loading: string;
    empty: string;
    visible: string;
    hidden: string;
    available: string;
    outOfStock: string;
    uploadImage: string;
    imageUrlPlaceholder: string;
    moveUp: string;
    moveDown: string;
    seedCatalog: string;
    seedingCatalog: string;
  };
  orders: {
    title: string;
    subtitle: string;
    allStatuses: string;
    today: string;
    last7Days: string;
    allDates: string;
    customDate: string;
    searchPlaceholder: string;
    newOrderAlert: string;
    openMaps: string;
    callCustomer: string;
    whatsappCustomer: string;
    whatsappThankYou: string;
    customerSavings: string;
    customerLifetimeSavings: string;
    statusActions: string;
    confirmFakeTitle: string;
    confirmFakeBody: string;
    alsoBlockPhone: string;
    blockReasonPlaceholder: string;
    internalNotes: string;
    notePlaceholder: string;
    addNote: string;
    noNotes: string;
  };
  products: {
    title: string;
    subtitle: string;
    addProduct: string;
    editProduct: string;
    tableMode: string;
    bulkMode: string;
    downloadTemplate: string;
    exportCsv: string;
    importCsv: string;
    ourPrice: string;
    marketPrice: string;
    savingsPreview: string;
    priceWarning: string;
    marketPriceNote: string;
    marketPriceUpdated: string;
    flagsTitle: string;
    inStock: string;
    showInDeals: string;
    showInPopular: string;
    isNew: string;
    isActive: string;
    bulkPercentLabel: string;
    applyPercent: string;
    saveAllChanges: string;
    csvPreviewTitle: string;
    commitImport: string;
    newRows: string;
    updateRows: string;
    invalidRows: string;
  };
  categories: {
    title: string;
    subtitle: string;
    addCategory: string;
    editCategory: string;
    subcategories: string;
    addSubcategory: string;
    iconLabel: string;
    imageLabel: string;
    imageHint: string;
    removeImage: string;
    loadDefaultsButton: string;
    loadingDefaults: string;
    defaultsAddedMsg: string;
    defaultsAlreadyPresentMsg: string;
  };
  customers: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    totalOrders: string;
    totalSpent: string;
    fakeCancelled: string;
    blockedBadge: string;
    blockNumber: string;
    unblockNumber: string;
    blockReasonLabel: string;
    orderHistory: string;
  };
  home: {
    title: string;
    subtitle: string;
    bannersTitle: string;
    addBanner: string;
    sectionsTitle: string;
    cmsTextTitle: string;
    contactLinksTitle: string;
    addContactLink: string;
    brandingTitle: string;
    primaryColorLabel: string;
    logoLabel: string;
    contrastPreview: string;
  };
  settings: {
    title: string;
    subtitle: string;
    storeStatusTitle: string;
    storeOpen: string;
    storeClosed: string;
    storeName: string;
    deliveryFee: string;
    minimumOrder: string;
    whatsappPhone: string;
    maxOrdersPerHour: string;
    maxOrdersPerHourHint: string;
    deliveryHoursKu: string;
    deliveryHoursAr: string;
    deliveryHoursEn: string;
    invalidPhoneError: string;
    lowBandwidthTitle: string;
    lowBandwidthDesc: string;
    lowBandwidthOn: string;
    lowBandwidthOff: string;
  };
  reports: {
    title: string;
    subtitle: string;
    today: string;
    last7Days: string;
    last30Days: string;
    customRange: string;
    orderCount: string;
    totalRevenue: string;
    fakeCancelled: string;
    savingsDelivered: string;
    aov: string;
    dailyChartTitle: string;
    topProductsTitle: string;
    qtySold: string;
    revenueCol: string;
  };
  audit: {
    title: string;
    subtitle: string;
    filterAction: string;
    allActions: string;
  };
  admins: {
    title: string;
    subtitle: string;
    addAdmin: string;
    uidLabel: string;
    emailLabel: string;
    roleLabel: string;
    uidHint: string;
  };
}

export const ADMIN_TRANSLATIONS: Record<Language, AdminDictionary> = {
  en: {
    panelTitle: 'Bazar Fresh Admin',
    ownerRole: 'Owner',
    staffRole: 'Staff',
    signOut: 'Sign out',
    openMenu: 'Open navigation',
    closeMenu: 'Close navigation',
    login: {
      title: 'Store Admin Sign-In',
      subtitle: 'Authorized store owners and staff only. Use your Firebase Email & Password account.',
      emailLabel: 'Admin email',
      passwordLabel: 'Password',
      signInEmail: 'Sign in with Email',
      signInGoogle: 'Owner Sign-In with Google',
      signingIn: 'Verifying admin access…',
      invalidCreds: 'Invalid credentials or sign-in method disabled in Firebase Console.',
    },
    accessDenied: {
      title: 'Access Denied',
      body: 'This account is not listed in admins/{uid}. You have been signed out of the admin area for security.',
      backToLogin: 'Try another account',
      goToStore: 'Return to storefront',
    },
    tabs: {
      orders: 'Orders',
      products: 'Products',
      categories: 'Categories',
      customers: 'Customers',
      home: 'Home Editor',
      settings: 'Settings',
      reports: 'Reports',
      audit: 'Audit Log',
      admins: 'Admin Users',
    },
    common: {
      search: 'Search…',
      save: 'Save',
      saving: 'Saving…',
      saved: 'Changes saved',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      add: 'Add',
      close: 'Close',
      confirm: 'Confirm',
      loading: 'Loading…',
      empty: 'No records found.',
      visible: 'Visible',
      hidden: 'Hidden',
      available: 'In Stock',
      outOfStock: 'Out of Stock',
      uploadImage: 'Upload image (auto <45KB)',
      imageUrlPlaceholder: 'Paste image URL or upload file',
      moveUp: 'Up',
      moveDown: 'Down',
      seedCatalog: 'Seed Sample Erbil Catalog (60 items)',
      seedingCatalog: 'Seeding catalog…',
    },
    orders: {
      title: 'Live Orders Queue',
      subtitle: 'Real-time Cash on Delivery orders from Erbil customers.',
      allStatuses: 'All',
      today: 'Today',
      last7Days: 'Last 7 Days',
      allDates: 'All Dates',
      customDate: 'Custom Date',
      searchPlaceholder: 'Search by SM-XXXX or phone…',
      newOrderAlert: 'New order received',
      openMaps: 'Open Location on Google Maps',
      callCustomer: 'Call Customer',
      whatsappCustomer: 'WhatsApp Customer',
      whatsappThankYou: 'Send Thank-You & Savings on WhatsApp',
      customerSavings: 'Customer savings on this order',
      customerLifetimeSavings: 'Customer lifetime savings',
      statusActions: 'Order Status',
      confirmFakeTitle: 'Mark order as Fake?',
      confirmFakeBody: 'Customers see Fake orders politely as Cancelled. Confirm before continuing.',
      alsoBlockPhone: 'Also block this phone number from future orders',
      blockReasonPlaceholder: 'Reason for blocking (e.g. Unreachable / Fake order)',
      internalNotes: 'Internal Staff Notes (Admin-only)',
      notePlaceholder: 'Add an internal call or delivery note…',
      addNote: 'Add note',
      noNotes: 'No internal notes yet.',
    },
    products: {
      title: 'Products Management',
      subtitle: 'Manage pricing, market comparisons, stock status, bulk edits, and CSV sync.',
      addProduct: 'Add Product',
      editProduct: 'Edit Product',
      tableMode: 'Catalog Table',
      bulkMode: 'Bulk Price Editor',
      downloadTemplate: 'Download CSV Template',
      exportCsv: 'Export CSV',
      importCsv: 'Import CSV',
      ourPrice: 'Our Price (IQD)',
      marketPrice: 'Market Price (IQD)',
      savingsPreview: 'Customer savings',
      priceWarning: 'Warning: Our Price is higher than Market Price.',
      marketPriceNote: 'Reference price note',
      marketPriceUpdated: 'Last checked date',
      flagsTitle: 'Stock & Home Visibility',
      inStock: 'Available (In Stock)',
      showInDeals: "Show in Today's Deals",
      showInPopular: 'Show in Popular',
      isNew: 'Mark as New',
      isActive: 'Visible on Storefront',
      bulkPercentLabel: '% Adjust selected',
      applyPercent: 'Apply %',
      saveAllChanges: 'Save All Changes',
      csvPreviewTitle: 'CSV Import Preview',
      commitImport: 'Commit Valid Rows',
      newRows: 'New items',
      updateRows: 'Updates',
      invalidRows: 'Invalid rows',
    },
    categories: {
      title: 'Categories Management',
      subtitle: 'Edit trilingual department names, category photos, fallback emojis, subcategories, and sort order.',
      addCategory: 'Add Category',
      editCategory: 'Edit Category',
      subcategories: 'Subcategories',
      addSubcategory: 'Add Subcategory',
      iconLabel: 'Fallback emoji or icon',
      imageLabel: 'Category tile image (400×400 auto-compressed, optional)',
      imageHint: 'Upload a square photo (auto-compressed <45KB, zero Cloud Storage cost) or paste an image URL. Leave blank to use studio grocery fallback.',
      removeImage: 'Remove image',
      loadDefaultsButton: 'Load Default 15 Supermarket Categories',
      loadingDefaults: 'Loading categories…',
      defaultsAddedMsg: 'Added {count} default supermarket categories.',
      defaultsAlreadyPresentMsg: 'All 15 default supermarket categories are already loaded.',
    },
    customers: {
      title: 'Customers & Blocklist',
      subtitle: 'Inspect registered Erbil shoppers, view order history, and block abusive numbers.',
      searchPlaceholder: 'Search customer name or phone…',
      totalOrders: 'Orders',
      totalSpent: 'Total Spent',
      fakeCancelled: 'Fake / Cancelled',
      blockedBadge: 'Blocked',
      blockNumber: 'Block This Number',
      unblockNumber: 'Unblock Number',
      blockReasonLabel: 'Required block reason',
      orderHistory: 'Customer Order History',
    },
    home: {
      title: 'Home Page & CMS Editor',
      subtitle: 'Edit storefront banners, home sections, trilingual texts, social buttons, and branding live.',
      bannersTitle: 'Banners Manager',
      addBanner: 'Add Banner',
      sectionsTitle: 'Home Sections Order & Visibility',
      cmsTextTitle: 'Trilingual Storefront Copy (cms/translations)',
      contactLinksTitle: 'Contact & Social Links (Profile Help)',
      addContactLink: 'Add Link',
      brandingTitle: 'Store Logo & Brand Color',
      primaryColorLabel: 'Primary Brand Color',
      logoLabel: 'Store Logo',
      contrastPreview: 'Button Contrast Preview',
    },
    settings: {
      title: 'Store Settings',
      subtitle: 'Control delivery fees, minimums, WhatsApp dispatch number, and live open/closed status.',
      storeStatusTitle: 'Store Availability',
      storeOpen: 'Store is OPEN (Accepting Orders)',
      storeClosed: 'Store is CLOSED (Checkout Paused)',
      storeName: 'Store Name',
      deliveryFee: 'Delivery Fee (IQD)',
      minimumOrder: 'Minimum Order (IQD)',
      whatsappPhone: 'Operations WhatsApp (9647XXXXXXXXX)',
      maxOrdersPerHour: 'Max Orders Per Hour (per phone)',
      maxOrdersPerHourHint: 'Set to 0 to disable the hourly order limit (unlimited for testing).',
      deliveryHoursKu: 'Delivery Hours (Kurdish Sorani)',
      deliveryHoursAr: 'Delivery Hours (Arabic)',
      deliveryHoursEn: 'Delivery Hours (English)',
      invalidPhoneError: 'Enter a valid Iraqi number normalized as 9647XXXXXXXXX (13 digits).',
      lowBandwidthTitle: 'Low-Bandwidth Mode (Show Instant SVGs Only for Categories)',
      lowBandwidthDesc: 'When ON, category buttons render instant 0ms inline SVG illustrations without downloading any category photos — ideal for slow mobile data.',
      lowBandwidthOn: 'ON (Instant SVGs Only)',
      lowBandwidthOff: 'OFF (SVGs + Fast Photos)',
    },
    reports: {
      title: 'Reports & Analytics',
      subtitle: 'Date-bounded Firestore analytics for sales, savings delivered, and fake order rate.',
      today: 'Today',
      last7Days: 'Last 7 Days',
      last30Days: 'Last 30 Days',
      customRange: 'Custom Range',
      orderCount: 'Period Orders',
      totalRevenue: 'Confirmed Sales Revenue',
      fakeCancelled: 'Fake & Cancelled',
      savingsDelivered: 'Customer Savings Delivered',
      aov: 'Average Order Value',
      dailyChartTitle: 'Daily Orders & Revenue',
      topProductsTitle: 'Top 10 Selling Products',
      qtySold: 'Qty Sold',
      revenueCol: 'Revenue',
    },
    audit: {
      title: 'Audit Log',
      subtitle: 'Immutable append-only history of every admin mutation.',
      filterAction: 'Filter by action',
      allActions: 'All actions',
    },
    admins: {
      title: 'Admin Users & Roles',
      subtitle: 'Manage Owner and Staff role assignments in admins/{uid}.',
      addAdmin: 'Add / Update Admin',
      uidLabel: 'Firebase Auth UID',
      emailLabel: 'Admin Email',
      roleLabel: 'Role',
      uidHint: 'Create the user in Firebase Console → Authentication first, then paste their UID here.',
    },
  },
  ku: {
    panelTitle: 'پانێڵی بەڕێوەبردنی بازاڕ فرێش',
    ownerRole: 'خاوەن',
    staffRole: 'ستاف',
    signOut: 'چوونەدەرەوە',
    openMenu: 'کردنەوەی مینیو',
    closeMenu: 'داخستنی مینیو',
    login: {
      title: 'چوونەژوورەوەی بەڕێوەبەر',
      subtitle: 'تەنها بۆ خاوەن و ستافی ڕێگەپێدراوی فرۆشگا. ئیمەیڵ و وشەی نهێنی Firebase بەکاربهێنە.',
      emailLabel: 'ئیمەیڵی بەڕێوەبەر',
      passwordLabel: 'وشەی نهێنی',
      signInEmail: 'چوونەژوورەوە بە ئیمەیڵ',
      signInGoogle: 'چوونەژوورەوەی خاوەن بە Google',
      signingIn: 'پشکنینی ڕێگەپێدانی ئەدمین…',
      invalidCreds: 'ئیمەیڵ یان وشەی نهێنی هەڵەیە، یان چوونەژوورەوەی ئیمەیڵ لە Firebase چالاک نەکراوە.',
    },
    accessDenied: {
      title: 'ڕێگەپێدان ڕەتکرایەوە',
      body: 'ئەم هەژمارە لە لیستی admins/{uid} تۆمار نەکراوە. بۆ پاراستن لە بەشی ئەدمین چوونەدەرەوە ئەنجام درا.',
      backToLogin: 'هەژمارێکی تر تاقی بکەرەوە',
      goToStore: 'گەڕانەوە بۆ فرۆشگا',
    },
    tabs: {
      orders: 'داواکارییەکان',
      products: 'بەرهەمەکان',
      categories: 'بەشەکان',
      customers: 'کڕیارەکان',
      home: 'دەستکاری پەڕەی سەرەکی',
      settings: 'ڕێکخستنەکان',
      reports: 'ڕاپۆرتەکان',
      audit: 'تۆماری گۆڕانکاری',
      admins: 'بەڕێوەبەرەکان',
    },
    common: {
      search: 'گەڕان…',
      save: 'پاشەکەوتکردن',
      saving: 'پاشەکەوتکردن…',
      saved: 'گۆڕانکارییەکان پاشەکەوت کران',
      cancel: 'هەڵوەشاندنەوە',
      delete: 'سڕینەوە',
      edit: 'دەستکاری',
      add: 'زیادکردن',
      close: 'داخستن',
      confirm: 'دڵنیابوونەوە',
      loading: 'بارکردن…',
      empty: 'هیچ تۆمارێک نەدۆزرایەوە.',
      visible: 'پیشاندراو',
      hidden: 'شاراوە',
      available: 'بەردەستە',
      outOfStock: 'نەماوە',
      uploadImage: 'هەڵبژاردنی وێنە (<45KB)',
      imageUrlPlaceholder: 'بەستەری وێنە یان فایل هەڵبژێرە',
      moveUp: 'سەرەوە',
      moveDown: 'خوارەوە',
      seedCatalog: 'ناردنی ٦٠ بەرهەمی نموونەی هەولێر',
      seedingCatalog: 'ناردنی بەرهەمەکان…',
    },
    orders: {
      title: 'لیستی ڕاستەوخۆی داواکارییەکان',
      subtitle: 'بەڕێوەبردنی خێرای داواکارییەکانی کاش لە کاتی گەیشتندا.',
      allStatuses: 'هەمووی',
      today: 'ئەمڕۆ',
      last7Days: '٧ ڕۆژی ڕابردوو',
      allDates: 'هەموو کات',
      customDate: 'بەرواری تایبەت',
      searchPlaceholder: 'گەڕان بە SM-XXXX یان مۆبایل…',
      newOrderAlert: 'داواکاری نوێ گەیشت',
      openMaps: 'کردنەوەی شوێن لە Google Maps',
      callCustomer: 'پەیوەندی بە کڕیار',
      whatsappCustomer: 'واتساپ بۆ کڕیار',
      whatsappThankYou: 'ناردنی سوپاس و پاشەکەوت لە واتساپ',
      customerSavings: 'پاشەکەوتی کڕیار لەم داواکارییەدا',
      customerLifetimeSavings: 'کۆی پاشەکەوتی هەمیشەیی کڕیار',
      statusActions: 'دۆخی داواکاری',
      confirmFakeTitle: 'دیاریکردنی داواکاری وەک ساختە (Fake)؟',
      confirmFakeBody: 'کڕیار داواکاری ساختە وەک «هەڵوەشێنرایەوە» دەبینێت. دڵنیایت؟',
      alsoBlockPhone: 'هەروەها ئەم ژمارە مۆبایلە بلۆک بکرێت',
      blockReasonPlaceholder: 'هۆکاری بلۆککردن (وەک: وەڵامنەدانەوە / داواکاری ساختە)',
      internalNotes: 'تێبینی ناوخۆیی ستاف (کڕیار نایبینێت)',
      notePlaceholder: 'تێبینییەکی ناوخۆیی بنووسە…',
      addNote: 'زیادکردنی تێبینی',
      noNotes: 'هێشتا تێبینی ناوخۆیی نییە.',
    },
    products: {
      title: 'بەڕێوەبردنی بەرهەمەکان',
      subtitle: 'نرخەکان، نرخی بازاڕ، بەردەستبوون، دەستکاری بەکۆمەڵ و CSV.',
      addProduct: 'زیادکردنی بەرهەم',
      editProduct: 'دەستکاری بەرهەم',
      tableMode: 'خشتەی بەرهەمەکان',
      bulkMode: 'دەستکاری نرخی بەکۆمەڵ',
      downloadTemplate: 'داگرتنی قاڵبی CSV',
      exportCsv: 'هەناردەکردنی CSV',
      importCsv: 'هاوردەکردنی CSV',
      ourPrice: 'نرخی ئێمە (د.ع)',
      marketPrice: 'نرخی بازاڕ (د.ع)',
      savingsPreview: 'پاشەکەوتی کڕیار',
      priceWarning: 'ئاگاداری: نرخی ئێمە لە نرخی بازاڕ بەرزترە.',
      marketPriceNote: 'تێبینی سەرچاوەی نرخی بازاڕ',
      marketPriceUpdated: 'دوا بەرواری پشکنین',
      flagsTitle: 'کۆگا و پیشاندان لە پەڕەی سەرەکی',
      inStock: 'بەردەستە لە کۆگا',
      showInDeals: 'پیشاندان لە داشکاندنەکان',
      showInPopular: 'پیشاندان لە باوترینەکان',
      isNew: 'وەک بەرهەمی نوێ',
      isActive: 'پیشاندان لە فرۆشگا',
      bulkPercentLabel: 'گۆڕینی % بۆ دیاریکراوەکان',
      applyPercent: 'جێبەجێکردنی %',
      saveAllChanges: 'پاشەکەوتکردنی هەموو گۆڕانکارییەکان',
      csvPreviewTitle: 'پێشبینینی هاوردەکردنی CSV',
      commitImport: 'تۆمارکردنی ڕیزە دروستەکان',
      newRows: 'بەرهەمی نوێ',
      updateRows: 'نوێکردنەوە',
      invalidRows: 'ڕیزی هەڵە',
    },
    categories: {
      title: 'بەڕێوەبردنی بەشەکان',
      subtitle: 'ناوی سێ‌زمانە، وێنەی بەش، ئیمۆجی، ژێربەشەکان و ڕیزبەندی.',
      addCategory: 'زیادکردنی بەش',
      editCategory: 'دەستکاری بەش',
      subcategories: 'ژێربەشەکان',
      addSubcategory: 'زیادکردنی ژێربەش',
      iconLabel: 'ئیمۆجی یان ئایکۆنی جێگرەوە',
      imageLabel: 'وێنەی بەش (400×400 پەستێوراو، ئارەزوومەندانە)',
      imageHint: 'وێنەیەک باربکە (بەخۆکارانە بۆ خوار 45KB دەپەستێورێت) یان بەستەری وێنە دابنێ.',
      removeImage: 'لابردنی وێنە',
      loadDefaultsButton: 'بارکردنی ١٥ پۆلی سەرەکی سوپەرمارکێت',
      loadingDefaults: 'بارکردنی پۆلەکان…',
      defaultsAddedMsg: '{count} پۆلی سەرەکی سوپەرمارکێت زیادکران.',
      defaultsAlreadyPresentMsg: 'هەموو ١٥ پۆلی سەرەکی پێشتر بارکراون.',
    },
    customers: {
      title: 'کڕیارەکان و لیستی بلۆک',
      subtitle: 'بینی مێژووی کڕینی کڕیارەکان و بلۆککردنی ژمارەی ساختە.',
      searchPlaceholder: 'گەڕان بە ناو یان مۆبایل…',
      totalOrders: 'داواکاری',
      totalSpent: 'کۆی خەرجی',
      fakeCancelled: 'ساختە / هەڵوەشاوە',
      blockedBadge: 'بلۆککراو',
      blockNumber: 'بلۆککردنی ئەم ژمارەیە',
      unblockNumber: 'لادانی بلۆک',
      blockReasonLabel: 'هۆکاری بلۆککردن (پێویستە)',
      orderHistory: 'مێژووی داواکارییەکانی کڕیار',
    },
    home: {
      title: 'دەستکاری پەڕەی سەرەکی و CMS',
      subtitle: 'بانەرەکان، ڕیزبەندی بەشەکان، دەقە سێ‌زمانەکان، پەیوەندی و ڕەنگی براند.',
      bannersTitle: 'بەڕێوەبردنی بانەرەکان',
      addBanner: 'زیادکردنی بانەر',
      sectionsTitle: 'ڕیزبەندی و پیشاندانی بەشەکانی سەرەکی',
      cmsTextTitle: 'دەستکاری دەقەکان (cms/translations)',
      contactLinksTitle: 'دوگمەکانی پەیوەندی و سۆشیاڵ میدیا',
      addContactLink: 'زیادکردنی بەستەر',
      brandingTitle: 'لۆگۆ و ڕەنگی سەرەکی فرۆشگا',
      primaryColorLabel: 'ڕەنگی سەرەکی',
      logoLabel: 'لۆگۆی فرۆشگا',
      contrastPreview: 'پێشبینینی ڕوونی دوگمە',
    },
    settings: {
      title: 'ڕێکخستنەکانی فرۆشگا',
      subtitle: 'کرێی گەیاندن، کەمترین داواکاری، واتساپ و کردنەوە/داخستنی فرۆشگا.',
      storeStatusTitle: 'دۆخی کردنەوەی فرۆشگا',
      storeOpen: 'فرۆشگا کراوەیە (داواکاری وەردەگرێت)',
      storeClosed: 'فرۆشگا داخراوە (داواکاری ڕاگیراوە)',
      storeName: 'ناوی فرۆشگا',
      deliveryFee: 'کرێی گەیاندن (د.ع)',
      minimumOrder: 'کەمترین بڕی داواکاری (د.ع)',
      whatsappPhone: 'ژمارەی واتساپی فرۆشگا (9647XXXXXXXXX)',
      maxOrdersPerHour: 'زۆرترین داواکاری لە کاتژمێرێکدا',
      maxOrdersPerHourHint: 'دابنێ بە 0 بۆ ناچالاککردنی سنوورەکە (بێسنوور بۆ تاقیکردنەوە).',
      deliveryHoursKu: 'کاتی گەیاندن (کوردی)',
      deliveryHoursAr: 'کاتی گەیاندن (عەرەبی)',
      deliveryHoursEn: 'کاتی گەیاندن (ئینگلیزی)',
      invalidPhoneError: 'تکایە ژمارەی عێراقی دروست بە شێوەی 9647XXXXXXXXX بنووسە.',
      lowBandwidthTitle: 'دۆخی ئینتەرنێتی خاو (تەنها SVGی خێرا بۆ پۆلەکان)',
      lowBandwidthDesc: 'کاتێک چالاکە، دوگمەی پۆلەکان تەنها وێنەی SVGی خێرا پیشان دەدەن بەبێ دابەزاندنی وێنەی دەرەکی — زۆر گونجاوە بۆ هێڵی لاواز.',
      lowBandwidthOn: 'چالاک (تەنها SVG)',
      lowBandwidthOff: 'ناچالاک (SVG + وێنەی خێرا)',
    },
    reports: {
      title: 'ڕاپۆرت و ئامارەکان',
      subtitle: 'فرۆش، پاشەکەوتی کڕیاران، ڕێژەی ساختە و پڕفرۆشترین بەرهەمەکان.',
      today: 'ئەمڕۆ',
      last7Days: '٧ ڕۆژی ڕابردوو',
      last30Days: '٣٠ ڕۆژی ڕابردوو',
      customRange: 'ماوەی تایبەت',
      orderCount: 'ژمارەی داواکاری',
      totalRevenue: 'کۆی داهاتی دڵنیاکراوە',
      fakeCancelled: 'ساختە و هەڵوەشاوە',
      savingsDelivered: 'کۆی پاشەکەوتی کڕیاران',
      aov: 'تێکڕای نرخی داواکاری',
      dailyChartTitle: 'داواکاری و فرۆشی ڕۆژانە',
      topProductsTitle: 'پڕفرۆشترین ١٠ بەرهەم',
      qtySold: 'بڕی فرۆشراو',
      revenueCol: 'داهات',
    },
    audit: {
      title: 'تۆماری گۆڕانکارییەکان',
      subtitle: 'مێژووی پارێزراوی هەموو گۆڕانکارییەکانی بەڕێوەبەران.',
      filterAction: 'فلتەر بەپێی کردار',
      allActions: 'هەموو کردارەکان',
    },
    admins: {
      title: 'بەڕێوەبەران و ڕۆڵەکان',
      subtitle: 'بەڕێوەبردنی خاوەن (Owner) و ستاف (Staff) لە admins/{uid}.',
      addAdmin: 'زیادکردن / نوێکردنەوەی ئەدمین',
      uidLabel: 'ناسنامەی Firebase UID',
      emailLabel: 'ئیمەیڵی ئەدمین',
      roleLabel: 'ڕۆڵ',
      uidHint: 'سەرەتا هەژمارەکە لە Firebase Authentication دروست بکە و پاشان UID لێرە دابنێ.',
    },
  },
  ar: {
    panelTitle: 'لوحة تحكم بازار فريش',
    ownerRole: 'المالك',
    staffRole: 'موظف',
    signOut: 'تسجيل الخروج',
    openMenu: 'فتح القائمة',
    closeMenu: 'إغلاق القائمة',
    login: {
      title: 'دخول إدارة المتجر',
      subtitle: 'مخصص لمالك وموظفي المتجر المصرح لهم فقط باستخدام البريد وكلمة المرور.',
      emailLabel: 'البريد الإلكتروني',
      passwordLabel: 'كلمة المرور',
      signInEmail: 'الدخول بالبريد وكلمة المرور',
      signInGoogle: 'دخول المالك عبر Google',
      signingIn: 'جاري التحقق من صلاحيات الإدارة…',
      invalidCreds: 'بيانات الدخول غير صحيحة أو مزود البريد غير مفعّل في Firebase Console.',
    },
    accessDenied: {
      title: 'تم رفض الوصول',
      body: 'هذا الحساب غير مسجل ضمن admins/{uid}. تم تسجيل خروجك من لوحة الإدارة حفاظاً على الأمان.',
      backToLogin: 'تجربة حساب آخر',
      goToStore: 'العودة إلى المتجر',
    },
    tabs: {
      orders: 'الطلبات',
      products: 'المنتجات',
      categories: 'الأقسام',
      customers: 'العملاء',
      home: 'محرر الرئيسية',
      settings: 'الإعدادات',
      reports: 'التقارير',
      audit: 'سجل التدقيق',
      admins: 'المدراء',
    },
    common: {
      search: 'بحث…',
      save: 'حفظ',
      saving: 'جاري الحفظ…',
      saved: 'تم حفظ التغييرات',
      cancel: 'إلغاء',
      delete: 'حذف',
      edit: 'تعديل',
      add: 'إضافة',
      close: 'إغلاق',
      confirm: 'تأكيد',
      loading: 'جاري التحميل…',
      empty: 'لا توجد سجلات.',
      visible: 'ظاهر',
      hidden: 'مخفي',
      available: 'متوفر',
      outOfStock: 'نفد المخزون',
      uploadImage: 'رفع صورة (<45KB)',
      imageUrlPlaceholder: 'رابط صورة أو اختر ملفاً',
      moveUp: 'أعلى',
      moveDown: 'أسفل',
      seedCatalog: 'إضافة 60 منتجاً نموذجياً لأربيل',
      seedingCatalog: 'جاري الإضافة…',
    },
    orders: {
      title: 'قائمة الطلبات المباشرة',
      subtitle: 'متابعة فورية لطلبات الدفع عند الاستلام في أربيل.',
      allStatuses: 'الكل',
      today: 'اليوم',
      last7Days: 'آخر 7 أيام',
      allDates: 'كل التواريخ',
      customDate: 'تاريخ محدد',
      searchPlaceholder: 'ابحث برقم SM-XXXX أو الهاتف…',
      newOrderAlert: 'وصل طلب جديد',
      openMaps: 'فتح الموقع على خرائط Google',
      callCustomer: 'اتصال بالعميل',
      whatsappCustomer: 'واتساب للعميل',
      whatsappThankYou: 'إرسال الشكر والتوفير عبر واتساب',
      customerSavings: 'توفير العميل في هذا الطلب',
      customerLifetimeSavings: 'إجمالي توفير العميل معنا',
      statusActions: 'حالة الطلب',
      confirmFakeTitle: 'تأكيد تحديد الطلب كـ وهمي (Fake)؟',
      confirmFakeBody: 'يرى العميل الطلب الوهمي كـ «ملغي» بأسلوب لائق. هل تريد المتابعة؟',
      alsoBlockPhone: 'حظر هذا الرقم أيضاً من الطلب مستقبلاً',
      blockReasonPlaceholder: 'سبب الحظر (مثال: رقم لا يرد / طلب وهمي)',
      internalNotes: 'ملاحظات الموظفين الداخلية (لا يراها العميل)',
      notePlaceholder: 'أضف ملاحظة داخلية للمكالمة أو التوصيل…',
      addNote: 'إضافة ملاحظة',
      noNotes: 'لا توجد ملاحظات داخلية بعد.',
    },
    products: {
      title: 'إدارة المنتجات',
      subtitle: 'الأسعار، مقارنة السوق، المخزون، التعديل الجماعي، واستيراد/تصدير CSV.',
      addProduct: 'إضافة منتج',
      editProduct: 'تعديل منتج',
      tableMode: 'جدول المنتجات',
      bulkMode: 'محرر الأسعار الجماعي',
      downloadTemplate: 'تحميل قالب CSV',
      exportCsv: 'تصدير CSV',
      importCsv: 'استيراد CSV',
      ourPrice: 'سعرنا (د.ع)',
      marketPrice: 'سعر السوق (د.ع)',
      savingsPreview: 'توفير العميل',
      priceWarning: 'تنبيه: سعرنا أعلى من سعر السوق.',
      marketPriceNote: 'ملاحظة مرجع سعر السوق',
      marketPriceUpdated: 'تاريخ آخر تحقق',
      flagsTitle: 'المخزون والظهور في الرئيسية',
      inStock: 'متوفر في المخزون',
      showInDeals: 'إظهار في العروض',
      showInPopular: 'إظهار في الأكثر طلباً',
      isNew: 'تمييز كـ جديد',
      isActive: 'ظاهر في المتجر',
      bulkPercentLabel: 'تعديل % للمحدد',
      applyPercent: 'تطبيق %',
      saveAllChanges: 'حفظ جميع التغييرات',
      csvPreviewTitle: 'معاينة استيراد CSV',
      commitImport: 'حفظ الصفوف الصحيحة',
      newRows: 'منتجات جديدة',
      updateRows: 'تحديثات',
      invalidRows: 'صفوف غير صالحة',
    },
    categories: {
      title: 'إدارة الأقسام',
      subtitle: 'الأسماء الثلاثية وصور الأقسام والإيموجي والأقسام الفرعية والترتيب.',
      addCategory: 'إضافة قسم',
      editCategory: 'تعديل قسم',
      subcategories: 'الأقسام الفرعية',
      addSubcategory: 'إضافة قسم فرعي',
      iconLabel: 'إيموجي أو أيقونة بديلة',
      imageLabel: 'صورة القسم (مضغوطة تلقائياً 400×400، اختياري)',
      imageHint: 'ارفع صورة مربعة (تُضغط تلقائياً لأقل من 45KB بدون تكلفة Storage) أو الصق رابط صورة.',
      removeImage: 'إزالة الصورة',
      loadDefaultsButton: 'تحميل 15 قسماً افتراضياً للسوبرماركت',
      loadingDefaults: 'جاري تحميل الأقسام…',
      defaultsAddedMsg: 'تمت إضافة {count} قسماً افتراضياً بنجاح.',
      defaultsAlreadyPresentMsg: 'جميع الأقسام الافتراضية الـ 15 محمّلة بالفعل.',
    },
    customers: {
      title: 'العملاء وقائمة الحظر',
      subtitle: 'عرض سجل طلبات العملاء وحظر أو إلغاء حظر الأرقام.',
      searchPlaceholder: 'ابحث باسم العميل أو الهاتف…',
      totalOrders: 'الطلبات',
      totalSpent: 'إجمالي الإنفاق',
      fakeCancelled: 'وهمي / ملغي',
      blockedBadge: 'محظور',
      blockNumber: 'حظر هذا الرقم',
      unblockNumber: 'إلغاء الحظر',
      blockReasonLabel: 'سبب الحظر (مطلوب)',
      orderHistory: 'سجل طلبات العميل',
    },
    home: {
      title: 'محرر الصفحة الرئيسية وCMS',
      subtitle: 'تعديل البانرات وترتيب الأقسام والنصوص الثلاثية وروابط التواصل والهوية.',
      bannersTitle: 'إدارة البانرات',
      addBanner: 'إضافة بانر',
      sectionsTitle: 'ترتيب وإظهار أقسام الرئيسية',
      cmsTextTitle: 'محرر النصوص الثلاثية (cms/translations)',
      contactLinksTitle: 'روابط التواصل والشبكات الاجتماعية',
      addContactLink: 'إضافة رابط',
      brandingTitle: 'شعار المتجر واللون الرئيسي',
      primaryColorLabel: 'اللون الرئيسي للعلامة',
      logoLabel: 'شعار المتجر',
      contrastPreview: 'معاينة تباين الزر',
    },
    settings: {
      title: 'إعدادات المتجر',
      subtitle: 'رسوم التوصيل والحد الأدنى ورقم واتساب وحالة فتح/إغلاق المتجر.',
      storeStatusTitle: 'حالة المتجر',
      storeOpen: 'المتجر مفتوح (يستقبل الطلبات)',
      storeClosed: 'المتجر مغلق (إرسال الطلبات متوقف)',
      storeName: 'اسم المتجر',
      deliveryFee: 'رسوم التوصيل (د.ع)',
      minimumOrder: 'الحد الأدنى للطلب (د.ع)',
      whatsappPhone: 'رقم واتساب العمليات (9647XXXXXXXXX)',
      maxOrdersPerHour: 'الحد الأقصى للطلبات في الساعة',
      maxOrdersPerHourHint: 'اضبطه على 0 لتعطيل الحد الساعي بالكامل (غير محدود للاختبار).',
      deliveryHoursKu: 'ساعات التوصيل (كردي)',
      deliveryHoursAr: 'ساعات التوصيل (عربي)',
      deliveryHoursEn: 'ساعات التوصيل (إنجليزي)',
      invalidPhoneError: 'يرجى إدخال رقم عراقي بصيغة 9647XXXXXXXXX (13 رقماً).',
      lowBandwidthTitle: 'وضع الإنترنت الضعيف (عرض رسومات SVG الفورية للأقسام فقط)',
      lowBandwidthDesc: 'عند التفعيل، تعرض أزرار الأقسام رسومات SVG فورية خلال 0ms دون تحميل صور الأقسام — مثالي لشبكات الموبايل البطيئة.',
      lowBandwidthOn: 'مفعّل (SVG فوري فقط)',
      lowBandwidthOff: 'متوقف (SVG + صور سريعة)',
    },
    reports: {
      title: 'التقارير والتحليلات',
      subtitle: 'إحصائيات المبيعات والتوفير والطلبات الوهمية ضمن الفترة المحددة.',
      today: 'اليوم',
      last7Days: 'آخر 7 أيام',
      last30Days: 'آخر 30 يوماً',
      customRange: 'فترة مخصصة',
      orderCount: 'عدد الطلبات',
      totalRevenue: 'إجمالي المبيعات المؤكدة',
      fakeCancelled: 'الوهمية والملغاة',
      savingsDelivered: 'إجمالي توفير العملاء',
      aov: 'متوسط قيمة الطلب',
      dailyChartTitle: 'الطلبات والمبيعات اليومية',
      topProductsTitle: 'أكثر 10 منتجات مبيعاً',
      qtySold: 'الكمية المباعة',
      revenueCol: 'الإيراد',
    },
    audit: {
      title: 'سجل التدقيق',
      subtitle: 'سجل دائم غير قابل للتعديل لكل عمليات الإدارة.',
      filterAction: 'تصفية حسب العملية',
      allActions: 'كل العمليات',
    },
    admins: {
      title: 'حسابات الإدارة والصلاحيات',
      subtitle: 'إدارة حسابات المالك (Owner) والموظفين (Staff) في admins/{uid}.',
      addAdmin: 'إضافة / تحديث مدير',
      uidLabel: 'معرّف Firebase UID',
      emailLabel: 'البريد الإلكتروني',
      roleLabel: 'الصلاحية',
      uidHint: 'أنشئ الحساب أولاً في Firebase Authentication ثم الصق UID هنا.',
    },
  },
};
