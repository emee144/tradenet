import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING } from '@constants/index';
import { formatNaira, timeAgo } from '@utils/formatters';

export default function ElectronicsCard({ item, onPress }) {
  const {
    title,
    price,
    brand,
    condition,
    images,
    city,
    state,
    created_at,
    seller,
    phone,
    whatsapp,
  } = item;

  const handleCall = (e) => {
    e.stopPropagation();
    const num = phone || seller?.phone;
    if (num) Linking.openURL(`tel:${num}`);
  };

  const handleWhatsApp = (e) => {
    e.stopPropagation();
    const num = whatsapp || phone || seller?.phone;
    if (!num) return;
    const intl = num.startsWith('0') ? `234${num.slice(1)}` : num.replace('+', '');
    Linking.openURL(`https://wa.me/${intl}`);
  };

  const hasImage = images && images.length > 0;
  const firstImage = hasImage ? images[0] : null;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.imageContainer}>
        {firstImage ? (
          <Image source={{ uri: firstImage }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.placeholder}>
            <Ionicons name="laptop-outline" size={48} color={COLORS.textMuted} />
          </View>
        )}

        <View style={styles.priceBadge}>
          <Text style={styles.priceText}>{formatNaira(price)}</Text>
        </View>
      </View>

      <View style={styles.details}>
        <Text style={styles.title} numberOfLines={2}>{title}</Text>
        <Text style={styles.brand}>{brand}</Text>

        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={14} color={COLORS.textMuted} />
          <Text style={styles.location}>{city}, {state}</Text>
          <Text style={styles.time}>{timeAgo(created_at)}</Text>
        </View>

        {seller && (
          <View style={styles.sellerRow}>
            <Image source={{ uri: seller.avatar_url }} style={styles.avatar} />
            <Text style={styles.sellerName}>{seller.full_name}</Text>
            {seller.verified && <Ionicons name="checkmark-circle" size={14} color="#22c55e" />}
          </View>
        )}

        {(phone || whatsapp || seller?.phone) && (
          <View style={styles.contactCol}>
            {(phone || seller?.phone) && (
              <TouchableOpacity style={styles.callBtn} onPress={handleCall}>
                <Ionicons name="call" size={14} color={COLORS.primary} />
                <Text style={styles.callText}>Call Seller</Text>
              </TouchableOpacity>
            )}
            {(whatsapp || phone || seller?.phone) && (
              <TouchableOpacity style={styles.waBtn} onPress={handleWhatsApp}>
                <Ionicons name="logo-whatsapp" size={14} color="#25D366" />
                <Text style={styles.waText}>WhatsApp</Text>
              </TouchableOpacity>
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
  imageContainer: { height: 180, position: 'relative' },
  image: { width: '100%', height: '100%' },
  placeholder: {
    flex: 1,
    backgroundColor: COLORS.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },

  priceBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  priceText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  details: { padding: SPACING.md },
  title: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  brand: { fontSize: 13, color: COLORS.textMuted, marginBottom: 8 },

  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 10 },
  location: { fontSize: 13, color: COLORS.textMuted, flex: 1 },
  time: { fontSize: 12, color: COLORS.textMuted },

  sellerRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  avatar: { width: 24, height: 24, borderRadius: 12, marginRight: 8 },
  sellerName: { fontSize: 13, color: COLORS.textPrimary, flex: 1 },
  contactCol: { marginTop: 10, gap: 8 },
  callBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.primaryMuted, borderWidth: 1,
    borderColor: COLORS.border, borderRadius: RADIUS.md,
    paddingVertical: 9, paddingHorizontal: 14,
  },
  callText: { fontSize: 13, fontWeight: '600', color: COLORS.primary },
  waBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(37,211,102,0.08)', borderWidth: 1,
    borderColor: 'rgba(37,211,102,0.25)', borderRadius: RADIUS.md,
    paddingVertical: 9, paddingHorizontal: 14,
  },
  waText: { fontSize: 13, fontWeight: '600', color: '#25D366' },
});