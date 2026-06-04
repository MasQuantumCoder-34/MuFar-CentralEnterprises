import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import orderService from '../../services/orderService';
import { Order } from '../../types';
import { COLORS, STORE_INFO } from '../../constants';
import StatusBadge from '../../components/StatusBadge';
import OrderStatusTimeline from '../../components/OrderStatusTimeline';
import LoadingSpinner from '../../components/LoadingSpinner';
import Toast from 'react-native-toast-message';
import { format } from 'date-fns';
import type { OrdersStackParamList } from '../../navigation/MainTabs';

type OrderDetailRouteProp = RouteProp<OrdersStackParamList, 'OrderDetail'>;

const CANCELLABLE_STATUSES = ['pending', 'accepted', 'on_hold'];

export default function OrderDetailScreen() {
  const route = useRoute<OrderDetailRouteProp>();
  const navigation = useNavigation();
  const { orderId } = route.params;

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await orderService.getOrderById(orderId);
        setOrder(data);
      } catch { /* ignore */ }
      setIsLoading(false);
    })();
  }, [orderId]);

  const handleViewInvoice = async () => {
    setInvoiceLoading(true);
    try {
      const html = await orderService.getInvoice(orderId);
      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      } else {
        Toast.show({ type: 'info', text1: 'Invoice saved', text2: `File: ${uri}` });
      }
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Failed to generate invoice', text2: err.message });
    } finally {
      setInvoiceLoading(false);
    }
  };

  const handleCancelOrder = () => {
    Alert.alert('Cancel Order', 'Are you sure you want to cancel this order?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: async () => {
          setCancelling(true);
          try {
            await orderService.cancelOrder(orderId);
            const updated = await orderService.getOrderById(orderId);
            setOrder(updated);
            Toast.show({ type: 'success', text1: 'Order cancelled' });
          } catch (err: any) {
            Toast.show({ type: 'error', text1: 'Failed to cancel', text2: err.message });
          } finally {
            setCancelling(false);
          }
        },
      },
    ]);
  };

  const handleShareWhatsApp = () => {
    if (!order) return;
    const text = `Order #${order.orderNumber} - ${STORE_INFO.name}\nStatus: ${order.status}\nTotal: KES ${order.total}\nItems: ${order.items.length}\n\nTrack your order at ${STORE_INFO.website}/orders/${order.orderNumber}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    Linking.openURL(url).catch(() => Toast.show({ type: 'error', text1: 'Could not open WhatsApp' }));
  };

  if (isLoading) return <LoadingSpinner />;
  if (!order) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text className="text-gray-500">Order not found</Text>
      </View>
    );
  }

  const canCancel = CANCELLABLE_STATUSES.includes(order.status);

  return (
    <ScrollView className="flex-1 bg-gray-50" showsVerticalScrollIndicator={false}>
      <View className="bg-white p-4 mb-3">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-lg font-bold text-gray-800">Order #{order.orderNumber}</Text>
          <StatusBadge status={order.status} size="md" />
        </View>
        <View className="flex-row items-center mb-1">
          <Ionicons name="calendar-outline" size={14} color={COLORS.textSecondary} />
          <Text className="text-xs text-gray-500 ml-1">
            {format(new Date(order.createdAt), 'MMM dd, yyyy HH:mm')}
          </Text>
        </View>
      </View>

      <View className="bg-white p-4 mb-3">
        <Text className="font-semibold text-gray-800 mb-3">Items</Text>
        {order.items.map((item) => (
          <View key={item.id} className="flex-row items-center mb-3">
            <View className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
              {item.productImage ? (
                <Image source={{ uri: item.productImage }} className="w-full h-full" resizeMode="cover" />
              ) : (
                <View className="flex-1 justify-center items-center">
                  <Ionicons name="image-outline" size={24} color={COLORS.textLight} />
                </View>
              )}
            </View>
            <View className="flex-1 ml-3">
              <Text className="text-sm font-medium text-gray-800">{item.productName}</Text>
              <Text className="text-xs text-gray-500">SKU: {item.productSku}</Text>
              <Text className="text-xs text-gray-500">Qty: {item.quantity} x KES {item.unitPrice}</Text>
            </View>
            <Text className="text-sm font-bold text-gray-800">KES {item.totalPrice.toLocaleString()}</Text>
          </View>
        ))}
      </View>

      <View className="bg-white p-4 mb-3">
        <Text className="font-semibold text-gray-800 mb-3">Status Timeline</Text>
        <OrderStatusTimeline
          history={order.statusHistory || []}
          currentStatus={order.status}
        />
      </View>

      <View className="bg-white p-4 mb-3">
        <Text className="font-semibold text-gray-800 mb-3">Delivery Information</Text>
        <View className="flex-row items-start mb-2">
          <Ionicons name="location-outline" size={16} color={COLORS.textSecondary} style={{ marginTop: 2 }} />
          <Text className="text-sm text-gray-600 ml-2 flex-1">{order.deliveryAddress}</Text>
        </View>
        <View className="flex-row items-center mb-2">
          <Ionicons name="call-outline" size={16} color={COLORS.textSecondary} />
          <Text className="text-sm text-gray-600 ml-2">{order.contactNumber}</Text>
        </View>
        {order.notes && (
          <View className="flex-row items-start">
            <Ionicons name="document-text-outline" size={16} color={COLORS.textSecondary} style={{ marginTop: 2 }} />
            <Text className="text-sm text-gray-600 ml-2 flex-1">{order.notes}</Text>
          </View>
        )}
      </View>

      <View className="bg-white p-4 mb-3">
        <View className="flex-row justify-between mb-2">
          <Text className="text-sm text-gray-600">Subtotal</Text>
          <Text className="text-sm text-gray-600">KES {order.subtotal.toLocaleString()}</Text>
        </View>
        <View className="flex-row justify-between mb-2">
          <Text className="text-sm text-gray-600">Tax</Text>
          <Text className="text-sm text-gray-600">KES {order.tax.toLocaleString()}</Text>
        </View>
        {order.discount > 0 && (
          <View className="flex-row justify-between mb-2">
            <Text className="text-sm text-gray-600">Discount</Text>
            <Text className="text-sm text-green-600">-KES {order.discount.toLocaleString()}</Text>
          </View>
        )}
        <View className="border-t border-gray-200 pt-2 mt-1 flex-row justify-between">
          <Text className="text-base font-bold text-gray-800">Total</Text>
          <Text className="text-base font-bold text-primary-700">KES {order.total.toLocaleString()}</Text>
        </View>
      </View>

      <View className="flex-row px-4 mb-8">
        <TouchableOpacity
          onPress={handleViewInvoice}
          disabled={invoiceLoading}
          className="flex-1 bg-primary-700 py-3 rounded-xl flex-row justify-center items-center mr-2"
        >
          {invoiceLoading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <>
              <Ionicons name="document-text-outline" size={18} color="white" />
              <Text className="text-white font-semibold ml-2">View Invoice</Text>
            </>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleShareWhatsApp}
          className="bg-green-500 py-3 px-4 rounded-xl mr-2"
        >
          <Ionicons name="logo-whatsapp" size={20} color="white" />
        </TouchableOpacity>
        {canCancel && (
          <TouchableOpacity
            onPress={handleCancelOrder}
            disabled={cancelling}
            className="bg-red-500 py-3 px-4 rounded-xl"
          >
            {cancelling ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Ionicons name="close-outline" size={20} color="white" />
            )}
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}
