import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import orderService from '../../services/orderService';
import { useCartStore } from '../../store/cartStore';
import { COLORS } from '../../constants';
import Toast from 'react-native-toast-message';

export default function CheckoutScreen() {
  const navigation = useNavigation<any>();
  const { items, getTotal, clearCart } = useCartStore();
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const subtotal = getTotal();
  const tax = Math.round(subtotal * 0.16);
  const total = subtotal + tax;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!deliveryAddress.trim()) errs.address = 'Delivery address is required';
    if (!contactNumber.trim()) errs.contact = 'Contact number is required';
    else if (contactNumber.trim().length < 10) errs.contact = 'Enter a valid phone number';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handlePlaceOrder = async () => {
    if (!validate()) return;

    setIsLoading(true);
    try {
      const order = await orderService.createOrder({
        deliveryAddress: deliveryAddress.trim(),
        contactNumber: contactNumber.trim(),
        notes: notes.trim() || undefined,
        items: items.map((i) => ({ product: typeof i.product === 'string' ? i.product : i.product._id, quantity: i.quantity })),
      });

      clearCart();
      Toast.show({ type: 'success', text1: 'Order Placed!', text2: `Order #${order.orderNumber}` });
      navigation.popToTop();
      navigation.getParent()?.navigate('OrdersTab');
    } catch (err: any) {
      Alert.alert('Order Failed', err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-gray-50" keyboardShouldPersistTaps="handled">
      <View className="p-4">
        <Text className="text-xl font-bold text-gray-800 mb-1">Delivery Details</Text>
        <Text className="text-sm text-gray-500 mb-4">Enter your delivery information</Text>

        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1">Delivery Address *</Text>
          <TextInput
            className={`border rounded-lg px-4 py-3 text-base bg-white ${
              errors.address ? 'border-red-400' : 'border-gray-300'
            }`}
            placeholder="e.g. 123 Moi Avenue, Nairobi"
            placeholderTextColor={COLORS.textLight}
            value={deliveryAddress}
            onChangeText={(t) => { setDeliveryAddress(t); setErrors((e) => ({ ...e, address: '' })); }}
            multiline
            numberOfLines={2}
            editable={!isLoading}
          />
          {errors.address && <Text className="text-red-500 text-xs mt-1">{errors.address}</Text>}
        </View>

        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1">Contact Number *</Text>
          <TextInput
            className={`border rounded-lg px-4 py-3 text-base bg-white ${
              errors.contact ? 'border-red-400' : 'border-gray-300'
            }`}
            placeholder="e.g. 0712345678"
            placeholderTextColor={COLORS.textLight}
            value={contactNumber}
            onChangeText={(t) => { setContactNumber(t); setErrors((e) => ({ ...e, contact: '' })); }}
            keyboardType="phone-pad"
            editable={!isLoading}
          />
          {errors.contact && <Text className="text-red-500 text-xs mt-1">{errors.contact}</Text>}
        </View>

        <View className="mb-6">
          <Text className="text-sm font-medium text-gray-700 mb-1">Order Notes (Optional)</Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-4 py-3 text-base bg-white"
            placeholder="Any special instructions..."
            placeholderTextColor={COLORS.textLight}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            editable={!isLoading}
          />
        </View>

        <Text className="text-xl font-bold text-gray-800 mb-3">Order Summary</Text>
        {items.map((item) => {
          const productData = typeof item.product === 'object' ? item.product : null;
          const productId = typeof item.product === 'string' ? item.product : item.product._id;
          const price = productData ? (productData.offerPrice || productData.price) : 0;
          return (
            <View key={productId} className="flex-row items-center bg-white rounded-lg p-3 mb-2 border border-gray-100">
              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-800" numberOfLines={1}>{productData?.name || 'Product'}</Text>
                <Text className="text-xs text-gray-500">Qty: {item.quantity} x KES {price}</Text>
              </View>
              <Text className="text-sm font-semibold text-gray-800">KES {(price * item.quantity).toLocaleString()}</Text>
            </View>
          );
        })}

        <View className="bg-white rounded-xl p-4 mt-4 border border-gray-200">
          <View className="flex-row justify-between mb-2">
            <Text className="text-sm text-gray-600">Subtotal</Text>
            <Text className="text-sm text-gray-600">KES {subtotal.toLocaleString()}</Text>
          </View>
          <View className="flex-row justify-between mb-2">
            <Text className="text-sm text-gray-600">VAT (16%)</Text>
            <Text className="text-sm text-gray-600">KES {tax.toLocaleString()}</Text>
          </View>
          <View className="border-t border-gray-200 pt-2 mt-1 flex-row justify-between">
            <Text className="text-lg font-bold text-gray-800">Total</Text>
            <Text className="text-lg font-bold text-primary-700">KES {total.toLocaleString()}</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={handlePlaceOrder}
          disabled={isLoading}
          className={`mt-6 py-4 rounded-xl ${isLoading ? 'bg-primary-300' : 'bg-primary-700'}`}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-center font-bold text-lg">Place Order</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
