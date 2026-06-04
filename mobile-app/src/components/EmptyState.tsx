import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
  icon = 'cart-outline',
  title,
  subtitle,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View className="flex-1 justify-center items-center px-8 py-16">
      <Ionicons name={icon} size={80} color={COLORS.textLight} />
      <Text className="text-xl font-semibold text-gray-700 mt-4 text-center">
        {title}
      </Text>
      {subtitle && (
        <Text className="text-sm text-gray-500 mt-2 text-center leading-5">
          {subtitle}
        </Text>
      )}
      {actionLabel && onAction && (
        <TouchableOpacity
          onPress={onAction}
          className="mt-6 bg-primary-700 px-8 py-3 rounded-lg"
        >
          <Text className="text-white font-semibold text-base">
            {actionLabel}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
