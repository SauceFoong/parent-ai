import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { childAPI } from '../services/api';
import { getDeviceInfo, registerBackgroundFetch } from '../services/monitoringService';

const DeviceContext = createContext();

export const useDevice = () => {
  const context = useContext(DeviceContext);
  if (!context) {
    throw new Error('useDevice must be used within a DeviceProvider');
  }
  return context;
};

export const DeviceProvider = ({ children }) => {
  const [isLinked, setIsLinked] = useState(false);
  const [childName, setChildName] = useState('');
  const [parentName, setParentName] = useState('');
  const [loading, setLoading] = useState(true);
  const [monitoringActive, setMonitoringActive] = useState(false);

  useEffect(() => {
    checkLinkStatus();
  }, []);

  const checkLinkStatus = async () => {
    try {
      const linked = await AsyncStorage.getItem('isLinked');
      const name = await AsyncStorage.getItem('childName');
      const parent = await AsyncStorage.getItem('parentName');
      
      if (linked === 'true' && name) {
        setIsLinked(true);
        setChildName(name);
        setParentName(parent || '');
        setMonitoringActive(true);
        
        // Start background monitoring
        await registerBackgroundFetch();
      }
    } catch (error) {
      console.log('Error checking link status:', error);
    } finally {
      setLoading(false);
    }
  };

  const linkDevice = async (pairingCode, name) => {
    try {
      const deviceInfo = await getDeviceInfo();
      
      const response = await childAPI.linkDevice(pairingCode, {
        ...deviceInfo,
        childName: name,
      });
      
      if (response.data.success) {
        await AsyncStorage.setItem('isLinked', 'true');
        await AsyncStorage.setItem('childName', name);
        await AsyncStorage.setItem('parentName', response.data.parentName || '');
        await AsyncStorage.setItem('parentToken', response.data.token);
        await AsyncStorage.setItem('deviceToken', response.data.deviceToken || deviceInfo.deviceId);
        
        setIsLinked(true);
        setChildName(name);
        setParentName(response.data.parentName || '');
        setMonitoringActive(true);
        
        // Start background monitoring
        await registerBackgroundFetch();
        
        return { success: true };
      }
      
      return { success: false, message: response.data.message };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to link device';
      return { success: false, message };
    }
  };

  const unlinkDevice = async () => {
    try {
      await AsyncStorage.multiRemove([
        'isLinked',
        'childName',
        'parentName',
        'parentToken',
        'deviceToken',
      ]);
      
      setIsLinked(false);
      setChildName('');
      setParentName('');
      setMonitoringActive(false);
    } catch (error) {
      console.log('Error unlinking device:', error);
    }
  };

  return (
    <DeviceContext.Provider
      value={{
        isLinked,
        childName,
        parentName,
        loading,
        monitoringActive,
        linkDevice,
        unlinkDevice,
        checkLinkStatus,
      }}
    >
      {children}
    </DeviceContext.Provider>
  );
};

