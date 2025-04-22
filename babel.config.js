module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'], // This preset now includes Expo Router transforms
    plugins: [
      // Add other plugins here first if you have them
      // Example: If you were using module-resolver
      // [
      //   'module-resolver',
      //   {
      //     root: ['./src'],
      //     extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
      //     alias: { /* ... your aliases ... */ }
      //   }
      // ],

      // Remove the deprecated expo-router/babel plugin
      // 'expo-router/babel', // <-- REMOVE THIS LINE

      // Reanimated plugin MUST be listed last if you use it.
      'react-native-reanimated/plugin',
    ]
  };
};
