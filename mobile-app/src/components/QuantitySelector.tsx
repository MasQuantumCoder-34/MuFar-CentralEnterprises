import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';

interface QuantitySelectorProps {
  quantity: number;
  min?: number;
  max?: number;
  onChange: (quantity: number) => void;
}

export default function QuantitySelector({
  quantity,
  min = 1,
  max = 99,
  onChange,
}: QuantitySelectorProps) {
  const canDecrement = quantity > min;
  const canIncrement = quantity < max;

  return (
    <View className="flex-row items-center border border-gray-300 rounded-lg overflow-hidden">
      <TouchableOpacity
        onPress={() => canDecrement && onChange(quantity - 1)}
        disabled={!canDecrement}
        className={`px-3 py-2 ${canDecrement ? 'bg-gray-50' : 'bg-gray-100'}`}
      >
        <Ionicons
          name="remove"
          size={18}
          color={canDecrement ? COLORS.text : COLORS.textLight}
        />
      </TouchableOpacity>
      <Text className="px-4 py-2 text-base font-semibold min-w-[40px] text-center">
        {quantity}
      </Text>
      <TouchableOpacity
        onPress={() => canIncrement && onChange(quantity + 1)}
        disabled={!canIncrement}
        className={`px-3 py-2 ${canIncrement ? 'bg-gray-50' : 'bg-gray-100'}`}
      >
        <Ionicons
          name="add"
          size={18}
          color={canIncrement ? COLORS.text : COLORS.textLight}
        />
      </TouchableOpacity>
    </View>
  );
}
