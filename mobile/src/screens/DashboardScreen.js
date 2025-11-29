import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { monitoringAPI } from '../services/api';
import { Ionicons } from '@expo/vector-icons';

export default function DashboardScreen({ navigation }) {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      loadStats();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadStats = async () => {
    try {
      const response = await monitoringAPI.getStats({
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date().toISOString(),
      });
      setStats(response.data.stats);
    } catch (error) {
      console.log('Error loading stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadStats();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4facfe" />
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" />
      <View style={styles.headerBackground} />
      
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, {user?.name?.split(' ')[0]} 👋</Text>
            <Text style={styles.subtitle}>Overview for the last 7 days</Text>
          </View>
          <TouchableOpacity style={styles.profileButton} onPress={() => navigation.navigate('Settings')}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase()}</Text>
            </View>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
          }
        >
          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, styles.cardElevation]}>
              <View style={[styles.iconContainer, { backgroundColor: '#e3f2fd' }]}>
                <Ionicons name="time-outline" size={24} color="#4facfe" />
              </View>
              <Text style={styles.statNumber}>{stats?.totalActivities || 0}</Text>
              <Text style={styles.statLabel}>Total Activities</Text>
            </View>

            <View style={[styles.statCard, styles.cardElevation]}>
              <View style={[styles.iconContainer, { backgroundColor: '#e8f5e9' }]}>
                <Ionicons name="shield-checkmark-outline" size={24} color="#2ecc71" />
              </View>
              <Text style={[styles.statNumber, { color: '#2ecc71' }]}>{stats?.safeActivities || 0}</Text>
              <Text style={styles.statLabel}>Safe Content</Text>
            </View>

            <View style={[styles.statCard, styles.cardElevation]}>
              <View style={[styles.iconContainer, { backgroundColor: '#ffebee' }]}>
                <Ionicons name="alert-circle-outline" size={24} color="#e74c3c" />
              </View>
              <Text style={[styles.statNumber, { color: '#e74c3c' }]}>{stats?.flaggedActivities || 0}</Text>
              <Text style={styles.statLabel}>Flagged Content</Text>
            </View>

            <View style={[styles.statCard, styles.cardElevation]}>
              <View style={[styles.iconContainer, { backgroundColor: '#fff3e0' }]}>
                <Ionicons name="analytics-outline" size={24} color="#f39c12" />
              </View>
              <Text style={[styles.statNumber, { color: '#f39c12' }]}>{stats?.flagRate || 0}%</Text>
              <Text style={styles.statLabel}>Flag Rate</Text>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionButtonsRow}>
              <TouchableOpacity
                style={[styles.actionButton, styles.cardElevation]}
                onPress={() => navigation.navigate('LinkDevice')}
              >
                <View style={[styles.actionIcon, { backgroundColor: '#667eea' }]}>
                  <Ionicons name="phone-portrait-outline" size={24} color="#fff" />
                </View>
                <Text style={styles.actionText}>Link Device</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.cardElevation]}
                onPress={() => navigation.navigate('Settings')}
              >
                <View style={[styles.actionIcon, { backgroundColor: '#a0a0a0' }]}>
                  <Ionicons name="settings-outline" size={24} color="#fff" />
                </View>
                <Text style={styles.actionText}>Settings</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Recent Alerts */}
          {stats?.recentFlags && stats.recentFlags.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Alerts</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
                  <Text style={styles.seeAllLink}>See All</Text>
                </TouchableOpacity>
              </View>
              
              {stats.recentFlags.map((flag, index) => (
                <View key={flag._id || index} style={[styles.alertCard, styles.cardElevation]}>
                  <View style={styles.alertSeverityBar} />
                  <View style={styles.alertContentWrapper}>
                    <View style={styles.alertHeader}>
                      <Text style={styles.alertTitle}>{flag.contentTitle || 'Unknown Content'}</Text>
                      <Text style={styles.alertTime}>
                        {new Date(flag.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                    <Text style={styles.alertChild}>Child: {flag.childName}</Text>
                    <Text style={styles.alertSummary} numberOfLines={2}>
                      {flag.aiAnalysis?.summary || 'Content flagged as inappropriate.'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Children List */}
          {user?.children && user.children.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Your Children</Text>
              <View style={[styles.childrenCard, styles.cardElevation]}>
                {user.children.map((child, index) => (
                  <View key={index} style={[
                    styles.childItem,
                    index === user.children.length - 1 && styles.lastChildItem
                  ]}>
                    <View style={styles.childAvatarLarge}>
                      <Text style={styles.childAvatarTextLarge}>
                        {child.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.childInfo}>
                      <Text style={styles.childName}>{child.name}</Text>
                      <Text style={styles.childAge}>{child.age} years old</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#ccc" />
                  </View>
                ))}
              </View>
            </View>
          )}
          
          <View style={styles.spacer} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 280,
    backgroundColor: '#4facfe',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 30,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
  },
  profileButton: {
    padding: 4,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  cardElevation: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#2c3e50',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#95a5a6',
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
  },
  seeAllLink: {
    color: '#4facfe',
    fontSize: 14,
    fontWeight: '600',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  actionButton: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    flexDirection: 'row',
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2c3e50',
  },
  alertCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  alertSeverityBar: {
    width: 6,
    backgroundColor: '#e74c3c',
  },
  alertContentWrapper: {
    flex: 1,
    padding: 16,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2c3e50',
    flex: 1,
    marginRight: 8,
  },
  alertTime: {
    fontSize: 12,
    color: '#95a5a6',
  },
  alertChild: {
    fontSize: 13,
    color: '#4facfe',
    fontWeight: '600',
    marginBottom: 4,
  },
  alertSummary: {
    fontSize: 13,
    color: '#7f8c8d',
    lineHeight: 18,
  },
  childrenCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 8,
  },
  childItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  lastChildItem: {
    borderBottomWidth: 0,
  },
  childAvatarLarge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  childAvatarTextLarge: {
    fontSize: 20,
    fontWeight: '800',
    color: '#4facfe',
  },
  childInfo: {
    flex: 1,
  },
  childName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2c3e50',
  },
  childAge: {
    fontSize: 14,
    color: '#95a5a6',
    marginTop: 2,
  },
  spacer: {
    height: 40,
  },
});
