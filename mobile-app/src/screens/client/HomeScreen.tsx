import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  Dimensions,
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

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
  const [offerSlide, setOfferSlide] = useState(0);
  const slideTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const offerProducts = featured.filter((p) => p.offerPrice && p.offerPrice < p.price);

  useEffect(() => {
    if (offerProducts.length <= 1) return;
    slideTimer.current = setInterval(() => {
      setOfferSlide((prev) => (prev + 1) % offerProducts.length);
    }, 4000);
    return () => {
      if (slideTimer.current) clearInterval(slideTimer.current);
    };
  }, [offerProducts.length]);

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
    if (product.stockQuantity <= 0) return;
    addItem({ product, quantity: 1 });
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

        {offerProducts.length > 0 && (
          <View className="mb-5">
            <View className="flex-row items-center justify-between px-4 mb-2">
              <View className="flex-row items-center gap-2">
                <Ionicons name="pricetag" size={18} color={COLORS.error} />
                <Text className="text-lg font-bold text-gray-800">Today's Offers</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('ProductList', {})}>
                <Text className="text-sm text-primary-700 font-medium">View All</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              snapToInterval={SCREEN_WIDTH - 32}
              decelerationRate="fast"
              contentContainerStyle={{ paddingHorizontal: 16 }}
              onMomentumScrollEnd={(e) => {
                const idx = Math.round(e.nativeEvent.contentOffset.x / (SCREEN_WIDTH - 32));
                setOfferSlide(idx);
              }}
            >
              {offerProducts.map((product) => (
                <TouchableOpacity
                  key={product._id}
                  activeOpacity={0.9}
                  onPress={() => navigation.navigate('ProductDetail', { productId: product._id })}
                  style={{ width: SCREEN_WIDTH - 32 }}
                  className="mr-3 bg-white rounded-2xl overflow-hidden shadow-md border border-gray-100"
                >
                  <View className="relative">
                    <View style={{ height: SCREEN_WIDTH * 0.45 }} className="bg-gray-100">
                      {product.images?.[0] ? (
                        <Image source={{ uri: product.images[0] }} className="w-full h-full" resizeMode="cover" />
                      ) : (
                        <View className="flex-1 justify-center items-center">
                          <Ionicons name="image-outline" size={64} color={COLORS.textLight} />
                          <Text className="text-xs text-gray-400 mt-2">No Image</Text>
                        </View>
                      )}
                    </View>
                    <View className="absolute top-3 left-3 bg-red-500 px-3 py-1 rounded-full">
                      <Text className="text-white text-xs font-bold">
                        {Math.round((1 - product.offerPrice! / product.price) * 100)}% OFF
                      </Text>
                    </View>
                  </View>
                  <View className="p-3">
                    <Text className="text-base font-bold text-gray-800" numberOfLines={1}>{product.name}</Text>
                    <View className="flex-row items-center gap-2 mt-1">
                      <Text className="text-lg font-bold text-primary-700">KES {product.offerPrice}</Text>
                      <Text className="text-sm text-gray-400 line-through">KES {product.price}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {offerProducts.length > 1 && (
              <View className="flex-row justify-center mt-2 gap-1.5">
                {offerProducts.map((_, i) => (
                  <View
                    key={i}
                    className={`rounded-full ${i === offerSlide ? 'bg-primary-700 w-5' : 'bg-gray-300 w-2'} h-2`}
                  />
                ))}
              </View>
            )}
          </View>
        )}

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
                  key={product._id}
                  onPress={() => navigation.navigate('ProductDetail', { productId: product._id })}
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
                  key={cat._id}
                  onPress={() => navigation.navigate('ProductList', { categoryId: cat._id, categoryName: cat.name })}
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
                <View key={product._id} className="w-1/2">
                  <ProductCard
                    product={product}
                    onPress={() => navigation.navigate('ProductDetail', { productId: product._id })}
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
