import type { Category } from '../types/grocery';

export type CategoryArtKey =
  | 'produce'
  | 'dairy'
  | 'bakery'
  | 'meat'
  | 'groceries'
  | 'beverages'
  | 'breakfast'
  | 'snacks'
  | 'canned'
  | 'spices'
  | 'nuts'
  | 'cleaning'
  | 'personal_care'
  | 'baby'
  | 'home_kitchen'
  | 'default';

const ART_BY_ID: Record<string, CategoryArtKey> = {
  produce: 'produce',
  dairy: 'dairy',
  bakery: 'bakery',
  meat: 'meat',
  groceries: 'groceries',
  grains: 'groceries',
  pantry: 'groceries',
  beverages: 'beverages',
  breakfast: 'breakfast',
  snacks: 'snacks',
  canned: 'canned',
  spices: 'spices',
  nuts: 'nuts',
  cleaning: 'cleaning',
  household: 'cleaning',
  personal_care: 'personal_care',
  baby: 'baby',
  home_kitchen: 'home_kitchen',
};

export function resolveCategoryArtKey(
  category: Pick<Category, 'id' | 'nameEn' | 'nameKu' | 'nameAr'>
): CategoryArtKey {
  if (ART_BY_ID[category.id]) {
    return ART_BY_ID[category.id];
  }
  const haystack = `${category.nameEn} ${category.nameKu} ${category.nameAr}`.toLowerCase();
  if (/fruit|veg|produce|mewa|میوە|سەوزە|فواكه|خضار|خضروات/.test(haystack)) return 'produce';
  if (/dairy|milk|yogurt|ice cream|شیرەمەنی|بەستەنی|ألبان|حليب|مثلجات/.test(haystack)) return 'dairy';
  if (/bread|bakery|samoon|نان|سەموون|خبز|مخبز|مخبوزات/.test(haystack)) return 'bakery';
  if (/meat|chicken|egg|poultry|گۆشت|مریشک|هێلکە|لحوم|دجاج|بيض/.test(haystack)) return 'meat';
  if (/grocer|staple|rice|pasta|oil|خۆراک|برنج|بقالة|أرز/.test(haystack)) return 'groceries';
  if (/drink|beverage|tea|coffee|juice|خواردنەوە|چا|مشروبات|عصير/.test(haystack)) return 'beverages';
  if (/breakfast|honey|jam|بەیانیان|هەنگوین|فطور|عسل/.test(haystack)) return 'breakfast';
  if (/snack|sweet|chip|chocolate|شیرینی|پسکیت|مقرمشات|حلويات/.test(haystack)) return 'snacks';
  if (/can|ready|pickle|لەقوتونراو|قوتوو|معلبات|جاهزة/.test(haystack)) return 'canned';
  if (/spice|sauce|بەهارات|سۆس|بهارات|صلصات/.test(haystack)) return 'spices';
  if (/nut|dried|date|چەرەس|گوێز|خورما|مكسرات|تمور/.test(haystack)) return 'nuts';
  if (/clean|detergent|tissue|پاککەرەوە|تایت|منظفات|مناديل/.test(haystack)) return 'cleaning';
  if (/personal|care|shampoo|hygiene|چاودێری کەسی|شامپۆ|عناية شخصية/.test(haystack)) return 'personal_care';
  if (/baby|mother|diaper|منداڵ|کۆرپە|أطفال|رضع/.test(haystack)) return 'baby';
  if (/home|kitchen|cook|ماڵ|چێشتخانە|المنزل|المطبخ/.test(haystack)) return 'home_kitchen';
  return 'default';
}

interface CategorySvgArtProps {
  category: Pick<Category, 'id' | 'nameEn' | 'nameKu' | 'nameAr'>;
  className?: string;
}

/**
 * Lightweight 0ms inline SVG studio illustrations for all 15 main supermarket categories.
 * Renders instantaneously on slow 3G/offline connections before or instead of network photos.
 */
export function CategorySvgArt({
  category,
  className = 'h-full w-full',
}: CategorySvgArtProps) {
  const key = resolveCategoryArtKey(category);

  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      data-svg-art={key}
      className={className}
    >
      {key === 'produce' && (
        <>
          <rect width="200" height="200" fill="#ECFDF5" />
          <ellipse cx="100" cy="156" rx="64" ry="12" fill="#D1FAE5" />
          {/* Fresh leafy greens */}
          <path d="M98 108C76 80 76 48 102 40C124 52 126 84 108 110Z" fill="#22C55E" />
          <path d="M104 108C128 84 148 64 150 48C130 48 110 72 98 104Z" fill="#16A34A" />
          <path d="M94 110C72 90 54 74 52 56C72 58 92 80 98 106Z" fill="#15803D" />
          {/* Orange */}
          <circle cx="136" cy="120" r="28" fill="#F97316" />
          <circle cx="128" cy="112" r="7" fill="#FDBA74" opacity="0.6" />
          {/* Red tomatoes */}
          <circle cx="72" cy="126" r="28" fill="#EF4444" />
          <circle cx="64" cy="118" r="7" fill="#FCA5A5" opacity="0.65" />
          <path d="M66 98L72 104L78 98" stroke="#15803D" strokeWidth="4" strokeLinecap="round" />
          {/* Cucumber */}
          <rect x="82" y="130" width="54" height="20" rx="10" transform="rotate(-14 82 130)" fill="#16A34A" />
          <rect x="88" y="135" width="38" height="5" rx="2.5" transform="rotate(-14 88 135)" fill="#86EFAC" opacity="0.55" />
        </>
      )}

      {key === 'dairy' && (
        <>
          <rect width="200" height="200" fill="#EFF6FF" />
          <ellipse cx="100" cy="158" rx="62" ry="12" fill="#DBEAFE" />
          {/* Glass milk bottle */}
          <rect x="52" y="64" width="38" height="86" rx="12" fill="#FFFFFF" stroke="#93C5FD" strokeWidth="3" />
          <rect x="61" y="42" width="20" height="24" rx="5" fill="#FFFFFF" stroke="#93C5FD" strokeWidth="3" />
          <rect x="58" y="36" width="26" height="9" rx="4" fill="#3B82F6" />
          <rect x="57" y="92" width="28" height="22" rx="4" fill="#DBEAFE" />
          {/* Cheese wedge */}
          <path d="M98 112L152 124V150H98V112Z" fill="#FACC15" stroke="#EAB308" strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M98 112L134 94L152 124L98 112Z" fill="#FEF08A" />
          <circle cx="116" cy="134" r="5" fill="#EAB308" />
          <circle cx="136" cy="138" r="4" fill="#EAB308" />
          {/* Ice cream scoop bowl */}
          <circle cx="132" cy="76" r="18" fill="#FFFBEB" stroke="#FDE68A" strokeWidth="2.5" />
          <path d="M110 82H154L146 102H118L110 82Z" fill="#60A5FA" />
        </>
      )}

      {key === 'bakery' && (
        <>
          <rect width="200" height="200" fill="#FFFBEB" />
          <ellipse cx="100" cy="156" rx="64" ry="12" fill="#FDE68A" opacity="0.6" />
          {/* Round artisan loaf */}
          <ellipse cx="88" cy="116" rx="44" ry="34" fill="#D97706" />
          <ellipse cx="88" cy="110" rx="40" ry="28" fill="#F59E0B" />
          <path d="M68 98C78 92 94 94 106 102" stroke="#FEF3C7" strokeWidth="4" strokeLinecap="round" />
          <path d="M72 114C84 108 98 110 110 116" stroke="#FEF3C7" strokeWidth="3.5" strokeLinecap="round" />
          {/* Croissant */}
          <path d="M108 136C116 112 146 106 160 124C166 134 158 148 144 148C130 148 118 144 108 136Z" fill="#EA580C" />
          <path d="M118 134C124 118 142 116 152 128" stroke="#FDBA74" strokeWidth="3.5" strokeLinecap="round" />
          {/* Sesame flatbread */}
          <circle cx="64" cy="74" r="24" fill="#FBBF24" stroke="#D97706" strokeWidth="2.5" />
          <circle cx="56" cy="68" r="2" fill="#FFFBEB" />
          <circle cx="68" cy="64" r="2" fill="#FFFBEB" />
          <circle cx="72" cy="78" r="2" fill="#FFFBEB" />
          <circle cx="58" cy="80" r="2" fill="#FFFBEB" />
        </>
      )}

      {key === 'meat' && (
        <>
          <rect width="200" height="200" fill="#FEF2F2" />
          <ellipse cx="100" cy="156" rx="64" ry="12" fill="#FECACA" opacity="0.6" />
          {/* Fresh steak cut */}
          <path d="M50 112C48 88 76 74 106 82C132 88 136 116 116 132C94 148 52 138 50 112Z" fill="#DC2626" />
          <path d="M60 110C60 94 82 86 102 92C118 96 122 114 108 124C92 134 60 128 60 110Z" fill="#EF4444" />
          <circle cx="80" cy="108" r="9" fill="#FEE2E2" />
          {/* Eggs */}
          <ellipse cx="136" cy="128" rx="18" ry="23" fill="#FDE68A" stroke="#D97706" strokeWidth="2" />
          <ellipse cx="116" cy="136" rx="16" ry="20" fill="#FFFBEB" stroke="#E5E7EB" strokeWidth="2" />
          {/* Chicken drumstick */}
          <ellipse cx="134" cy="76" rx="22" ry="15" transform="rotate(-22 134 76)" fill="#F59E0B" />
          <rect x="148" y="64" width="18" height="7" rx="3.5" transform="rotate(-22 148 64)" fill="#FEF3C7" />
        </>
      )}

      {key === 'groceries' && (
        <>
          <rect width="200" height="200" fill="#FEFCE8" />
          <ellipse cx="100" cy="158" rx="64" ry="12" fill="#FEF08A" opacity="0.7" />
          {/* Cooking oil bottle */}
          <rect x="86" y="68" width="38" height="82" rx="10" fill="#FACC15" stroke="#CA8A04" strokeWidth="2.5" />
          <rect x="97" y="46" width="16" height="22" rx="4" fill="#FDE047" stroke="#CA8A04" strokeWidth="2.5" />
          <rect x="95" y="40" width="20" height="8" rx="3" fill="#16A34A" />
          <rect x="92" y="96" width="26" height="26" rx="4" fill="#FFFFFF" opacity="0.9" />
          {/* Rice sack */}
          <path d="M44 102C44 90 54 84 64 84C74 84 82 90 82 102L84 148H42L44 102Z" fill="#E7E5E4" stroke="#A8A29E" strokeWidth="2.5" />
          <path d="M52 118H74" stroke="#15803D" strokeWidth="4" strokeLinecap="round" />
          {/* Lentils bowl */}
          <path d="M126 124H166C164 142 156 150 146 150C136 150 128 142 126 124Z" fill="#EA580C" />
          <ellipse cx="146" cy="124" rx="20" ry="7" fill="#FB923C" />
        </>
      )}

      {key === 'beverages' && (
        <>
          <rect width="200" height="200" fill="#ECFEFF" />
          <ellipse cx="100" cy="158" rx="62" ry="12" fill="#CFFAFE" />
          {/* Water bottle */}
          <rect x="82" y="54" width="34" height="96" rx="11" fill="#E0F2FE" stroke="#0284C7" strokeWidth="2.5" />
          <rect x="91" y="38" width="16" height="16" rx="3" fill="#38BDF8" />
          <rect x="86" y="92" width="26" height="24" rx="4" fill="#0EA5E9" opacity="0.85" />
          {/* Orange juice bottle */}
          <rect x="46" y="76" width="32" height="74" rx="10" fill="#FB923C" stroke="#EA580C" strokeWidth="2.5" />
          <rect x="54" y="64" width="16" height="12" rx="3" fill="#F97316" />
          {/* Tea glass */}
          <path d="M124 104H158L152 148H130L124 104Z" fill="#B45309" stroke="#78350F" strokeWidth="2.5" />
          <path d="M156 114C165 114 166 130 155 132" stroke="#78350F" strokeWidth="3" strokeLinecap="round" />
        </>
      )}

      {key === 'breakfast' && (
        <>
          <rect width="200" height="200" fill="#FFF7ED" />
          <ellipse cx="100" cy="156" rx="64" ry="12" fill="#FFEDD5" />
          {/* Honey jar */}
          <rect x="52" y="76" width="48" height="72" rx="14" fill="#F59E0B" stroke="#B45309" strokeWidth="2.5" />
          <rect x="58" y="64" width="36" height="14" rx="4" fill="#FEF3C7" stroke="#B45309" strokeWidth="2.5" />
          <rect x="60" y="98" width="32" height="24" rx="4" fill="#FFFBEB" />
          <circle cx="76" cy="110" r="6" fill="#F59E0B" />
          {/* Jam jar */}
          <rect x="108" y="90" width="42" height="58" rx="12" fill="#E11D48" stroke="#9F1239" strokeWidth="2.5" />
          <rect x="114" y="78" width="30" height="12" rx="4" fill="#FDA4AF" stroke="#9F1239" strokeWidth="2.5" />
          <rect x="116" y="108" width="26" height="18" rx="3" fill="#FFF1F2" />
        </>
      )}

      {key === 'snacks' && (
        <>
          <rect width="200" height="200" fill="#FEF3C7" />
          <ellipse cx="100" cy="156" rx="64" ry="12" fill="#FDE68A" />
          {/* Bowl of golden crisps */}
          <circle cx="80" cy="100" r="18" fill="#FBBF24" />
          <circle cx="104" cy="92" r="20" fill="#F59E0B" />
          <circle cx="126" cy="102" r="16" fill="#FCD34D" />
          <path d="M52 108H148C144 138 126 150 100 150C74 150 56 138 52 108Z" fill="#FFFFFF" stroke="#D97706" strokeWidth="3" />
          {/* Chocolate bar */}
          <rect x="56" y="88" width="36" height="44" rx="5" transform="rotate(-15 56 88)" fill="#78350F" stroke="#451A03" strokeWidth="2" />
          <path d="M62 104L90 96M74 86L84 124" stroke="#92400E" strokeWidth="2" />
        </>
      )}

      {key === 'canned' && (
        <>
          <rect width="200" height="200" fill="#F0FDF4" />
          <ellipse cx="100" cy="156" rx="64" ry="12" fill="#DCFCE7" />
          {/* Tomato paste can */}
          <rect x="48" y="80" width="44" height="68" rx="6" fill="#EF4444" stroke="#991B1B" strokeWidth="2.5" />
          <ellipse cx="70" cy="80" rx="22" ry="6" fill="#E5E7EB" stroke="#9CA3AF" strokeWidth="2" />
          <rect x="52" y="102" width="36" height="24" rx="3" fill="#FEF2F2" />
          {/* Pickles glass jar */}
          <rect x="104" y="72" width="48" height="76" rx="12" fill="#84CC16" stroke="#3F6212" strokeWidth="2.5" />
          <rect x="110" y="60" width="36" height="12" rx="4" fill="#FDE047" stroke="#3F6212" strokeWidth="2.5" />
          <rect x="114" y="88" width="10" height="44" rx="5" fill="#4D7C0F" />
          <rect x="130" y="92" width="10" height="40" rx="5" fill="#65A30D" />
        </>
      )}

      {key === 'spices' && (
        <>
          <rect width="200" height="200" fill="#FFF7ED" />
          <ellipse cx="100" cy="156" rx="64" ry="12" fill="#FED7AA" opacity="0.6" />
          {/* Sauce bottle */}
          <rect x="118" y="54" width="28" height="92" rx="8" fill="#7C2D12" />
          <rect x="125" y="40" width="14" height="16" rx="3" fill="#F59E0B" />
          {/* 3 colorful spice bowls */}
          <path d="M40 120H82C80 136 72 144 61 144C50 144 42 136 40 120Z" fill="#FFFFFF" stroke="#D97706" strokeWidth="2.5" />
          <ellipse cx="61" cy="120" rx="20" ry="8" fill="#DC2626" />
          <path d="M74 102H116C114 118 106 126 95 126C84 126 76 118 74 102Z" fill="#FFFFFF" stroke="#D97706" strokeWidth="2.5" />
          <ellipse cx="95" cy="102" rx="20" ry="8" fill="#EAB308" />
          <path d="M78 130H120C118 146 110 154 99 154C88 154 80 146 78 130Z" fill="#FFFFFF" stroke="#15803D" strokeWidth="2.5" />
          <ellipse cx="99" cy="130" rx="20" ry="8" fill="#16A34A" />
        </>
      )}

      {key === 'nuts' && (
        <>
          <rect width="200" height="200" fill="#FEFCE8" />
          <ellipse cx="100" cy="154" rx="64" ry="12" fill="#FDE68A" opacity="0.65" />
          {/* Roasted walnuts / almonds */}
          <ellipse cx="70" cy="104" rx="24" ry="18" transform="rotate(-18 70 104)" fill="#B45309" />
          <ellipse cx="106" cy="96" rx="20" ry="15" fill="#D97706" />
          {/* Pistachios */}
          <ellipse cx="136" cy="112" rx="18" ry="13" transform="rotate(18 136 112)" fill="#84CC16" stroke="#D6D3D1" strokeWidth="3" />
          {/* Dried apricots & dates */}
          <circle cx="86" cy="132" r="18" fill="#F97316" />
          <ellipse cx="122" cy="134" rx="20" ry="14" fill="#78350F" />
        </>
      )}

      {key === 'cleaning' && (
        <>
          <rect width="200" height="200" fill="#ECFEFF" />
          <ellipse cx="100" cy="158" rx="64" ry="12" fill="#CFFAFE" />
          {/* Detergent jug */}
          <rect x="46" y="70" width="48" height="80" rx="12" fill="#0EA5E9" />
          <rect x="60" y="54" width="20" height="16" rx="4" fill="#0284C7" />
          <rect x="54" y="96" width="32" height="28" rx="5" fill="#E0F2FE" />
          {/* Paper towel roll */}
          <rect x="108" y="64" width="44" height="86" rx="8" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="2.5" />
          <ellipse cx="130" cy="64" rx="22" ry="7" fill="#F1F5F9" stroke="#94A3B8" strokeWidth="2" />
          <ellipse cx="130" cy="64" rx="7" ry="2.5" fill="#CBD5E1" />
          {/* Sponge */}
          <rect x="86" y="130" width="42" height="20" rx="5" fill="#FACC15" stroke="#16A34A" strokeWidth="3" />
        </>
      )}

      {key === 'personal_care' && (
        <>
          <rect width="200" height="200" fill="#F0FDF4" />
          <ellipse cx="100" cy="158" rx="62" ry="12" fill="#DCFCE7" />
          {/* Pump shampoo bottle */}
          <rect x="56" y="74" width="40" height="76" rx="12" fill="#16A34A" />
          <path d="M76 54V74M68 54H88" stroke="#15803D" strokeWidth="5" strokeLinecap="round" />
          <rect x="64" y="100" width="24" height="26" rx="4" fill="#DCFCE7" />
          {/* Lotion bottle */}
          <rect x="104" y="88" width="36" height="62" rx="10" fill="#FFFFFF" stroke="#86EFAC" strokeWidth="3" />
          <rect x="114" y="76" width="16" height="12" rx="4" fill="#4ADE80" />
          {/* Soap bar */}
          <rect x="108" y="132" width="46" height="18" rx="9" fill="#BBF7D0" stroke="#16A34A" strokeWidth="2" />
        </>
      )}

      {key === 'baby' && (
        <>
          <rect width="200" height="200" fill="#EFF6FF" />
          <ellipse cx="100" cy="158" rx="62" ry="12" fill="#DBEAFE" />
          {/* Baby milk bottle */}
          <rect x="64" y="72" width="38" height="78" rx="12" fill="#FFFFFF" stroke="#60A5FA" strokeWidth="3" />
          <rect x="68" y="58" width="30" height="14" rx="5" fill="#3B82F6" />
          <path d="M77 58C77 46 89 46 89 58" fill="#FDE68A" stroke="#F59E0B" strokeWidth="2" />
          <path d="M72 98H84M72 112H84M72 126H84" stroke="#93C5FD" strokeWidth="3" strokeLinecap="round" />
          {/* Soft folded diapers */}
          <rect x="108" y="102" width="46" height="48" rx="10" fill="#FCE7F3" stroke="#F472B6" strokeWidth="2.5" />
          <path d="M108 118H154M108 134H154" stroke="#F9A8D4" strokeWidth="2.5" />
        </>
      )}

      {key === 'home_kitchen' && (
        <>
          <rect width="200" height="200" fill="#F8FAFC" />
          <ellipse cx="100" cy="156" rx="64" ry="12" fill="#E2E8F0" />
          {/* Stainless cooking pot */}
          <rect x="56" y="88" width="88" height="60" rx="12" fill="#CBD5E1" stroke="#64748B" strokeWidth="3" />
          <path d="M46 102H56M144 102H154" stroke="#475569" strokeWidth="5" strokeLinecap="round" />
          <path d="M52 88H148C144 74 126 68 100 68C74 68 56 74 52 88Z" fill="#94A3B8" stroke="#475569" strokeWidth="2.5" />
          <path d="M90 68C90 58 110 58 110 68" stroke="#475569" strokeWidth="4" strokeLinecap="round" />
          {/* Wooden spoon */}
          <path d="M138 66L160 44" stroke="#B45309" strokeWidth="5" strokeLinecap="round" />
          <ellipse cx="162" cy="42" rx="9" ry="6" transform="rotate(-45 162 42)" fill="#D97706" />
        </>
      )}

      {key === 'default' && (
        <>
          <rect width="200" height="200" fill="#F0FDF4" />
          <ellipse cx="100" cy="156" rx="60" ry="12" fill="#DCFCE7" />
          <path d="M54 96H146L136 148H64L54 96Z" fill="#16A34A" />
          <path d="M74 96L90 64M126 96L110 64" stroke="#15803D" strokeWidth="6" strokeLinecap="round" />
          <path d="M76 112V134M100 112V134M124 112V134" stroke="#BBF7D0" strokeWidth="4" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}
