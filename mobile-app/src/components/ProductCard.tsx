import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '../types';
import { COLORS } from '../constants';

interface ProductCardProps {
  product: Product;
  onPress: () => void;
  onAddToCart?: () => void;
  variant?: 'grid' | 'list';
}

export default function ProductCard({
  product,
  onPress,
  onAddToCart,
  variant = 'grid',
}: ProductCardProps) {
  const hasOffer = !!product.offerPrice && product.offerPrice < product.price;
  const imageUrl =
    product.images && product.images.length > 0
      ? { uri: product.images[0] }
      : undefined;
  const outOfStock = product.stockQuantity <= 0;

  if (variant === 'list') {
    return (
      <TouchableOpacity
        onPress={onPress}
        className="flex-row bg-white rounded-xl mb-3 mx-4 overflow-hidden shadow-sm border border-gray-100"
      >
        <View className="w-24 h-24 bg-gray-100">
          {imageUrl ? (
            <Image
              source={imageUrl}
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <View className="flex-1 justify-center items-center">
              <Ionicons name="image-outline" size={32} color={COLORS.textLight} />
            </View>
          )}
          {outOfStock && (
            <View className="absolute inset-0 bg-black/40 justify-center items-center">
              <Text className="text-white text-xs font-bold">Out of Stock</Text>
            </View>
          )}
        </View>
        <View className="flex-1 p-3 justify-between">
          <View>
            <Text className="text-sm font-semibold text-gray-800" numberOfLines={2}>
              {product.name}
            </Text>
            {product.brand && (
              <Text className="text-xs text-gray-500 mt-0.5">{product.brand}</Text>
            )}
          </View>
          <View className="flex-row items-center justify-between mt-1">
            <View className="flex-row items-center">
              <Text className="text-base font-bold text-primary-700">
                KES {hasOffer ? product.offerPrice : product.price}
              </Text>
              {hasOffer && (
                <Text className="text-xs text-gray-400 line-through ml-2">
                  KES {product.price}
                </Text>
              )}
            </View>
            {!outOfStock && onAddToCart && (
              <TouchableOpacity
                onPress={onAddToCart}
                className="bg-primary-600 rounded-full p-2"
              >
                <Ionicons name="cart" size={16} color="white" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white rounded-xl mb-4 mx-2 overflow-hidden shadow-sm border border-gray-100 flex-1"
    >
      <View className="w-full aspect-square bg-gray-100">
        {imageUrl ? (
          <Image
            source={imageUrl}
            className="w-full h-full"
            resizeMode="cover"
          />
        ) : (
          <View className="flex-1 justify-center items-center">
            <Ionicons name="image-outline" size={40} color={COLORS.textLight} />
          </View>
        )}
        {outOfStock && (
          <View className="absolute inset-0 bg-black/40 justify-center items-center">
            <Text className="text-white text-xs font-bold">Out of Stock</Text>
          </View>
        )}
        {hasOffer && !outOfStock && (
          <View className="absolute top-2 left-2 bg-red-500 rounded-full px-2 py-0.5">
            <Text className="text-white text-xs font-bold">
              -{Math.round(((product.price - (product.offerPrice || product.price)) / product.price) * 100)}%
            </Text>
          </View>
        )}
      </View>
      <View className="p-3">
        <Text className="text-sm font-semibold text-gray-800" numberOfLines={2}>
          {product.name}
        </Text>
        <Text className="text-xs text-gray-500 mt-0.5">
          {product.brand || (typeof product.category === 'object' ? product.category.name : '') || ''}
        </Text>
        <View className="flex-row items-center justify-between mt-2">
          <View>
            <Text className="text-base font-bold text-primary-700">
              KES {hasOffer ? product.offerPrice : product.price}
            </Text>
            {hasOffer && (
              <Text className="text-xs text-gray-400 line-through">
                KES {product.price}
              </Text>
            )}
          </View>
          {!outOfStock && onAddToCart && (
            <TouchableOpacity
              onPress={onAddToCart}
              className="bg-primary-600 rounded-full p-2"
            >
              <Ionicons name="cart" size={16} color="white" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}
