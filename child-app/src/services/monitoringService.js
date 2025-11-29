import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import * as Application from 'expo-application';
import { childAPI } from './api';

const BACKGROUND_FETCH_TASK = 'background-monitoring-task';
const HEARTBEAT_INTERVAL = 5 * 60 * 1000; // 5 minutes

// Device info helper
export const getDeviceInfo = async () => {
  return {
    deviceId: await Application.getIosIdForVendorAsync() || Device.deviceName,
    deviceName: Device.deviceName,
    deviceType: Device.deviceType,
    osName: Device.osName,
    osVersion: Device.osVersion,
    brand: Device.brand,
    modelName: Device.modelName,
    isDevice: Device.isDevice,
  };
};

// Track current app/activity
let currentActivity = null;
let activityStartTime = null;

export const startActivity = (activityType, contentTitle, contentUrl = null) => {
  currentActivity = {
    activityType,
    contentTitle,
    contentUrl,
    startTime: new Date().toISOString(),
  };
  activityStartTime = Date.now();
};

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
  } catch (error) {
    console.log('Failed to submit activity:', error.message);
    // Store locally for later sync
    await storeOfflineActivity({
      ...currentActivity,
      duration,
      childName,
    });
  }
  
  currentActivity = null;
  activityStartTime = null;
};

// Offline storage for activities when network is unavailable
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

// Sync offline activities when network is available
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
      batteryLevel: null, // Could add battery info
    });
  } catch (error) {
    console.log('Heartbeat failed:', error.message);
  }
};

// Define the background task
TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    // Send heartbeat
    await sendHeartbeat();
    
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
    await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
      minimumInterval: 15 * 60, // 15 minutes (minimum allowed)
      stopOnTerminate: false,
      startOnBoot: true,
    });
    console.log('Background fetch registered');
  } catch (error) {
    console.log('Failed to register background fetch:', error);
  }
};

// Unregister background fetch
export const unregisterBackgroundFetch = async () => {
  try {
    await BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
    console.log('Background fetch unregistered');
  } catch (error) {
    console.log('Failed to unregister background fetch:', error);
  }
};

// Check if background fetch is registered
export const isBackgroundFetchRegistered = async () => {
  return await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK);
};

