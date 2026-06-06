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
import productService from '../../services/productService';
import { Category } from '../../types';
import { COLORS } from '../../constants';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';

export default function CategoriesScreen() {
  const navigation = useNavigation<any>();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadCategories = useCallback(async () => {
    try {
      const data = await productService.getCategories();
      setCategories(data || []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      await loadCategories();
      setIsLoading(false);
    })();
  }, [loadCategories]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadCategories();
    setRefreshing(false);
  }, [loadCategories]);

  if (isLoading) return <LoadingSpinner />;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-4 pt-4 pb-2">
        <Text className="text-2xl font-bold text-gray-800">Categories</Text>
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >
        {categories.length === 0 ? (
          <EmptyState icon="grid-outline" title="No Categories" subtitle="Categories will appear here" />
        ) : (
          categories.map((cat) => (
            <TouchableOpacity
              key={cat._id}
              onPress={() =>
                navigation.navigate('CategoryProducts', {
                  categoryId: cat._id,
                  categoryName: cat.name,
                })
              }
              className="bg-white mx-4 mb-3 rounded-xl overflow-hidden shadow-sm border border-gray-100"
            >
              <View className="flex-row items-center p-4">
                <View className="w-16 h-16 bg-primary-50 rounded-xl justify-center items-center">
                  {cat.image ? (
                    <Image source={{ uri: cat.image }} className="w-full h-full rounded-xl" resizeMode="cover" />
                  ) : (
                    <Ionicons name="grid-outline" size={28} color={COLORS.primary} />
                  )}
                </View>
                <View className="flex-1 ml-4">
                  <Text className="text-base font-semibold text-gray-800">{cat.name}</Text>
                  {cat.description && (
                    <Text className="text-xs text-gray-500 mt-1" numberOfLines={2}>
                      {cat.description}
                    </Text>
                  )}
                  {cat.productCount !== undefined && (
                    <Text className="text-xs text-primary-600 mt-1">{cat.productCount} products</Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
