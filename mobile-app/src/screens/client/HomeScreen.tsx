import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../../navigation/MainTabs';
import productService from '../../services/productService';
import notificationService from '../../services/notificationService';
import { Product, Category } from '../../types';
import { COLORS, STORE_INFO } from '../../constants';
import SearchBar from '../../components/SearchBar';
import ProductCard from '../../components/ProductCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useCartStore } from '../../store/cartStore';

type HomeNavProp = NativeStackNavigationProp<HomeStackParamList, 'Home'>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeNavProp>();
  const addItem = useCartStore((s) => s.addItem);
  const [featured, setFeatured] = useState<Product[]>([]);
  const [recent, setRecent] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [featuredRes, recentRes, cats] = await Promise.all([
        productService.getFeaturedProducts(),
        productService.getRecentProducts(8),
        productService.getCategories(),
      ]);
      setFeatured(featuredRes || []);
      setRecent(recentRes || []);
      setCategories(cats || []);
      try {
        const count = await notificationService.getUnreadCount();
        setUnreadCount(count);
      } catch { /* ignore */ }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      await loadData();
      setIsLoading(false);
    })();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleSearch = (query: string) => {
    if (query.trim()) {
      navigation.navigate('ProductList', { search: query.trim() });
    }
  };

  const handleAddToCart = (product: Product) => {
    if (product.stock <= 0) return;
    addItem({ productId: product.id, product, quantity: 1 });
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >
        <View className="flex-row items-center justify-between px-4 pt-2 pb-4">
          <View>
            <Text className="text-xl font-bold text-primary-800">{STORE_INFO.name}</Text>
            <Text className="text-xs text-gray-500">{STORE_INFO.tagline}</Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('Notifications')}
            className="relative p-2"
          >
            <Ionicons name="notifications-outline" size={24} color={COLORS.text} />
            {unreadCount > 0 && (
              <View className="absolute top-0 right-0 bg-red-500 rounded-full w-5 h-5 justify-center items-center">
                <Text className="text-white text-xs font-bold">{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <SearchBar onSearch={handleSearch} />

        {featured.length > 0 && (
          <View className="mb-6">
            <View className="flex-row justify-between items-center px-4 mb-3">
              <Text className="text-lg font-bold text-gray-800">Featured Products</Text>
              <TouchableOpacity onPress={() => navigation.navigate('ProductList', {})}>
                <Text className="text-sm text-primary-700 font-medium">See All</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="pl-4"
            >
              {featured.map((product) => (
                <TouchableOpacity
                  key={product.id}
                  onPress={() => navigation.navigate('ProductDetail', { productId: product.id })}
                  className="mr-3 bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 w-44"
                >
                  <View className="w-44 h-44 bg-gray-100">
                    {product.images?.[0] ? (
                      <Image source={{ uri: product.images[0] }} className="w-full h-full" resizeMode="cover" />
                    ) : (
                      <View className="flex-1 justify-center items-center">
                        <Ionicons name="image-outline" size={36} color={COLORS.textLight} />
                      </View>
                    )}
                  </View>
                  <View className="p-2">
                    <Text className="text-sm font-semibold text-gray-800" numberOfLines={1}>{product.name}</Text>
                    <Text className="text-xs text-gray-500">{product.brand || ''}</Text>
                    <Text className="text-sm font-bold text-primary-700 mt-1">
                      KES {product.offerPrice || product.price}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {categories.length > 0 && (
          <View className="mb-6 px-4">
            <Text className="text-lg font-bold text-gray-800 mb-3">Categories</Text>
            <View className="flex-row flex-wrap">
              {categories.slice(0, 8).map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => navigation.navigate('ProductList', { categoryId: cat.id, categoryName: cat.name })}
                  className="w-1/4 items-center mb-4"
                >
                  <View className="w-14 h-14 bg-primary-50 rounded-full justify-center items-center mb-1">
                    <Ionicons name="grid-outline" size={24} color={COLORS.primary} />
                  </View>
                  <Text className="text-xs text-gray-700 text-center" numberOfLines={1}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {recent.length > 0 && (
          <View className="mb-6 px-4">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-lg font-bold text-gray-800">Recent Products</Text>
              <TouchableOpacity onPress={() => navigation.navigate('ProductList', {})}>
                <Text className="text-sm text-primary-700 font-medium">See All</Text>
              </TouchableOpacity>
            </View>
            <View className="flex-row flex-wrap">
              {recent.map((product) => (
                <View key={product.id} className="w-1/2">
                  <ProductCard
                    product={product}
                    onPress={() => navigation.navigate('ProductDetail', { productId: product.id })}
                    onAddToCart={() => handleAddToCart(product)}
                  />
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
