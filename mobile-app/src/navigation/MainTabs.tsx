import React from 'react';
import { View, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useCartStore } from '../store/cartStore';
import { COLORS } from '../constants';

import HomeScreen from '../screens/client/HomeScreen';
import CategoriesScreen from '../screens/client/CategoriesScreen';
import ProductListScreen from '../screens/client/ProductListScreen';
import ProductDetailScreen from '../screens/client/ProductDetailScreen';
import CartScreen from '../screens/client/CartScreen';
import CheckoutScreen from '../screens/client/CheckoutScreen';
import OrdersScreen from '../screens/client/OrdersScreen';
import OrderDetailScreen from '../screens/client/OrderDetailScreen';
import ProfileScreen from '../screens/client/ProfileScreen';
import NotificationsScreen from '../screens/client/NotificationsScreen';

export type MainTabParamList = {
  HomeTab: undefined;
  CategoriesTab: undefined;
  CartTab: undefined;
  OrdersTab: undefined;
  ProfileTab: undefined;
};

export type HomeStackParamList = {
  Home: undefined;
  ProductList: { categoryId?: number; categoryName?: string; search?: string } | undefined;
  ProductDetail: { productId: number };
  Notifications: undefined;
};

export type CategoriesStackParamList = {
  Categories: undefined;
  CategoryProducts: { categoryId: number; categoryName: string };
  CategoryProductDetail: { productId: number };
};

export type CartStackParamList = {
  Cart: undefined;
  Checkout: undefined;
};

export type OrdersStackParamList = {
  Orders: undefined;
  OrderDetail: { orderId: number };
};

export type ProfileStackParamList = {
  Profile: undefined;
  EditProfile: undefined;
  NotificationsList: undefined;
};

const HomeStack = createNativeStackNavigator<HomeStackParamList>();

function HomeStackScreen() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="Home" component={HomeScreen} />
      <HomeStack.Screen
        name="ProductList"
        component={ProductListScreen}
        options={{ headerShown: true, headerTintColor: COLORS.primary, headerTitle: 'Products' }}
      />
      <HomeStack.Screen
        name="ProductDetail"
        component={ProductDetailScreen}
        options={{ headerShown: true, headerTintColor: COLORS.primary, headerTitle: 'Product Details' }}
      />
      <HomeStack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ headerShown: true, headerTintColor: COLORS.primary, headerTitle: 'Notifications' }}
      />
    </HomeStack.Navigator>
  );
}

const CategoriesStack = createNativeStackNavigator();

function CategoriesStackScreen() {
  return (
    <CategoriesStack.Navigator screenOptions={{ headerShown: false }}>
      <CategoriesStack.Screen name="Categories" component={CategoriesScreen} />
      <CategoriesStack.Screen
        name="CategoryProducts"
        component={ProductListScreen}
        options={{ headerShown: true, headerTintColor: COLORS.primary, headerTitle: 'Products' }}
      />
      <CategoriesStack.Screen
        name="CategoryProductDetail"
        component={ProductDetailScreen}
        options={{ headerShown: true, headerTintColor: COLORS.primary, headerTitle: 'Product Details' }}
      />
    </CategoriesStack.Navigator>
  );
}

const CartStack = createNativeStackNavigator<CartStackParamList>();

function CartStackScreen() {
  return (
    <CartStack.Navigator screenOptions={{ headerShown: false }}>
      <CartStack.Screen name="Cart" component={CartScreen} />
      <CartStack.Screen
        name="Checkout"
        component={CheckoutScreen}
        options={{ headerShown: true, headerTintColor: COLORS.primary, headerTitle: 'Checkout' }}
      />
    </CartStack.Navigator>
  );
}

const OrdersStack = createNativeStackNavigator<OrdersStackParamList>();

function OrdersStackScreen() {
  return (
    <OrdersStack.Navigator screenOptions={{ headerShown: false }}>
      <OrdersStack.Screen name="Orders" component={OrdersScreen} />
      <OrdersStack.Screen
        name="OrderDetail"
        component={OrderDetailScreen}
        options={{ headerShown: true, headerTintColor: COLORS.primary, headerTitle: 'Order Details' }}
      />
    </OrdersStack.Navigator>
  );
}

const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

function ProfileStackScreen() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="Profile" component={ProfileScreen} />
      <ProfileStack.Screen
        name="NotificationsList"
        component={NotificationsScreen}
        options={{ headerShown: true, headerTintColor: COLORS.primary, headerTitle: 'Notifications' }}
      />
    </ProfileStack.Navigator>
  );
}

const Tab = createBottomTabNavigator<MainTabParamList>();

function CartBadge() {
  const itemCount = useCartStore((s) => s.getItemCount());
  if (itemCount === 0) return null;
  return (
    <View className="absolute -top-1 -right-2 bg-red-500 rounded-full w-5 h-5 justify-center items-center">
      <Text className="text-white text-xs font-bold">
        {itemCount > 99 ? '99+' : itemCount}
      </Text>
    </View>
  );
}

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopColor: COLORS.border,
          paddingBottom: 4,
          height: 56,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';

          switch (route.name) {
            case 'HomeTab':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'CategoriesTab':
              iconName = focused ? 'grid' : 'grid-outline';
              break;
            case 'CartTab':
              iconName = focused ? 'cart' : 'cart-outline';
              break;
            case 'OrdersTab':
              iconName = focused ? 'receipt' : 'receipt-outline';
              break;
            case 'ProfileTab':
              iconName = focused ? 'person' : 'person-outline';
              break;
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStackScreen}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen
        name="CategoriesTab"
        component={CategoriesStackScreen}
        options={{ tabBarLabel: 'Categories' }}
      />
      <Tab.Screen
        name="CartTab"
        component={CartStackScreen}
        options={{
          tabBarLabel: 'Cart',
          tabBarIcon: ({ focused, color, size }) => (
            <View>
              <Ionicons
                name={focused ? 'cart' : 'cart-outline'}
                size={size}
                color={color}
              />
              <CartBadge />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="OrdersTab"
        component={OrdersStackScreen}
        options={{ tabBarLabel: 'Orders' }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackScreen}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
}
