export default {
  expo: {
    name: 'TMV Mobile',
    slug: 'tmv-mobile',
    version: '1.0.0',
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
      icon: './assets/icon.png'
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#1A1A1A'
      },
      package: 'com.tmv.mobile',
      icon: './assets/icon.png'
    },
    web: {
      favicon: './assets/favicon.png'
    },
    extra: {
      apiUrl: process.env.EXPO_PUBLIC_API_URL || 'https://api.themoneyvice.com'
    }
  }
};
