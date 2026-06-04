import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CartItem as CartItemType } from '../types';
import { COLORS } from '../constants';
import QuantitySelector from './QuantitySelector';

interface CartItemProps {
  item: CartItemType;
  onQuantityChange: (productId: number, quantity: number) => void;
  onRemove: (productId: number) => void;
}

export default function CartItem({
  item,
  onQuantityChange,
  onRemove,
}: CartItemProps) {
  const price = item.product.offerPrice || item.product.price;
  const lineTotal = price * item.quantity;
  const imageUrl =
    item.product.images && item.product.images.length > 0
      ? { uri: item.product.images[0] }
      : undefined;

  return (
    <View className="flex-row bg-white rounded-xl mb-3 mx-4 p-3 shadow-sm border border-gray-100">
      <View className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
        {imageUrl ? (
          <Image
            source={imageUrl}
            className="w-full h-full"
            resizeMode="cover"
          />
        ) : (
          <View className="flex-1 justify-center items-center">
            <Ionicons name="image-outline" size={28} color={COLORS.textLight} />
          </View>
        )}
      </View>
      <View className="flex-1 ml-3 justify-between">
        <View className="flex-row justify-between">
          <View className="flex-1 mr-2">
            <Text className="text-sm font-semibold text-gray-800" numberOfLines={2}>
              {item.product.name}
            </Text>
            <Text className="text-xs text-gray-500 mt-0.5">
              SKU: {item.product.sku}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => onRemove(item.productId)}
            className="p-1"
          >
            <Ionicons name="trash-outline" size={18} color={COLORS.error} />
          </TouchableOpacity>
        </View>
        <View className="flex-row items-center justify-between mt-2">
          <Text className="text-sm font-bold text-primary-700">
            KES {price.toLocaleString()}
          </Text>
          <QuantitySelector
            quantity={item.quantity}
            onChange={(q) => onQuantityChange(item.productId, q)}
            min={1}
          />
        </View>
        <Text className="text-xs text-right text-gray-500 mt-1">
          Line Total: KES {lineTotal.toLocaleString()}
        </Text>
      </View>
    </View>
  );
}
