import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDevice } from '../context/DeviceContext';

export default function SetupScreen() {
  const [step, setStep] = useState(1);
  const [childName, setChildName] = useState('');
  const [pairingCode, setPairingCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { linkDevice } = useDevice();

  const handleNext = () => {
    if (step === 1 && childName.trim()) {
      setStep(2);
    }
  };

  const handleLink = async () => {
    if (!pairingCode.trim()) {
      Alert.alert('Error', 'Please enter the pairing code');
      return;
    }

    setLoading(true);
    const result = await linkDevice(pairingCode.trim(), childName.trim());
    setLoading(false);

    if (!result.success) {
      Alert.alert('Error', result.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="shield-checkmark" size={60} color="#fff" />
          </View>
          <Text style={styles.title}>Parent AI</Text>
          <Text style={styles.subtitle}>Child Device Setup</Text>
        </View>

        {/* Step Indicator */}
        <View style={styles.stepIndicator}>
          <View style={[styles.stepDot, step >= 1 && styles.stepDotActive]} />
          <View style={styles.stepLine} />
          <View style={[styles.stepDot, step >= 2 && styles.stepDotActive]} />
        </View>

        {/* Step 1: Enter Child Name */}
        {step === 1 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>What's your name?</Text>
            <Text style={styles.stepDescription}>
              This helps your parent know which device is yours
            </Text>

            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={22} color="#a0aec0" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your name"
                placeholderTextColor="#a0aec0"
                value={childName}
                onChangeText={setChildName}
                autoCapitalize="words"
              />
            </View>

            <TouchableOpacity
              style={[styles.button, !childName.trim() && styles.buttonDisabled]}
              onPress={handleNext}
              disabled={!childName.trim()}
            >
              <Text style={styles.buttonText}>Continue</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        {/* Step 2: Enter Pairing Code */}
        {step === 2 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Enter Pairing Code</Text>
            <Text style={styles.stepDescription}>
              Ask your parent for the 6-digit code from their Parent AI app
            </Text>

            <View style={styles.inputContainer}>
              <Ionicons name="key-outline" size={22} color="#a0aec0" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.codeInput]}
                placeholder="000000"
                placeholderTextColor="#a0aec0"
                value={pairingCode}
                onChangeText={setPairingCode}
                keyboardType="number-pad"
                maxLength={6}
              />
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setStep(1)}
              >
                <Ionicons name="arrow-back" size={20} color="#667eea" />
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.linkButton, loading && styles.buttonDisabled]}
                onPress={handleLink}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.buttonText}>Link Device</Text>
                    <Ionicons name="link" size={20} color="#fff" />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Ionicons name="lock-closed" size={16} color="#a0aec0" />
          <Text style={styles.footerText}>
            Your activity is monitored for your safety
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4ff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 30,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1a202c',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#718096',
    fontWeight: '500',
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#e2e8f0',
  },
  stepDotActive: {
    backgroundColor: '#667eea',
  },
  stepLine: {
    width: 60,
    height: 3,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 8,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a202c',
    textAlign: 'center',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 15,
    color: '#718096',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 56,
    fontSize: 16,
    color: '#1a202c',
  },
  codeInput: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 8,
    textAlign: 'center',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#667eea',
    borderRadius: 16,
    height: 56,
    gap: 8,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    height: 56,
    paddingHorizontal: 20,
    gap: 6,
    borderWidth: 2,
    borderColor: '#667eea',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#667eea',
  },
  linkButton: {
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  footerText: {
    fontSize: 13,
    color: '#a0aec0',
  },
});

