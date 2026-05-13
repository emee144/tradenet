import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@stores/authStore';
import { COLORS, RADIUS, SPACING } from '@constants/index';

const { width } = Dimensions.get('window');
const FRAME_SIZE = width * 0.68;

export default function CameraScreen({ navigation, route }) {
  const { phone } = route.params || {};
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState('front');
  const [captured, setCaptured] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const cameraRef = useRef(null);
  const { uploadVerificationPhoto, fetchProfile } = useAuthStore();

  useEffect(() => {
    if (!permission?.granted) return;
    let count = 3;
    setCountdown(count);
    const timer = setInterval(() => {
      count -= 1;
      setCountdown(count);
      if (count === 0) {
        clearInterval(timer);
        setCountdown(null);
        handleCapture();
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [permission?.granted]);

  const handleCapture = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7, base64: true, exif: false });
      setCaptured(photo);
    } catch (error) {
      Alert.alert('Error', 'Failed to capture photo. Please try again.');
    }
  };

  const handleRetake = () => {
    setCaptured(null);
    let count = 3;
    setCountdown(count);
    const timer = setInterval(() => {
      count -= 1;
      setCountdown(count);
      if (count === 0) {
        clearInterval(timer);
        setCountdown(null);
        handleCapture();
      }
    }, 1000);
  };

  const handleSubmit = async () => {
    if (!captured) return;
    setUploading(true);
    try {
      await uploadVerificationPhoto(`data:image/jpeg;base64,${captured.base64}`);
      await fetchProfile();
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    } catch (error) {
      Alert.alert('Upload Failed', error.message || 'Failed to upload photo. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // ── Loading permission ──
  if (!permission) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  // ── Permission denied ──
  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.permissionContent}>
          <View style={styles.permIconWrap}>
            <Ionicons name="camera-outline" size={36} color={COLORS.primary} />
          </View>
          <Text style={styles.permTitle}>Camera access needed</Text>
          <Text style={styles.permSub}>
            TradeNet needs your camera to take a live photo for identity verification
          </Text>
          <View style={styles.permInfoBox}>
            <Ionicons name="shield-checkmark-outline" size={24} color={COLORS.primary} style={{ marginBottom: 12 }} />
            <Text style={styles.permInfoTitle}>Why we need this</Text>
            <Text style={styles.permInfoText}>
              To protect all users on TradeNet, we verify every account with a live photo.
              This helps prevent fake accounts and keeps the platform safe and trusted.
            </Text>
          </View>
          <TouchableOpacity style={styles.ctaBtn} onPress={requestPermission} activeOpacity={0.85}>
            <Ionicons name="camera" size={18} color={COLORS.textOnGold} />
            <Text style={styles.ctaText}>Allow camera access</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Preview ──
  if (captured) {
    return (
      <SafeAreaView style={styles.darkSafe}>
        <View style={styles.previewHeader}>
          <Text style={styles.previewTitle}>Use this photo?</Text>
          <Text style={styles.previewSub}>Make sure your face is clearly visible</Text>
        </View>
        <View style={styles.previewFrame}>
          <Image source={{ uri: captured.uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          {/* Gold frame overlay */}
          <View style={styles.previewFrameBorder} />
        </View>
        <View style={styles.previewActions}>
          <TouchableOpacity style={styles.retakeBtn} onPress={handleRetake} disabled={uploading}>
            <Ionicons name="refresh-outline" size={18} color={COLORS.textPrimary} />
            <Text style={styles.retakeText}>Retake</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.submitBtn, uploading && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={uploading}
            activeOpacity={0.85}
          >
            {uploading ? (
              <ActivityIndicator color={COLORS.textOnGold} size="small" />
            ) : (
              <>
                <Ionicons name="checkmark" size={18} color={COLORS.textOnGold} />
                <Text style={styles.submitText}>Submit</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Live camera ──
  return (
    <SafeAreaView style={styles.darkSafe}>
      <View style={styles.cameraHeader}>
        <Text style={styles.cameraTitle}>Take a live photo</Text>
        <Text style={styles.cameraSub}>Position your face inside the circle and stay still</Text>
      </View>

      <View style={styles.cameraWrap}>
        <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing={facing} />
        <View style={styles.overlay}>
          <View style={styles.faceFrame}>
            {countdown !== null && (
              <View style={styles.countdownBadge}>
                <Text style={styles.countdownText}>{countdown}</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <View style={styles.cameraFooter}>
        <TouchableOpacity style={styles.flipBtn} onPress={() => setFacing(facing === 'front' ? 'back' : 'front')}>
          <Ionicons name="camera-reverse-outline" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.captureBtn} onPress={handleCapture}>
          <View style={styles.captureInner} />
        </TouchableOpacity>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.tips}>
        <TipItem icon="sunny-outline" text="Good lighting" />
        <TipItem icon="eye-outline" text="Eyes open" />
        <TipItem icon="happy-outline" text="No mask" />
      </View>
    </SafeAreaView>
  );
}

function TipItem({ icon, text }) {
  return (
    <View style={styles.tipItem}>
      <Ionicons name={icon} size={16} color={COLORS.primary} />
      <Text style={styles.tipText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  darkSafe: { flex: 1, backgroundColor: '#000' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // ── Permission ──
  permissionContent: {
    flex: 1,
    paddingHorizontal: SPACING.margin,
    paddingTop: 40,
    alignItems: 'flex-start',
  },
  permIconWrap: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.primaryMuted,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  permTitle: { fontSize: 26, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.5, marginBottom: 8 },
  permSub: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 22, marginBottom: 28 },
  permInfoBox: {
    width: '100%',
    backgroundColor: COLORS.surfaceHigh,
    borderRadius: RADIUS.lg,
    padding: 20,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: COLORS.borderMuted,
    alignItems: 'center',
  },
  permInfoTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 8 },
  permInfoText: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20 },
  ctaBtn: {
    width: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  ctaText: { fontSize: 16, fontWeight: '700', color: COLORS.textOnGold },

  // ── Camera ──
  cameraHeader: {
    paddingHorizontal: SPACING.margin,
    paddingTop: 20,
    paddingBottom: 12,
    alignItems: 'center',
  },
  cameraTitle: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 4 },
  cameraSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)', textAlign: 'center' },
  cameraWrap: {
    flex: 1,
    marginHorizontal: SPACING.margin,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: COLORS.borderMuted,
  },
  overlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  faceFrame: {
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    borderRadius: FRAME_SIZE / 2,
    borderWidth: 3,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
  },
  countdownBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  countdownText: { fontSize: 28, fontWeight: '800', color: COLORS.textOnGold },
  cameraFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
    paddingVertical: 20,
  },
  flipBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surfaceHigh,
    borderWidth: 1,
    borderColor: COLORS.borderMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  captureInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: COLORS.primary,
  },
  tips: { flexDirection: 'row', justifyContent: 'center', gap: 28, paddingBottom: 16 },
  tipItem: { alignItems: 'center', gap: 4 },
  tipText: { fontSize: 11, color: 'rgba(255,255,255,0.65)', fontWeight: '500' },

  // ── Preview ──
  previewHeader: {
    paddingHorizontal: SPACING.margin,
    paddingTop: 20,
    paddingBottom: 12,
    alignItems: 'center',
  },
  previewTitle: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 4 },
  previewSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)', textAlign: 'center' },
  previewFrame: {
    flex: 1,
    marginHorizontal: SPACING.margin,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    backgroundColor: '#111',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  previewFrameBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: RADIUS.xl,
    borderWidth: 2,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
  },
  previewActions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: SPACING.margin,
    paddingVertical: 20,
  },
  retakeBtn: {
    flex: 1,
    height: 52,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.borderMuted,
    backgroundColor: COLORS.surfaceHigh,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  retakeText: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  submitBtn: {
    flex: 2,
    height: 52,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { fontSize: 15, fontWeight: '700', color: COLORS.textOnGold },
});