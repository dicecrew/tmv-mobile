export default {
  expo: {
    name: 'TMV Mobile',
    slug: 'tmv-mobile',
    version: '1.0.4',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'dark',
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#1A1A1A'
    },
    assetBundlePatterns: [
      '**/*'
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.tmv.mobile',
      buildNumber: '4',
      icon: './assets/icon.png',
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#1A1A1A'
      },
      package: 'com.tmv.mobile',
      versionCode: 4,
      icon: './assets/icon.png'
    },
    web: {
      favicon: './assets/favicon.png'
    },
    extra: {
      apiUrl: process.env.EXPO_PUBLIC_API_URL || 'https://api.themoneyvice.com',
      eas: {
        projectId: '688e34d6-803d-40c9-8787-e90b25d961a5'
      }
    }
  }
};
