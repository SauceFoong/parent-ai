import AsyncStorage from '@react-native-async-storage/async-storage';

// Clear all AsyncStorage data
AsyncStorage.clear()
  .then(() => console.log('✅ AsyncStorage cleared successfully'))
  .catch((error) => console.log('Error clearing storage:', error));


