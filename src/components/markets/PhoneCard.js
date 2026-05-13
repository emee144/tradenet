import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING } from '@constants/index';
import { formatNaira, timeAgo } from '@utils/formatters';

export default function PhoneCard({ item, onPress }) {
  const {
    title,
    brand,
    model,
    price,
    condition,
    storage,
    color,
    images,
    city,
    state,
    created_at,
    seller,
  } = item;

  const hasImage = images && images.length > 0;
  const firstImage = hasImage ? images[0] : null;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      {/* Image */}
      <View style={styles.imageContainer}>
        {firstImage ? (
          <Image
            source={{ uri: firstImage }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholder}>
            <Ionicons name="phone-portrait-outline" size={48} color={COLORS.textMuted} />
          </View>
        )}

        {/* Condition Badge */}
        <View style={styles.conditionBadge}>
          <Text style={styles.conditionText}>{condition}</Text>
        </View>

        {/* Price Badge */}
        <View style={styles.priceBadge}>
          <Text style={styles.priceText}>{formatNaira(price)}</Text>
        </View>
      </View>

      {/* Details */}
      <View style={styles.details}>
        <Text style={styles.title} numberOfLines={2}>
          {title || `${brand} ${model}`}
        </Text>

        <Text style={styles.specs}>
          {storage} • {color}
        </Text>

        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={14} color={COLORS.textMuted} />
          <Text style={styles.location}>
            {city}, {state}
          </Text>
          <Text style={styles.time}>{timeAgo(created_at)}</Text>
        </View>

        {/* Seller Info */}
        {seller && (
          <View style={styles.sellerRow}>
            <Image
              source={{ uri: seller.avatar_url }}
              style={styles.avatar}
            />
            <Text style={styles.sellerName} numberOfLines={1}>
              {seller.full_name}
            </Text>
            {seller.verified && (
              <Ionicons name="checkmark-circle" size={14} color="#22c55e" />
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.margin,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.borderMuted,
  },

  imageContainer: {
    height: 180,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    backgroundColor: COLORS.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },

  conditionBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  conditionText: {
    color: COLORS.textOnGold,
    fontSize: 12,
    fontWeight: '700',
  },

  priceBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  priceText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },

  details: {
    padding: SPACING.md,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
    lineHeight: 22,
  },
  specs: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 8,
  },

  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 10,
  },
  location: {
    fontSize: 13,
    color: COLORS.textMuted,
    flex: 1,
  },
  time: {
    fontSize: 12,
    color: COLORS.textMuted,
  },

  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  sellerName: {
    fontSize: 13,
    color: COLORS.textPrimary,
    flex: 1,
  },
});