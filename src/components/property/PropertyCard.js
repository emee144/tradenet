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
import { formatNaira, timeAgo } from '@utils/formatters';

const TYPE_CONFIG = {
  rent: { label: 'For Rent', icon: 'key-outline', color: '#60a5fa' },
  buy: { label: 'For Sale', icon: 'cash-outline', color: '#4ade80' },
  land: { label: 'Land', icon: 'earth-outline', color: '#fb923c' },
  commercial: { label: 'Commercial', icon: 'business-outline', color: '#c084fc' },
  shortlet: { label: 'Shortlet', icon: 'bed-outline', color: '#facc15' },
};

export default function PropertyCard({ property, onPress, onSave, saved = false }) {
  const {
    title,
    type,
    price,
    price_period,
    bedrooms,
    bathrooms,
    toilet,
    city,
    state,
    images,
    amenities,
    owner,
    created_at,
  } = property;

  const hasImage = images && images.length > 0;
  const config = TYPE_CONFIG[type] || TYPE_CONFIG.rent;
  const isVerified = owner?.nin_verified && owner?.photo_verified;
  const location = [city, state].filter(Boolean).join(', ') || 'Nigeria';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>

      {/* ── Image ── */}
      <View style={styles.imageWrap}>
        {hasImage ? (
          <Image source={{ uri: images[0] }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="home-outline" size={40} color={COLORS.primary} />
          </View>
        )}

        {/* Save */}
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={onSave}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name={saved ? 'heart' : 'heart-outline'}
            size={16}
            color={saved ? '#ef4444' : '#fff'}
          />
        </TouchableOpacity>

        {/* Type badge */}
        <View style={[styles.typeBadge, { borderColor: config.color + '50' }]}>
          <Ionicons name={config.icon} size={11} color={config.color} />
          <Text style={[styles.typeBadgeText, { color: config.color }]}>{config.label}</Text>
        </View>

        {/* Verified */}
        {isVerified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={11} color={COLORS.primary} />
            <Text style={styles.verifiedText}>VERIFIED</Text>
          </View>
        )}

        {/* Price */}
        <View style={styles.priceBadge}>
          <Text style={styles.priceText}>
            {formatNaira(price)}
            {price_period ? `/${price_period}` : ''}
          </Text>
        </View>
      </View>

      {/* ── Body ── */}
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>

        {/* Specs row */}
        {(bedrooms || bathrooms || toilet) ? (
          <View style={styles.specsRow}>
            {bedrooms ? (
              <View style={styles.specItem}>
                <Ionicons name="bed-outline" size={13} color={COLORS.textMuted} />
                <Text style={styles.specText}>{bedrooms} bed{bedrooms !== 1 ? 's' : ''}</Text>
              </View>
            ) : null}
            {bathrooms ? (
              <View style={styles.specItem}>
                <Ionicons name="water-outline" size={13} color={COLORS.textMuted} />
                <Text style={styles.specText}>{bathrooms} bath{bathrooms !== 1 ? 's' : ''}</Text>
              </View>
            ) : null}
            {toilet ? (
              <View style={styles.specItem}>
                <Ionicons name="reader-outline" size={13} color={COLORS.textMuted} />
                <Text style={styles.specText}>{toilet} toilet{toilet !== 1 ? 's' : ''}</Text>
              </View>
            ) : null}
            {amenities && amenities.length > 0 ? (
              <View style={styles.specItem}>
                <Ionicons name="checkmark-circle-outline" size={13} color={COLORS.textMuted} />
                <Text style={styles.specText}>{amenities.length} amenities</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.locationWrap}>
            <Ionicons name="location-outline" size={12} color={COLORS.textMuted} />
            <Text style={styles.locationText} numberOfLines={1}>{location}</Text>
          </View>
          <Text style={styles.postedTime}>{timeAgo(created_at)}</Text>
        </View>
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
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },

  // ── Image ──
  imageWrap: {
    height: 180,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.surfaceHighest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtn: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: RADIUS.full,
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderWidth: 1,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 44,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: RADIUS.sm,
    paddingVertical: 3,
    paddingHorizontal: 7,
  },
  verifiedText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  priceBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  priceText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textOnGold,
  },

  // ── Body ──
  body: {
    padding: 14,
    gap: 10,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },

  // ── Specs ──
  specsRow: {
    flexDirection: 'row',
    gap: 14,
  },
  specItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  specText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: COLORS.borderMuted,
    paddingTop: 10,
  },
  locationWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    flex: 1,
  },
  locationText: {
    fontSize: 12,
    color: COLORS.textMuted,
    flex: 1,
  },
  postedTime: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
});