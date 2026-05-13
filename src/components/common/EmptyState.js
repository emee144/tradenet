import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING } from '@constants/index';
import Button from './Button';

const NAVY = '#0f2d5c';

const PRESETS = {
  services: {
    emoji: '🔧',
    title: 'No services found',
    subtitle: 'Try a different category or check back later',
  },
  properties: {
    emoji: '🏠',
    title: 'No properties found',
    subtitle: 'Try a different filter or check back later',
  },
  jobs: {
    emoji: '💼',
    title: 'No jobs found',
    subtitle: 'Try a different category or check back later',
  },
  cars: {
    emoji: '🚗',
    title: 'No cars found',
    subtitle: 'Try a different search or check back later',
  },
  search: {
    emoji: '🔍',
    title: 'No results found',
    subtitle: 'Try different keywords or clear your search',
  },
  saved: {
    emoji: '❤️',
    title: 'Nothing saved yet',
    subtitle: 'Items you save will appear here',
  },
  bookings: {
    emoji: '📅',
    title: 'No bookings yet',
    subtitle: 'Your bookings will appear here',
  },
  notifications: {
    emoji: '🔔',
    title: 'No notifications',
    subtitle: 'You are all caught up!',
  },
  applications: {
    emoji: '📨',
    title: 'No applications yet',
    subtitle: 'Jobs you apply for will appear here',
  },
};

export default function EmptyState({
  preset,
  emoji,
  title,
  subtitle,
  actionLabel,
  onAction,
}) {
  const config = preset ? PRESETS[preset] : {};

  const displayEmoji = emoji || config.emoji || '📭';
  const displayTitle = title || config.title || 'Nothing here yet';
  const displaySubtitle = subtitle || config.subtitle || '';

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>{displayEmoji}</Text>
      <Text style={styles.title}>{displayTitle}</Text>
      {displaySubtitle ? (
        <Text style={styles.subtitle}>{displaySubtitle}</Text>
      ) : null}
      {actionLabel && onAction && (
        <Button
          label={actionLabel}
          onPress={onAction}
          fullWidth={false}
          size="sm"
          style={styles.actionBtn}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl * 2,
    paddingHorizontal: SPACING.xl,
  },
  emoji: {
    fontSize: 52,
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: NAVY,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  actionBtn: {
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.xl,
  },
});