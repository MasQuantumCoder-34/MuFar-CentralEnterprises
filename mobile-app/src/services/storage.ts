import AsyncStorage from '@react-native-async-storage/async-storage';

export const storage = {
  async getItem(key: string): Promise<string | null> {
    try { return await AsyncStorage.getItem(key); } catch { return null; }
  },

  async setItem(key: string, value: string): Promise<void> {
    try { await AsyncStorage.setItem(key, value); } catch { /* fallback */ }
  },

  async removeItem(key: string): Promise<void> {
    try { await AsyncStorage.removeItem(key); } catch { /* fallback */ }
  },
};
