import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING } from '@constants/index';

export default function ProviderCard({ provider, onPress }) {
  const {
    full_name,
    avatar_url,
    bio,
    city,
    state,
    rating,
    total_reviews,
    nin_verified,
    photo_verified,
  } = provider;

  const isVerified = nin_verified && photo_verified;
  const location = [city, state].filter(Boolean).join(', ') || 'Nigeria';
  const initial = full_name?.[0]?.toUpperCase() || '?';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>

      {/* ── Avatar + Info ── */}
      <View style={styles.topRow}>
        <View style={styles.avatarWrap}>
          {avatar_url ? (
            <Image source={{ uri: avatar_url }} style={styles.avatar} />
          ) : (
            <Text style={styles.avatarInitial}>{initial}</Text>
          )}
          {isVerified && (
            <View style={styles.verifiedDot}>
              <Ionicons name="checkmark" size={8} color={COLORS.textOnGold} />
            </View>
          )}
        </View>

        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>{full_name}</Text>
            {isVerified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="shield-checkmark" size={11} color={COLORS.primary} />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            )}
          </View>

          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={12} color={COLORS.textMuted} />
            <Text style={styles.locationText} numberOfLines={1}>{location}</Text>
          </View>

          {rating > 0 && (
            <View style={styles.ratingRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                  key={star}
                  name={star <= Math.round(rating) ? 'star' : 'star-outline'}
                  size={12}
                  color={COLORS.primary}
                />
              ))}
              <Text style={styles.ratingText}>{Number(rating).toFixed(1)}</Text>
              {total_reviews > 0 && (
                <Text style={styles.reviewCount}>
                  ({total_reviews} review{total_reviews !== 1 ? 's' : ''})
                </Text>
              )}
            </View>
          )}
        </View>

        <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
      </View>

      {/* ── Bio ── */}
      {bio ? (
        <Text style={styles.bio} numberOfLines={2}>{bio}</Text>
      ) : null}

      {/* ── Footer ── */}
      <View style={styles.footer}>
        <View style={styles.footerItem}>
          <Ionicons name="construct-outline" size={13} color={COLORS.primary} />
          <Text style={styles.footerText}>Provider</Text>
        </View>
        {isVerified && (
          <View style={styles.footerItem}>
            <Ionicons name="id-card-outline" size={13} color={COLORS.primary} />
            <Text style={styles.footerText}>NIN Verified</Text>
          </View>
        )}
        <TouchableOpacity style={styles.viewBtn} onPress={onPress}>
          <Ionicons name="person-outline" size={13} color={COLORS.textOnGold} />
          <Text style={styles.viewBtnText}>View Profile</Text>
        </TouchableOpacity>
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

  // ── Top row ──
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  avatarWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primaryMuted,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  avatarInitial: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
  },
  verifiedDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.surfaceHigh,
  },
  info: { flex: 1, gap: 5 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    flex: 1,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: COLORS.primaryMuted,
    borderRadius: RADIUS.full,
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexShrink: 0,
  },
  verifiedText: {
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: '700',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  locationText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    marginLeft: 2,
  },
  reviewCount: {
    fontSize: 11,
    color: COLORS.textMuted,
  },

  // ── Bio ──
  bio: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 19,
    marginBottom: 12,
    paddingLeft: 64,
  },

  // ── Footer ──
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderMuted,
    paddingTop: 12,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  footerText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  viewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginLeft: 'auto',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  viewBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textOnGold,
  },
});