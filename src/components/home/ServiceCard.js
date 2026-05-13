import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING } from '@constants/index';
import { formatNaira, timeAgo } from '@utils/formatters';

export default function ServiceCard({ service, onPress, onSave, saved = false }) {
  const {
    title,
    price,
    price_type,
    city,
    state,
    images,
    rating,
    total_reviews,
    provider,
    phone,
    whatsapp,
    created_at,
  } = service;

  const handleCall = (e) => {
    e.stopPropagation();
    const num = phone || provider?.phone;
    if (num) Linking.openURL(`tel:${num}`);
  };

  const handleWhatsApp = (e) => {
    e.stopPropagation();
    const num = whatsapp || phone || provider?.phone;
    if (!num) return;
    const intl = num.startsWith('0') ? `234${num.slice(1)}` : num.replace('+', '');
    Linking.openURL(`https://wa.me/${intl}`);
  };

  const hasImage = images && images.length > 0;
  const isVerified = provider?.nin_verified && provider?.photo_verified;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>

      {/* ── Image ── */}
      <View style={styles.imageWrap}>
        {hasImage ? (
          <Image source={{ uri: images[0] }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="construct-outline" size={36} color={COLORS.primary} />
          </View>
        )}

        {/* Save button */}
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

        {/* Verified badge */}
        {isVerified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={11} color={COLORS.primary} />
            <Text style={styles.verifiedText}>VERIFIED</Text>
          </View>
        )}

        {/* Price badge */}
        {price ? (
          <View style={styles.priceBadge}>
            <Text style={styles.priceText}>
              {formatNaira(price)}{price_type === 'hourly' ? '/hr' : ''}
            </Text>
          </View>
        ) : (
          <View style={styles.priceBadge}>
            <Text style={styles.priceText}>Negotiable</Text>
          </View>
        )}
      </View>

      {/* ── Body ── */}
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>

        {/* Provider */}
        {provider && (
          <View style={styles.providerRow}>
            <View style={styles.providerAvatar}>
              {provider.avatar_url ? (
                <Image source={{ uri: provider.avatar_url }} style={styles.avatarImg} />
              ) : (
                <Text style={styles.avatarInitial}>
                  {provider.full_name?.[0] || '?'}
                </Text>
              )}
            </View>
            <Text style={styles.providerName} numberOfLines={1}>
              {provider.full_name || 'Provider'}
            </Text>
          </View>
        )}

        {/* Location + time + rating + contact */}
        <View style={styles.metaRow}>
          <View style={styles.locationWrap}>
            <Ionicons name="location-outline" size={12} color={COLORS.textMuted} />
            <Text style={styles.locationText} numberOfLines={1}>
              {[city, state].filter(Boolean).join(', ') || 'Nigeria'}
            </Text>
            {created_at && <Text style={styles.timeText}> · {timeAgo(created_at)}</Text>}
          </View>
          <View style={styles.rightGroup}>
            {rating > 0 && (
              <View style={styles.ratingWrap}>
                <Ionicons name="star" size={11} color={COLORS.primary} />
                <Text style={styles.ratingText}>
                  {Number(rating).toFixed(1)}
                  {total_reviews > 0 && <Text style={styles.reviewCount}> ({total_reviews})</Text>}
                </Text>
              </View>
            )}
            {(phone || provider?.phone) && (
              <TouchableOpacity style={styles.contactIcon} onPress={handleCall}>
                <Ionicons name="call" size={13} color={COLORS.primary} />
              </TouchableOpacity>
            )}
            {(whatsapp || phone || provider?.phone) && (
              <TouchableOpacity style={styles.waIcon} onPress={handleWhatsApp}>
                <Ionicons name="logo-whatsapp" size={13} color="#25D366" />
              </TouchableOpacity>
            )}
          </View>
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
    height: 150,
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
  verifiedBadge: {
    position: 'absolute',
    top: 10,
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
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  priceText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textOnGold,
  },

  // ── Body ──
  body: {
    padding: 14,
    gap: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },

  // ── Provider ──
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  providerAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.primaryMuted,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarInitial: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
  },
  providerName: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },

  // ── Meta ──
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  locationWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    flex: 1,
  },
  locationText: {
    fontSize: 11,
    color: COLORS.textMuted,
    flex: 1,
  },
  timeText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  rightGroup: { flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 8 },
  contactIcon: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: COLORS.primaryMuted, borderWidth: 1,
    borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center',
  },
  waIcon: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(37,211,102,0.1)', borderWidth: 1,
    borderColor: 'rgba(37,211,102,0.3)', alignItems: 'center', justifyContent: 'center',
  },
  ratingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: COLORS.primaryMuted,
    borderRadius: RADIUS.full,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
  },
  reviewCount: {
    fontWeight: '400',
    color: COLORS.textMuted,
  },
});