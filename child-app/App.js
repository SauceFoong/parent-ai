import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DeviceProvider, useDevice } from './src/context/DeviceContext';
import SetupScreen from './src/screens/SetupScreen';
import HomeScreen from './src/screens/HomeScreen';

function AppContent() {
  const { isLinked, loading } = useDevice();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
      </View>
    );
  }

  return isLinked ? <HomeScreen /> : <SetupScreen />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <DeviceProvider>
        <StatusBar style="dark" />
        <AppContent />
      </DeviceProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f4ff',
  },
});
