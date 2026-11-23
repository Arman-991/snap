import type { Category } from '../types/grocery';

export const FALLBACK_CATEGORY_PHOTO = '/categories/groceries-staples.jpg';

export const DEFAULT_15_CATEGORIES: Category[] = [
  {
    id: 'produce',
    nameEn: 'Fruits & Vegetables',
    nameKu: 'میوە و سەوزە',
    nameAr: 'فواكه وخضروات',
    icon: '/categories/fruits-vegetables.jpg',
    imageUrl: '/categories/fruits-vegetables.jpg',
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
    nameEn: 'Dairy & Ice Cream',
    nameKu: 'شیرەمەنی و بەستەنی',
    nameAr: 'ألبان ومثلجات',
    icon: '/categories/dairy-ice-cream.jpg',
    imageUrl: '/categories/dairy-ice-cream.jpg',
    sortOrder: 2,
    isActive: true,
    subcategories: [
      { id: 'yogurt', nameKu: 'ماست و دۆ', nameAr: 'لبن وشنينة', nameEn: 'Yogurt & Doogh' },
      { id: 'cheese', nameKu: 'پەنیر و قەیماغ', nameAr: 'أجبان وقشطة', nameEn: 'Cheese & Cream' },
      { id: 'milk_icecream', nameKu: 'شیر و بەستەنی', nameAr: 'حليب ومثلجات', nameEn: 'Milk & Ice Cream' },
    ],
  },
  {
    id: 'bakery',
    nameEn: 'Bread & Bakery',
    nameKu: 'نان و نانەواخانە',
    nameAr: 'خبز ومخبوزات',
    icon: '/categories/bread-bakery.jpg',
    imageUrl: '/categories/bread-bakery.jpg',
    sortOrder: 3,
    isActive: true,
    subcategories: [
      { id: 'flatbread', nameKu: 'نانی تەنوور و سەموون', nameAr: 'خبز تنور وصمون', nameEn: 'Flatbread & Samoon' },
      { id: 'pastries', nameKu: 'کولیچە و شیرینی', nameAr: 'معجنات وكليجة', nameEn: 'Pastries & Rolls' },
    ],
  },
  {
    id: 'meat',
    nameEn: 'Meat, Chicken & Eggs',
    nameKu: 'گۆشت، مریشک و هێلکە',
    nameAr: 'لحوم ودواجن وبيض',
    icon: '/categories/meat-chicken-eggs.jpg',
    imageUrl: '/categories/meat-chicken-eggs.jpg',
    sortOrder: 4,
    isActive: true,
    subcategories: [
      { id: 'poultry', nameKu: 'مریشکی تازە', nameAr: 'دجاج طازج', nameEn: 'Fresh Poultry' },
      { id: 'red_meat', nameKu: 'گۆشتی بەرخ و گوێرەکە', nameAr: 'لحم غنم وعجل', nameEn: 'Lamb & Beef' },
      { id: 'eggs', nameKu: 'هێلکەی تازە', nameAr: 'بيض طازج', nameEn: 'Farm Eggs' },
    ],
  },
  {
    id: 'groceries',
    nameEn: 'Groceries & Staples',
    nameKu: 'خۆراک و پێداویستی',
    nameAr: 'بقالة ومواد غذائية',
    icon: '/categories/groceries-staples.jpg',
    imageUrl: '/categories/groceries-staples.jpg',
    sortOrder: 5,
    isActive: true,
    subcategories: [
      { id: 'rice', nameKu: 'برنج و دانەوێڵە', nameAr: 'أرز وحبوب', nameEn: 'Rice & Grains' },
      { id: 'oils', nameKu: 'زەیت و ڕۆن', nameAr: 'زيوت وسمن', nameEn: 'Oils & Ghee' },
      { id: 'pasta', nameKu: 'مەکەرۆنی و نیسک', nameAr: 'معكرونة وبقوليات', nameEn: 'Pasta & Legumes' },
    ],
  },
  {
    id: 'beverages',
    nameEn: 'Drinks & Beverages',
    nameKu: 'خواردنەوەکان',
    nameAr: 'مشروبات',
    icon: '/categories/drinks-beverages.jpg',
    imageUrl: '/categories/drinks-beverages.jpg',
    sortOrder: 6,
    isActive: true,
    subcategories: [
      { id: 'tea_coffee', nameKu: 'چا و قاوە', nameAr: 'شاي وقهوة', nameEn: 'Tea & Coffee' },
      { id: 'water_juice', nameKu: 'ئاو و شەربەت', nameAr: 'مياه وعصائر', nameEn: 'Water & Juices' },
    ],
  },
  {
    id: 'breakfast',
    nameEn: 'Breakfast',
    nameKu: 'بەیانیان',
    nameAr: 'فطور',
    icon: '/categories/breakfast.jpg',
    imageUrl: '/categories/breakfast.jpg',
    sortOrder: 7,
    isActive: true,
    subcategories: [
      { id: 'honey_tahini', nameKu: 'هەنگوین و تەحین', nameAr: 'عسل وراشي', nameEn: 'Honey & Tahini' },
      { id: 'jams_olives', nameKu: 'مرەبا و زەیتوون', nameAr: 'مربى وزيتون', nameEn: 'Jams & Olives' },
    ],
  },
  {
    id: 'snacks',
    nameEn: 'Snacks & Sweets',
    nameKu: 'شیرینی و خواردنە سووکەکان',
    nameAr: 'مقرمشات وحلويات',
    icon: '/categories/snacks-sweets.jpg',
    imageUrl: '/categories/snacks-sweets.jpg',
    sortOrder: 8,
    isActive: true,
    subcategories: [
      { id: 'chips', nameKu: 'چپس و خواردنە سووکەکان', nameAr: 'شيبس ومقرمشات', nameEn: 'Chips & Crisps' },
      { id: 'biscuits', nameKu: 'پسکیت و چوکلێت', nameAr: 'بسكويت وشوكولاتة', nameEn: 'Biscuits & Chocolate' },
    ],
  },
  {
    id: 'canned',
    nameEn: 'Canned & Ready Food',
    nameKu: 'لەقوتونراو و خواردنی ئامادە',
    nameAr: 'معلبات وأطعمة جاهزة',
    icon: '/categories/canned-ready.jpg',
    imageUrl: '/categories/canned-ready.jpg',
    sortOrder: 9,
    isActive: true,
    subcategories: [
      { id: 'canned_veg', nameKu: 'قوتووبەند و دۆشاو', nameAr: 'معلبات ومعجون', nameEn: 'Canned Goods & Pastes' },
      { id: 'pickles', nameKu: 'ترشیات و ئامادە', nameAr: 'مخللات وأطعمة جاهزة', nameEn: 'Pickles & Ready Meals' },
    ],
  },
  {
    id: 'spices',
    nameEn: 'Spices & Sauces',
    nameKu: 'بەهارات و سۆس',
    nameAr: 'بهارات وصلصات',
    icon: '/categories/spices-sauces.jpg',
    imageUrl: '/categories/spices-sauces.jpg',
    sortOrder: 10,
    isActive: true,
    subcategories: [
      { id: 'blends', nameKu: 'بەهاراتی تێکەڵ', nameAr: 'بهارات مشكلة', nameEn: 'Spice Blends' },
      { id: 'whole_spices', nameKu: 'سماق و هێل و سۆس', nameAr: 'سماق وهيل وصلصات', nameEn: 'Whole Spices & Sauces' },
    ],
  },
  {
    id: 'nuts',
    nameEn: 'Nuts & Dried Fruit',
    nameKu: 'چەرەسات و میوەی وشک',
    nameAr: 'مكسرات وفواكه مجففة',
    icon: '/categories/nuts-dried-fruit.jpg',
    imageUrl: '/categories/nuts-dried-fruit.jpg',
    sortOrder: 11,
    isActive: true,
    subcategories: [
      { id: 'roasted_nuts', nameKu: 'گوێز و فستق و بادەم', nameAr: 'جوز وفستق ولوز', nameEn: 'Nuts' },
      { id: 'dates_dried', nameKu: 'خورما و میوەی وشک', nameAr: 'تمور وفواكه مجففة', nameEn: 'Dates & Dried Fruit' },
    ],
  },
  {
    id: 'cleaning',
    nameEn: 'Cleaning & Detergents',
    nameKu: 'پاککەرەوەکان',
    nameAr: 'منظفات ومناديل',
    icon: '/categories/cleaning-detergents.jpg',
    imageUrl: '/categories/cleaning-detergents.jpg',
    sortOrder: 12,
    isActive: true,
    subcategories: [
      { id: 'detergents', nameKu: 'شۆرەری قاپ و جلشۆر', nameAr: 'مساحيق وسوائل التنظيف', nameEn: 'Detergents' },
      { id: 'paper', nameKu: 'کلینیکس و کاغەز', nameAr: 'مناديل وورقيات', nameEn: 'Paper & Tissues' },
    ],
  },
  {
    id: 'personal_care',
    nameEn: 'Personal Care',
    nameKu: 'چاودێری کەسی',
    nameAr: 'عناية شخصية',
    icon: '/categories/personal-care.jpg',
    imageUrl: '/categories/personal-care.jpg',
    sortOrder: 13,
    isActive: true,
    subcategories: [
      { id: 'hair_body', nameKu: 'شامپۆ و سابوون', nameAr: 'شامبو وصابون', nameEn: 'Hair & Body' },
      { id: 'oral_care', nameKu: 'چاودێری ددان', nameAr: 'العناية بالفم', nameEn: 'Oral Care' },
    ],
  },
  {
    id: 'baby',
    nameEn: 'Baby & Mother',
    nameKu: 'منداڵ و کۆرپە',
    nameAr: 'أطفال ورضع',
    icon: '/categories/baby-mother.jpg',
    imageUrl: '/categories/baby-mother.jpg',
    sortOrder: 14,
    isActive: true,
    subcategories: [
      { id: 'diapers', nameKu: 'دایبی و دەستماڵی تەڕ', nameAr: 'حفاضات ومناديل', nameEn: 'Diapers & Wipes' },
      { id: 'baby_care', nameKu: 'چاودێری کۆرپە', nameAr: 'العناية بالرضيع', nameEn: 'Baby Care' },
    ],
  },
  {
    id: 'home_kitchen',
    nameEn: 'Home & Kitchen',
    nameKu: 'ماڵ و چێشتخانە',
    nameAr: 'المنزل والمطبخ',
    icon: '/categories/home-kitchen.jpg',
    imageUrl: '/categories/home-kitchen.jpg',
    sortOrder: 15,
    isActive: true,
    subcategories: [
      { id: 'cookware', nameKu: 'ئامێری چێشتخانە', nameAr: 'أدوات المطبخ', nameEn: 'Kitchen Essentials' },
      { id: 'storage', nameKu: 'ڕێکخستنی ماڵ', nameAr: 'مستلزمات المنزل', nameEn: 'Home Supplies' },
    ],
  },
];

const CATEGORY_PHOTO_BY_ID: Record<string, string> = {
  produce: '/categories/fruits-vegetables.jpg',
  dairy: '/categories/dairy-ice-cream.jpg',
  bakery: '/categories/bread-bakery.jpg',
  meat: '/categories/meat-chicken-eggs.jpg',
  groceries: '/categories/groceries-staples.jpg',
  grains: '/categories/groceries-staples.jpg',
  pantry: '/categories/groceries-staples.jpg',
  beverages: '/categories/drinks-beverages.jpg',
  breakfast: '/categories/breakfast.jpg',
  snacks: '/categories/snacks-sweets.jpg',
  canned: '/categories/canned-ready.jpg',
  spices: '/categories/spices-sauces.jpg',
  nuts: '/categories/nuts-dried-fruit.jpg',
  cleaning: '/categories/cleaning-detergents.jpg',
  household: '/categories/cleaning-detergents.jpg',
  personal_care: '/categories/personal-care.jpg',
  baby: '/categories/baby-mother.jpg',
  home_kitchen: '/categories/home-kitchen.jpg',
};

export function resolveDefaultPhotoForCategory(
  category: Pick<Category, 'id' | 'nameEn' | 'nameKu' | 'nameAr'>
): string {
  if (CATEGORY_PHOTO_BY_ID[category.id]) {
    return CATEGORY_PHOTO_BY_ID[category.id];
  }
  const haystack = `${category.nameEn} ${category.nameKu} ${category.nameAr}`.toLowerCase();
  if (/fruit|veg|produce|mewa|میوە|سەوزە|فواكه|خضار|خضروات/.test(haystack)) {
    return '/categories/fruits-vegetables.jpg';
  }
  if (/dairy|milk|yogurt|ice cream|شیرەمەنی|بەستەنی|ألبان|حليب|مثلجات/.test(haystack)) {
    return '/categories/dairy-ice-cream.jpg';
  }
  if (/bread|bakery|samoon|نان|سەموون|خبز|مخبز|مخبوزات/.test(haystack)) {
    return '/categories/bread-bakery.jpg';
  }
  if (/meat|chicken|egg|poultry|گۆشت|مریشک|هێلکە|لحوم|دجاج|بيض/.test(haystack)) {
    return '/categories/meat-chicken-eggs.jpg';
  }
  if (/drink|beverage|tea|coffee|juice|خواردنەوە|چا|مشروبات|عصير/.test(haystack)) {
    return '/categories/drinks-beverages.jpg';
  }
  if (/breakfast|honey|jam|بەیانیان|هەنگوین|فطور|عسل/.test(haystack)) {
    return '/categories/breakfast.jpg';
  }
  if (/snack|sweet|chip|chocolate|شیرینی|پسکیت|مقرمشات|حلويات/.test(haystack)) {
    return '/categories/snacks-sweets.jpg';
  }
  if (/can|ready|pickle|لەقوتونراو|قوتوو|معلبات|جاهزة/.test(haystack)) {
    return '/categories/canned-ready.jpg';
  }
  if (/spice|sauce|بەهارات|سۆس|بهارات|صلصات/.test(haystack)) {
    return '/categories/spices-sauces.jpg';
  }
  if (/nut|dried|date|چەرەس|گوێز|خورما|مكسرات|تمور/.test(haystack)) {
    return '/categories/nuts-dried-fruit.jpg';
  }
  if (/clean|detergent|tissue|پاککەرەوە|تایت|منظفات|مناديل/.test(haystack)) {
    return '/categories/cleaning-detergents.jpg';
  }
  if (/personal|care|shampoo|hygiene|چاودێری کەسی|شامپۆ|عناية شخصية/.test(haystack)) {
    return '/categories/personal-care.jpg';
  }
  if (/baby|mother|diaper|منداڵ|کۆرپە|أطفال|رضع/.test(haystack)) {
    return '/categories/baby-mother.jpg';
  }
  if (/home|kitchen|cook|ماڵ|چێشتخانە|المنزل|المطبخ/.test(haystack)) {
    return '/categories/home-kitchen.jpg';
  }
  return FALLBACK_CATEGORY_PHOTO;
}
