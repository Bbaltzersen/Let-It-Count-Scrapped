import React from 'react';
import { StyleSheet, View, SafeAreaView, Text } from 'react-native'; // Added Text
import { StatusBar } from 'expo-status-bar';

export default function HomeScreen() { // Renamed component for clarity
  return (
    // Using View here as SafeAreaView is often handled by the layout in Expo Router
    <View style={styles.container}>
      <Text>Let it count - Home Screen</Text>
      {/* Your calorie entry form, list etc. will go here */}
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center', // Example: center content
    justifyContent: 'center', // Example: center content
  },
});