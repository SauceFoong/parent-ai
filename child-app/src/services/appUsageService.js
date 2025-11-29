import { Platform, NativeModules, Linking, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { childAPI } from './api';

// Check if native module is available (only in dev builds, not Expo Go)
const UsageStatsModule = NativeModules.UsageStatsModule;

/**
 * App Usage Tracking Service
 * 
 * On Android: Uses UsageStatsManager (requires permission)
 * On iOS: Limited - uses app state changes and manual reporting
 */

// Storage keys
const LAST_USAGE_SYNC = 'lastUsageSync';
const CACHED_USAGE_DATA = 'cachedUsageData';

/**
 * Check if usage stats permission is granted (Android only)
 */
export const checkUsageStatsPermission = async () => {
  if (Platform.OS !== 'android') {
    return { granted: false, available: false, reason: 'iOS does not support UsageStats API' };
  }
  
  // In Expo Go, native modules aren't available
  if (!UsageStatsModule) {
    return { 
      granted: false, 
      available: false, 
      reason: 'Native module not available. Build with expo-dev-client to enable.' 
    };
  }
  
  try {
    const hasPermission = await UsageStatsModule.hasUsageStatsPermission();
    return { granted: hasPermission, available: true };
  } catch (error) {
    console.log('Error checking usage stats permission:', error);
    return { granted: false, available: false, reason: error.message };
  }
};

/**
 * Request usage stats permission (opens settings on Android)
 */
export const requestUsageStatsPermission = async () => {
  if (Platform.OS !== 'android') {
    Alert.alert(
      'Not Available',
      'Screen time tracking requires iOS Screen Time API which needs Family Sharing setup.',
      [{ text: 'OK' }]
    );
    return false;
  }
  
  if (!UsageStatsModule) {
    Alert.alert(
      'Development Build Required',
      'To enable app usage tracking, you need to build the app with expo-dev-client instead of using Expo Go.\n\nRun: npx expo run:android',
      [{ text: 'OK' }]
    );
    return false;
  }
  
  try {
    // Open Android usage access settings
    await UsageStatsModule.openUsageAccessSettings();
    return true;
  } catch (error) {
    // Fallback: try to open settings via Linking
    try {
      await Linking.openSettings();
      Alert.alert(
        'Enable Usage Access',
        'Please find "Usage Access" or "App Usage" in settings and enable it for Parent AI Child app.',
        [{ text: 'OK' }]
      );
      return true;
    } catch (e) {
      console.log('Error opening settings:', e);
      return false;
    }
  }
};

/**
 * Get app usage stats for a time range (Android only)
 */
export const getAppUsageStats = async (startTime, endTime) => {
  if (Platform.OS !== 'android' || !UsageStatsModule) {
    // Return mock data or cached data for non-Android/Expo Go
    return getMockUsageData();
  }
  
  try {
    const stats = await UsageStatsModule.getUsageStats(startTime, endTime);
    return stats;
  } catch (error) {
    console.log('Error getting usage stats:', error);
    return [];
  }
};

/**
 * Get currently running app (Android only)
 */
export const getCurrentApp = async () => {
  if (Platform.OS !== 'android' || !UsageStatsModule) {
    return null;
  }
  
  try {
    const currentApp = await UsageStatsModule.getCurrentApp();
    return currentApp;
  } catch (error) {
    console.log('Error getting current app:', error);
    return null;
  }
};

/**
 * Sync app usage data to backend
 */
export const syncAppUsageToBackend = async () => {
  try {
    const childName = await AsyncStorage.getItem('childName');
    const deviceToken = await AsyncStorage.getItem('deviceToken');
    
    if (!childName || !deviceToken) {
      console.log('Not linked, skipping usage sync');
      return;
    }
    
    // Get last sync time
    const lastSyncStr = await AsyncStorage.getItem(LAST_USAGE_SYNC);
    const lastSync = lastSyncStr ? parseInt(lastSyncStr) : Date.now() - 24 * 60 * 60 * 1000; // Default to 24h ago
    const now = Date.now();
    
    // Get usage stats since last sync
    const usageStats = await getAppUsageStats(lastSync, now);
    
    if (usageStats && usageStats.length > 0) {
      // Send to backend
      await childAPI.submitAppUsage({
        childName,
        deviceId: deviceToken,
        timestamp: new Date().toISOString(),
        periodStart: new Date(lastSync).toISOString(),
        periodEnd: new Date(now).toISOString(),
        apps: usageStats,
      });
      
      // Update last sync time
      await AsyncStorage.setItem(LAST_USAGE_SYNC, now.toString());
      
      console.log(`Synced ${usageStats.length} app usage records`);
    }
    
    return usageStats;
  } catch (error) {
    console.log('Error syncing app usage:', error);
    return null;
  }
};

/**
 * Get mock usage data (for testing in Expo Go)
 */
const getMockUsageData = () => {
  return [
    {
      packageName: 'com.google.android.youtube',
      appName: 'YouTube',
      totalTimeInForeground: 45 * 60 * 1000, // 45 minutes
      lastTimeUsed: Date.now() - 10 * 60 * 1000,
    },
    {
      packageName: 'com.instagram.android',
      appName: 'Instagram',
      totalTimeInForeground: 30 * 60 * 1000, // 30 minutes
      lastTimeUsed: Date.now() - 60 * 60 * 1000,
    },
    {
      packageName: 'com.zhiliaoapp.musically',
      appName: 'TikTok',
      totalTimeInForeground: 60 * 60 * 1000, // 60 minutes
      lastTimeUsed: Date.now() - 2 * 60 * 60 * 1000,
    },
  ];
};

/**
 * Format milliseconds to readable time
 */
export const formatUsageTime = (ms) => {
  if (!ms || ms < 0) return '0m';
  
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

/**
 * Get app category based on package name
 */
export const getAppCategory = (packageName) => {
  const categories = {
    // Video
    'com.google.android.youtube': 'video',
    'com.netflix.mediaclient': 'video',
    'com.disney.disneyplus': 'video',
    
    // Social
    'com.instagram.android': 'social',
    'com.facebook.katana': 'social',
    'com.twitter.android': 'social',
    'com.snapchat.android': 'social',
    'com.zhiliaoapp.musically': 'social', // TikTok
    
    // Games
    'com.supercell.clashofclans': 'game',
    'com.mojang.minecraftpe': 'game',
    'com.roblox.client': 'game',
    
    // Messaging
    'com.whatsapp': 'messaging',
    'org.telegram.messenger': 'messaging',
    'com.discord': 'messaging',
    
    // Education
    'com.google.android.apps.classroom': 'education',
    'com.duolingo': 'education',
    'com.khanacademy': 'education',
  };
  
  return categories[packageName] || 'other';
};

/**
 * Check if app is potentially concerning for children
 */
export const isAppConcerning = (packageName, totalTime) => {
  const concerningApps = [
    'com.zhiliaoapp.musically', // TikTok
    'com.instagram.android',
    'com.snapchat.android',
    'com.twitter.android',
  ];
  
  // Flag if concerning app used for more than 1 hour
  if (concerningApps.includes(packageName) && totalTime > 60 * 60 * 1000) {
    return true;
  }
  
  // Flag any app used for more than 3 hours
  if (totalTime > 3 * 60 * 60 * 1000) {
    return true;
  }
  
  return false;
};

