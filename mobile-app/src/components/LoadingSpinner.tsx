import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { COLORS } from '../constants';

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  fullScreen?: boolean;
}

export default function LoadingSpinner({
  size = 'large',
  color = COLORS.primary,
  fullScreen = true,
}: LoadingSpinnerProps) {
  if (fullScreen) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size={size} color={color} />
      </View>
    );
  }
  return (
    <View className="justify-center items-center py-8">
      <ActivityIndicator size={size} color={color} />
    </View>
  );
}
