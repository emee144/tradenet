import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING } from '@constants/index';
import { formatNaira, timeAgo } from '@utils/formatters';

const TYPE_CONFIG = {
  full_time: { label: 'Full-time', color: '#60a5fa' },
  part_time: { label: 'Part-time', color: '#c084fc' },
  freelance: { label: 'Freelance', color: '#4ade80' },
  contract: { label: 'Contract', color: '#fb923c' },
  internship: { label: 'Internship', color: '#facc15' },
};

export default function JobCard({ job, onPress }) {
  const {
    title,
    company,
    job_type,
    salary_min,
    salary_max,
    city,
    state,
    is_remote,
    deadline,
    employer,
    created_at,
  } = job;

  const config = TYPE_CONFIG[job_type] || TYPE_CONFIG.full_time;
  const isExpired = deadline && new Date(deadline) < new Date();
  const isVerified = employer?.nin_verified && employer?.photo_verified;
  const location = [city, state].filter(Boolean).join(', ') || 'Nigeria';

  return (
    <TouchableOpacity
      style={[styles.card, isExpired && styles.cardExpired]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {/* ── Top row ── */}
      <View style={styles.topRow}>
        <View style={styles.companyLogo}>
          <Text style={styles.companyLogoText}>
            {(company || title)?.[0]?.toUpperCase() || '?'}
          </Text>
        </View>

        <View style={styles.topInfo}>
          <Text style={styles.jobTitle} numberOfLines={1}>{title}</Text>
          {company && <Text style={styles.companyName} numberOfLines={1}>{company}</Text>}
        </View>

        {/* Type badge */}
        <View style={[styles.typeBadge, { borderColor: config.color + '40' }]}>
          <View style={[styles.typeDot, { backgroundColor: config.color }]} />
          <Text style={[styles.typeBadgeText, { color: config.color }]}>{config.label}</Text>
        </View>
      </View>

      {/* ── Tags ── */}
      <View style={styles.tagsRow}>
        <View style={styles.tag}>
          <Ionicons name="location-outline" size={12} color={COLORS.textMuted} />
          <Text style={styles.tagText} numberOfLines={1}>{location}</Text>
        </View>

        {is_remote && (
          <View style={[styles.tag, styles.remoteTag]}>
            <Ionicons name="globe-outline" size={12} color={COLORS.primary} />
            <Text style={[styles.tagText, { color: COLORS.primary }]}>Remote ok</Text>
          </View>
        )}

        {(salary_min || salary_max) && (
          <View style={[styles.tag, styles.salaryTag]}>
            <Ionicons name="cash-outline" size={12} color={COLORS.primary} />
            <Text style={[styles.tagText, { color: COLORS.primary }]}>
              {salary_min && salary_max
                ? `${formatNaira(salary_min)} – ${formatNaira(salary_max)}`
                : salary_min
                ? `From ${formatNaira(salary_min)}`
                : `Up to ${formatNaira(salary_max)}`}
            </Text>
          </View>
        )}
      </View>

      {/* ── Footer ── */}
      <View style={styles.footer}>
        {isVerified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="shield-checkmark" size={11} color={COLORS.primary} />
            <Text style={styles.verifiedText}>Verified</Text>
          </View>
        )}
        {isExpired && (
          <View style={styles.expiredBadge}>
            <Ionicons name="time-outline" size={11} color={COLORS.error} />
            <Text style={styles.expiredText}>Expired</Text>
          </View>
        )}
        <Text style={styles.postedTime}>{timeAgo(created_at)}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surfaceHigh,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderMuted,
    padding: SPACING.margin,
    marginBottom: SPACING.sm,
  },
  cardExpired: { opacity: 0.5 },

  // ── Top row ──
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
  },
  companyLogo: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryMuted,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  companyLogoText: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
  },
  topInfo: { flex: 1 },
  jobTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 3,
  },
  companyName: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: RADIUS.full,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderWidth: 1,
    backgroundColor: 'transparent',
    alignSelf: 'flex-start',
    flexShrink: 0,
  },
  typeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // ── Tags ──
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.surfaceHighest,
    borderRadius: RADIUS.full,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: COLORS.borderMuted,
  },
  remoteTag: {
    backgroundColor: COLORS.primaryMuted,
    borderColor: COLORS.border,
  },
  salaryTag: {
    backgroundColor: COLORS.primaryMuted,
    borderColor: COLORS.border,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },

  // ── Footer ──
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderMuted,
    paddingTop: 12,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primaryMuted,
    borderRadius: RADIUS.full,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  verifiedText: {
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: '700',
  },
  expiredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(147,0,10,0.15)',
    borderRadius: RADIUS.full,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,180,171,0.2)',
  },
  expiredText: {
    fontSize: 10,
    color: COLORS.error,
    fontWeight: '700',
  },
  postedTime: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginLeft: 'auto',
  },
});