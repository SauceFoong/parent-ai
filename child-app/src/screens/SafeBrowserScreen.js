import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { captureRef } from 'react-native-view-shot';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { childAPI } from '../services/api';
import { enterSafeBrowser, exitSafeBrowser } from '../services/monitoringService';

const SCREENSHOT_INTERVAL = 60 * 1000; // Take screenshot every 60 seconds (was 30)
const MIN_SCREENSHOT_GAP = 10 * 1000; // Minimum 10 seconds between screenshots

export default function SafeBrowserScreen({ navigation }) {
  const [url, setUrl] = useState('https://www.google.com');
  const [inputUrl, setInputUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentTitle, setCurrentTitle] = useState('');
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  
  const webViewRef = useRef(null);
  const viewShotRef = useRef(null);
  const screenshotInterval = useRef(null);
  const lastScreenshotTime = useRef(0); // Track last screenshot time
  const isCapturing = useRef(false); // Prevent concurrent captures

  useEffect(() => {
    // Notify monitoring service that we're in Safe Browser
    enterSafeBrowser();
    
    // Start periodic screenshots after initial load
    screenshotInterval.current = setInterval(() => {
      // First update the title, then capture
      updatePageTitle();
      setTimeout(() => captureAndSendScreenshot(), 500);
    }, SCREENSHOT_INTERVAL);
    
    return () => {
      // Notify monitoring service that we're leaving Safe Browser
      exitSafeBrowser();
      
      if (screenshotInterval.current) {
        clearInterval(screenshotInterval.current);
      }
    };
  }, []);
  
  const updatePageTitle = () => {
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        (function() {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'pageInfo',
            title: document.title,
            url: window.location.href
          }));
        })();
        true;
      `);
    }
  };

  // Store the latest page info from WebView
  const latestPageInfo = useRef({ title: '', url: '' });
  
  const captureAndSendScreenshot = async (force = false) => {
    try {
      // Prevent concurrent captures
      if (isCapturing.current) {
        console.log('Screenshot capture already in progress, skipping');
        return;
      }
      
      // Check minimum gap between screenshots (unless forced)
      const now = Date.now();
      if (!force && (now - lastScreenshotTime.current) < MIN_SCREENSHOT_GAP) {
        console.log('Too soon since last screenshot, skipping');
        return;
      }
      
      if (!viewShotRef.current || !webViewRef.current) return;
      
      isCapturing.current = true;
      lastScreenshotTime.current = now;
      
      // First, get the CURRENT page title and URL directly from WebView
      // Wait a moment for the JS to execute and update latestPageInfo
      await new Promise((resolve) => {
        webViewRef.current.injectJavaScript(`
          (function() {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'captureInfo',
              title: document.title,
              url: window.location.href
            }));
          })();
          true;
        `);
        // Give it 300ms to get the response
        setTimeout(resolve, 300);
      });
      
      // Capture screenshot
      const uri = await captureRef(viewShotRef, {
        format: 'jpg',
        quality: 0.5, // Lower quality to reduce size
        result: 'base64',
      });

      const childName = await AsyncStorage.getItem('childName');
      
      // Use the latest page info (updated by captureInfo message)
      // Fall back to state if not available
      const currentUrl = latestPageInfo.current.url || url;
      let title = latestPageInfo.current.title || currentTitle;
      
      // If still no title, extract from URL
      if (!title || title.trim() === '') {
        try {
          const urlObj = new URL(currentUrl);
          title = urlObj.hostname.replace('www.', '').replace('m.', '');
          
          // Add path info for context
          if (urlObj.pathname && urlObj.pathname !== '/') {
            const pathPart = urlObj.pathname.split('/').filter(p => p).slice(0, 2).join('/');
            if (pathPart) {
              title = `${title}/${pathPart}`;
            }
          }
        } catch (e) {
          title = currentUrl;
        }
      }
      
      // Send to backend for AI analysis
      await childAPI.submitActivity({
        childName: childName || 'Unknown',
        activityType: 'web',
        contentTitle: title,
        contentUrl: currentUrl,
        screenshot: uri, // Base64 image
        timestamp: new Date().toISOString(),
      });

      console.log('Screenshot captured and sent:', title, 'URL:', currentUrl);
    } catch (error) {
      console.log('Screenshot capture failed:', error.message);
    } finally {
      isCapturing.current = false;
    }
  };

  const handleNavigate = () => {
    let newUrl = inputUrl.trim();
    
    if (!newUrl) return;
    
    // Add https if not present
    if (!newUrl.startsWith('http://') && !newUrl.startsWith('https://')) {
      // Check if it looks like a URL or a search query
      if (newUrl.includes('.') && !newUrl.includes(' ')) {
        newUrl = 'https://' + newUrl;
      } else {
        // Treat as Google search
        newUrl = `https://www.google.com/search?q=${encodeURIComponent(newUrl)}`;
      }
    }
    
    setUrl(newUrl);
    setInputUrl('');
  };

  const handleNavigationStateChange = (navState) => {
    setCanGoBack(navState.canGoBack);
    setCanGoForward(navState.canGoForward);
    
    // Update title if available
    if (navState.title && navState.title.trim() !== '') {
      setCurrentTitle(navState.title);
    }
    
    // Update URL
    if (navState.url && navState.url !== url) {
      setUrl(navState.url);
    }
    
    // Inject JS to get the actual page title (for SPAs like YouTube)
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        (function() {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'pageInfo',
            title: document.title,
            url: window.location.href
          }));
        })();
        true;
      `);
    }
  };
  
  const handleWebViewMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'pageInfo') {
        if (data.title && data.title.trim() !== '') {
          setCurrentTitle(data.title);
          console.log('Page title updated:', data.title);
        }
        // Also update the ref for immediate access
        latestPageInfo.current = {
          title: data.title || '',
          url: data.url || url,
        };
      } else if (data.type === 'captureInfo') {
        // Update the ref immediately for screenshot capture
        latestPageInfo.current = {
          title: data.title || '',
          url: data.url || url,
        };
        console.log('Capture info received:', data.title, data.url);
      }
    } catch (e) {
      // Ignore non-JSON messages
    }
  };

  const goBack = () => {
    if (webViewRef.current && canGoBack) {
      webViewRef.current.goBack();
    }
  };

  const goForward = () => {
    if (webViewRef.current && canGoForward) {
      webViewRef.current.goForward();
    }
  };

  const refresh = () => {
    if (webViewRef.current) {
      webViewRef.current.reload();
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#1a202c" />
        </TouchableOpacity>
        <View style={styles.urlBarContainer}>
          <Ionicons name="search" size={18} color="#a0aec0" />
          <TextInput
            style={styles.urlInput}
            placeholder="Search or enter URL"
            placeholderTextColor="#a0aec0"
            value={inputUrl}
            onChangeText={setInputUrl}
            onSubmitEditing={handleNavigate}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            returnKeyType="go"
          />
        </View>
      </View>

      {/* Navigation Bar */}
      <View style={styles.navBar}>
        <TouchableOpacity 
          onPress={goBack} 
          style={[styles.navButton, !canGoBack && styles.navButtonDisabled]}
          disabled={!canGoBack}
        >
          <Ionicons name="chevron-back" size={22} color={canGoBack ? '#667eea' : '#cbd5e0'} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={goForward} 
          style={[styles.navButton, !canGoForward && styles.navButtonDisabled]}
          disabled={!canGoForward}
        >
          <Ionicons name="chevron-forward" size={22} color={canGoForward ? '#667eea' : '#cbd5e0'} />
        </TouchableOpacity>
        
        <TouchableOpacity onPress={refresh} style={styles.navButton}>
          <Ionicons name="refresh" size={20} color="#667eea" />
        </TouchableOpacity>
        
        <View style={styles.currentUrl}>
          <Ionicons name="lock-closed" size={12} color="#48bb78" />
          <Text style={styles.currentUrlText} numberOfLines={1}>
            {url.replace('https://', '').replace('http://', '').split('/')[0]}
          </Text>
        </View>
        
        <View style={styles.monitoringBadge}>
          <Ionicons name="eye" size={14} color="#fff" />
        </View>
      </View>

      {/* WebView with Screenshot Capture */}
      <View style={styles.webViewContainer} ref={viewShotRef} collapsable={false}>
        <WebView
          ref={webViewRef}
          source={{ uri: url }}
          style={styles.webView}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => {
            setLoading(false);
            
            // Get title via JS injection after load
            if (webViewRef.current) {
              webViewRef.current.injectJavaScript(`
                (function() {
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'pageInfo',
                    title: document.title,
                    url: window.location.href
                  }));
                })();
                true;
              `);
            }
            
            // Take initial screenshot after first page load (with 3s delay)
            // Only if no screenshot has been taken yet
            if (lastScreenshotTime.current === 0) {
              setTimeout(() => captureAndSendScreenshot(true), 3000);
            }
          }}
          onNavigationStateChange={handleNavigationStateChange}
          onMessage={handleWebViewMessage}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          scalesPageToFit={true}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
        />
        
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#667eea" />
          </View>
        )}
      </View>

      {/* Footer - Monitoring Notice */}
      <View style={styles.footer}>
        <Ionicons name="shield-checkmark" size={16} color="#48bb78" />
        <Text style={styles.footerText}>Safe browsing monitored by parent</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  closeButton: {
    padding: 8,
  },
  urlBarContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f7fafc',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginLeft: 8,
    height: 40,
  },
  urlInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: '#1a202c',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  navButton: {
    padding: 8,
    marginRight: 4,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  currentUrl: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  currentUrlText: {
    fontSize: 13,
    color: '#718096',
    marginLeft: 4,
  },
  monitoringBadge: {
    backgroundColor: '#667eea',
    borderRadius: 12,
    padding: 6,
  },
  webViewContainer: {
    flex: 1,
  },
  webView: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: '#f0fff4',
    gap: 6,
  },
  footerText: {
    fontSize: 12,
    color: '#48bb78',
    fontWeight: '500',
  },
});

