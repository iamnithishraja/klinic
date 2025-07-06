const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Add platform-specific extensions for video call components
config.resolver.platforms = ['native', 'web', 'ios', 'android'];

module.exports = withNativeWind(config, { input: './global.css' }); 