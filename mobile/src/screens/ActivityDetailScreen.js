import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Pressable,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';

const { width } = Dimensions.get('window');

export default function ActivityDetailScreen({ navigation, route }) {
  const { activity } = route.params || {};
  const [loading, setLoading] = useState(false);
  const [fullActivity, setFullActivity] = useState(activity);

  useEffect(() => {
    if (activity?.id) {
      loadActivityDetails();
    }
  }, [activity?.id]);

  const loadActivityDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/monitoring/activity/${activity.id}`);
      if (response.data.success) {
        setFullActivity(response.data.activity);
      }
    } catch (error) {
      console.log('Failed to load activity details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'video': return 'videocam';
      case 'game': return 'game-controller';
      case 'web': return 'globe';
      case 'app': return 'apps';
      case 'social': return 'chatbubbles';
      case 'unmonitored': return 'eye-off';
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
      case 'unmonitored': return '#95a5a6';
      default: return '#95a5a6';
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return 'N/A';
    if (seconds < 60) return `${seconds} seconds`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const getSeverityColor = (score) => {
    if (score >= 0.7) return '#e74c3c';
    if (score >= 0.4) return '#f39c12';
    return '#2ecc71';
  };

  const getSeverityLabel = (score) => {
    if (score >= 0.7) return 'High Risk';
    if (score >= 0.4) return 'Medium Risk';
    return 'Safe';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
      </View>
    );
  }

  const aiAnalysis = fullActivity?.aiAnalysis;

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
        <Text style={styles.title}>Activity Details</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Activity Header Card */}
        <View style={styles.activityCard}>
          <View style={styles.activityHeader}>
            <View style={[
              styles.activityIconContainer,
              { backgroundColor: `${getActivityColor(fullActivity?.activityType)}20` }
            ]}>
              <Ionicons 
                name={getActivityIcon(fullActivity?.activityType)} 
                size={28} 
                color={getActivityColor(fullActivity?.activityType)} 
              />
            </View>
            <View style={styles.activityInfo}>
              <Text style={styles.activityTitle} numberOfLines={2}>
                {fullActivity?.contentTitle || 'Unknown Activity'}
              </Text>
              <Text style={styles.activityType}>
                {fullActivity?.activityType?.toUpperCase() || 'UNKNOWN'}
              </Text>
            </View>
            {fullActivity?.flagged && (
              <View style={styles.flaggedBadge}>
                <Ionicons name="warning" size={16} color="#fff" />
              </View>
            )}
          </View>

          {/* Meta Info */}
          <View style={styles.metaContainer}>
            <View style={styles.metaItem}>
              <Ionicons name="person" size={16} color="#718096" />
              <Text style={styles.metaText}>{fullActivity?.childName || 'Unknown'}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="time" size={16} color="#718096" />
              <Text style={styles.metaText}>{formatTime(fullActivity?.timestamp)}</Text>
            </View>
            {fullActivity?.duration > 0 && (
              <View style={styles.metaItem}>
                <Ionicons name="hourglass" size={16} color="#718096" />
                <Text style={styles.metaText}>{formatDuration(fullActivity?.duration)}</Text>
              </View>
            )}
          </View>

          {/* URL if available */}
          {fullActivity?.contentUrl && (
            <View style={styles.urlContainer}>
              <Ionicons name="link" size={14} color="#667eea" />
              <Text style={styles.urlText} numberOfLines={1}>
                {fullActivity.contentUrl}
              </Text>
            </View>
          )}
        </View>

        {/* Screenshot Section */}
        {fullActivity?.screenshotUrl && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Screenshot</Text>
            <View style={styles.screenshotContainer}>
              <Image 
                source={{ uri: fullActivity.screenshotUrl }}
                style={styles.screenshot}
                resizeMode="contain"
              />
            </View>
          </View>
        )}

        {/* AI Analysis Section */}
        {aiAnalysis && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>AI Analysis</Text>
            
            {/* Summary */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <Ionicons name="bulb" size={20} color="#667eea" />
                <Text style={styles.summaryTitle}>Summary</Text>
              </View>
              <Text style={styles.summaryText}>
                {aiAnalysis.summary || 'No summary available'}
              </Text>
              
              {aiAnalysis.reason && (
                <View style={styles.reasonContainer}>
                  <Ionicons name="alert-circle" size={16} color="#e74c3c" />
                  <Text style={styles.reasonText}>{aiAnalysis.reason}</Text>
                </View>
              )}
            </View>

            {/* Safety Scores */}
            <View style={styles.scoresCard}>
              <Text style={styles.scoresTitle}>Safety Scores</Text>
              
              <View style={styles.scoreRow}>
                <View style={styles.scoreLabel}>
                  <Ionicons name="skull" size={18} color="#e74c3c" />
                  <Text style={styles.scoreLabelText}>Violence</Text>
                </View>
                <View style={styles.scoreBarContainer}>
                  <View 
                    style={[
                      styles.scoreBar, 
                      { 
                        width: `${(aiAnalysis.violenceScore || 0) * 100}%`,
                        backgroundColor: getSeverityColor(aiAnalysis.violenceScore || 0)
                      }
                    ]} 
                  />
                </View>
                <Text style={[
                  styles.scoreValue,
                  { color: getSeverityColor(aiAnalysis.violenceScore || 0) }
                ]}>
                  {Math.round((aiAnalysis.violenceScore || 0) * 100)}%
                </Text>
              </View>

              <View style={styles.scoreRow}>
                <View style={styles.scoreLabel}>
                  <Ionicons name="eye-off" size={18} color="#9b59b6" />
                  <Text style={styles.scoreLabelText}>Adult Content</Text>
                </View>
                <View style={styles.scoreBarContainer}>
                  <View 
                    style={[
                      styles.scoreBar, 
                      { 
                        width: `${(aiAnalysis.adultContentScore || 0) * 100}%`,
                        backgroundColor: getSeverityColor(aiAnalysis.adultContentScore || 0)
                      }
                    ]} 
                  />
                </View>
                <Text style={[
                  styles.scoreValue,
                  { color: getSeverityColor(aiAnalysis.adultContentScore || 0) }
                ]}>
                  {Math.round((aiAnalysis.adultContentScore || 0) * 100)}%
                </Text>
              </View>

              <View style={styles.scoreRow}>
                <View style={styles.scoreLabel}>
                  <Ionicons name="warning" size={18} color="#f39c12" />
                  <Text style={styles.scoreLabelText}>Inappropriate</Text>
                </View>
                <View style={styles.scoreBarContainer}>
                  <View 
                    style={[
                      styles.scoreBar, 
                      { 
                        width: `${(aiAnalysis.inappropriateScore || 0) * 100}%`,
                        backgroundColor: getSeverityColor(aiAnalysis.inappropriateScore || 0)
                      }
                    ]} 
                  />
                </View>
                <Text style={[
                  styles.scoreValue,
                  { color: getSeverityColor(aiAnalysis.inappropriateScore || 0) }
                ]}>
                  {Math.round((aiAnalysis.inappropriateScore || 0) * 100)}%
                </Text>
              </View>
            </View>

            {/* Detected Categories */}
            {aiAnalysis.detectedCategories && aiAnalysis.detectedCategories.length > 0 && (
              <View style={styles.categoriesCard}>
                <Text style={styles.categoriesTitle}>Detected Categories</Text>
                <View style={styles.categoriesContainer}>
                  {aiAnalysis.detectedCategories.map((category, index) => (
                    <View key={index} style={styles.categoryBadge}>
                      <Text style={styles.categoryText}>{category}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Confidence */}
            {aiAnalysis.confidence && (
              <View style={styles.confidenceContainer}>
                <Text style={styles.confidenceText}>
                  AI Confidence: {Math.round(aiAnalysis.confidence * 100)}%
                </Text>
              </View>
            )}
          </View>
        )}

        {/* No AI Analysis Message */}
        {!aiAnalysis && (
          <View style={styles.noAnalysisCard}>
            <Ionicons name="analytics-outline" size={48} color="#cbd5e0" />
            <Text style={styles.noAnalysisTitle}>No AI Analysis</Text>
            <Text style={styles.noAnalysisText}>
              This activity was not analyzed by AI. This could be because no screenshot was captured or the AI service was unavailable.
            </Text>
          </View>
        )}

        <View style={styles.spacer} />
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
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  activityCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  activityIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a202c',
    marginBottom: 4,
  },
  activityType: {
    fontSize: 12,
    fontWeight: '600',
    color: '#718096',
    letterSpacing: 1,
  },
  flaggedBadge: {
    backgroundColor: '#e74c3c',
    borderRadius: 20,
    padding: 8,
  },
  metaContainer: {
    borderTopWidth: 1,
    borderTopColor: '#f0f4ff',
    paddingTop: 12,
    gap: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    fontSize: 14,
    color: '#4a5568',
  },
  urlContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 10,
    backgroundColor: '#f0f4ff',
    borderRadius: 8,
    gap: 8,
  },
  urlText: {
    flex: 1,
    fontSize: 13,
    color: '#667eea',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a202c',
    marginBottom: 12,
  },
  screenshotContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  screenshot: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a202c',
  },
  summaryText: {
    fontSize: 15,
    color: '#4a5568',
    lineHeight: 22,
  },
  reasonContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
    padding: 12,
    backgroundColor: '#fff5f5',
    borderRadius: 10,
    gap: 8,
  },
  reasonText: {
    flex: 1,
    fontSize: 14,
    color: '#e74c3c',
    lineHeight: 20,
  },
  scoresCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  scoresTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a202c',
    marginBottom: 16,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  scoreLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 120,
    gap: 8,
  },
  scoreLabelText: {
    fontSize: 13,
    color: '#4a5568',
  },
  scoreBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  scoreBar: {
    height: '100%',
    borderRadius: 4,
  },
  scoreValue: {
    width: 40,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
  },
  categoriesCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  categoriesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a202c',
    marginBottom: 12,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryBadge: {
    backgroundColor: '#fff5f5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#fed7d7',
  },
  categoryText: {
    fontSize: 13,
    color: '#e74c3c',
    fontWeight: '500',
  },
  confidenceContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  confidenceText: {
    fontSize: 12,
    color: '#a0aec0',
  },
  noAnalysisCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  noAnalysisTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a202c',
    marginTop: 16,
    marginBottom: 8,
  },
  noAnalysisText: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 20,
  },
  spacer: {
    height: 40,
  },
});

