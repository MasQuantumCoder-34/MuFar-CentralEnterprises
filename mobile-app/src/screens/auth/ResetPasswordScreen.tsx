import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import authService from '../../services/authService';
import { COLORS } from '../../constants';
import { useNavigation } from '@react-navigation/native';

export default function ResetPasswordScreen() {
  const navigation = useNavigation();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async () => {
    setError('');
    setSuccess('');
    if (!currentPassword) { setError('Enter current password'); return; }
    if (!newPassword) { setError('Enter new password'); return; }
    if (newPassword.length < 6) { setError('New password must be at least 6 characters'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return; }

    setIsLoading(true);
    try {
      await authService.changePassword(currentPassword, newPassword);
      setSuccess('Password changed successfully');
      setTimeout(() => navigation.goBack(), 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  const renderInput = (
    label: string,
    value: string,
    onChange: (v: string) => void,
    show: boolean,
    toggleShow: () => void,
    placeholder: string
  ) => (
    <View className="mb-4">
      <Text className="text-sm font-medium text-gray-700 mb-1">{label}</Text>
      <View className="flex-row items-center border border-gray-300 rounded-lg bg-gray-50">
        <TextInput
          className="flex-1 px-4 py-3 text-base"
          placeholder={placeholder}
          placeholderTextColor={COLORS.textLight}
          value={value}
          onChangeText={onChange}
          secureTextEntry={!show}
          autoCapitalize="none"
          editable={!isLoading}
        />
        <TouchableOpacity onPress={toggleShow} className="px-3">
          <Ionicons
            name={show ? 'eye-off-outline' : 'eye-outline'}
            size={22}
            color={COLORS.textSecondary}
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerClassName="p-6"
          keyboardShouldPersistTaps="handled"
        >
          <Text className="text-xl font-bold text-gray-800 mb-2">Change Password</Text>
          <Text className="text-sm text-gray-500 mb-6">
            Enter your current password and a new password
          </Text>

          {error ? (
            <View className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">
              <Text className="text-red-700 text-sm">{error}</Text>
            </View>
          ) : null}

          {success ? (
            <View className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 mb-4">
              <Text className="text-green-700 text-sm">{success}</Text>
            </View>
          ) : null}

          {renderInput('Current Password', currentPassword, setCurrentPassword, showCurrent, () => setShowCurrent(!showCurrent), 'Enter current password')}
          {renderInput('New Password', newPassword, setNewPassword, showNew, () => setShowNew(!showNew), 'Enter new password')}
          {renderInput('Confirm New Password', confirmPassword, setConfirmPassword, showConfirm, () => setShowConfirm(!showConfirm), 'Confirm new password')}

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isLoading}
            className={`py-4 rounded-xl mt-2 ${isLoading ? 'bg-primary-300' : 'bg-primary-700'}`}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-center font-bold text-lg">Change Password</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
