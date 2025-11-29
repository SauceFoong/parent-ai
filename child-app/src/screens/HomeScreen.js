import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDevice } from '../context/DeviceContext';
import { 
  sendHeartbeat, 
  isBackgroundFetchRegistered, 
  sendSummaryReport,
  startActivity,
  endActivity,
} from '../services/monitoringService';
import { childAPI } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function HomeScreen() {
  const { childName, parentName, monitoringActive, unlinkDevice } = useDevice();
  const [backgroundActive, setBackgroundActive] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [activityTitle, setActivityTitle] = useState('');
  const [activityType, setActivityType] = useState('video');

  useEffect(() => {
    checkBackgroundStatus();
    handleHeartbeat();
  }, []);

  const checkBackgroundStatus = async () => {
    const isRegistered = await isBackgroundFetchRegistered();
    setBackgroundActive(isRegistered);
  };

  const handleHeartbeat = async () => {
    await sendHeartbeat();
    await sendSummaryReport();
    setLastSync(new Date());
  };

  const handleUnlink = () => {
    Alert.alert(
      'Unlink Device',
      'Are you sure you want to unlink this device? Your parent will need to link it again.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Unlink', 
          style: 'destructive',
          onPress: unlinkDevice,
        },
      ]
    );
  };

  const handleReportActivity = async () => {
    if (!activityTitle.trim()) {
      Alert.alert('Error', 'Please enter what you were doing');
      return;
    }

    try {
      const storedChildName = await AsyncStorage.getItem('childName');
      
      await childAPI.submitActivity({
        childName: storedChildName || childName,
        activityType: activityType,
        contentTitle: activityTitle.trim(),
        contentUrl: null,
        duration: 0,
        timestamp: new Date().toISOString(),
        manualReport: true,
      });

      Alert.alert('Reported!', 'Your activity has been sent to your parent.');
      setShowReportModal(false);
      setActivityTitle('');
      handleHeartbeat();
    } catch (error) {
      Alert.alert('Error', 'Failed to report activity. Please try again.');
    }
  };

  const activityTypes = [
    { id: 'video', label: 'Video', icon: 'videocam' },
    { id: 'game', label: 'Game', icon: 'game-controller' },
    { id: 'web', label: 'Website', icon: 'globe' },
    { id: 'social', label: 'Social', icon: 'chatbubbles' },
    { id: 'app', label: 'Other App', icon: 'apps' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {childName?.charAt(0)?.toUpperCase() || '?'}
            </Text>
          </View>
          <Text style={styles.greeting}>Hi, {childName}! 👋</Text>
          <Text style={styles.subGreeting}>
            Protected by {parentName || 'your parent'}
          </Text>
        </View>

        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={[
              styles.statusIndicator,
              monitoringActive ? styles.statusActive : styles.statusInactive
            ]} />
            <Text style={styles.statusTitle}>
              {monitoringActive ? 'Protection Active' : 'Protection Paused'}
            </Text>
          </View>
          
          <Text style={styles.statusDescription}>
            {monitoringActive 
              ? 'Your device is being monitored to keep you safe online.'
              : 'Monitoring is currently paused.'}
          </Text>

          <View style={styles.statusDetails}>
            <View style={styles.statusItem}>
              <Ionicons 
                name={backgroundActive ? 'checkmark-circle' : 'close-circle'} 
                size={20} 
                color={backgroundActive ? '#48bb78' : '#fc8181'} 
              />
              <Text style={styles.statusItemText}>Background Sync</Text>
            </View>
            
            <View style={styles.statusItem}>
              <Ionicons name="time-outline" size={20} color="#667eea" />
              <Text style={styles.statusItemText}>
                Last sync: {lastSync ? lastSync.toLocaleTimeString() : 'Never'}
              </Text>
            </View>
          </View>
        </View>

        {/* Info Cards */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>What's Being Monitored</Text>
          
          <View style={styles.infoCard}>
            <View style={[styles.infoIcon, { backgroundColor: '#ebf8ff' }]}>
              <Ionicons name="apps-outline" size={24} color="#4299e1" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>App Usage</Text>
              <Text style={styles.infoDescription}>
                Which apps you use and for how long
              </Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <View style={[styles.infoIcon, { backgroundColor: '#faf5ff' }]}>
              <Ionicons name="globe-outline" size={24} color="#9f7aea" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Web Activity</Text>
              <Text style={styles.infoDescription}>
                Websites you visit in the browser
              </Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <View style={[styles.infoIcon, { backgroundColor: '#fff5f5' }]}>
              <Ionicons name="videocam-outline" size={24} color="#fc8181" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Video Content</Text>
              <Text style={styles.infoDescription}>
                Videos you watch on YouTube and other platforms
              </Text>
            </View>
          </View>
        </View>

        {/* Report Activity Button */}
        <TouchableOpacity 
          style={styles.reportButton} 
          onPress={() => setShowReportModal(true)}
        >
          <Ionicons name="add-circle" size={22} color="#fff" />
          <Text style={styles.reportButtonText}>Report What I'm Doing</Text>
        </TouchableOpacity>

        {/* Sync Button */}
        <TouchableOpacity style={styles.syncButton} onPress={handleHeartbeat}>
          <Ionicons name="sync-outline" size={20} color="#667eea" />
          <Text style={styles.syncButtonText}>Sync Now</Text>
        </TouchableOpacity>

        {/* Unlink Button */}
        <TouchableOpacity style={styles.unlinkButton} onPress={handleUnlink}>
          <Ionicons name="unlink-outline" size={18} color="#fc8181" />
          <Text style={styles.unlinkButtonText}>Unlink Device</Text>
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footer}>
          <Ionicons name="heart" size={16} color="#fc8181" />
          <Text style={styles.footerText}>
            Keeping you safe online
          </Text>
        </View>
      </ScrollView>

      {/* Report Activity Modal */}
      <Modal
        visible={showReportModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowReportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>What are you doing?</Text>
              <TouchableOpacity onPress={() => setShowReportModal(false)}>
                <Ionicons name="close" size={24} color="#718096" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Activity Type</Text>
            <View style={styles.typeSelector}>
              {activityTypes.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.typeButton,
                    activityType === type.id && styles.typeButtonActive,
                  ]}
                  onPress={() => setActivityType(type.id)}
                >
                  <Ionicons 
                    name={type.icon} 
                    size={20} 
                    color={activityType === type.id ? '#fff' : '#667eea'} 
                  />
                  <Text style={[
                    styles.typeButtonText,
                    activityType === type.id && styles.typeButtonTextActive,
                  ]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.modalLabel}>What are you watching/playing?</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g., YouTube - Minecraft videos"
              placeholderTextColor="#a0aec0"
              value={activityTitle}
              onChangeText={setActivityTitle}
            />

            <TouchableOpacity 
              style={styles.submitButton}
              onPress={handleReportActivity}
            >
              <Text style={styles.submitButtonText}>Send to Parent</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4ff',
  },
  content: {
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
  },
  greeting: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1a202c',
    marginBottom: 4,
  },
  subGreeting: {
    fontSize: 15,
    color: '#718096',
  },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  statusActive: {
    backgroundColor: '#48bb78',
  },
  statusInactive: {
    backgroundColor: '#fc8181',
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a202c',
  },
  statusDescription: {
    fontSize: 14,
    color: '#718096',
    lineHeight: 20,
    marginBottom: 16,
  },
  statusDetails: {
    borderTopWidth: 1,
    borderTopColor: '#f0f4ff',
    paddingTop: 16,
    gap: 10,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusItemText: {
    fontSize: 14,
    color: '#4a5568',
  },
  infoSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a202c',
    marginBottom: 16,
  },
  infoCard: {
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
  infoIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a202c',
    marginBottom: 2,
  },
  infoDescription: {
    fontSize: 13,
    color: '#718096',
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#48bb78',
    borderRadius: 14,
    height: 54,
    gap: 10,
    marginBottom: 12,
    shadowColor: '#48bb78',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  reportButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    height: 50,
    gap: 8,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#667eea',
  },
  syncButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#667eea',
  },
  unlinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    gap: 6,
    marginBottom: 24,
  },
  unlinkButtonText: {
    fontSize: 14,
    color: '#fc8181',
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingBottom: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#a0aec0',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a202c',
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4a5568',
    marginBottom: 12,
  },
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#f0f4ff',
    gap: 6,
  },
  typeButtonActive: {
    backgroundColor: '#667eea',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#667eea',
  },
  typeButtonTextActive: {
    color: '#fff',
  },
  modalInput: {
    backgroundColor: '#f7fafc',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1a202c',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  submitButton: {
    backgroundColor: '#667eea',
    borderRadius: 14,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },
});

