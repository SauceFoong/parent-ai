import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  checkUsageStatsPermission,
  requestUsageStatsPermission,
  getAppUsageStats,
  syncAppUsageToBackend,
  formatUsageTime,
  getAppCategory,
  isAppConcerning,
} from '../services/appUsageService';

export default function AppUsageScreen({ navigation }) {
  const [permissionStatus, setPermissionStatus] = useState(null);
  const [usageData, setUsageData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [totalScreenTime, setTotalScreenTime] = useState(0);

  useEffect(() => {
    checkPermissionAndLoad();
  }, []);

  const checkPermissionAndLoad = async () => {
    setLoading(true);
    
    const status = await checkUsageStatsPermission();
    setPermissionStatus(status);
    
    if (status.granted || !status.available) {
      await loadUsageData();
    }
    
    setLoading(false);
  };

  const loadUsageData = async () => {
    try {
      // Get last 24 hours
      const endTime = Date.now();
      const startTime = endTime - 24 * 60 * 60 * 1000;
      
      const stats = await getAppUsageStats(startTime, endTime);
      
      // Sort by usage time (descending)
      const sortedStats = stats
        .filter(app => app.totalTimeInForeground > 60000) // Only show apps used > 1 minute
        .sort((a, b) => b.totalTimeInForeground - a.totalTimeInForeground);
      
      setUsageData(sortedStats);
      
      // Calculate total screen time
      const total = sortedStats.reduce((sum, app) => sum + app.totalTimeInForeground, 0);
      setTotalScreenTime(total);
      
      // Sync to backend
      await syncAppUsageToBackend();
    } catch (error) {
      console.log('Error loading usage data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await checkPermissionAndLoad();
    setRefreshing(false);
  };

  const handleRequestPermission = async () => {
    await requestUsageStatsPermission();
    // Check again after user returns from settings
    setTimeout(checkPermissionAndLoad, 1000);
  };

  const getCategoryIcon = (category) => {
    const icons = {
      video: 'videocam',
      social: 'chatbubbles',
      game: 'game-controller',
      messaging: 'chatbox',
      education: 'school',
      other: 'apps',
    };
    return icons[category] || 'apps';
  };

  const getCategoryColor = (category) => {
    const colors = {
      video: '#e74c3c',
      social: '#9b59b6',
      game: '#3498db',
      messaging: '#2ecc71',
      education: '#f39c12',
      other: '#95a5a6',
    };
    return colors[category] || '#95a5a6';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1a202c" />
        </TouchableOpacity>
        <Text style={styles.title}>Screen Time</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
          <Ionicons name="refresh" size={22} color="#667eea" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Permission Required Card */}
        {Platform.OS === 'android' && permissionStatus && !permissionStatus.granted && permissionStatus.available && (
          <View style={styles.permissionCard}>
            <Ionicons name="lock-closed" size={40} color="#667eea" />
            <Text style={styles.permissionTitle}>Permission Required</Text>
            <Text style={styles.permissionText}>
              To track app usage, please enable "Usage Access" permission for this app.
            </Text>
            <TouchableOpacity style={styles.permissionButton} onPress={handleRequestPermission}>
              <Text style={styles.permissionButtonText}>Open Settings</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Not Available Card (Expo Go) */}
        {permissionStatus && !permissionStatus.available && (
          <View style={styles.permissionCard}>
            <Ionicons name="information-circle" size={40} color="#f39c12" />
            <Text style={styles.permissionTitle}>
              {Platform.OS === 'ios' ? 'iOS Limitation' : 'Development Build Required'}
            </Text>
            <Text style={styles.permissionText}>
              {Platform.OS === 'ios' 
                ? 'iOS Screen Time API requires Family Sharing setup and native code integration.'
                : 'App usage tracking requires a development build. The data below is simulated for demo purposes.'}
            </Text>
          </View>
        )}

        {/* Total Screen Time Card */}
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Today's Screen Time</Text>
          <Text style={styles.totalTime}>{formatUsageTime(totalScreenTime)}</Text>
          <View style={styles.totalMeta}>
            <Ionicons name="apps" size={16} color="#718096" />
            <Text style={styles.totalApps}>{usageData.length} apps used</Text>
          </View>
        </View>

        {/* App Usage List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Usage (Last 24h)</Text>
          
          {usageData.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="phone-portrait-outline" size={48} color="#cbd5e0" />
              <Text style={styles.emptyText}>No app usage data available</Text>
            </View>
          ) : (
            usageData.map((app, index) => {
              const category = getAppCategory(app.packageName);
              const concerning = isAppConcerning(app.packageName, app.totalTimeInForeground);
              
              return (
                <View 
                  key={app.packageName || index} 
                  style={[
                    styles.appCard,
                    concerning && styles.appCardConcerning,
                  ]}
                >
                  <View style={[
                    styles.appIcon,
                    { backgroundColor: `${getCategoryColor(category)}20` }
                  ]}>
                    <Ionicons 
                      name={getCategoryIcon(category)} 
                      size={24} 
                      color={getCategoryColor(category)} 
                    />
                  </View>
                  
                  <View style={styles.appInfo}>
                    <View style={styles.appNameRow}>
                      <Text style={styles.appName}>{app.appName || app.packageName}</Text>
                      {concerning && (
                        <Ionicons name="warning" size={16} color="#e74c3c" />
                      )}
                    </View>
                    <Text style={styles.appCategory}>{category}</Text>
                  </View>
                  
                  <View style={styles.appTime}>
                    <Text style={[
                      styles.appTimeText,
                      concerning && styles.appTimeTextConcerning,
                    ]}>
                      {formatUsageTime(app.totalTimeInForeground)}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Info Note */}
        <View style={styles.infoNote}>
          <Ionicons name="information-circle-outline" size={18} color="#718096" />
          <Text style={styles.infoNoteText}>
            This data is automatically shared with your parent to help keep you safe online.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4ff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f4ff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f0f4ff',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a202c',
  },
  refreshButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  permissionCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a202c',
    marginTop: 12,
    marginBottom: 8,
  },
  permissionText: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  permissionButton: {
    backgroundColor: '#667eea',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  totalCard: {
    backgroundColor: '#667eea',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  totalLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  totalTime: {
    fontSize: 48,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
  },
  totalMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  totalApps: {
    fontSize: 14,
    color: '#fff',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a202c',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 15,
    color: '#a0aec0',
    marginTop: 12,
  },
  appCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  appCardConcerning: {
    borderLeftWidth: 4,
    borderLeftColor: '#e74c3c',
  },
  appIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  appInfo: {
    flex: 1,
  },
  appNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  appName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a202c',
  },
  appCategory: {
    fontSize: 13,
    color: '#718096',
    textTransform: 'capitalize',
    marginTop: 2,
  },
  appTime: {
    alignItems: 'flex-end',
  },
  appTimeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a202c',
  },
  appTimeTextConcerning: {
    color: '#e74c3c',
  },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f7fafc',
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  infoNoteText: {
    flex: 1,
    fontSize: 13,
    color: '#718096',
    lineHeight: 18,
  },
});

