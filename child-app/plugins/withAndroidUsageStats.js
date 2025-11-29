const { withAndroidManifest } = require('@expo/config-plugins');

/**
 * Config plugin to add Android Usage Stats permission
 */
const withAndroidUsageStats = (config) => {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;
    
    // Add PACKAGE_USAGE_STATS permission
    const permissions = androidManifest.manifest['uses-permission'] || [];
    
    const hasUsageStats = permissions.some(
      (perm) => perm.$['android:name'] === 'android.permission.PACKAGE_USAGE_STATS'
    );
    
    if (!hasUsageStats) {
      permissions.push({
        $: {
          'android:name': 'android.permission.PACKAGE_USAGE_STATS',
          'tools:ignore': 'ProtectedPermissions',
        },
      });
    }
    
    // Add QUERY_ALL_PACKAGES permission (for Android 11+)
    const hasQueryPackages = permissions.some(
      (perm) => perm.$['android:name'] === 'android.permission.QUERY_ALL_PACKAGES'
    );
    
    if (!hasQueryPackages) {
      permissions.push({
        $: {
          'android:name': 'android.permission.QUERY_ALL_PACKAGES',
        },
      });
    }
    
    // Add FOREGROUND_SERVICE permission
    const hasForegroundService = permissions.some(
      (perm) => perm.$['android:name'] === 'android.permission.FOREGROUND_SERVICE'
    );
    
    if (!hasForegroundService) {
      permissions.push({
        $: {
          'android:name': 'android.permission.FOREGROUND_SERVICE',
        },
      });
    }
    
    androidManifest.manifest['uses-permission'] = permissions;
    
    // Add tools namespace if not present
    if (!androidManifest.manifest.$['xmlns:tools']) {
      androidManifest.manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';
    }
    
    return config;
  });
};

module.exports = withAndroidUsageStats;

