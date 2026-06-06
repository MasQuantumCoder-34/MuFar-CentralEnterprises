import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import productService from '../../services/productService';
import { Product, ProductFilters } from '../../types';
import { COLORS } from '../../constants';
import ProductCard from '../../components/ProductCard';
import SearchBar from '../../components/SearchBar';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { useCartStore } from '../../store/cartStore';
import type { HomeStackParamList } from '../../navigation/MainTabs';

type ProductListRouteProp = RouteProp<HomeStackParamList, 'ProductList'>;

export default function ProductListScreen() {
  const route = useRoute<ProductListRouteProp>();
  const navigation = useNavigation<any>();
  const addItem = useCartStore((s) => s.addItem);
  const categoryId = route.params?.categoryId;
  const search = route.params?.search;
  const categoryName = route.params?.categoryName;

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState(search || '');
  const [sort, setSort] = useState<ProductFilters['sort']>('newest');
  const [showFilters, setShowFilters] = useState(false);

  const loadProducts = useCallback(async (pageNum = 1, append = false) => {
    try {
      const filters: ProductFilters = {
        page: pageNum,
        limit: 20,
        sort,
      };
      if (categoryId) filters.categoryId = categoryId;
      if (searchQuery) filters.search = searchQuery;

      const res = await productService.getProducts(filters);
      if (append) {
        setProducts((prev) => [...prev, ...res.data]);
      } else {
        setProducts(res.data);
      }
      setTotalPages(res.totalPages);
      setPage(pageNum);
    } catch { /* ignore */ }
  }, [categoryId, searchQuery, sort]);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      setProducts([]);
      setPage(1);
      await loadProducts(1);
      setIsLoading(false);
    })();
  }, [loadProducts]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setPage(1);
    await loadProducts(1);
    setRefreshing(false);
  }, [loadProducts]);

  const handleLoadMore = useCallback(async () => {
    if (loadingMore || page >= totalPages) return;
    setLoadingMore(true);
    await loadProducts(page + 1, true);
    setLoadingMore(false);
  }, [loadingMore, page, totalPages, loadProducts]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleAddToCart = (product: Product) => {
    if (product.stockQuantity <= 0) return;
    addItem({ product, quantity: 1 });
  };

  const sortOptions: { label: string; value: ProductFilters['sort'] }[] = [
    { label: 'Newest', value: 'newest' },
    { label: 'Price: Low to High', value: 'price_asc' },
    { label: 'Price: High to Low', value: 'price_desc' },
    { label: 'Name: A-Z', value: 'name_asc' },
  ];

  const renderProduct = ({ item }: { item: Product }) => (
    <View className={viewMode === 'grid' ? 'w-1/2' : 'w-full'}>
      <ProductCard
        product={item}
        variant={viewMode}
        onPress={() => navigation.navigate('ProductDetail', { productId: item._id })}
        onAddToCart={() => handleAddToCart(item)}
      />
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <SearchBar
        onSearch={handleSearch}
        placeholder={`Search ${categoryName || 'products'}...`}
      />

      <View className="flex-row items-center justify-between px-4 mb-2">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => setShowFilters(!showFilters)}
            className="flex-row items-center bg-white border border-gray-300 rounded-lg px-3 py-2 mr-2"
          >
            <Ionicons name="funnel-outline" size={16} color={COLORS.textSecondary} />
            <Text className="text-sm text-gray-600 ml-1">Filter</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="bg-white border border-gray-300 rounded-lg p-2"
          >
            <Ionicons
              name={viewMode === 'grid' ? 'list-outline' : 'grid-outline'}
              size={18}
              color={COLORS.textSecondary}
            />
          </TouchableOpacity>
        </View>
        <Text className="text-sm text-gray-500">{products.length} products</Text>
      </View>

      {showFilters && (
        <View className="bg-white mx-4 mb-3 p-4 rounded-xl border border-gray-200">
          <Text className="text-sm font-semibold text-gray-700 mb-2">Sort By</Text>
          <View className="flex-row flex-wrap">
            {sortOptions.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                onPress={() => { setSort(opt.value); setShowFilters(false); }}
                className={`px-3 py-1.5 rounded-full mr-2 mb-2 border ${
                  sort === opt.value
                    ? 'bg-primary-700 border-primary-700'
                    : 'bg-white border-gray-300'
                }`}
              >
                <Text
                  className={`text-xs font-medium ${
                    sort === opt.value ? 'text-white' : 'text-gray-600'
                  }`}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <FlatList
          data={products}
          renderItem={renderProduct}
          keyExtractor={(item) => item._id}
          numColumns={viewMode === 'grid' ? 2 : 1}
          key={viewMode}
          contentContainerClassName={products.length === 0 ? 'flex-1' : 'px-2 pb-4'}
          columnWrapperClassName={viewMode === 'grid' ? '' : undefined}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            <EmptyState icon="search-outline" title="No products found" subtitle="Try adjusting your search or filters" />
          }
          ListFooterComponent={
            loadingMore ? (
              <View className="py-4">
                <LoadingSpinner size="small" fullScreen={false} />
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}
