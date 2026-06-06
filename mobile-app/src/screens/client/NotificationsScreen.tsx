import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import notificationService from '../../services/notificationService';
import { Notification } from '../../types';
import { COLORS } from '../../constants';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { format } from 'date-fns';

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = useCallback(async () => {
    try {
      const res = await notificationService.getNotifications({ limit: 50 });
      setNotifications(res.data || []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      await loadNotifications();
      setIsLoading(false);
    })();
  }, [loadNotifications]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  }, [loadNotifications]);

  const handleMarkRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch { /* ignore */ }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch { /* ignore */ }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'order_update': return 'cube-outline';
      case 'promotion': return 'pricetag-outline';
      case 'invoice': return 'document-text-outline';
      default: return 'notifications-outline';
    }
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      onPress={() => !item.isRead && handleMarkRead(item._id)}
      className={`flex-row px-4 py-4 border-b border-gray-50 ${
        !item.isRead ? 'bg-primary-50/30' : 'bg-white'
      }`}
    >
      <View
        className={`w-10 h-10 rounded-full justify-center items-center ${
          !item.isRead ? 'bg-primary-100' : 'bg-gray-100'
        }`}
      >
        <Ionicons
          name={getIcon(item.type)}
          size={20}
          color={!item.isRead ? COLORS.primary : COLORS.textSecondary}
        />
      </View>
      <View className="flex-1 ml-3">
        <View className="flex-row justify-between">
          <Text
            className={`text-sm flex-1 ${
              !item.isRead ? 'font-bold text-gray-800' : 'font-medium text-gray-600'
            }`}
          >
            {item.title}
          </Text>
          {!item.isRead && <View className="w-2 h-2 rounded-full bg-primary-600 mt-1.5 ml-2" />}
        </View>
        <Text className="text-xs text-gray-500 mt-1">{item.message}</Text>
        <Text className="text-xs text-gray-400 mt-1">
          {format(new Date(item.createdAt), 'MMM dd, yyyy HH:mm')}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) return <LoadingSpinner />;

  return (
    <View className="flex-1 bg-white">
      {unreadCount > 0 && (
        <View className="px-4 py-2 bg-gray-50 flex-row justify-between items-center border-b border-gray-200">
          <Text className="text-sm text-gray-600">{unreadCount} unread</Text>
          <TouchableOpacity onPress={handleMarkAllRead}>
            <Text className="text-sm font-medium text-primary-700">Mark all read</Text>
          </TouchableOpacity>
        </View>
      )}
      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item._id}
        contentContainerClassName={notifications.length === 0 ? 'flex-1' : ''}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
        ListEmptyComponent={
          <EmptyState
            icon="notifications-off-outline"
            title="No notifications"
            subtitle="You're all caught up"
          />
        }
      />
    </View>
  );
}
