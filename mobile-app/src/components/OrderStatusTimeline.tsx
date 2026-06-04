import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { OrderStatusHistory, OrderStatus } from '../types';
import { STATUS_COLORS, STATUS_LABELS } from '../constants';
import { format } from 'date-fns';

interface OrderStatusTimelineProps {
  history: OrderStatusHistory[];
  currentStatus: OrderStatus;
}

export default function OrderStatusTimeline({
  history,
  currentStatus,
}: OrderStatusTimelineProps) {
  if (!history || history.length === 0) {
    return (
      <View className="py-4">
        <Text className="text-gray-500 text-center">No status history available</Text>
      </View>
    );
  }

  return (
    <View className="py-4">
      {history.map((event, index) => {
        const isLast = index === history.length - 1;
        const color = STATUS_COLORS[event.status] || '#9e9e9e';
        const label = STATUS_LABELS[event.status] || event.status;
        const isCurrent = event.status === currentStatus;

        return (
          <View key={index} className="flex-row">
            <View className="items-center w-8">
              <View
                className="w-4 h-4 rounded-full border-2 justify-center items-center"
                style={{
                  borderColor: color,
                  backgroundColor: isCurrent ? color : 'white',
                }}
              >
                {isCurrent && (
                  <View className="w-1.5 h-1.5 rounded-full bg-white" />
                )}
              </View>
              {!isLast && (
                <View className="w-0.5 flex-1" style={{ backgroundColor: color + '40' }} />
              )}
            </View>
            <View className={`flex-1 ml-3 pb-6 ${isLast ? '' : ''}`}>
              <View className="flex-row items-center">
                <Text
                  className={`text-sm font-semibold ${
                    isCurrent ? '' : 'text-gray-600'
                  }`}
                  style={{ color: isCurrent ? color : undefined }}
                >
                  {label}
                </Text>
                {isCurrent && (
                  <View className="ml-2">
                    <Ionicons name="checkmark-circle" size={16} color={color} />
                  </View>
                )}
              </View>
              {event.note && (
                <Text className="text-xs text-gray-500 mt-0.5">
                  {event.note}
                </Text>
              )}
              <Text className="text-xs text-gray-400 mt-0.5">
                {format(new Date(event.createdAt), 'MMM dd, yyyy HH:mm')}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}
