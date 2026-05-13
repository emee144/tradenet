import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RADIUS, SPACING } from '@constants/index';

const VARIANTS = {
  verified: {
    bg: '#dcfce7',
    border: '#86efac',
    text: '#14532d',
    icon: 'shield-checkmark',
    iconColor: '#14532d',
  },
  unverified: {
    bg: '#fee2e2',
    border: '#fca5a5',
    text: '#7f1d1d',
    icon: 'shield-outline',
    iconColor: '#7f1d1d',
  },
  rating: {
    bg: '#fffbeb',
    border: '#fcd34d',
    text: '#7a4f00',
    icon: 'star',
    iconColor: '#f59e0b',
  },
  expired: {
    bg: '#fee2e2',
    border: '#fca5a5',
    text: '#7f1d1d',
    icon: 'time-outline',
    iconColor: '#7f1d1d',
  },
  remote: {
    bg: '#dcfce7',
    border: '#86efac',
    text: '#14532d',
    icon: 'laptop-outline',
    iconColor: '#14532d',
  },
  pending: {
    bg: '#fff7ed',
    border: '#fdba74',
    text: '#9a3412',
    icon: 'time-outline',
    iconColor: '#9a3412',
  },
  primary: {
    bg: '#fffbeb',
    border: '#fcd34d',
    text: '#7a4f00',
    icon: null,
    iconColor: null,
  },
};

export default function Badge({ variant = 'primary', label, icon, size = 'sm' }) {
  const config = VARIANTS[variant] || VARIANTS.primary;
  const iconName = icon || config.icon;
  const isSmall = size === 'sm';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: config.bg,
          borderColor: config.border,
          paddingVertical: isSmall ? 2 : 4,
          paddingHorizontal: isSmall ? 6 : 10,
        },
      ]}
    >
      {iconName && (
        <Ionicons
          name={iconName}
          size={isSmall ? 10 : 13}
          color={config.iconColor}
        />
      )}
      {label && (
        <Text
          style={[
            styles.text,
            {
              color: config.text,
              fontSize: isSmall ? 10 : 12,
            },
          ]}
        >
          {label}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: RADIUS.full,
    borderWidth: 0.5,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '600',
  },
});