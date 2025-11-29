import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';

export default function LinkDeviceScreen({ navigation }) {
  const [code, setCode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expiresIn, setExpiresIn] = useState(0);
  const [devices, setDevices] = useState([]);

  useEffect(() => {
    loadDevices();
  }, []);

  useEffect(() => {
    let timer;
    if (expiresIn > 0) {
      timer = setInterval(() => {
        setExpiresIn(prev => {
          if (prev <= 1) {
            setCode(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [expiresIn]);

  const loadDevices = async () => {
    try {
      const response = await api.get('/child/devices');
      if (response.data.success) {
        setDevices(response.data.devices);
      }
    } catch (error) {
      console.log('Failed to load devices:', error);
    }
  };

  const generateCode = async () => {
    setLoading(true);
    try {
      const response = await api.post('/child/generate-code');
      if (response.data.success) {
        setCode(response.data.code);
        setExpiresIn(response.data.expiresIn);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to generate pairing code');
    } finally {
      setLoading(false);
    }
  };

  const unlinkDevice = async (deviceId) => {
    Alert.alert(
      'Unlink Device',
      'Are you sure you want to unlink this device?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unlink',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/child/devices/${deviceId}`);
              loadDevices();
            } catch (error) {
              Alert.alert('Error', 'Failed to unlink device');
            }
          },
        },
      ]
    );
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1a202c" />
          </TouchableOpacity>
          <Text style={styles.title}>Link Child Device</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Instructions */}
        <View style={styles.instructionsCard}>
          <View style={styles.instructionIcon}>
            <Ionicons name="phone-portrait-outline" size={32} color="#667eea" />
          </View>
          <Text style={styles.instructionsTitle}>How to Link</Text>
          <Text style={styles.instructionsText}>
            1. Install "Parent AI Child" app on your child's device{'\n'}
            2. Generate a pairing code below{'\n'}
            3. Enter the code on your child's device
          </Text>
        </View>

        {/* Pairing Code Section */}
        <View style={styles.codeSection}>
          {code ? (
            <View style={styles.codeCard}>
              <Text style={styles.codeLabel}>Pairing Code</Text>
              <Text style={styles.code}>{code}</Text>
              <View style={styles.timerRow}>
                <Ionicons name="time-outline" size={16} color="#718096" />
                <Text style={styles.timer}>Expires in {formatTime(expiresIn)}</Text>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.generateButton}
              onPress={generateCode}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="key-outline" size={24} color="#fff" />
                  <Text style={styles.generateButtonText}>Generate Pairing Code</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Linked Devices */}
        <View style={styles.devicesSection}>
          <Text style={styles.sectionTitle}>Linked Devices ({devices.length})</Text>
          
          {devices.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="phone-portrait-outline" size={48} color="#cbd5e0" />
              <Text style={styles.emptyText}>No devices linked yet</Text>
            </View>
          ) : (
            devices.map((device) => (
              <View key={device.id} style={styles.deviceCard}>
                <View style={styles.deviceIcon}>
                  <Ionicons 
                    name={device.osName === 'iOS' ? 'logo-apple' : 'logo-android'} 
                    size={24} 
                    color="#667eea" 
                  />
                </View>
                <View style={styles.deviceInfo}>
                  <Text style={styles.deviceName}>{device.childName}</Text>
                  <Text style={styles.deviceDetails}>
                    {device.deviceName} • {device.osName}
                  </Text>
                  <View style={styles.statusRow}>
                    <View style={[
                      styles.statusDot,
                      device.isActive ? styles.statusActive : styles.statusInactive
                    ]} />
                    <Text style={styles.statusText}>
                      {device.isActive ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.unlinkButton}
                  onPress={() => unlinkDevice(device.id)}
                >
                  <Ionicons name="trash-outline" size={20} color="#fc8181" />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a202c',
  },
  placeholder: {
    width: 40,
  },
  instructionsCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  instructionIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f0f4ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a202c',
    marginBottom: 12,
  },
  instructionsText: {
    fontSize: 14,
    color: '#718096',
    lineHeight: 22,
    textAlign: 'center',
  },
  codeSection: {
    marginBottom: 32,
  },
  codeCard: {
    backgroundColor: '#667eea',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  codeLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  code: {
    fontSize: 40,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 8,
    marginBottom: 12,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  timer: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#667eea',
    borderRadius: 16,
    height: 60,
    gap: 12,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  generateButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },
  devicesSection: {
    flex: 1,
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
  deviceCard: {
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
  deviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#f0f4ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a202c',
    marginBottom: 2,
  },
  deviceDetails: {
    fontSize: 13,
    color: '#718096',
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusActive: {
    backgroundColor: '#48bb78',
  },
  statusInactive: {
    backgroundColor: '#fc8181',
  },
  statusText: {
    fontSize: 12,
    color: '#718096',
  },
  unlinkButton: {
    padding: 8,
  },
});

