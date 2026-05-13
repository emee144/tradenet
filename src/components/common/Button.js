import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING } from '@constants/index';

const NAVY = '#0f2d5c';

const VARIANTS = {
  primary: {
    bg: COLORS.primary,
    border: COLORS.primaryDark,
    text: '#fff',
  },
  navy: {
    bg: NAVY,
    border: NAVY,
    text: '#fff',
  },
  outline: {
    bg: 'transparent',
    border: COLORS.primary,
    text: COLORS.primaryDark,
  },
  outlineNavy: {
    bg: 'transparent',
    border: NAVY,
    text: NAVY,
  },
  danger: {
    bg: 'transparent',
    border: '#fca5a5',
    text: '#ef4444',
  },
  ghost: {
    bg: 'rgba(255,255,255,0.2)',
    border: 'rgba(255,255,255,0.4)',
    text: '#fff',
  },
};

const SIZES = {
  sm: { height: 36, fontSize: 13, paddingHorizontal: SPACING.md },
  md: { height: 50, fontSize: 15, paddingHorizontal: SPACING.lg },
  lg: { height: 56, fontSize: 16, paddingHorizontal: SPACING.xl },
};

export default function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  fullWidth = true,
  style,
}) {
  const v = VARIANTS[variant] || VARIANTS.primary;
  const s = SIZES[size] || SIZES.md;

  return (
    <TouchableOpacity
      style={[
        styles.btn,
        {
          backgroundColor: v.bg,
          borderColor: v.border,
          height: s.height,
          paddingHorizontal: s.paddingHorizontal,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
          opacity: disabled || loading ? 0.65 : 1,
        },
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator size="small" color={v.text} />
      ) : (
        <View style={styles.content}>
          {icon && iconPosition === 'left' && (
            <Ionicons name={icon} size={s.fontSize + 2} color={v.text} />
          )}
          <Text style={[styles.label, { color: v.text, fontSize: s.fontSize }]}>
            {label}
          </Text>
          {icon && iconPosition === 'right' && (
            <Ionicons name={icon} size={s.fontSize + 2} color={v.text} />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  label: {
    fontWeight: '700',
  },
});