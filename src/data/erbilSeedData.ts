import type { Banner, Category, Product, StoreSettings } from '../types/grocery';

export const HERO_IMAGE = '/src/assets/images/hero_fresh_market_1795087971030.jpg';
const IMG_TOMATOES = '/src/assets/images/prod_vine_tomatoes_1795087970471.jpg';
const IMG_POMEGRANATES = '/src/assets/images/prod_pomegranates_1795087970182.jpg';
const IMG_CUCUMBERS = '/src/assets/images/prod_cucumbers_1795087971662.jpg';
const IMG_YOGURT = '/src/assets/images/prod_mountain_yogurt_1795087970641.jpg';
const IMG_FLATBREAD = '/src/assets/images/prod_sesame_flatbread_1795087971803.jpg';
const IMG_OLIVE_OIL = '/src/assets/images/prod_olive_oil_1795087970555.jpg';
const IMG_HONEY = '/src/assets/images/prod_wildflower_honey_1795087970611.jpg';
const IMG_TEA = '/src/assets/images/prod_cardamom_tea_1795087971403.jpg';

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  storeName: 'Bazar Fresh',
  whatsappPhone: '9647507442404',
  deliveryFee: 2500,
  minimumOrder: 10000,
  isStoreOpen: true,
  deliveryHoursText: {
    ku: 'ڕۆژانە ٠٨:٠٠ – ٢٣:٠٠ · گەیاندن لە ٤٥ خولەکدا لە هەولێر',
    ar: 'يومياً 08:00 – 23:00 · توصيل خلال 45 دقيقة في أربيل',
    en: 'Daily 08:00 – 23:00 · 45 min delivery across Erbil',
  },
  maxOrdersPerHour: 3,
  themeColor: '#15663C',
  primaryColor: '#15663C',
  logoUrl: '',
  homeSections: [
    { id: 'deals', visible: true, sortOrder: 1 },
    { id: 'popular', visible: true, sortOrder: 2 },
    { id: 'new', visible: true, sortOrder: 3 },
    { id: 'recommended', visible: true, sortOrder: 4 },
  ],
  contactLinks: [
    {
      id: 'contact-whatsapp',
      type: 'whatsapp',
      labelKu: 'واتساپی فرۆشگا',
      labelAr: 'واتساب المتجر',
      labelEn: 'WhatsApp Support',
      url: 'https://wa.me/9647507442404',
      visible: true,
      sortOrder: 1,
    },
    {
      id: 'contact-phone',
      type: 'phone',
      labelKu: 'پەیوەندی تەلەفۆنی',
      labelAr: 'اتصال هاتفي',
      labelEn: 'Call Store',
      url: 'tel:+9647507442404',
      visible: true,
      sortOrder: 2,
    },
    {
      id: 'contact-instagram',
      type: 'instagram',
      labelKu: 'ئینستاگرام',
      labelAr: 'إنستغرام',
      labelEn: 'Instagram',
      url: 'https://instagram.com',
      visible: true,
      sortOrder: 3,
    },
    {
      id: 'contact-facebook',
      type: 'facebook',
      labelKu: 'فەیسبووک',
      labelAr: 'فيسبوك',
      labelEn: 'Facebook',
      url: 'https://facebook.com',
      visible: true,
      sortOrder: 4,
    },
  ],
};

export const SEED_BANNERS: Banner[] = [
  {
    id: 'banner-erbil-fresh',
    titleKu: 'سەوزە و میوەی تازەی بەیانیان بە نرخی هەرزانتر لە بازاڕ',
    titleAr: 'خضار وفواكه الصباح الطازجة بأسعار أقل من السوق',
    titleEn: 'Morning-picked Erbil produce below market price',
    imageUrl: HERO_IMAGE,
    linkCategoryId: 'produce',
    sortOrder: 1,
    isActive: true,
  },
  {
    id: 'banner-kurdish-breakfast',
    titleKu: 'خوانی بەیانی کوردەواری: ماستی کوێستانی و هەنگوینی زاگرۆس',
    titleAr: 'فطور صباحي أصيل: لبن جبلي وعسل زاغروس',
    titleEn: 'Highland breakfast staples: mountain yogurt & Zagros honey',
    imageUrl: IMG_HONEY,
    linkCategoryId: 'breakfast',
    sortOrder: 2,
    isActive: true,
  },
  {
    id: 'banner-pantry-deals',
    titleKu: 'داشکاندنی هەفتانە لەسەر زەیت، برنج و چای سیلانی',
    titleAr: 'عروض أسبوعية على زيت الزيتون والأرز والشاي السيلاني',
    titleEn: 'Weekly pantry savings on olive oil, rice & cardamom tea',
    imageUrl: IMG_OLIVE_OIL,
    linkCategoryId: 'pantry',
    sortOrder: 3,
    isActive: true,
  },
];

export const SEED_CATEGORIES: Category[] = [
  {
    id: 'produce',
    nameKu: 'سەوزە و میوە',
    nameAr: 'خضار وفواكه',
    nameEn: 'Fresh Produce',
    icon: 'Carrot',
    sortOrder: 1,
    isActive: true,
    subcategories: [
      { id: 'vegetables', nameKu: 'سەوزە', nameAr: 'خضار', nameEn: 'Vegetables' },
      { id: 'fruits', nameKu: 'میوە', nameAr: 'فواكه', nameEn: 'Fruits' },
      { id: 'herbs', nameKu: 'سەوزەی تازە', nameAr: 'أعشاب طازجة', nameEn: 'Fresh Herbs' },
    ],
  },
  {
    id: 'dairy',
    nameKu: 'شیرەمەنی و هێلکە',
    nameAr: 'ألبان وبيض',
    nameEn: 'Dairy & Eggs',
    icon: 'Milk',
    sortOrder: 2,
    isActive: true,
    subcategories: [
      { id: 'yogurt', nameKu: 'ماست و دۆ', nameAr: 'لبن وشنينة', nameEn: 'Yogurt & Doogh' },
      { id: 'cheese', nameKu: 'پەنیر و قەیماغ', nameAr: 'أجبان وقشطة', nameEn: 'Cheese & Cream' },
      { id: 'eggs', nameKu: 'هێلکە و شیر', nameAr: 'بيض وحليب', nameEn: 'Eggs & Milk' },
    ],
  },
  {
    id: 'bakery',
    nameKu: 'نانەواخانە',
    nameAr: 'المخبز',
    nameEn: 'Bakery',
    icon: 'Croissant',
    sortOrder: 3,
    isActive: true,
    subcategories: [
      { id: 'flatbread', nameKu: 'نانی تەنوور و سەموون', nameAr: 'خبز تنور وصمون', nameEn: 'Flatbread & Samoon' },
      { id: 'pastries', nameKu: 'کولیچە و سەموونی گەرم', nameAr: 'معجنات وكليجة', nameEn: 'Pastries & Rolls' },
    ],
  },
  {
    id: 'meat',
    nameKu: 'گۆشت و مریشک',
    nameAr: 'لحوم ودواجن',
    nameEn: 'Meat & Poultry',
    icon: 'Beef',
    sortOrder: 4,
    isActive: true,
    subcategories: [
      { id: 'poultry', nameKu: 'مریشکی تازە', nameAr: 'دجاج طازج', nameEn: 'Fresh Poultry' },
      { id: 'red_meat', nameKu: 'گۆشتی بەرخ و گوێرەکە', nameAr: 'لحم غنم وعجل', nameEn: 'Lamb & Beef' },
    ],
  },
  {
    id: 'grains',
    nameKu: 'برنج و دانەوێڵە',
    nameAr: 'أرز وحبوب',
    nameEn: 'Rice & Grains',
    icon: 'Wheat',
    sortOrder: 5,
    isActive: true,
    subcategories: [
      { id: 'rice', nameKu: 'برنج', nameAr: 'أرز', nameEn: 'Rice' },
      { id: 'legumes', nameKu: 'نیسک و نۆک و بڕوێش', nameAr: 'عدس وحمص وبرغل', nameEn: 'Legumes & Bulgur' },
      { id: 'pasta', nameKu: 'مەکەرۆنی و شەعرییە', nameAr: 'معكرونة وشعيرية', nameEn: 'Pasta & Vermicelli' },
    ],
  },
  {
    id: 'pantry',
    nameKu: 'زەیت و خواردەمەنی',
    nameAr: 'زيوت ومونة',
    nameEn: 'Oils & Pantry',
    icon: 'Droplets',
    sortOrder: 6,
    isActive: true,
    subcategories: [
      { id: 'oils', nameKu: 'زەیت و ڕۆن', nameAr: 'زيوت وسمن', nameEn: 'Oils & Ghee' },
      { id: 'sauces', nameKu: 'دۆشاو و سۆس', nameAr: 'معجون وصلصات', nameEn: 'Pastes & Sauces' },
      { id: 'canned', nameKu: 'قوتووبەند', nameAr: 'معلبات', nameEn: 'Canned Goods' },
    ],
  },
  {
    id: 'beverages',
    nameKu: 'چا و خواردنەوە',
    nameAr: 'شاي ومشروبات',
    nameEn: 'Tea & Drinks',
    icon: 'Coffee',
    sortOrder: 7,
    isActive: true,
    subcategories: [
      { id: 'tea_coffee', nameKu: 'چا و قاوە', nameAr: 'شاي وقهوة', nameEn: 'Tea & Coffee' },
      { id: 'water_juice', nameKu: 'ئاو و شەربەت', nameAr: 'مياه وعصائر', nameEn: 'Water & Juices' },
    ],
  },
  {
    id: 'breakfast',
    nameKu: 'بەیانیان و هەنگوین',
    nameAr: 'فطور وعسل',
    nameEn: 'Breakfast & Honey',
    icon: 'Sun',
    sortOrder: 8,
    isActive: true,
    subcategories: [
      { id: 'honey_tahini', nameKu: 'هەنگوین و تەحین', nameAr: 'عسل وراشي', nameEn: 'Honey & Tahini' },
      { id: 'jams_olives', nameKu: 'مرەبا و زەیتوون', nameAr: 'مربى وزيتون', nameEn: 'Jams & Olives' },
    ],
  },
  {
    id: 'snacks',
    nameKu: 'چەرەزات و سوکەژەم',
    nameAr: 'مكسرات وسناكس',
    nameEn: 'Snacks & Nuts',
    icon: 'Cookie',
    sortOrder: 9,
    isActive: true,
    subcategories: [
      { id: 'nuts', nameKu: 'چەرەزات و خورما', nameAr: 'مكسرات وتمور', nameEn: 'Nuts & Dates' },
      { id: 'biscuits', nameKu: 'پسکیت و چوکلێت', nameAr: 'بسكويت وشوكولاتة', nameEn: 'Biscuits & Chocolate' },
    ],
  },
  {
    id: 'spices',
    nameKu: 'بەهارات و وشکە',
    nameAr: 'بهارات وتوابل',
    nameEn: 'Spices & Seasoning',
    icon: 'Sparkles',
    sortOrder: 10,
    isActive: true,
    subcategories: [
      { id: 'blends', nameKu: 'بەهاراتی تێکەڵ', nameAr: 'بهارات مشكلة', nameEn: 'Spice Blends' },
      { id: 'whole_spices', nameKu: 'سماق و هێل و بیبەر', nameAr: 'سماق وهيل وفلفل', nameEn: 'Whole Spices' },
    ],
  },
  {
    id: 'personal_care',
    nameKu: 'تەندروستی و منداڵان',
    nameAr: 'العناية والأطفال',
    nameEn: 'Baby & Care',
    icon: 'Heart',
    sortOrder: 11,
    isActive: true,
    subcategories: [
      { id: 'baby', nameKu: 'پێداویستی منداڵ', nameAr: 'مستلزمات الأطفال', nameEn: 'Baby Care' },
      { id: 'hygiene', nameKu: 'شامپۆ و سابوون', nameAr: 'شامبو وصابون', nameEn: 'Personal Hygiene' },
    ],
  },
  {
    id: 'household',
    nameKu: 'پاککەرەوە و ماڵەوە',
    nameAr: 'منظفات ومنزل',
    nameEn: 'Household',
    icon: 'Home',
    sortOrder: 12,
    isActive: true,
    subcategories: [
      { id: 'cleaning', nameKu: 'پاککەرەوەکان', nameAr: 'منظفات', nameEn: 'Cleaning' },
      { id: 'paper', nameKu: 'کلینیکس و کاغەز', nameAr: 'مناديل وورقيات', nameEn: 'Paper & Kitchen' },
    ],
  },
];

type SeedProductInput = Omit<Product, 'isActive'>;

const RAW_SEED_PRODUCTS: SeedProductInput[] = [
  // 1. Fresh Produce (5)
  { id: 'prod-01', categoryId: 'produce', subcategoryId: 'vegetables', nameKu: 'تەماتەی لقی هەولێر', nameAr: 'طماطم عنقودية أربيل', nameEn: 'Erbil Vine Tomatoes', size: '1 kg', ourPrice: 1250, marketPrice: 1750, imageUrl: IMG_TOMATOES, section: 'deals' },
  { id: 'prod-02', categoryId: 'produce', subcategoryId: 'fruits', nameKu: 'هەناری سووری هەڵەبجە', nameAr: 'رمان حلبجة الأحمر', nameEn: 'Halabja Ruby Pomegranates', size: '1.5 kg', ourPrice: 3500, marketPrice: 4500, imageUrl: IMG_POMEGRANATES, section: 'popular' },
  { id: 'prod-03', categoryId: 'produce', subcategoryId: 'vegetables', nameKu: 'خەیاری وردی شەقڵاوە', nameAr: 'خيار بلدي شقلاوة', nameEn: 'Shaqlawa Crisp Cucumbers', size: '1 kg', ourPrice: 1000, marketPrice: 1500, imageUrl: IMG_CUCUMBERS, section: 'popular' },
  { id: 'prod-04', categoryId: 'produce', subcategoryId: 'vegetables', nameKu: 'پەتاتەی زەردی خۆماڵی', nameAr: 'بطاطا صفراء محلية', nameEn: 'Local Yellow Potatoes', size: '2 kg', ourPrice: 1500, marketPrice: 2000, imageUrl: HERO_IMAGE, section: 'deals' },
  { id: 'prod-05', categoryId: 'produce', subcategoryId: 'herbs', nameKu: 'دەستەی نەعنا و کەرەوز و ڕێحان', nameAr: 'باقة نعناع وكرفس وريحان', nameEn: 'Fresh Mint, Parsley & Basil Bundle', size: '3 bunches', ourPrice: 750, marketPrice: 1000, imageUrl: IMG_CUCUMBERS, section: 'recommended' },

  // 2. Dairy & Eggs (5)
  { id: 'prod-06', categoryId: 'dairy', subcategoryId: 'yogurt', nameKu: 'ماستی پاڵێوراوی کوێستانی', nameAr: 'لبن جبلي مصفى', nameEn: 'Strained Mountain Yogurt', size: '750 g', ourPrice: 3250, marketPrice: 4000, imageUrl: IMG_YOGURT, section: 'popular' },
  { id: 'prod-07', categoryId: 'dairy', subcategoryId: 'cheese', nameKu: 'پەنیری سپی کوردی خۆماڵی', nameAr: 'جبن عربي أبيض محلي', nameEn: 'Fresh Local White Cheese', size: '500 g', ourPrice: 4000, marketPrice: 4750, imageUrl: IMG_YOGURT, section: 'recommended' },
  { id: 'prod-08', categoryId: 'dairy', subcategoryId: 'eggs', nameKu: 'تەبەقی هێلکەی تازە', nameAr: 'طبق بيض طازج', nameEn: 'Farm Fresh Eggs Tray', size: '30 pcs', ourPrice: 5250, marketPrice: 6000, imageUrl: IMG_YOGURT, section: 'deals' },
  { id: 'prod-09', categoryId: 'dairy', subcategoryId: 'eggs', nameKu: 'شیری پڕچەوری تازە', nameAr: 'حليب طازج كامل الدسم', nameEn: 'Full Cream Fresh Milk', size: '1 L', ourPrice: 1750, marketPrice: 2000, imageUrl: IMG_YOGURT, section: 'popular' },
  { id: 'prod-10', categoryId: 'dairy', subcategoryId: 'cheese', nameKu: 'قەیماغی بەیانی هەولێر', nameAr: 'قيمر صباحي أربيل', nameEn: 'Erbil Morning Clotted Cream', size: '250 g', ourPrice: 3500, marketPrice: 4000, imageUrl: IMG_YOGURT, section: 'new' },

  // 3. Bakery (5)
  { id: 'prod-11', categoryId: 'bakery', subcategoryId: 'flatbread', nameKu: 'نانی گەرمی کونجی تەنوور', nameAr: 'خبز تنور بالسمسم', nameEn: 'Stone-Baked Sesame Flatbread', size: '3 loaves', ourPrice: 1000, marketPrice: 1250, imageUrl: IMG_FLATBREAD, section: 'popular' },
  { id: 'prod-12', categoryId: 'bakery', subcategoryId: 'flatbread', nameKu: 'سەموونی بەردی عێراقی', nameAr: 'صمون حجري عراقي', nameEn: 'Iraqi Stone-Oven Samoon', size: '8 pcs', ourPrice: 1000, marketPrice: 1000, imageUrl: IMG_FLATBREAD, section: 'popular' },
  { id: 'prod-13', categoryId: 'bakery', subcategoryId: 'flatbread', nameKu: 'نانی تیری گەنمی تەواو', nameAr: 'خبز رقاق بر كامل', nameEn: 'Whole Wheat Thin Flatbread', size: '6 pcs', ourPrice: 1500, marketPrice: 1750, imageUrl: IMG_FLATBREAD, section: 'recommended' },
  { id: 'prod-14', categoryId: 'bakery', subcategoryId: 'pastries', nameKu: 'کولیچەی خورما و گوێز', nameAr: 'كليجة بالتمر والجوز', nameEn: 'Date & Walnut Kleicha Box', size: '500 g', ourPrice: 4500, marketPrice: 5500, imageUrl: IMG_FLATBREAD, section: 'new' },
  { id: 'prod-15', categoryId: 'bakery', subcategoryId: 'pastries', nameKu: 'سەموونی تۆستی نەرم', nameAr: 'خبز توست طري', nameEn: 'Soft Sliced Toast Bread', size: '600 g', ourPrice: 2000, marketPrice: 2250, imageUrl: IMG_FLATBREAD, section: 'recommended' },

  // 4. Meat & Poultry (5)
  { id: 'prod-16', categoryId: 'meat', subcategoryId: 'poultry', nameKu: 'سنگی مریشکی تازەی بێ ئێسک', nameAr: 'صدور دجاج طازجة بدون عظم', nameEn: 'Fresh Boneless Chicken Breast', size: '1 kg', ourPrice: 6500, marketPrice: 7500, imageUrl: HERO_IMAGE, section: 'deals' },
  { id: 'prod-17', categoryId: 'meat', subcategoryId: 'poultry', nameKu: 'مریشکی تەواوی تازەی خۆماڵی', nameAr: 'دجاج كامل طازج محلي', nameEn: 'Whole Fresh Local Chicken', size: '1.3 kg', ourPrice: 5500, marketPrice: 6250, imageUrl: HERO_IMAGE, section: 'popular' },
  { id: 'prod-18', categoryId: 'meat', subcategoryId: 'red_meat', nameKu: 'گۆشتی بەرخی قیمەکراو', nameAr: 'لحم غنم مفروم طازج', nameEn: 'Fresh Minced Lamb', size: '500 g', ourPrice: 9500, marketPrice: 10500, imageUrl: HERO_IMAGE, section: 'recommended' },
  { id: 'prod-19', categoryId: 'meat', subcategoryId: 'red_meat', nameKu: 'تیکەی گۆشتی گوێرەکە', nameAr: 'مكعبات لحم عجل طري', nameEn: 'Tender Beef Stew Cubes', size: '500 g', ourPrice: 8500, marketPrice: 9500, imageUrl: HERO_IMAGE, section: 'new' },
  { id: 'prod-20', categoryId: 'meat', subcategoryId: 'poultry', nameKu: 'ڕانی مریشکی تازە', nameAr: 'أفخاذ دجاج طازجة', nameEn: 'Fresh Chicken Drumsticks', size: '1 kg', ourPrice: 4250, marketPrice: 5000, imageUrl: HERO_IMAGE, section: 'deals' },

  // 5. Rice & Grains (5)
  { id: 'prod-21', categoryId: 'grains', subcategoryId: 'rice', nameKu: 'برنجی بەسمەتی دەنک درێژ', nameAr: 'أرز بسمتي حبة طويلة', nameEn: 'Long-Grain Basmati Rice', size: '5 kg', ourPrice: 11500, marketPrice: 13000, imageUrl: IMG_FLATBREAD, section: 'deals' },
  { id: 'prod-22', categoryId: 'grains', subcategoryId: 'rice', nameKu: 'برنجی کوردی ئاکرێ', nameAr: 'أرز عقرة الكردي', nameEn: 'Akre Kurdish Short-Grain Rice', size: '2 kg', ourPrice: 7500, marketPrice: 8500, imageUrl: IMG_FLATBREAD, section: 'recommended' },
  { id: 'prod-23', categoryId: 'grains', subcategoryId: 'legumes', nameKu: 'نیسکی سووری هاڕاو', nameAr: 'عدس أحمر مجروش', nameEn: 'Red Split Lentils', size: '1 kg', ourPrice: 2250, marketPrice: 2750, imageUrl: IMG_FLATBREAD, section: 'popular' },
  { id: 'prod-24', categoryId: 'grains', subcategoryId: 'legumes', nameKu: 'بڕوێشی زەردی ورد', nameAr: 'برغل أصفر ناعم', nameEn: 'Fine Golden Bulgur', size: '1 kg', ourPrice: 1750, marketPrice: 2000, imageUrl: IMG_FLATBREAD, section: 'recommended' },
  { id: 'prod-25', categoryId: 'grains', subcategoryId: 'pasta', nameKu: 'شەعرییەی برژاو بۆ برنج', nameAr: 'شعيرية محمصة للأرز', nameEn: 'Roasted Vermicelli Noodles', size: '500 g', ourPrice: 1000, marketPrice: 1250, imageUrl: IMG_FLATBREAD, section: 'popular' },

  // 6. Oils & Pantry (5)
  { id: 'prod-26', categoryId: 'pantry', subcategoryId: 'oils', nameKu: 'زەیتی زەیتوونی سروشتی بەعشیقە', nameAr: 'زيت زيتون بكر بعشيقة', nameEn: 'Bashiqa Cold-Pressed Olive Oil', size: '500 ml', ourPrice: 9500, marketPrice: 11500, imageUrl: IMG_OLIVE_OIL, section: 'deals' },
  { id: 'prod-27', categoryId: 'pantry', subcategoryId: 'oils', nameKu: 'زەیتی گوڵەبەڕۆژەی چێشتلێنان', nameAr: 'زيت دوار الشمس للطبخ', nameEn: 'Pure Sunflower Cooking Oil', size: '1.8 L', ourPrice: 4000, marketPrice: 4750, imageUrl: IMG_OLIVE_OIL, section: 'popular' },
  { id: 'prod-28', categoryId: 'pantry', subcategoryId: 'sauces', nameKu: 'دۆشاوی تەماتەی خەست', nameAr: 'معجون طماطم مركز', nameEn: 'Double Concentrated Tomato Paste', size: '800 g', ourPrice: 2000, marketPrice: 2500, imageUrl: IMG_TOMATOES, section: 'deals' },
  { id: 'prod-29', categoryId: 'pantry', subcategoryId: 'sauces', nameKu: 'ڕوبەهەناری سروشتی هەڵەبجە', nameAr: 'دبس رمان حلبجة الطبيعي', nameEn: 'Halabja Natural Pomegranate Molasses', size: '500 ml', ourPrice: 5500, marketPrice: 6500, imageUrl: IMG_POMEGRANATES, section: 'recommended' },
  { id: 'prod-30', categoryId: 'pantry', subcategoryId: 'canned', nameKu: 'نۆکی کوڵاوی ئامادە', nameAr: 'حمص حب مسلوق جاهز', nameEn: 'Cooked Whole Chickpeas', size: '400 g', ourPrice: 1000, marketPrice: 1250, imageUrl: IMG_OLIVE_OIL, section: 'new' },

  // 7. Tea & Drinks (5)
  { id: 'prod-31', categoryId: 'beverages', subcategoryId: 'tea_coffee', nameKu: 'چای ڕەشی سیلانی بە هێل', nameAr: 'شاي سيلاني أسود بالهيل', nameEn: 'Ceylon Black Tea with Cardamom', size: '400 g', ourPrice: 6250, marketPrice: 7500, imageUrl: IMG_TEA, section: 'popular' },
  { id: 'prod-32', categoryId: 'beverages', subcategoryId: 'tea_coffee', nameKu: 'قاوەی قەزوانی کوردی', nameAr: 'قهوة القزوان الكردية', nameEn: 'Kurdish Qazwan Pistachio Coffee', size: '250 g', ourPrice: 4500, marketPrice: 5250, imageUrl: IMG_TEA, section: 'recommended' },
  { id: 'prod-33', categoryId: 'beverages', subcategoryId: 'water_juice', nameKu: 'سێتێک ئاوی کانزایی شاخاوی', nameAr: 'صندوق مياه معدنية جبلية', nameEn: 'Mountain Mineral Water Pack', size: '12 x 500 ml', ourPrice: 2000, marketPrice: 2500, imageUrl: IMG_TEA, section: 'deals' },
  { id: 'prod-34', categoryId: 'beverages', subcategoryId: 'water_juice', nameKu: 'شەربەتی هەناری سروشتی ١٠٠٪', nameAr: 'عصير رمان طبيعي 100%', nameEn: '100% Pure Pomegranate Juice', size: '1 L', ourPrice: 3250, marketPrice: 3750, imageUrl: IMG_POMEGRANATES, section: 'new' },
  { id: 'prod-35', categoryId: 'beverages', subcategoryId: 'water_juice', nameKu: 'دۆی ساردی نەعنادار', nameAr: 'شنينة باردة بالنعناع', nameEn: 'Chilled Mint Yogurt Drink (Doogh)', size: '1 L', ourPrice: 1500, marketPrice: 1750, imageUrl: IMG_YOGURT, section: 'popular' },

  // 8. Breakfast & Honey (5)
  { id: 'prod-36', categoryId: 'breakfast', subcategoryId: 'honey_tahini', nameKu: 'هەنگوینی گوڵی شاخاوی زاگرۆس', nameAr: 'عسل أزهار جبال زاغروس', nameEn: 'Zagros Mountain Wildflower Honey', size: '500 g', ourPrice: 15500, marketPrice: 18000, imageUrl: IMG_HONEY, section: 'deals' },
  { id: 'prod-37', categoryId: 'breakfast', subcategoryId: 'honey_tahini', nameKu: 'تەحینی کونجی ئامێدی', nameAr: 'راشي سمسم العمادية', nameEn: 'Amedi Stone-Ground Sesame Tahini', size: '500 g', ourPrice: 4500, marketPrice: 5250, imageUrl: IMG_HONEY, section: 'popular' },
  { id: 'prod-38', categoryId: 'breakfast', subcategoryId: 'honey_tahini', nameKu: 'دۆشاوی خورمای خاوێن', nameAr: 'دبس تمر صافي', nameEn: 'Pure Iraqi Date Syrup', size: '500 g', ourPrice: 2500, marketPrice: 3000, imageUrl: IMG_HONEY, section: 'recommended' },
  { id: 'prod-39', categoryId: 'breakfast', subcategoryId: 'jams_olives', nameKu: 'زەیتوونی سەوزی بێ ناوک', nameAr: 'زيتون أخضر منزوع النوى', nameEn: 'Pitted Green Table Olives', size: '450 g', ourPrice: 3000, marketPrice: 3500, imageUrl: IMG_OLIVE_OIL, section: 'recommended' },
  { id: 'prod-40', categoryId: 'breakfast', subcategoryId: 'jams_olives', nameKu: 'مرەبای هەنجیری شاخاوی', nameAr: 'مربى التين الجبلي', nameEn: 'Mountain Fig Preserve Jam', size: '400 g', ourPrice: 3250, marketPrice: 3750, imageUrl: IMG_HONEY, section: 'new' },

  // 9. Snacks & Nuts (5)
  { id: 'prod-41', categoryId: 'snacks', subcategoryId: 'nuts', nameKu: 'گوێزی هەورامان پاککراو', nameAr: 'جوز هورامان مقشر', nameEn: 'Shelled Hawraman Walnuts', size: '400 g', ourPrice: 7500, marketPrice: 8750, imageUrl: IMG_HONEY, section: 'recommended' },
  { id: 'prod-42', categoryId: 'snacks', subcategoryId: 'nuts', nameKu: 'خورمای خەستاوی نەرم', nameAr: 'تمر خستاوي طري', nameEn: 'Soft Khastawi Dates', size: '1 kg', ourPrice: 3000, marketPrice: 3500, imageUrl: IMG_HONEY, section: 'popular' },
  { id: 'prod-43', categoryId: 'snacks', subcategoryId: 'nuts', nameKu: 'فستقی برژاوی خوێدار', nameAr: 'فستق حلبي محمص مملح', nameEn: 'Roasted Salted Pistachios', size: '300 g', ourPrice: 6000, marketPrice: 7000, imageUrl: IMG_TEA, section: 'deals' },
  { id: 'prod-44', categoryId: 'snacks', subcategoryId: 'biscuits', nameKu: 'پسکیتی چای کلاسیک', nameAr: 'بسكويت شاي كلاسيكي', nameEn: 'Classic Tea Biscuits Pack', size: '400 g', ourPrice: 1250, marketPrice: 1500, imageUrl: IMG_FLATBREAD, section: 'popular' },
  { id: 'prod-45', categoryId: 'snacks', subcategoryId: 'biscuits', nameKu: 'گەزۆی سلێمانی بە فستق', nameAr: 'من السما السليمانية بالفستق', nameEn: 'Sulaymaniyah Pistachio Gazzo', size: '350 g', ourPrice: 5000, marketPrice: 5750, imageUrl: IMG_HONEY, section: 'new' },

  // 10. Spices & Seasoning (5)
  { id: 'prod-46', categoryId: 'spices', subcategoryId: 'whole_spices', nameKu: 'سماقی سووری ئاکرێ', nameAr: 'سماق أحمر عقرة', nameEn: 'Akre Crimson Ground Sumac', size: '200 g', ourPrice: 2500, marketPrice: 3250, imageUrl: IMG_POMEGRANATES, section: 'recommended' },
  { id: 'prod-47', categoryId: 'spices', subcategoryId: 'whole_spices', nameKu: 'هێلی سەوزی هیندی پلە یەک', nameAr: 'هيل أخضر هندي درجة أولى', nameEn: 'Premium Whole Green Cardamom', size: '100 g', ourPrice: 4500, marketPrice: 5250, imageUrl: IMG_TEA, section: 'popular' },
  { id: 'prod-48', categoryId: 'spices', subcategoryId: 'blends', nameKu: 'بەهاراتی بریانی هەولێر', nameAr: 'بهارات برياني أربيل', nameEn: 'Erbil Signature Biryani Spice', size: '150 g', ourPrice: 2000, marketPrice: 2500, imageUrl: IMG_TEA, section: 'deals' },
  { id: 'prod-49', categoryId: 'spices', subcategoryId: 'blends', nameKu: 'بەهاراتی یاپراخ و دۆڵمە', nameAr: 'بهارات دولمة ويبرق', nameEn: 'Dolma & Stuffed Veg Seasoning', size: '150 g', ourPrice: 2000, marketPrice: 2250, imageUrl: IMG_TEA, section: 'new' },
  { id: 'prod-50', categoryId: 'spices', subcategoryId: 'whole_spices', nameKu: 'خوێی دەریایی سروشتی', nameAr: 'ملح بحري طبيعي', nameEn: 'Natural Fine Sea Salt', size: '750 g', ourPrice: 750, marketPrice: 1000, imageUrl: IMG_YOGURT, section: 'popular' },

  // 11. Baby & Personal Care (5)
  { id: 'prod-51', categoryId: 'personal_care', subcategoryId: 'baby', nameKu: 'دایبی منداڵ قەبارە ٤ (نەرم)', nameAr: 'حفاضات أطفال مقاس 4', nameEn: 'Soft Comfort Baby Diapers Size 4', size: '44 pcs', ourPrice: 12500, marketPrice: 14500, imageUrl: IMG_YOGURT, section: 'deals' },
  { id: 'prod-52', categoryId: 'personal_care', subcategoryId: 'baby', nameKu: 'دەستماڵی تەڕی بێ بۆن بۆ منداڵ', nameAr: 'مناديل مبللة للأطفال بدون عطر', nameEn: 'Fragrance-Free Baby Wipes', size: '72 wipes', ourPrice: 1750, marketPrice: 2250, imageUrl: IMG_YOGURT, section: 'popular' },
  { id: 'prod-53', categoryId: 'personal_care', subcategoryId: 'hygiene', nameKu: 'شامپۆی ڕۆژانەی گەڵای زەیتوون', nameAr: 'شامبو يومي بخلاصة الزيتون', nameEn: 'Olive Leaf Daily Shampoo', size: '400 ml', ourPrice: 4000, marketPrice: 4750, imageUrl: IMG_OLIVE_OIL, section: 'recommended' },
  { id: 'prod-54', categoryId: 'personal_care', subcategoryId: 'hygiene', nameKu: 'سابوونی دەستی شل بە نەعنا', nameAr: 'غسول يدين سائل بالنعناع', nameEn: 'Mint Liquid Hand Wash', size: '500 ml', ourPrice: 2250, marketPrice: 2750, imageUrl: IMG_CUCUMBERS, section: 'new' },
  { id: 'prod-55', categoryId: 'personal_care', subcategoryId: 'hygiene', nameKu: 'هەویری ددانی تازەبەخش', nameAr: 'معجون أسنان منعش', nameEn: 'Fresh Mint Toothpaste', size: '100 ml', ourPrice: 2000, marketPrice: 2500, imageUrl: IMG_YOGURT, section: 'popular' },

  // 12. Household (5)
  { id: 'prod-56', categoryId: 'household', subcategoryId: 'cleaning', nameKu: 'شۆرەری قاپ بە لیمۆی سروشتی', nameAr: 'سائل جلي بالليمون الطبيعي', nameEn: 'Lemon Dishwashing Liquid', size: '750 ml', ourPrice: 2000, marketPrice: 2500, imageUrl: IMG_OLIVE_OIL, section: 'deals' },
  { id: 'prod-57', categoryId: 'household', subcategoryId: 'cleaning', nameKu: 'تایتی جلشۆری ئۆتۆماتیک', nameAr: 'مسحوق غسيل أوتوماتيك', nameEn: 'Automatic Laundry Detergent', size: '3 kg', ourPrice: 8500, marketPrice: 9750, imageUrl: IMG_YOGURT, section: 'deals' },
  { id: 'prod-58', categoryId: 'household', subcategoryId: 'paper', nameKu: 'کلینیکسی چێشتخانەی ٣ چین', nameAr: 'مناديل مطبخ 3 طبقات', nameEn: '3-Ply Kitchen Paper Towels', size: '4 rolls', ourPrice: 3000, marketPrice: 3500, imageUrl: IMG_YOGURT, section: 'popular' },
  { id: 'prod-59', categoryId: 'household', subcategoryId: 'paper', nameKu: 'پاکەتی کلینیکسی دەموچاو', nameAr: 'عبوة مناديل وجه ناعمة', nameEn: 'Soft Facial Tissue Pack', size: '5 boxes', ourPrice: 4500, marketPrice: 5250, imageUrl: IMG_YOGURT, section: 'recommended' },
  { id: 'prod-60', categoryId: 'household', subcategoryId: 'cleaning', nameKu: 'کیسی خۆڵی ئەستووری قایم', nameAr: 'أكياس نفايات سميكة قوية', nameEn: 'Heavy-Duty Kitchen Trash Bags', size: '30 bags', ourPrice: 1750, marketPrice: 2000, imageUrl: IMG_TEA, section: 'new' },
];

export const SEED_PRODUCTS: Product[] = RAW_SEED_PRODUCTS.map((item) => ({
  ...item,
  isActive: true,
}));
