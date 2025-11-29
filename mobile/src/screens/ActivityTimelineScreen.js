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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';

export default function ActivityTimelineScreen({ navigation, route }) {
  const { childName } = route.params || {};
  const [summaries, setSummaries] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState(60); // minutes

  useEffect(() => {
    loadSummaries();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadSummaries, 30000);
    return () => clearInterval(interval);
  }, [childName, timeRange]);

  const loadSummaries = async () => {
    try {
      const endpoint = childName 
        ? `/child/summaries/${encodeURIComponent(childName)}?minutes=${timeRange}`
        : `/child/summaries?limit=100`;
      
      const response = await api.get(endpoint);
      
      if (response.data.success) {
        if (childName) {
          setTimeline(response.data.timeline || []);
        }
        setSummaries(response.data.summaries || []);
      }
    } catch (error) {
      console.log('Failed to load summaries:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadSummaries();
  }, [childName, timeRange]);

  const getActivityIcon = (type) => {
    switch (type) {
      case 'video': return 'videocam';
      case 'game': return 'game-controller';
      case 'web': return 'globe';
      case 'app': return 'apps';
      case 'social': return 'chatbubbles';
      default: return 'ellipse';
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'video': return '#e74c3c';
      case 'game': return '#9b59b6';
      case 'web': return '#3498db';
      case 'app': return '#2ecc71';
      case 'social': return '#f39c12';
      default: return '#95a5a6';
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds || seconds < 60) return `${seconds || 0}s`;
    const mins = Math.floor(seconds / 60);
    return `${mins}m`;
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
        <Pressable 
          onPress={() => navigation.goBack()} 
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color="#1a202c" />
        </Pressable>
        <Text style={styles.title}>
          {childName ? `${childName}'s Activity` : 'All Activity'}
        </Text>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
          <Ionicons name="refresh" size={22} color="#667eea" />
        </TouchableOpacity>
      </View>

      {/* Time Range Selector */}
      <View style={styles.timeRangeContainer}>
        {[15, 30, 60, 120].map((mins) => (
          <TouchableOpacity
            key={mins}
            style={[
              styles.timeRangeButton,
              timeRange === mins && styles.timeRangeButtonActive,
            ]}
            onPress={() => setTimeRange(mins)}
          >
            <Text style={[
              styles.timeRangeText,
              timeRange === mins && styles.timeRangeTextActive,
            ]}>
              {mins < 60 ? `${mins}m` : `${mins / 60}h`}
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
        {/* Stats Card */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{summaries.length}</Text>
            <Text style={styles.statLabel}>Reports</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{timeRange}m</Text>
            <Text style={styles.statLabel}>Time Range</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons 
              name={summaries.length > 0 ? "checkmark-circle" : "alert-circle"} 
              size={24} 
              color={summaries.length > 0 ? "#48bb78" : "#fc8181"} 
            />
            <Text style={styles.statLabel}>
              {summaries.length > 0 ? 'Active' : 'No Data'}
            </Text>
          </View>
        </View>

        {/* Timeline */}
        {timeline.length > 0 ? (
          <View style={styles.timelineSection}>
            <Text style={styles.sectionTitle}>Activity Timeline</Text>
            
            {timeline.map((item, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.timelineItem}
                onPress={() => {
                  // Find the corresponding summary with full data
                  const fullSummary = summaries.find(s => s.timestamp === item.timestamp);
                  navigation.navigate('ActivityDetail', { 
                    activity: {
                      ...item,
                      ...fullSummary,
                      contentTitle: item.activity,
                      activityType: item.type,
                    }
                  });
                }}
                activeOpacity={0.7}
              >
                <View style={styles.timelineLeft}>
                  <Text style={styles.timelineTime}>{item.time}</Text>
                  <View style={[
                    styles.timelineDot,
                    { backgroundColor: getActivityColor(item.type) }
                  ]} />
                  {index < timeline.length - 1 && (
                    <View style={styles.timelineLine} />
                  )}
                </View>
                
                <View style={styles.timelineContent}>
                  <View style={styles.timelineCard}>
                    <View style={[
                      styles.activityIconContainer,
                      { backgroundColor: `${getActivityColor(item.type)}20` }
                    ]}>
                      <Ionicons 
                        name={getActivityIcon(item.type)} 
                        size={20} 
                        color={getActivityColor(item.type)} 
                      />
                    </View>
                    <View style={styles.activityInfo}>
                      <Text style={styles.activityTitle} numberOfLines={1}>
                        {item.activity}
                      </Text>
                      <View style={styles.activityMeta}>
                        <Text style={styles.activityType}>{item.type}</Text>
                        {item.duration > 0 && (
                          <Text style={styles.activityDuration}>
                            • {formatDuration(item.duration)}
                          </Text>
                        )}
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#cbd5e0" />
                    <View style={[
                      styles.appStateBadge,
                      item.appState === 'active' ? styles.appStateActive : styles.appStateBackground
                    ]}>
                      <Text style={styles.appStateText}>
                        {item.appState === 'active' ? '●' : '○'}
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="time-outline" size={64} color="#cbd5e0" />
            <Text style={styles.emptyTitle}>No Activity Yet</Text>
            <Text style={styles.emptyText}>
              Activity summaries will appear here once the child's device starts reporting.
            </Text>
          </View>
        )}

        {/* Raw Summaries (for debugging) */}
        {summaries.length > 0 && !childName && (
          <View style={styles.summariesSection}>
            <Text style={styles.sectionTitle}>Recent Reports</Text>
            {summaries.slice(0, 20).map((summary, index) => (
              <TouchableOpacity 
                key={summary.id || index}
                style={styles.summaryCard}
                onPress={() => navigation.navigate('ActivityTimeline', { childName: summary.childName })}
              >
                <View style={styles.summaryHeader}>
                  <Text style={styles.summaryChildName}>{summary.childName}</Text>
                  <Text style={styles.summaryTime}>
                    {new Date(summary.timestamp).toLocaleTimeString()}
                  </Text>
                </View>
                <Text style={styles.summaryActivity}>
                  {summary.currentActivity?.title || 'Idle'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
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
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1a202c',
  },
  statLabel: {
    fontSize: 12,
    color: '#718096',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 16,
  },
  timelineSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a202c',
    marginBottom: 16,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 0,
  },
  timelineLeft: {
    width: 70,
    alignItems: 'center',
  },
  timelineTime: {
    fontSize: 11,
    color: '#718096',
    marginBottom: 8,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    zIndex: 1,
  },
  timelineLine: {
    position: 'absolute',
    top: 38,
    width: 2,
    height: 60,
    backgroundColor: '#e2e8f0',
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 16,
  },
  timelineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  activityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a202c',
    marginBottom: 2,
  },
  activityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityType: {
    fontSize: 12,
    color: '#718096',
    textTransform: 'capitalize',
  },
  activityDuration: {
    fontSize: 12,
    color: '#718096',
    marginLeft: 4,
  },
  appStateBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  appStateActive: {
    backgroundColor: '#c6f6d5',
  },
  appStateBackground: {
    backgroundColor: '#fed7d7',
  },
  appStateText: {
    fontSize: 10,
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
  summariesSection: {
    marginTop: 8,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  summaryChildName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#667eea',
  },
  summaryTime: {
    fontSize: 12,
    color: '#718096',
  },
  summaryActivity: {
    fontSize: 13,
    color: '#4a5568',
  },
});

