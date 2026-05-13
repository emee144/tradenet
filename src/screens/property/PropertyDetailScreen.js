import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Image, FlatList, Dimensions,
  ActivityIndicator, Alert, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@lib/supabase';
import { useAuthStore } from '@stores/authStore';
import { COLORS, RADIUS, SPACING } from '@constants/index';
import { formatNaira, timeAgo } from '@utils/formatters';

const { width } = Dimensions.get('window');

const TYPE_CONFIG = {
  rent: { label: 'For Rent', color: '#60a5fa' },
  buy: { label: 'For Sale', color: '#4ade80' },
  land: { label: 'Land', color: '#fb923c' },
  commercial: { label: 'Commercial', color: '#c084fc' },
  shortlet: { label: 'Shortlet', color: '#facc15' },
};

export default function PropertyDetailScreen({ navigation, route }) {
  const { propertyId } = route.params;
  const { user } = useAuthStore();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    fetchProperty();
    checkIfSaved();
  }, [propertyId]);

  const fetchProperty = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*, owner:profiles(id, full_name, avatar_url, phone, nin_verified, photo_verified, city, state, rating, total_reviews)')
        .eq('id', propertyId).single();
      if (error) throw error;
      setProperty(data);
    } catch (error) {
      Alert.alert('Error', 'Could not load property details.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const checkIfSaved = async () => {
    if (!user) return;
    const { data } = await supabase.from('saved_items').select('id')
      .eq('user_id', user.id).eq('item_type', 'property').eq('item_id', propertyId).single();
    setSaved(!!data);
  };

  const toggleSave = async () => {
    if (!user) { Alert.alert('Login required', 'Please log in to save properties.'); return; }
    if (saved) {
      await supabase.from('saved_items').delete().eq('user_id', user.id).eq('item_type', 'property').eq('item_id', propertyId);
    } else {
      await supabase.from('saved_items').insert({ user_id: user.id, item_type: 'property', item_id: propertyId });
    }
    setSaved(!saved);
  };

  const handleCall = () => {
    const phone = property.phone || property.owner?.phone;
    if (!phone) return;
    Linking.openURL(`tel:${phone}`);
  };

  const handleWhatsApp = () => {
    const phone = property.whatsapp || property.phone || property.owner?.phone;
    if (!phone) return;
    const intl = phone.startsWith('0') ? `234${phone.slice(1)}` : phone.replace('+', '');
    const message = encodeURIComponent(`Hi, I saw your property on TradeNet: "${property.title}". Is it still available?`);
    Linking.openURL(`https://wa.me/${intl}?text=${message}`);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}><ActivityIndicator size="large" color={COLORS.primary} /></View>
      </SafeAreaView>
    );
  }

  if (!property) return null;

  const config = TYPE_CONFIG[property.type] || TYPE_CONFIG.rent;
  const isOwner = user?.id === property.owner_id;
  const images = property.images?.length > 0 ? property.images : [];
  const isVerifiedOwner = property.owner?.nin_verified && property.owner?.photo_verified;

  return (
    <SafeAreaView style={styles.safe}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{property.title}</Text>
        <TouchableOpacity style={styles.headerBtn} onPress={toggleSave}>
          <Ionicons name={saved ? 'heart' : 'heart-outline'} size={20} color={saved ? '#ef4444' : COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Image carousel ── */}
        {images.length > 0 ? (
          <View>
            <FlatList
              data={images}
              keyExtractor={(_, i) => String(i)}
              horizontal pagingEnabled showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => setActiveImage(Math.round(e.nativeEvent.contentOffset.x / width))}
              renderItem={({ item }) => (
                <Image source={{ uri: item }} style={styles.propImage} resizeMode="cover" />
              )}
            />
            {images.length > 1 && (
              <View style={styles.dots}>
                {images.map((_, i) => (
                  <View key={i} style={[styles.dot, i === activeImage && styles.dotActive]} />
                ))}
              </View>
            )}
          </View>
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="home-outline" size={64} color={COLORS.primary} />
          </View>
        )}

        <View style={styles.body}>

          {/* ── Title + type badge ── */}
          <View style={styles.titleRow}>
            <Text style={styles.propTitle}>{property.title}</Text>
            <View style={[styles.typeBadge, { borderColor: config.color + '50' }]}>
              <View style={[styles.typeDot, { backgroundColor: config.color }]} />
              <Text style={[styles.typeBadgeText, { color: config.color }]}>{config.label}</Text>
            </View>
          </View>

          {/* ── Price ── */}
          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatNaira(property.price)}</Text>
            {property.price_period && (
              <Text style={styles.pricePeriod}>/{property.price_period}</Text>
            )}
          </View>

          {/* ── Specs grid ── */}
          <View style={styles.specsGrid}>
            {property.bedrooms != null && (
              <SpecItem icon="bed-outline" label="Bedrooms" value={String(property.bedrooms)} />
            )}
            {property.bathrooms != null && (
              <SpecItem icon="water-outline" label="Bathrooms" value={String(property.bathrooms)} />
            )}
            {property.toilet != null && (
              <SpecItem icon="reader-outline" label="Toilets" value={String(property.toilet)} />
            )}
            {property.city && (
              <SpecItem icon="location-outline" label="Location"
                value={[property.city, property.state].filter(Boolean).join(', ')} />
            )}
            {property.address && (
              <SpecItem icon="map-outline" label="Address" value={property.address} />
            )}
          </View>

          {/* ── Amenities ── */}
          {property.amenities && property.amenities.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Amenities</Text>
              <View style={styles.amenitiesWrap}>
                {property.amenities.map((a, i) => (
                  <View key={i} style={styles.amenityChip}>
                    <Ionicons name="checkmark-circle" size={13} color={COLORS.primary} />
                    <Text style={styles.amenityText}>{a}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ── Description ── */}
          {property.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <View style={styles.descCard}>
                <Text style={styles.description}>{property.description}</Text>
              </View>
            </View>
          )}

          {/* ── Contact ── */}
          {(property.phone || property.whatsapp) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Contact</Text>
              <View style={styles.contactCard}>
                {property.phone && (
                  <TouchableOpacity style={styles.contactRow} onPress={handleCall}>
                    <View style={styles.contactIconWrap}>
                      <Ionicons name="call-outline" size={17} color={COLORS.textPrimary} />
                    </View>
                    <Text style={styles.contactNumber}>{property.phone}</Text>
                    <Text style={styles.contactAction}>Call</Text>
                  </TouchableOpacity>
                )}
                {property.phone && property.whatsapp && <View style={styles.contactDivider} />}
                {property.whatsapp && (
                  <TouchableOpacity style={styles.contactRow} onPress={handleWhatsApp}>
                    <View style={[styles.contactIconWrap, styles.waIconWrap]}>
                      <Ionicons name="logo-whatsapp" size={17} color="#25D366" />
                    </View>
                    <Text style={styles.contactNumber}>{property.whatsapp}</Text>
                    <Text style={[styles.contactAction, { color: '#25D366' }]}>WhatsApp</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* ── Owner card ── */}
          {property.owner && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Listed by</Text>
              <View style={styles.ownerCard}>
                <View style={styles.ownerAvatarWrap}>
                  {property.owner.avatar_url ? (
                    <Image source={{ uri: property.owner.avatar_url }} style={styles.ownerAvatar} />
                  ) : (
                    <Text style={styles.ownerInitial}>
                      {property.owner.full_name?.[0]?.toUpperCase() || '?'}
                    </Text>
                  )}
                  {isVerifiedOwner && (
                    <View style={styles.ownerVerifiedDot}>
                      <Ionicons name="checkmark" size={8} color={COLORS.textOnGold} />
                    </View>
                  )}
                </View>
                <View style={styles.ownerInfo}>
                  <Text style={styles.ownerName}>{property.owner.full_name}</Text>
                  <Text style={styles.ownerLocation}>
                    {[property.owner.city, property.owner.state].filter(Boolean).join(', ') || 'Nigeria'}
                  </Text>
                  {isVerifiedOwner && (
                    <View style={styles.verifiedBadge}>
                      <Ionicons name="shield-checkmark" size={10} color={COLORS.primary} />
                      <Text style={styles.verifiedText}>NIN & Photo Verified</Text>
                    </View>
                  )}
                </View>
                {property.owner.rating > 0 && (
                  <View style={styles.ratingBadge}>
                    <Ionicons name="star" size={11} color={COLORS.primary} />
                    <Text style={styles.ratingText}>{Number(property.owner.rating).toFixed(1)}</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          <Text style={styles.postedTime}>Posted {timeAgo(property.created_at)}</Text>
          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* ── Bottom actions ── */}
      {!isOwner ? (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.whatsappBtn} onPress={handleWhatsApp}>
            <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
            <Text style={styles.whatsappText}>WhatsApp</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.callBtn} onPress={handleCall}>
            <Ionicons name="call" size={18} color={COLORS.textOnGold} />
            <Text style={styles.callText}>Call Owner</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => navigation.navigate('EditProperty', { propertyId: property.id })}
          >
            <Ionicons name="create-outline" size={18} color={COLORS.textOnGold} />
            <Text style={styles.editText}>Edit Listing</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

function SpecItem({ icon, label, value }) {
  return (
    <View style={styles.specItem}>
      <View style={styles.specIconWrap}>
        <Ionicons name={icon} size={16} color={COLORS.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.specLabel}>{label}</Text>
        <Text style={styles.specValue} numberOfLines={1}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // ── Header ──
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.margin, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: COLORS.borderMuted,
    backgroundColor: COLORS.background,
  },
  headerBtn: {
    width: 38, height: 38, borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceHigh, borderWidth: 1,
    borderColor: COLORS.borderMuted, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, textAlign: 'center', marginHorizontal: 8 },

  // ── Images ──
  scroll: { flex: 1, backgroundColor: COLORS.background },
  propImage: { width, height: 280 },
  imagePlaceholder: {
    width: '100%', height: 220,
    backgroundColor: COLORS.surfaceHighest, alignItems: 'center', justifyContent: 'center',
  },
  dots: {
    flexDirection: 'row', justifyContent: 'center', gap: 5,
    paddingVertical: 10, backgroundColor: COLORS.surfaceLow,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.surfaceHighest },
  dotActive: { backgroundColor: COLORS.primary, width: 18 },

  // ── Body ──
  body: { padding: SPACING.margin },
  titleRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    justifyContent: 'space-between', gap: 10, marginBottom: 10,
  },
  propTitle: { flex: 1, fontSize: 20, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.3 },
  typeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: RADIUS.full, paddingVertical: 5, paddingHorizontal: 10,
    borderWidth: 1, backgroundColor: 'transparent', flexShrink: 0,
  },
  typeDot: { width: 7, height: 7, borderRadius: 4 },
  typeBadgeText: { fontSize: 11, fontWeight: '700' },

  // ── Price ──
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginBottom: 16 },
  price: { fontSize: 28, fontWeight: '800', color: COLORS.primary, letterSpacing: -0.5 },
  pricePeriod: { fontSize: 14, color: COLORS.textMuted, fontWeight: '500' },

  // ── Specs ──
  specsGrid: {
    backgroundColor: COLORS.surfaceHigh, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.borderMuted,
    padding: 14, flexDirection: 'row', flexWrap: 'wrap',
    gap: 14, marginBottom: 20,
  },
  specItem: { flexDirection: 'row', alignItems: 'center', gap: 10, width: '45%' },
  specIconWrap: {
    width: 34, height: 34, borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryMuted, borderWidth: 1,
    borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  specLabel: { fontSize: 11, color: COLORS.textMuted, marginBottom: 2 },
  specValue: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },

  // ── Section ──
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 10 },

  // ── Amenities ──
  amenitiesWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  amenityChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: COLORS.surfaceHigh, borderWidth: 1,
    borderColor: COLORS.borderMuted, borderRadius: RADIUS.full,
    paddingVertical: 5, paddingHorizontal: 10,
  },
  amenityText: { fontSize: 12, fontWeight: '500', color: COLORS.textSecondary },

  // ── Description ──
  descCard: {
    backgroundColor: COLORS.surfaceHigh, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.borderMuted, padding: 14,
  },
  description: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 22 },

  // ── Contact ──
  contactCard: {
    backgroundColor: COLORS.surfaceHigh, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.borderMuted, overflow: 'hidden',
  },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  contactIconWrap: {
    width: 38, height: 38, borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceHighest, borderWidth: 1,
    borderColor: COLORS.borderMuted, alignItems: 'center', justifyContent: 'center',
  },
  waIconWrap: { backgroundColor: 'rgba(37,211,102,0.1)', borderColor: 'rgba(37,211,102,0.3)' },
  contactNumber: { flex: 1, fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  contactAction: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
  contactDivider: { height: 1, backgroundColor: COLORS.borderMuted, marginHorizontal: 14 },

  // ── Owner card ──
  ownerCard: {
    backgroundColor: COLORS.surfaceHigh, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.borderMuted,
    padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  ownerAvatarWrap: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: COLORS.primaryMuted, borderWidth: 2,
    borderColor: COLORS.border, alignItems: 'center',
    justifyContent: 'center', position: 'relative', flexShrink: 0,
  },
  ownerAvatar: { width: 50, height: 50, borderRadius: 25 },
  ownerInitial: { fontSize: 18, fontWeight: '800', color: COLORS.primary },
  ownerVerifiedDot: {
    position: 'absolute', bottom: 0, right: 0,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: COLORS.primary, alignItems: 'center',
    justifyContent: 'center', borderWidth: 2, borderColor: COLORS.surfaceHigh,
  },
  ownerInfo: { flex: 1, gap: 3 },
  ownerName: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  ownerLocation: { fontSize: 12, color: COLORS.textSecondary },
  verifiedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: COLORS.primaryMuted, borderRadius: RADIUS.full,
    paddingVertical: 2, paddingHorizontal: 7, borderWidth: 1,
    borderColor: COLORS.border, alignSelf: 'flex-start',
  },
  verifiedText: { fontSize: 10, color: COLORS.primary, fontWeight: '700' },
  ratingBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: COLORS.primaryMuted, borderRadius: RADIUS.full,
    paddingVertical: 4, paddingHorizontal: 10, borderWidth: 1, borderColor: COLORS.border,
  },
  ratingText: { fontSize: 12, fontWeight: '700', color: COLORS.primary },

  postedTime: { fontSize: 12, color: COLORS.textMuted, textAlign: 'center', marginBottom: 10 },

  // ── Bottom actions ──
  actions: {
    flexDirection: 'row', gap: 10,
    paddingHorizontal: SPACING.margin, paddingVertical: 12,
    backgroundColor: COLORS.surfaceLow, borderTopWidth: 1, borderTopColor: COLORS.borderMuted,
  },
  whatsappBtn: {
    flex: 1, height: 50, borderRadius: RADIUS.md,
    borderWidth: 1.5, borderColor: '#25D366',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: 'rgba(37,211,102,0.08)',
  },
  whatsappText: { fontSize: 14, fontWeight: '700', color: '#25D366' },
  callBtn: {
    flex: 1, height: 50, borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 6,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
  },
  callText: { fontSize: 14, fontWeight: '700', color: COLORS.textOnGold },
  editBtn: {
    flex: 1, height: 50, borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 6,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
  },
  editText: { fontSize: 14, fontWeight: '700', color: COLORS.textOnGold },
});