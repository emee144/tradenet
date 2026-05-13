import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING } from '@constants/index';
import { formatNaira, timeAgo } from '@utils/formatters';

export default function CarCard({ car, onPress }) {
  const { title, make, model, year, type, price, price_period, mileage, city, state, images, owner, color, phone, whatsapp, created_at } = car;

  const handleCall = (e) => {
    e.stopPropagation();
    const num = phone || owner?.phone;
    if (num) Linking.openURL(`tel:${num}`);
  };

  const handleWhatsApp = (e) => {
    e.stopPropagation();
    const num = whatsapp || phone || owner?.phone;
    if (!num) return;
    const intl = num.startsWith('0') ? `234${num.slice(1)}` : num.replace('+', '');
    Linking.openURL(`https://wa.me/${intl}`);
  };
  const hasImage = images && images.length > 0;
  const isRental = type === 'rental';
  const isVerified = owner?.nin_verified && owner?.photo_verified;
  const location = [city, state].filter(Boolean).join(', ') || 'Nigeria';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>

      {/* ── Image ── */}
      <View style={styles.imageWrap}>
        {hasImage ? (
          <Image source={{ uri: images[0] }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.placeholder}>
            <Ionicons name="car-outline" size={48} color={COLORS.primary} />
          </View>
        )}

        {/* Type badge */}
        <View style={[styles.typeBadge, { borderColor: isRental ? '#60a5fa50' : '#4ade8050' }]}>
          <View style={[styles.typeDot, { backgroundColor: isRental ? '#60a5fa' : '#4ade80' }]} />
          <Text style={[styles.typeBadgeText, { color: isRental ? '#60a5fa' : '#4ade80' }]}>
            {isRental ? 'For Rent' : 'For Sale'}
          </Text>
        </View>

        {/* Verified badge */}
        {isVerified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={11} color={COLORS.primary} />
            <Text style={styles.verifiedText}>VERIFIED</Text>
          </View>
        )}

        {/* Price badge */}
        <View style={styles.priceBadge}>
          <Text style={styles.priceText}>
            {formatNaira(price)}{isRental && price_period ? `/${price_period}` : ''}
          </Text>
        </View>
      </View>

      {/* ── Body ── */}
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>

        {/* Details chips */}
        <View style={styles.detailsRow}>
          {year && (
            <View style={styles.chip}>
              <Ionicons name="calendar-outline" size={11} color={COLORS.textMuted} />
              <Text style={styles.chipText}>{year}</Text>
            </View>
          )}
          {mileage && (
            <View style={styles.chip}>
              <Ionicons name="speedometer-outline" size={11} color={COLORS.textMuted} />
              <Text style={styles.chipText}>{Number(mileage).toLocaleString()} km</Text>
            </View>
          )}
          {color && (
            <View style={styles.chip}>
              <Ionicons name="color-palette-outline" size={11} color={COLORS.textMuted} />
              <Text style={styles.chipText}>{color}</Text>
            </View>
          )}
        </View>

        {/* Location + time + contact */}
        <View style={styles.metaRow}>
          <View style={styles.locationWrap}>
            <Ionicons name="location-outline" size={12} color={COLORS.textMuted} />
            <Text style={styles.locationText} numberOfLines={1}>{location}</Text>
            {created_at && <Text style={styles.timeText}> · {timeAgo(created_at)}</Text>}
          </View>
          <View style={styles.contactBtns}>
            {(phone || owner?.phone) && (
              <TouchableOpacity style={styles.contactIcon} onPress={handleCall}>
                <Ionicons name="call" size={13} color={COLORS.primary} />
              </TouchableOpacity>
            )}
            {(whatsapp || phone || owner?.phone) && (
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
  imageWrap: { height: 160, position: 'relative' },
  image: { width: '100%', height: '100%' },
  placeholder: {
    width: '100%', height: '100%',
    backgroundColor: COLORS.surfaceHighest,
    alignItems: 'center', justifyContent: 'center',
  },
  typeBadge: {
    position: 'absolute', top: 10, left: 10,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(0,0,0,0.65)', borderRadius: RADIUS.full,
    paddingVertical: 4, paddingHorizontal: 10, borderWidth: 1,
  },
  typeDot: { width: 6, height: 6, borderRadius: 3 },
  typeBadgeText: { fontSize: 10, fontWeight: '700' },
  verifiedBadge: {
    position: 'absolute', top: 10, right: 10,
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: RADIUS.sm,
    paddingVertical: 3, paddingHorizontal: 7,
  },
  verifiedText: { fontSize: 9, fontWeight: '700', color: COLORS.primary, letterSpacing: 0.5 },
  priceBadge: {
    position: 'absolute', bottom: 10, left: 10,
    backgroundColor: COLORS.primary, borderRadius: RADIUS.full,
    paddingVertical: 4, paddingHorizontal: 12,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 4, elevation: 3,
  },
  priceText: { fontSize: 12, fontWeight: '700', color: COLORS.textOnGold },

  // ── Body ──
  body: { padding: 14, gap: 8 },
  title: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  detailsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.surfaceHighest, borderRadius: RADIUS.full,
    paddingVertical: 4, paddingHorizontal: 9, borderWidth: 1, borderColor: COLORS.borderMuted,
  },
  chipText: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '500' },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  locationWrap: { flexDirection: 'row', alignItems: 'center', gap: 3, flex: 1 },
  locationText: { fontSize: 11, color: COLORS.textMuted, flex: 1 },
  timeText: { fontSize: 11, color: COLORS.textMuted },
  contactBtns: { flexDirection: 'row', gap: 6, marginLeft: 8 },
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
});