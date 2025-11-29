import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DeviceProvider, useDevice } from './src/context/DeviceContext';
import SetupScreen from './src/screens/SetupScreen';
import HomeScreen from './src/screens/HomeScreen';
import AppUsageScreen from './src/screens/AppUsageScreen';

const Stack = createNativeStackNavigator();

function LinkedNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="AppUsage" component={AppUsageScreen} />
    </Stack.Navigator>
  );
}

function AppContent() {
  const { isLinked, loading } = useDevice();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
      </View>
    );
  }

  return isLinked ? <LinkedNavigator /> : <SetupScreen />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <DeviceProvider>
          <StatusBar style="dark" />
          <AppContent />
        </DeviceProvider>
      </NavigationContainer>
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
