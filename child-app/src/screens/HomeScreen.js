import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDevice } from '../context/DeviceContext';
import { sendHeartbeat, isBackgroundFetchRegistered } from '../services/monitoringService';

export default function HomeScreen() {
  const { childName, parentName, monitoringActive, unlinkDevice } = useDevice();
  const [backgroundActive, setBackgroundActive] = useState(false);
  const [lastSync, setLastSync] = useState(null);

  useEffect(() => {
    checkBackgroundStatus();
    // Send initial heartbeat
    handleHeartbeat();
  }, []);

  const checkBackgroundStatus = async () => {
    const isRegistered = await isBackgroundFetchRegistered();
    setBackgroundActive(isRegistered);
  };

  const handleHeartbeat = async () => {
    await sendHeartbeat();
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
});

