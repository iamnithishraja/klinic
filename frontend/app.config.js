module.exports = {
  expo: {
    name: 'Klinic',
    slug: 'klinic',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'klinic',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.klinic.kliinic',
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      package: 'com.klinic.kliinic',
    },
    web: {
      bundler: 'metro',
      output: 'static',
      favicon: './assets/images/favicon.png',
    },
    plugins: [
      'expo-router',
      [
        'expo-build-properties',
        {
          web: {
            // Enable support for WebRTC and media devices
            // This is needed for Agora Web SDK
            devtool: 'source-map',
          },
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
  },
}; 