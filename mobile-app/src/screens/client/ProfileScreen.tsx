import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import { COLORS } from '../../constants';

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  const menuItems = [
    {
      icon: 'receipt-outline' as const,
      label: 'Order History',
      onPress: () => navigation.getParent()?.navigate('OrdersTab'),
    },
    {
      icon: 'notifications-outline' as const,
      label: 'Notifications',
      onPress: () => navigation.navigate('NotificationsList'),
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="bg-primary-700 px-6 pt-8 pb-12">
          <View className="items-center">
            <View className="w-20 h-20 bg-white/20 rounded-full justify-center items-center mb-3">
              <Ionicons name="person" size={40} color="white" />
            </View>
            <Text className="text-xl font-bold text-white">{user?.name || 'User'}</Text>
            <Text className="text-sm text-white/80 mt-1">{user?.email}</Text>
            {user?.mobile && <Text className="text-sm text-white/80">{user.mobile}</Text>}
          </View>
        </View>

        <View className="rounded-t-3xl bg-gray-50 -mt-6 px-4 pt-6">


          <View className="bg-white rounded-xl border border-gray-100 mb-4 overflow-hidden">
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                onPress={item.onPress}
                className="flex-row items-center px-4 py-4 border-b border-gray-50"
              >
                <Ionicons name={item.icon} size={22} color={COLORS.primary} />
                <Text className="flex-1 ml-3 text-base text-gray-800">{item.label}</Text>
                <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            onPress={handleLogout}
            className="flex-row items-center justify-center bg-white rounded-xl py-4 border border-red-100 mb-8"
          >
            <Ionicons name="log-out-outline" size={22} color={COLORS.error} />
            <Text className="text-base font-semibold text-red-600 ml-2">Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
