import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Pressable,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';

const { width } = Dimensions.get('window');

export default function ScreenTimeScreen({ navigation, route }) {
  const { childName } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState(null);
  const [selectedDays, setSelectedDays] = useState(7);

  useEffect(() => {
    loadData();
  }, [childName, selectedDays]);

  const loadData = async () => {
    try {
      const endpoint = childName 
        ? `/child/app-usage/${encodeURIComponent(childName)}?days=${selectedDays}`
        : `/child/app-usage?days=${selectedDays}`;
      
      const response = await api.get(endpoint);
      
      if (response.data.success) {
        setData(response.data);
      }
    } catch (error) {
      console.log('Failed to load screen time data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [childName, selectedDays]);

  const formatTime = (ms) => {
    if (!ms || ms < 0) return '0m';
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getAppIcon = (packageName) => {
    const icons = {
      'com.google.android.youtube': 'logo-youtube',
      'com.instagram.android': 'logo-instagram',
      'com.facebook.katana': 'logo-facebook',
      'com.twitter.android': 'logo-twitter',
      'com.zhiliaoapp.musically': 'musical-notes',
      'com.snapchat.android': 'camera',
      'com.whatsapp': 'logo-whatsapp',
      'com.discord': 'chatbubbles',
    };
    return icons[packageName] || 'apps';
  };

  const getAppColor = (packageName) => {
    const colors = {
      'com.google.android.youtube': '#FF0000',
      'com.instagram.android': '#E4405F',
      'com.facebook.katana': '#1877F2',
      'com.twitter.android': '#1DA1F2',
      'com.zhiliaoapp.musically': '#000000',
      'com.snapchat.android': '#FFFC00',
      'com.whatsapp': '#25D366',
      'com.discord': '#5865F2',
    };
    return colors[packageName] || '#667eea';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
      </View>
    );
  }

  // For single child view
  const renderChildDetail = () => (
    <>
      {/* Total Screen Time Card */}
      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total Screen Time ({selectedDays} days)</Text>
        <Text style={styles.totalTime}>{formatTime(data?.totalScreenTime)}</Text>
        <View style={styles.averageRow}>
          <Ionicons name="trending-up" size={16} color="rgba(255,255,255,0.8)" />
          <Text style={styles.averageText}>
            ~{formatTime(data?.averageDaily)} daily average
          </Text>
        </View>
      </View>

      {/* Daily Chart */}
      {data?.dailyData && data.dailyData.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daily Usage</Text>
          <View style={styles.chartContainer}>
            {data.dailyData.slice(-7).map((day, index) => {
              const maxTime = Math.max(...data.dailyData.map(d => d.totalTime));
              const height = maxTime > 0 ? (day.totalTime / maxTime) * 100 : 0;
              const isHighUsage = day.totalTime > 4 * 60 * 60 * 1000; // > 4 hours
              
              return (
                <View key={day.date} style={styles.barContainer}>
                  <Text style={styles.barTime}>{formatTime(day.totalTime)}</Text>
                  <View 
                    style={[
                      styles.bar, 
                      { height: Math.max(height, 10) },
                      isHighUsage && styles.barHighUsage,
                    ]} 
                  />
                  <Text style={styles.barLabel}>
                    {new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Top Apps */}
      {data?.topApps && data.topApps.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Most Used Apps</Text>
          {data.topApps.map((app, index) => {
            const percentage = data.totalScreenTime > 0 
              ? Math.round((app.totalTime / data.totalScreenTime) * 100) 
              : 0;
            
            return (
              <View key={app.packageName} style={styles.appCard}>
                <View style={styles.appRank}>
                  <Text style={styles.appRankText}>{index + 1}</Text>
                </View>
                <View style={[styles.appIcon, { backgroundColor: `${getAppColor(app.packageName)}20` }]}>
                  <Ionicons 
                    name={getAppIcon(app.packageName)} 
                    size={22} 
                    color={getAppColor(app.packageName)} 
                  />
                </View>
                <View style={styles.appInfo}>
                  <Text style={styles.appName}>{app.appName || app.packageName}</Text>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${percentage}%` }]} />
                  </View>
                </View>
                <View style={styles.appTime}>
                  <Text style={styles.appTimeText}>{formatTime(app.totalTime)}</Text>
                  <Text style={styles.appPercentage}>{percentage}%</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </>
  );

  // For all children overview
  const renderAllChildren = () => (
    <>
      {data?.children && data.children.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Screen Time by Child</Text>
          {data.children.map((child) => (
            <TouchableOpacity
              key={child.childName}
              style={styles.childCard}
              onPress={() => navigation.push('ScreenTime', { childName: child.childName })}
            >
              <View style={styles.childAvatar}>
                <Text style={styles.childAvatarText}>
                  {child.childName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.childInfo}>
                <Text style={styles.childName}>{child.childName}</Text>
                <Text style={styles.childApps}>
                  {child.topApps.slice(0, 3).map(a => a.appName).join(', ')}
                </Text>
              </View>
              <View style={styles.childTime}>
                <Text style={styles.childTimeText}>{formatTime(child.totalScreenTime)}</Text>
                <Ionicons name="chevron-forward" size={18} color="#a0aec0" />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="phone-portrait-outline" size={64} color="#cbd5e0" />
          <Text style={styles.emptyTitle}>No Screen Time Data</Text>
          <Text style={styles.emptyText}>
            Screen time data will appear here once your child's device starts reporting.
          </Text>
        </View>
      )}
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable 
          onPress={() => navigation.goBack()} 
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color="#1a202c" />
        </Pressable>
        <Text style={styles.title}>
          {childName ? `${childName}'s Screen Time` : 'Screen Time'}
        </Text>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
          <Ionicons name="refresh" size={22} color="#667eea" />
        </TouchableOpacity>
      </View>

      {/* Time Range Selector */}
      <View style={styles.timeRangeContainer}>
        {[1, 7, 14, 30].map((days) => (
          <TouchableOpacity
            key={days}
            style={[
              styles.timeRangeButton,
              selectedDays === days && styles.timeRangeButtonActive,
            ]}
            onPress={() => setSelectedDays(days)}
          >
            <Text style={[
              styles.timeRangeText,
              selectedDays === days && styles.timeRangeTextActive,
            ]}>
              {days === 1 ? 'Today' : `${days}d`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {childName ? renderChildDetail() : renderAllChildren()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
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
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a202c',
  },
  refreshButton: {
    padding: 8,
  },
  timeRangeContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    gap: 8,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f0f4ff',
    alignItems: 'center',
  },
  timeRangeButtonActive: {
    backgroundColor: '#667eea',
  },
  timeRangeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#667eea',
  },
  timeRangeTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
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
  averageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  averageText: {
    fontSize: 14,
    color: '#fff',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a202c',
    marginBottom: 16,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    height: 180,
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
  },
  barTime: {
    fontSize: 10,
    color: '#718096',
    marginBottom: 4,
  },
  bar: {
    width: 24,
    backgroundColor: '#667eea',
    borderRadius: 4,
    minHeight: 10,
  },
  barHighUsage: {
    backgroundColor: '#e74c3c',
  },
  barLabel: {
    fontSize: 11,
    color: '#718096',
    marginTop: 8,
  },
  appCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  appRank: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f0f4ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  appRankText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#667eea',
  },
  appIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  appInfo: {
    flex: 1,
  },
  appName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a202c',
    marginBottom: 6,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#667eea',
    borderRadius: 3,
  },
  appTime: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  appTimeText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a202c',
  },
  appPercentage: {
    fontSize: 12,
    color: '#718096',
    marginTop: 2,
  },
  childCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  childAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  childAvatarText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
  },
  childInfo: {
    flex: 1,
  },
  childName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a202c',
    marginBottom: 2,
  },
  childApps: {
    fontSize: 13,
    color: '#718096',
  },
  childTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  childTimeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#667eea',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a202c',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 20,
  },
});

