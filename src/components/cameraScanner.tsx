// components/CameraScanner.tsx
import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Linking,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useFrameProcessor,
  type Frame,
} from 'react-native-vision-camera';
import { useIsFocused } from '@react-navigation/native';
import { useTheme } from '../context/themeContext';
import Icon from 'react-native-vector-icons/Ionicons';
import { runOnJS } from 'react-native-reanimated';
import { scanOCR, type OCRFrame } from 'vision-camera-ocr';

interface CameraScannerProps {
  /** Called with the recognized text once (UI thread) */
  onTextScanned: (text: string) => void;
  /** Called whenever the scanner should dismiss (e.g. close button, after scan) */
  onClose: () => void;
}

// Custom hook to process frames using scanOCR
function useOCRProcessor(onTextRecognized: (text: string) => void) {
  return useFrameProcessor(
    (frame: Frame) => {
      'worklet';
      try {
        const ocrFrame: OCRFrame = scanOCR(frame);
        const text = ocrFrame.result.text?.trim();
        if (text) {
          runOnJS(onTextRecognized)(text);
        }
      } catch (error) {
        // Silently catch in worklet
        console.error('[OCR Worklet] Error:', error);
      }
    },
    [onTextRecognized]
  );
}

export default function CameraScanner({
  onTextScanned,
  onClose,
}: CameraScannerProps) {
  const { colors } = useTheme();
  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();
  const isFocused = useIsFocused();
  const [isActive, setIsActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const cameraRef = useRef<Camera>(null);

  // When OCR finds text, call onTextScanned once, then dismiss
  const handleTextRecognized = useCallback(
    (recognizedText: string) => {
      if (isProcessing || !isActive) return;
      setIsProcessing(true);
      onTextScanned(recognizedText);
      onClose();
    },
    [isProcessing, isActive, onTextScanned, onClose]
  );

  // Toggle camera active when focused + permission
  useEffect(() => {
    const shouldBeActive = !!device && isFocused && hasPermission;
    setIsActive(shouldBeActive);
    if (shouldBeActive) {
      setIsProcessing(false);
    }
  }, [device, isFocused, hasPermission]);

  const frameProcessor = useOCRProcessor(handleTextRecognized);

  // 1) Loading state
  if (!device || hasPermission === undefined) {
    return (
      <View
        style={[
          styles.container,
          styles.centerContent,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // 2) Permission request state
  if (!hasPermission) {
    const onRequest = async () => {
      const granted = await requestPermission();
      if (!granted) {
        Alert.alert(
          'Permission Required',
          'Camera permission is needed to scan labels. Please grant permission in settings.',
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: onClose,
            },
            {
              text: 'Open Settings',
              onPress: () => Linking.openSettings(),
            },
          ]
        );
      }
    };

    return (
      <SafeAreaView
        style={[
          styles.container,
          styles.centerContent,
          { backgroundColor: colors.background },
        ]}
      >
        <Text style={[styles.permissionText, { color: colors.text }]}>
          Camera permission is required to scan labels.
        </Text>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={onRequest}
        >
          <Text style={[styles.buttonText, { color: '#fff' }]}>
            Grant Permission
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton, { borderColor: colors.primary }]}
          onPress={onClose}
        >
          <Text style={[styles.buttonText, { color: colors.primary }]}>
            Cancel
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // 3) Camera + overlay UI
  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={isActive}
        frameProcessor={frameProcessor}
      />

      {/* Close button */}
      <SafeAreaView style={styles.overlayContainer}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <View style={styles.iconBackground}>
            <Icon name="close" size={28} color={colors.text} />
          </View>
        </TouchableOpacity>
      </SafeAreaView>

      {/* Viewfinder & instructions */}
      <View style={styles.scannerOverlay}>
        <View style={[styles.viewfinder, { borderColor: 'rgba(255,255,255,0.7)' }]} />
        <Text style={[styles.instructionText, { color: '#fff' }]}>
          Position the label inside the box
        </Text>
      </View>

      {/* Processing indicator */}
      {isProcessing && (
        <View style={styles.processingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.processingText}>Processing...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionText: {
    fontSize: 17,
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 24,
  },
  button: {
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 15,
    minWidth: '60%',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  closeButton: {
    margin: Platform.OS === 'ios' ? 15 : 20,
    alignSelf: 'flex-start',
  },
  iconBackground: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 20,
    padding: 4,
  },
  scannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  viewfinder: {
    width: '90%',
    aspectRatio: 1.6,
    borderWidth: 2,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3.84,
    elevation: 5,
  },
  instructionText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    maxWidth: '80%',
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  processingText: {
    color: '#fff',
    fontSize: 18,
    marginTop: 10,
    fontWeight: 'bold',
  },
});
