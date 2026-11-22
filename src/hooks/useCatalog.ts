import { useCallback, useEffect, useMemo, useState } from 'react';
import type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import {
  DEFAULT_STORE_SETTINGS,
  SEED_BANNERS,
  SEED_CATEGORIES,
  SEED_PRODUCTS,
} from '../data/erbilSeedData';
import {
  fetchActiveBanners,
  fetchActiveCategories,
  fetchActiveProductsPage,
  fetchAllActiveProducts,
  fetchCmsTranslations,
  fetchStoreSettings,
  seedSampleCatalogToFirestore,
} from '../services/firestoreService';
import type {
  AsyncStatus,
  Banner,
  Category,
  CmsTranslationsDoc,
  Product,
  ProductSection,
  StoreSettings,
} from '../types/grocery';
import { matchesProductSectionFlag } from '../utils/adminLogic';
import { matchesProductSearch } from '../utils/supermarketLogic';

const PAGE_SIZE = 16;

export function useCatalog() {
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS);
  const [cms, setCms] = useState<CmsTranslationsDoc>({});
  const [banners, setBanners] = useState<Banner[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pagedProducts, setPagedProducts] = useState<Product[]>([]);
  const [allActiveProducts, setAllActiveProducts] = useState<Product[]>([]);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [status, setStatus] = useState<AsyncStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isFirestoreEmpty, setIsFirestoreEmpty] = useState(false);
  const [previewLimit, setPreviewLimit] = useState(PAGE_SIZE);
  const [seeding, setSeeding] = useState(false);
  const [seedMessage, setSeedMessage] = useState<string | null>(null);

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string>('all');
  const [selectedSection, setSelectedSection] = useState<'all' | ProductSection>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const loadInitialCatalog = useCallback(async () => {
    setStatus('loading');
    setErrorMessage(null);
    try {
      const [liveSettings, liveCms, liveBanners, liveCategories, firstPage, allProducts] =
        await Promise.all([
          fetchStoreSettings().catch(() => DEFAULT_STORE_SETTINGS),
          fetchCmsTranslations().catch(() => ({})),
          fetchActiveBanners().catch(() => []),
          fetchActiveCategories(),
          fetchActiveProductsPage({ pageSize: PAGE_SIZE }),
          fetchAllActiveProducts().catch(() => []),
        ]);

      setSettings(liveSettings);
      setCms(liveCms);

      if (liveCategories.length === 0) {
        // Firestore has not been seeded yet — show first-run seed utility & local Erbil sample preview
        setIsFirestoreEmpty(true);
        setBanners(SEED_BANNERS);
        setCategories(SEED_CATEGORIES);
        setAllActiveProducts(SEED_PRODUCTS);
        setPagedProducts(SEED_PRODUCTS.slice(0, PAGE_SIZE));
        setPreviewLimit(PAGE_SIZE);
        setLastDoc(null);
        setHasMore(SEED_PRODUCTS.length > PAGE_SIZE);
      } else {
        setIsFirestoreEmpty(false);
        setBanners(liveBanners.length > 0 ? liveBanners : SEED_BANNERS);
        setCategories(liveCategories);
        setPagedProducts(firstPage.products);
        setLastDoc(firstPage.lastDoc);
        setHasMore(firstPage.hasMore);
        setAllActiveProducts(
          allProducts.length > 0 ? allProducts : firstPage.products
        );
      }

      setStatus('ready');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'CATALOG_LOAD_ERROR');
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    void loadInitialCatalog();
  }, [loadInitialCatalog]);

  const loadMoreProducts = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);

    try {
      if (isFirestoreEmpty) {
        const nextLimit = previewLimit + PAGE_SIZE;
        setPagedProducts(SEED_PRODUCTS.slice(0, nextLimit));
        setPreviewLimit(nextLimit);
        setHasMore(nextLimit < SEED_PRODUCTS.length);
      } else {
        const nextPage = await fetchActiveProductsPage({
          pageSize: PAGE_SIZE,
          lastDoc,
        });
        setPagedProducts((prev) => {
          const seen = new Set(prev.map((p) => p.id));
          const merged = [...prev];
          for (const item of nextPage.products) {
            if (!seen.has(item.id)) merged.push(item);
          }
          return merged;
        });
        setLastDoc(nextPage.lastDoc);
        setHasMore(nextPage.hasMore);
      }
    } catch (err) {
      console.error('Failed to load next product page:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, isFirestoreEmpty, lastDoc, loadingMore, previewLimit]);

  const runSeedCatalog = useCallback(async () => {
    setSeeding(true);
    setSeedMessage(null);
    try {
      const result = await seedSampleCatalogToFirestore();
      if (result.seeded) {
        setSeedMessage('SEEDED_OK');
        await loadInitialCatalog();
      } else {
        setSeedMessage('ALREADY_SEEDED');
        await loadInitialCatalog();
      }
    } catch (err) {
      setSeedMessage(err instanceof Error ? err.message : 'SEED_FAILED');
    } finally {
      setSeeding(false);
    }
  }, [loadInitialCatalog]);

  const productsById = useMemo(
    () => new Map(allActiveProducts.map((p) => [p.id, p])),
    [allActiveProducts]
  );

  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === selectedCategoryId) ?? null,
    [categories, selectedCategoryId]
  );

  const isFiltering =
    searchQuery.trim().length > 0 ||
    selectedCategoryId !== 'all' ||
    selectedSubcategoryId !== 'all' ||
    selectedSection !== 'all';

  const visibleProducts = useMemo(() => {
    const source = isFiltering ? allActiveProducts : pagedProducts;
    return source.filter((product) => {
      if (selectedCategoryId !== 'all' && product.categoryId !== selectedCategoryId) {
        return false;
      }
      if (
        selectedSubcategoryId !== 'all' &&
        product.subcategoryId !== selectedSubcategoryId
      ) {
        return false;
      }
      if (
        selectedSection !== 'all' &&
        !matchesProductSectionFlag(product, selectedSection)
      ) {
        return false;
      }
      if (searchQuery.trim() && !matchesProductSearch(product, searchQuery)) {
        return false;
      }
      return true;
    });
  }, [
    allActiveProducts,
    isFiltering,
    pagedProducts,
    searchQuery,
    selectedCategoryId,
    selectedSection,
    selectedSubcategoryId,
  ]);

  const selectCategory = useCallback((categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setSelectedSubcategoryId('all');
  }, []);

  const resetFilters = useCallback(() => {
    setSelectedCategoryId('all');
    setSelectedSubcategoryId('all');
    setSelectedSection('all');
    setSearchQuery('');
  }, []);

  return {
    settings,
    cms,
    banners,
    categories,
    allActiveProducts,
    productsById,
    visibleProducts,
    selectedCategory,
    selectedCategoryId,
    selectedSubcategoryId,
    selectedSection,
    searchQuery,
    isFiltering,
    hasMore: !isFiltering && hasMore,
    loadingMore,
    status,
    errorMessage,
    isFirestoreEmpty,
    seeding,
    seedMessage,
    selectCategory,
    setSelectedSubcategoryId,
    setSelectedSection,
    setSearchQuery,
    resetFilters,
    loadMoreProducts,
    retryLoad: () => void loadInitialCatalog(),
    runSeedCatalog,
  };
}
