import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';

export default function SettingsScreen() {
  const { user, logout, updateUser } = useAuth();
  const [settings, setSettings] = useState(user?.settings || {});

  const handleToggle = async (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    try {
      await authAPI.updateSettings(newSettings);
      await updateUser();
    } catch (error) {
      Alert.alert('Error', 'Failed to update settings');
      // Revert on error
      setSettings(settings);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', onPress: logout, style: 'destructive' },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Name</Text>
            <Text style={styles.value}>{user?.name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{user?.email}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Monitoring Settings</Text>
        <View style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Enable Monitoring</Text>
              <Text style={styles.settingDescription}>
                Monitor children's device activity
              </Text>
            </View>
            <Switch
              value={settings.monitoringEnabled}
              onValueChange={(value) => handleToggle('monitoringEnabled', value)}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Push Notifications</Text>
              <Text style={styles.settingDescription}>
                Receive alerts for inappropriate content
              </Text>
            </View>
            <Switch
              value={settings.notificationsEnabled}
              onValueChange={(value) => handleToggle('notificationsEnabled', value)}
            />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Content Thresholds</Text>
        <Text style={styles.sectionSubtitle}>
          Adjust sensitivity levels (0-100%)
        </Text>
        <View style={styles.card}>
          <View style={styles.thresholdRow}>
            <Text style={styles.thresholdLabel}>Violence Detection</Text>
            <Text style={styles.thresholdValue}>
              {Math.round(settings.violenceThreshold * 100)}%
            </Text>
          </View>
          <Text style={styles.thresholdHint}>
            Lower values = more sensitive
          </Text>

          <View style={styles.thresholdRow}>
            <Text style={styles.thresholdLabel}>Inappropriate Content</Text>
            <Text style={styles.thresholdValue}>
              {Math.round(settings.inappropriateThreshold * 100)}%
            </Text>
          </View>

          <View style={styles.thresholdRow}>
            <Text style={styles.thresholdLabel}>Adult Content</Text>
            <Text style={styles.thresholdValue}>
              {Math.round(settings.adultContentThreshold * 100)}%
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Version</Text>
            <Text style={styles.value}>1.0.0</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>App Name</Text>
            <Text style={styles.value}>Parent AI</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  section: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  label: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  settingInfo: {
    flex: 1,
    marginRight: 15,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 3,
  },
  settingDescription: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  thresholdRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  thresholdLabel: {
    fontSize: 16,
    color: '#2c3e50',
  },
  thresholdValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3498db',
  },
  thresholdHint: {
    fontSize: 12,
    color: '#95a5a6',
    marginTop: 5,
    fontStyle: 'italic',
  },
  logoutButton: {
    backgroundColor: '#e74c3c',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

