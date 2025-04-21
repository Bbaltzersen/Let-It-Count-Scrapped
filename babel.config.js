// babel.config.js
module.exports = function(api) {
    api.cache(true);
    return {
      presets: ['babel-preset-expo'],
      plugins: [
        // Add other plugins here first, like module-resolver if you use it
        ['module-resolver', { /* ... your config ... */ }], // Example if used
        'expo-router/babel',
        // Reanimated plugin MUST be listed last.
        'react-native-reanimated/plugin',
      ]
    };
  };