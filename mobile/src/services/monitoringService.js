import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import * as ScreenCapture from 'expo-screen-capture';
import { monitoringAPI } from './api';

const MONITORING_TASK = 'CONTENT_MONITORING_TASK';
const BACKGROUND_FETCH_TASK = 'BACKGROUND_CONTENT_CHECK';

class MonitoringService {
  constructor() {
    this.isMonitoring = false;
    this.currentActivity = null;
    this.activityStartTime = null;
  }

  /**
   * Start monitoring a new activity
   */
  async startMonitoring(activityData) {
    try {
      this.isMonitoring = true;
      this.activityStartTime = new Date();
      
      const { childName, activityType, contentTitle, contentDescription, appName, url } = activityData;

      // Capture screenshot (if permission granted)
      let screenshot = null;
      try {
        const hasPermission = await ScreenCapture.requestPermissionsAsync();
        if (hasPermission.granted) {
          // Note: In production, you'd implement actual screenshot capture
          // This is a simplified version
          console.log('Screenshot capture enabled');
        }
      } catch (error) {
        console.log('Screenshot capture not available:', error);
      }

      // Submit activity to backend for analysis
      const response = await monitoringAPI.submitActivity({
        childName,
        activityType,
        contentTitle,
        contentDescription,
        appName,
        url,
        screenshot,
      });

      this.currentActivity = response.data.activity;
      
      return {
        success: true,
        activity: this.currentActivity,
      };
    } catch (error) {
      console.error('Error starting monitoring:', error);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * Stop monitoring current activity
   */
  async stopMonitoring() {
    try {
      if (this.currentActivity && this.activityStartTime) {
        const duration = Math.floor((new Date() - this.activityStartTime) / 1000);
        
        // Update activity duration
        await monitoringAPI.updateDuration(this.currentActivity.id, duration);
      }

      this.isMonitoring = false;
      this.currentActivity = null;
      this.activityStartTime = null;

      return { success: true };
    } catch (error) {
      console.error('Error stopping monitoring:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Get current monitoring status
   */
  getStatus() {
    return {
      isMonitoring: this.isMonitoring,
      currentActivity: this.currentActivity,
      duration: this.activityStartTime 
        ? Math.floor((new Date() - this.activityStartTime) / 1000)
        : 0,
    };
  }

  /**
   * Register background monitoring task
   */
  async registerBackgroundTask() {
    try {
      // Define the background task
      TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
        try {
          // Check if monitoring is active and update duration
          if (this.isMonitoring && this.currentActivity) {
            const duration = Math.floor((new Date() - this.activityStartTime) / 1000);
            await monitoringAPI.updateDuration(this.currentActivity.id, duration);
          }

          return BackgroundFetch.BackgroundFetchResult.NewData;
        } catch (error) {
          return BackgroundFetch.BackgroundFetchResult.Failed;
        }
      });

      // Register the task
      await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
        minimumInterval: 60, // Check every minute
        stopOnTerminate: false,
        startOnBoot: true,
      });

      console.log('Background monitoring task registered');
      return true;
    } catch (error) {
      console.error('Error registering background task:', error);
      return false;
    }
  }

  /**
   * Unregister background monitoring task
   */
  async unregisterBackgroundTask() {
    try {
      await BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
      console.log('Background monitoring task unregistered');
      return true;
    } catch (error) {
      console.error('Error unregistering background task:', error);
      return false;
    }
  }
}

export default new MonitoringService();

