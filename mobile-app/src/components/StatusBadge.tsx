import React from 'react';
import { View, Text } from 'react-native';
import { STATUS_COLORS, STATUS_LABELS } from '../constants';
import { OrderStatus } from '../types';

interface StatusBadgeProps {
  status: OrderStatus;
  size?: 'sm' | 'md' | 'lg';
}

export default function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const bgColor = STATUS_COLORS[status] || '#9e9e9e';
  const label = STATUS_LABELS[status] || status;

  const sizeStyles = {
    sm: 'px-2 py-0.5',
    md: 'px-3 py-1',
    lg: 'px-4 py-1.5',
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <View
      className={`rounded-full self-start ${sizeStyles[size]}`}
      style={{ backgroundColor: bgColor + '20' }}
    >
      <Text
        className={`font-semibold ${textSizes[size]}`}
        style={{ color: bgColor }}
      >
        {label}
      </Text>
    </View>
  );
}
