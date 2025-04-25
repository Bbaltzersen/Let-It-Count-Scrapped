// components/CameraModal.tsx
import React from 'react';
import { Modal, SafeAreaView, StyleSheet } from 'react-native';
import CameraScanner from 'components/cameraScanner';  // <-- relative path

interface Props {
  visible: boolean;
  onClose: () => void;
  onTextScanned: (text: string) => void;
}

export default function CameraModal({
  visible,
  onClose,
  onTextScanned,
}: Props) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="fullScreen"
    >
      <SafeAreaView style={styles.container}>
        <CameraScanner
          onTextScanned={onTextScanned}
          onClose={onClose}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
});
