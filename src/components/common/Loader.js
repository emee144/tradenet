import React from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { COLORS, SPACING } from '@constants/index';

const NAVY = '#0f2d5c';

export default function Loader({
  size = 'large',
  color = COLORS.primary,
  fullScreen = false,
  message,
  overlay = false,
}) {
  if (fullScreen) {
    return (
      <View style={styles.fullScreen}>
        <ActivityIndicator size={size} color={color} />
        {message && <Text style={styles.message}>{message}</Text>}
      </View>
    );
  }

  if (overlay) {
    return (
      <View style={styles.overlay}>
        <View style={styles.overlayBox}>
          <ActivityIndicator size={size} color={COLORS.primary} />
          {message && <Text style={styles.overlayMessage}>{message}</Text>}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.centered}>
      <ActivityIndicator size={size} color={color} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  // ── Inline centered ──
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl,
  },

  // ── Full screen ──
  fullScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
  },

  // ── Overlay on top of screen ──
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  overlayBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: SPACING.xl,
    alignItems: 'center',
    gap: SPACING.md,
    minWidth: 120,
  },

  message: {
    marginTop: SPACING.md,
    fontSize: 13,
    fontWeight: '500',
    color: NAVY,
    textAlign: 'center',
  },
  overlayMessage: {
    fontSize: 13,
    fontWeight: '500',
    color: NAVY,
    textAlign: 'center',
  },
});