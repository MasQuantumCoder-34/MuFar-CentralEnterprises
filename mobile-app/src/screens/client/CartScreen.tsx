import React, { useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { CartStackParamList } from '../../navigation/MainTabs';
import { useCartStore } from '../../store/cartStore';
import { COLORS } from '../../constants';
import CartItemComponent from '../../components/CartItem';
import EmptyState from '../../components/EmptyState';

type CartNavProp = NativeStackNavigationProp<CartStackParamList, 'Cart'>;

export default function CartScreen() {
  const navigation = useNavigation<CartNavProp>();
  const { items, removeItem, updateQuantity, clearCart, getTotal, getItemCount } = useCartStore();

  const total = getTotal();
  const itemCount = getItemCount();

  const handleCheckout = useCallback(() => {
    if (items.length === 0) return;
    navigation.navigate('Checkout');
  }, [items.length, navigation]);

  if (items.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <EmptyState
          icon="cart-outline"
          title="Your cart is empty"
          subtitle="Browse products and add items to your cart"
          actionLabel="Start Shopping"
          onAction={() => navigation.getParent()?.navigate('HomeTab')}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-row items-center justify-between px-4 pt-4 pb-2">
        <Text className="text-2xl font-bold text-gray-800">Cart ({itemCount})</Text>
        <TouchableOpacity onPress={clearCart} className="flex-row items-center">
          <Ionicons name="trash-outline" size={18} color={COLORS.error} />
          <Text className="text-sm text-red-600 ml-1">Clear</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.productId.toString()}
        renderItem={({ item }) => (
          <CartItemComponent
            item={item}
            onQuantityChange={updateQuantity}
            onRemove={removeItem}
          />
        )}
        contentContainerClassName="pb-4"
        showsVerticalScrollIndicator={false}
      />

      <View className="bg-white border-t border-gray-200 px-4 py-4">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-lg font-semibold text-gray-800">Total</Text>
          <Text className="text-2xl font-bold text-primary-700">KES {total.toLocaleString()}</Text>
        </View>
        <TouchableOpacity
          onPress={handleCheckout}
          className="bg-primary-700 py-4 rounded-xl"
        >
          <Text className="text-white text-center font-bold text-lg">Proceed to Checkout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
