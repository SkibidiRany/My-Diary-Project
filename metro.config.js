const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// This tells the Metro bundler to handle .wasm files as assets.
if (!config.resolver.assetExts.includes('wasm')) {
  config.resolver.assetExts.push('wasm');
}

module.exports = config;