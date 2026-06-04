import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';

interface SearchBarProps extends TextInputProps {
  onSearch: (query: string) => void;
  debounceMs?: number;
}

export default function SearchBar({
  onSearch,
  debounceMs = 400,
  placeholder = 'Search products...',
  ...rest
}: SearchBarProps) {
  const [value, setValue] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = useCallback(
    (text: string) => {
      setValue(text);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        onSearch(text);
      }, debounceMs);
    },
    [onSearch, debounceMs]
  );

  const handleClear = useCallback(() => {
    setValue('');
    onSearch('');
  }, [onSearch]);

  return (
    <View className="flex-row items-center bg-gray-100 rounded-xl px-3 py-2 mx-4 my-2">
      <Ionicons name="search" size={20} color={COLORS.textSecondary} />
      <TextInput
        className="flex-1 ml-2 text-base text-gray-800"
        value={value}
        onChangeText={handleChange}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textLight}
        returnKeyType="search"
        clearButtonMode="never"
        {...rest}
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={handleClear} className="ml-2">
          <Ionicons name="close-circle" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
      )}
    </View>
  );
}
