import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING } from '@constants/index';

const NAVY = '#0f2d5c';

export default function Input({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  secureTextEntry = false,
  keyboardType = 'default',
  maxLength,
  error,
  hint,
  editable = true,
  multiline = false,
  numberOfLines = 1,
  returnKeyType = 'next',
  onSubmitEditing,
  autoFocus = false,
  style,
  inputRef,
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState(false);

  const isPassword = secureTextEntry;

  return (
    <View style={[styles.wrapper, style]}>

      {/* Label */}
      {label && (
        <Text style={styles.label}>{label}</Text>
      )}

      {/* Input row */}
      <View
        style={[
          styles.inputRow,
          focused && styles.inputRowFocused,
          error && styles.inputRowError,
          !editable && styles.inputRowDisabled,
          multiline && styles.inputRowMultiline,
        ]}
      >
        {/* Left icon */}
        {icon && (
          <Ionicons
            name={icon}
            size={18}
            color={focused ? COLORS.primaryDark : '#9ca3af'}
            style={styles.leftIcon}
          />
        )}

        {/* Text input */}
        <TextInput
          ref={inputRef}
          style={[
            styles.input,
            multiline && styles.inputMultiline,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9ca3af"
          secureTextEntry={isPassword && !showPassword}
          keyboardType={keyboardType}
          maxLength={maxLength}
          editable={editable}
          multiline={multiline}
          numberOfLines={multiline ? numberOfLines : 1}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          autoFocus={autoFocus}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          textAlignVertical={multiline ? 'top' : 'center'}
        />

        {/* Password toggle */}
        {isPassword && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name={showPassword ? 'eye-outline' : 'eye-off-outline'}
              size={18}
              color="#9ca3af"
            />
          </TouchableOpacity>
        )}

        {/* Character count */}
        {maxLength && value && (
          <Text style={styles.charCount}>
            {value.length}/{maxLength}
          </Text>
        )}
      </View>

      {/* Error message */}
      {error && (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle-outline" size={13} color="#ef4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Hint */}
      {hint && !error && (
        <Text style={styles.hintText}>{hint}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: SPACING.md,
  },

  // ── Label ──
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: NAVY,
    marginBottom: 6,
  },

  // ── Input row ──
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    height: 50,
  },
  inputRowFocused: {
    borderColor: COLORS.primary,
    backgroundColor: '#fff',
  },
  inputRowError: {
    borderColor: '#ef4444',
    backgroundColor: '#fff5f5',
  },
  inputRowDisabled: {
    backgroundColor: '#f3f4f6',
    opacity: 0.7,
  },
  inputRowMultiline: {
    height: 'auto',
    minHeight: 100,
    alignItems: 'flex-start',
    paddingVertical: SPACING.md,
  },
  leftIcon: {
    marginRight: SPACING.sm,
  },

  // ── Input ──
  input: {
    flex: 1,
    fontSize: 14,
    color: NAVY,
    height: '100%',
  },
  inputMultiline: {
    height: 'auto',
    paddingTop: 0,
  },

  // ── Eye button ──
  eyeBtn: {
    padding: 4,
    marginLeft: SPACING.sm,
  },

  // ── Char count ──
  charCount: {
    fontSize: 11,
    color: '#9ca3af',
    marginLeft: SPACING.sm,
  },

  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 5,
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    flex: 1,
  },

  hintText: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 5,
  },
});