import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import * as Application from 'expo-application';
import { AppState } from 'react-native';
import { childAPI } from './api';

const BACKGROUND_FETCH_TASK = 'background-monitoring-task';
const SUMMARY_INTERVAL = 60 * 1000; // 1 minute for summary reports

// Activity tracking state
let currentActivity = null;
let activityStartTime = null;
let summaryInterval = null;
let appStateSubscription = null;

// Device info helper
export const getDeviceInfo = async () => {
  let deviceId;
  try {
    deviceId = await Application.getIosIdForVendorAsync();
  } catch (e) {
    deviceId = Device.deviceName;
  }
  
  return {
    deviceId: deviceId || Device.deviceName || 'unknown-device',
    deviceName: Device.deviceName || 'Unknown Device',
    deviceType: Device.deviceType,
    osName: Device.osName || 'Unknown',
    osVersion: Device.osVersion || 'Unknown',
    brand: Device.brand || 'Unknown',
    modelName: Device.modelName || 'Unknown',
    isDevice: Device.isDevice,
  };
};

// Start tracking an activity
export const startActivity = (activityType, contentTitle, contentUrl = null) => {
  currentActivity = {
    activityType,
    contentTitle,
    contentUrl,
    startTime: new Date().toISOString(),
  };
  activityStartTime = Date.now();
  console.log('Activity started:', contentTitle);
};

// End current activity and submit
export const endActivity = async () => {
  if (!currentActivity) return;
  
  const duration = Math.floor((Date.now() - activityStartTime) / 1000);
  const childName = await AsyncStorage.getItem('childName');
  
  try {
    await childAPI.submitActivity({
      childName: childName || 'Unknown',
      activityType: currentActivity.activityType,
      contentTitle: currentActivity.contentTitle,
      contentUrl: currentActivity.contentUrl,
      duration,
      timestamp: currentActivity.startTime,
    });
    console.log('Activity submitted:', currentActivity.contentTitle);
  } catch (error) {
    console.log('Failed to submit activity:', error.message);
    await storeOfflineActivity({
      ...currentActivity,
      duration,
      childName,
    });
  }
  
  currentActivity = null;
  activityStartTime = null;
};

// Store activity locally when offline
const storeOfflineActivity = async (activity) => {
  try {
    const stored = await AsyncStorage.getItem('offlineActivities');
    const activities = stored ? JSON.parse(stored) : [];
    activities.push(activity);
    await AsyncStorage.setItem('offlineActivities', JSON.stringify(activities));
  } catch (error) {
    console.log('Failed to store offline activity:', error);
  }
};

// Sync offline activities
export const syncOfflineActivities = async () => {
  try {
    const stored = await AsyncStorage.getItem('offlineActivities');
    if (!stored) return;
    
    const activities = JSON.parse(stored);
    const failedActivities = [];
    
    for (const activity of activities) {
      try {
        await childAPI.submitActivity(activity);
      } catch (error) {
        failedActivities.push(activity);
      }
    }
    
    if (failedActivities.length > 0) {
      await AsyncStorage.setItem('offlineActivities', JSON.stringify(failedActivities));
    } else {
      await AsyncStorage.removeItem('offlineActivities');
    }
  } catch (error) {
    console.log('Failed to sync offline activities:', error);
  }
};

// Send heartbeat to parent
export const sendHeartbeat = async () => {
  try {
    const deviceInfo = await getDeviceInfo();
    const childName = await AsyncStorage.getItem('childName');
    
    await childAPI.sendHeartbeat({
      ...deviceInfo,
      childName,
      timestamp: new Date().toISOString(),
    });
    console.log('Heartbeat sent successfully');
    return true;
  } catch (error) {
    console.log('Heartbeat failed:', error.message);
    return false;
  }
};

// Send activity summary report (called every minute)
export const sendSummaryReport = async () => {
  try {
    const childName = await AsyncStorage.getItem('childName');
    const deviceToken = await AsyncStorage.getItem('deviceToken');
    
    if (!childName || !deviceToken) {
      console.log('Not linked, skipping summary');
      return;
    }

    const deviceInfo = await getDeviceInfo();
    
    // Get current app state
    const appState = AppState.currentState;
    
    // Create summary report
    const summary = {
      childName,
      deviceId: deviceToken,
      timestamp: new Date().toISOString(),
      appState: appState, // 'active', 'background', 'inactive'
      currentActivity: currentActivity ? {
        type: currentActivity.activityType,
        title: currentActivity.contentTitle,
        duration: activityStartTime ? Math.floor((Date.now() - activityStartTime) / 1000) : 0,
      } : null,
      deviceInfo: {
        deviceName: deviceInfo.deviceName,
        osName: deviceInfo.osName,
        osVersion: deviceInfo.osVersion,
      },
    };

    await childAPI.submitSummary(summary);
    console.log('Summary report sent:', new Date().toLocaleTimeString());
    return true;
  } catch (error) {
    console.log('Summary report failed:', error.message);
    return false;
  }
};

// Start the summary reporting interval (every minute)
export const startSummaryReporting = () => {
  if (summaryInterval) {
    clearInterval(summaryInterval);
  }
  
  // Send initial summary
  sendSummaryReport();
  
  // Then send every minute
  summaryInterval = setInterval(() => {
    sendSummaryReport();
  }, SUMMARY_INTERVAL);
  
  console.log('Summary reporting started (every 1 minute)');
};

// Stop summary reporting
export const stopSummaryReporting = () => {
  if (summaryInterval) {
    clearInterval(summaryInterval);
    summaryInterval = null;
  }
  console.log('Summary reporting stopped');
};

// Monitor app state changes
export const startAppStateMonitoring = () => {
  if (appStateSubscription) {
    appStateSubscription.remove();
  }
  
  appStateSubscription = AppState.addEventListener('change', async (nextAppState) => {
    console.log('App state changed to:', nextAppState);
    
    if (nextAppState === 'active') {
      // App came to foreground
      startActivity('app', 'Parent AI Child App');
    } else if (nextAppState === 'background') {
      // App went to background
      await endActivity();
    }
  });
  
  // Start with current state
  if (AppState.currentState === 'active') {
    startActivity('app', 'Parent AI Child App');
  }
  
  console.log('App state monitoring started');
};

// Stop app state monitoring
export const stopAppStateMonitoring = () => {
  if (appStateSubscription) {
    appStateSubscription.remove();
    appStateSubscription = null;
  }
};

// Define the background task
TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    console.log('Background fetch running...');
    
    // Send heartbeat
    await sendHeartbeat();
    
    // Send summary
    await sendSummaryReport();
    
    // Sync any offline activities
    await syncOfflineActivities();
    
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.log('Background task error:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// Register background fetch
export const registerBackgroundFetch = async () => {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK);
    
    if (!isRegistered) {
      await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
        minimumInterval: 60, // 1 minute (iOS may throttle this)
        stopOnTerminate: false,
        startOnBoot: true,
      });
      console.log('Background fetch registered');
    } else {
      console.log('Background fetch already registered');
    }
    
    // Also start foreground monitoring
    startSummaryReporting();
    startAppStateMonitoring();
    
    return true;
  } catch (error) {
    console.log('Failed to register background fetch:', error);
    // Still start foreground monitoring even if background fails
    startSummaryReporting();
    startAppStateMonitoring();
    return false;
  }
};

// Unregister background fetch
export const unregisterBackgroundFetch = async () => {
  try {
    stopSummaryReporting();
    stopAppStateMonitoring();
    
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK);
    if (isRegistered) {
      await BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
    }
    console.log('Background fetch unregistered');
  } catch (error) {
    console.log('Failed to unregister background fetch:', error);
  }
};

// Check if background fetch is registered
export const isBackgroundFetchRegistered = async () => {
  try {
    return await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK);
  } catch (error) {
    return false;
  }
};

