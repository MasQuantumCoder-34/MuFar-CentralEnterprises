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
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { OrdersStackParamList } from '../../navigation/MainTabs';
import orderService from '../../services/orderService';
import { Order, OrderStatus } from '../../types';
import { COLORS } from '../../constants';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { format } from 'date-fns';

type OrdersNavProp = NativeStackNavigationProp<OrdersStackParamList, 'Orders'>;

const TABS: { label: string; value: OrderStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Accepted', value: 'accepted' },
  { label: 'Delivered', value: 'delivered' },
];

export default function OrdersScreen() {
  const navigation = useNavigation<OrdersNavProp>();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<OrderStatus | 'all'>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadOrders = useCallback(async (pageNum = 1, append = false) => {
    try {
      const params: { status?: string; page: number; limit: number } = { page: pageNum, limit: 20 };
      if (activeTab !== 'all') params.status = activeTab;
      const res = await orderService.getMyOrders(params);
      if (append) {
        setOrders((prev) => [...prev, ...res.data]);
      } else {
        setOrders(res.data);
      }
      setTotalPages(res.totalPages);
      setPage(pageNum);
    } catch { /* ignore */ }
  }, [activeTab]);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      setOrders([]);
      setPage(1);
      await loadOrders(1);
      setIsLoading(false);
    })();
  }, [loadOrders]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setPage(1);
    await loadOrders(1);
    setRefreshing(false);
  }, [loadOrders]);

  const handleLoadMore = useCallback(async () => {
    if (loadingMore || page >= totalPages) return;
    setLoadingMore(true);
    await loadOrders(page + 1, true);
    setLoadingMore(false);
  }, [loadingMore, page, totalPages, loadOrders]);

  const renderOrder = ({ item }: { item: Order }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('OrderDetail', { orderId: item._id })}
      className="bg-white mx-4 mb-3 rounded-xl p-4 border border-gray-100 shadow-sm"
    >
      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-sm font-bold text-gray-800">#{item.orderNumber}</Text>
        <StatusBadge status={item.status} />
      </View>
      <View className="flex-row items-center mb-1">
        <Ionicons name="calendar-outline" size={14} color={COLORS.textSecondary} />
        <Text className="text-xs text-gray-500 ml-1">
          {format(new Date(item.createdAt), 'MMM dd, yyyy HH:mm')}
        </Text>
      </View>
      <Text className="text-xs text-gray-500" numberOfLines={1}>
        {item.items.length} item(s) - {item.deliveryAddress}
      </Text>
      <View className="border-t border-gray-100 mt-2 pt-2 flex-row justify-between items-center">
        <Text className="text-base font-bold text-primary-700">KES {item.total.toLocaleString()}</Text>
        <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
      </View>
    </TouchableOpacity>
  );

  if (isLoading) return <LoadingSpinner />;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-4 pt-4 pb-2">
        <Text className="text-2xl font-bold text-gray-800">My Orders</Text>
      </View>

      <View className="flex-row px-4 mb-3">
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.value}
            onPress={() => setActiveTab(tab.value)}
            className={`px-4 py-2 rounded-full mr-2 ${
              activeTab === tab.value ? 'bg-primary-700' : 'bg-white border border-gray-300'
            }`}
          >
            <Text
              className={`text-sm font-medium ${
                activeTab === tab.value ? 'text-white' : 'text-gray-600'
              }`}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={orders}
        renderItem={renderOrder}
        keyExtractor={(item) => item._id}
        contentContainerClassName={orders.length === 0 ? 'flex-1' : 'pb-4'}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          <EmptyState icon="receipt-outline" title="No orders yet" subtitle="Your orders will appear here" actionLabel="Start Shopping" onAction={() => {}} />
        }
        ListFooterComponent={
          loadingMore ? <LoadingSpinner size="small" fullScreen={false} /> : null
        }
      />
    </SafeAreaView>
  );
}
