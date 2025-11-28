import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { monitoringAPI } from '../services/api';

export default function ActivitiesScreen() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // all, flagged, safe

  useEffect(() => {
    loadActivities();
  }, [filter]);

  const loadActivities = async () => {
    try {
      const params = {
        limit: 50,
        skip: 0,
      };

      if (filter === 'flagged') {
        params.flagged = true;
      }

      const response = await monitoringAPI.getActivities(params);
      setActivities(response.data.activities);
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadActivities();
  };

  const getSeverityColor = (analysis) => {
    const maxScore = Math.max(
      analysis.violenceScore || 0,
      analysis.adultContentScore || 0,
      analysis.inappropriateScore || 0
    );

    if (maxScore >= 0.8) return '#e74c3c';
    if (maxScore >= 0.6) return '#f39c12';
    return '#2ecc71';
  };

  const renderActivity = ({ item }) => {
    const severityColor = getSeverityColor(item.aiAnalysis);

    return (
      <View style={styles.activityCard}>
        <View style={[styles.statusIndicator, { backgroundColor: severityColor }]} />
        
        <View style={styles.activityContent}>
          <View style={styles.activityHeader}>
            <Text style={styles.activityTitle} numberOfLines={1}>
              {item.contentTitle}
            </Text>
            <Text style={styles.activityType}>{item.activityType}</Text>
          </View>

          <Text style={styles.childName}>👤 {item.childName}</Text>

          {item.aiAnalysis.summary && (
            <Text style={styles.summary} numberOfLines={2}>
              {item.aiAnalysis.summary}
            </Text>
          )}

          {item.aiAnalysis.detectedCategories?.length > 0 && (
            <View style={styles.categoriesContainer}>
              {item.aiAnalysis.detectedCategories.map((category, index) => (
                <View key={index} style={styles.categoryTag}>
                  <Text style={styles.categoryText}>{category}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.activityFooter}>
            <Text style={styles.timestamp}>
              {new Date(item.timestamp).toLocaleString()}
            </Text>
            {item.duration > 0 && (
              <Text style={styles.duration}>
                ⏱️ {Math.floor(item.duration / 60)}m {item.duration % 60}s
              </Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            All
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, filter === 'flagged' && styles.filterTabActive]}
          onPress={() => setFilter('flagged')}
        >
          <Text style={[styles.filterText, filter === 'flagged' && styles.filterTextActive]}>
            Flagged
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, filter === 'safe' && styles.filterTabActive]}
          onPress={() => setFilter('safe')}
        >
          <Text style={[styles.filterText, filter === 'safe' && styles.filterTextActive]}>
            Safe
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={activities}
        renderItem={renderActivity}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No activities found</Text>
          </View>
        }
      />
    </View>
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
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginHorizontal: 5,
    borderRadius: 20,
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: '#3498db',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7f8c8d',
  },
  filterTextActive: {
    color: '#fff',
  },
  listContent: {
    padding: 15,
  },
  activityCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 15,
    marginBottom: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statusIndicator: {
    width: 5,
  },
  activityContent: {
    flex: 1,
    padding: 15,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  activityTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginRight: 10,
  },
  activityType: {
    fontSize: 12,
    color: '#fff',
    backgroundColor: '#95a5a6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    textTransform: 'capitalize',
  },
  childName: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 8,
  },
  summary: {
    fontSize: 14,
    color: '#555',
    marginBottom: 10,
    lineHeight: 20,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  categoryTag: {
    backgroundColor: '#fee',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    marginRight: 5,
    marginBottom: 5,
  },
  categoryText: {
    fontSize: 12,
    color: '#e74c3c',
    fontWeight: '600',
  },
  activityFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timestamp: {
    fontSize: 12,
    color: '#95a5a6',
  },
  duration: {
    fontSize: 12,
    color: '#3498db',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#95a5a6',
  },
});

