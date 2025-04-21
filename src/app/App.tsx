import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { StyleSheet, View, SafeAreaView } from 'react-native';

// You could explicitly type the component like this:
// const App: React.FC = () => {
// But for simple functional components, it's often not necessary
export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Content will go here */}
      </View>
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
  },
});