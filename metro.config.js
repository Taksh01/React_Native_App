const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Ensure Reanimated 3 compatibility
config.resolver.assetExts.push("db");

module.exports = config;
