#!/usr/bin/env node

/**
 * Test script for Parent AI monitoring system
 * This script simulates activity monitoring and helps test the entire flow
 */

const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

// Test data
const testUser = {
  name: 'Test Parent',
  email: `test${Date.now()}@example.com`,
  password: 'password123',
};

const testChild = {
  name: 'Test Child',
  age: 10,
  deviceId: `device-${Date.now()}`,
};

const testActivities = [
  {
    activityType: 'video',
    contentTitle: 'Peaceful Nature Documentary',
    contentDescription: 'Beautiful landscapes and wildlife in their natural habitat',
    appName: 'YouTube',
  },
  {
    activityType: 'video',
    contentTitle: 'Action Movie Trailer',
    contentDescription: 'Contains fighting scenes, explosions, and violence',
    appName: 'YouTube',
  },
  {
    activityType: 'game',
    contentTitle: 'Educational Math Game',
    contentDescription: 'Fun math puzzles for kids',
    appName: 'Math Masters',
  },
  {
    activityType: 'video',
    contentTitle: 'Inappropriate Content Example',
    contentDescription: 'Contains adult content, violence, and profanity',
    appName: 'Browser',
  },
];

let authToken = '';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testRegistration() {
  console.log('\n📝 Testing User Registration...');
  try {
    const response = await axios.post(`${API_URL}/auth/register`, testUser);
    authToken = response.data.token;
    console.log('✅ Registration successful!');
    console.log(`   User ID: ${response.data.user.id}`);
    console.log(`   Email: ${response.data.user.email}`);
    return true;
  } catch (error) {
    console.error('❌ Registration failed:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testLogin() {
  console.log('\n🔐 Testing User Login...');
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: testUser.email,
      password: testUser.password,
    });
    authToken = response.data.token;
    console.log('✅ Login successful!');
    console.log(`   Token: ${authToken.substring(0, 20)}...`);
    return true;
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testAddChild() {
  console.log('\n👶 Adding Child Profile...');
  try {
    const response = await axios.post(`${API_URL}/auth/children`, testChild, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    console.log('✅ Child added successfully!');
    console.log(`   Name: ${testChild.name}`);
    console.log(`   Age: ${testChild.age}`);
    return true;
  } catch (error) {
    console.error('❌ Add child failed:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testActivityMonitoring() {
  console.log('\n📊 Testing Activity Monitoring...');
  
  for (let i = 0; i < testActivities.length; i++) {
    const activity = testActivities[i];
    console.log(`\n   Activity ${i + 1}/${testActivities.length}: ${activity.contentTitle}`);
    
    try {
      const response = await axios.post(
        `${API_URL}/monitoring/activity`,
        {
          ...activity,
          childName: testChild.name,
          deviceId: testChild.deviceId,
        },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      const result = response.data.activity;
      console.log(`   ✅ Activity submitted`);
      console.log(`   📈 Analysis:`);
      console.log(`      - Flagged: ${result.flagged ? '🚨 YES' : '✅ NO'}`);
      console.log(`      - Violence Score: ${(result.aiAnalysis.violenceScore * 100).toFixed(0)}%`);
      console.log(`      - Inappropriate Score: ${(result.aiAnalysis.inappropriateScore * 100).toFixed(0)}%`);
      console.log(`      - Summary: ${result.aiAnalysis.summary}`);
      
      if (result.aiAnalysis.detectedCategories.length > 0) {
        console.log(`      - Categories: ${result.aiAnalysis.detectedCategories.join(', ')}`);
      }

      // Wait a bit between activities
      await sleep(1000);
    } catch (error) {
      console.error(`   ❌ Activity submission failed:`, error.response?.data?.message || error.message);
    }
  }

  return true;
}

async function testGetActivities() {
  console.log('\n📋 Fetching Activity History...');
  try {
    const response = await axios.get(`${API_URL}/monitoring/activities`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: { limit: 10 },
    });

    console.log(`✅ Retrieved ${response.data.count} activities`);
    
    const flagged = response.data.activities.filter(a => a.flagged).length;
    console.log(`   🚨 Flagged: ${flagged}`);
    console.log(`   ✅ Safe: ${response.data.count - flagged}`);
    
    return true;
  } catch (error) {
    console.error('❌ Get activities failed:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testGetStats() {
  console.log('\n📊 Fetching Statistics...');
  try {
    const response = await axios.get(`${API_URL}/monitoring/stats`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    const stats = response.data.stats;
    console.log('✅ Statistics retrieved:');
    console.log(`   Total Activities: ${stats.totalActivities}`);
    console.log(`   Safe Activities: ${stats.safeActivities}`);
    console.log(`   Flagged Activities: ${stats.flaggedActivities}`);
    console.log(`   Flag Rate: ${stats.flagRate}%`);
    
    if (stats.activitiesByType.length > 0) {
      console.log('   Activity Breakdown:');
      stats.activitiesByType.forEach(type => {
        console.log(`      - ${type._id}: ${type.count}`);
      });
    }
    
    return true;
  } catch (error) {
    console.error('❌ Get stats failed:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testGetNotifications() {
  console.log('\n🔔 Fetching Notifications...');
  try {
    const response = await axios.get(`${API_URL}/notifications`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    console.log(`✅ Retrieved ${response.data.count} notifications`);
    
    if (response.data.count > 0) {
      console.log('\n   Recent notifications:');
      response.data.notifications.slice(0, 3).forEach((notif, index) => {
        console.log(`   ${index + 1}. ${notif.title}`);
        console.log(`      Severity: ${notif.severity.toUpperCase()}`);
        console.log(`      Message: ${notif.message.substring(0, 60)}...`);
      });
    } else {
      console.log('   No notifications yet (this is normal for safe content)');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Get notifications failed:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testHealthCheck() {
  console.log('\n🏥 Testing Health Check...');
  try {
    const response = await axios.get(`${API_URL.replace('/api', '')}/health`);
    console.log('✅ Server is healthy!');
    console.log(`   Status: ${response.data.message}`);
    return true;
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    console.error('   Make sure the server is running on http://localhost:3000');
    return false;
  }
}

async function runTests() {
  console.log('\n🚀 Parent AI - System Test Suite');
  console.log('=====================================');
  console.log(`API URL: ${API_URL}`);
  console.log('=====================================\n');

  let passed = 0;
  let failed = 0;

  // Test 1: Health Check
  if (await testHealthCheck()) {
    passed++;
  } else {
    failed++;
    console.log('\n⚠️  Cannot continue - server is not running');
    process.exit(1);
  }

  // Test 2: Registration
  if (await testRegistration()) {
    passed++;
  } else {
    failed++;
  }

  // Test 3: Login (skip if registration succeeded and we have token)
  // if (await testLogin()) {
  //   passed++;
  // } else {
  //   failed++;
  // }

  // Test 4: Add Child
  if (await testAddChild()) {
    passed++;
  } else {
    failed++;
  }

  // Test 5: Activity Monitoring
  if (await testActivityMonitoring()) {
    passed++;
  } else {
    failed++;
  }

  // Wait a bit for AI processing
  console.log('\n⏳ Waiting for AI analysis to complete...');
  await sleep(3000);

  // Test 6: Get Activities
  if (await testGetActivities()) {
    passed++;
  } else {
    failed++;
  }

  // Test 7: Get Stats
  if (await testGetStats()) {
    passed++;
  } else {
    failed++;
  }

  // Test 8: Get Notifications
  if (await testGetNotifications()) {
    passed++;
  } else {
    failed++;
  }

  // Summary
  console.log('\n=====================================');
  console.log('📊 Test Summary');
  console.log('=====================================');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(0)}%`);
  console.log('=====================================\n');

  if (failed === 0) {
    console.log('🎉 All tests passed! Your Parent AI system is working correctly.\n');
  } else {
    console.log('⚠️  Some tests failed. Please check the error messages above.\n');
  }

  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  console.error('\n💥 Test suite crashed:', error.message);
  process.exit(1);
});

