import React, { useState, useEffect, useRef } from 'react';
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

export default function CarDetailScreen({ navigation, route }) {
  const { carId } = route.params;
  const { user } = useAuthStore();
  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => { fetchCar(); checkIfSaved(); }, [carId]);

  const fetchCar = async () => {
    try {
      const { data, error } = await supabase
        .from('cars')
        .select('*, owner:profiles(id, full_name, avatar_url, phone, nin_verified, photo_verified, city, state, rating)')
        .eq('id', carId).single();
      if (error) throw error;
      setCar(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load car details.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const checkIfSaved = async () => {
    if (!user) return;
    const { data } = await supabase.from('saved_items').select('id')
      .eq('user_id', user.id).eq('item_type', 'car').eq('item_id', carId).single();
    setSaved(!!data);
  };

  const toggleSave = async () => {
    if (!user) { Alert.alert('Login required', 'Please log in to save cars.'); return; }
    if (saved) {
      await supabase.from('saved_items').delete().eq('user_id', user.id).eq('item_type', 'car').eq('item_id', carId);
    } else {
      await supabase.from('saved_items').insert({ user_id: user.id, item_type: 'car', item_id: carId });
    }
    setSaved(!saved);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}><ActivityIndicator size="large" color={COLORS.primary} /></View>
      </SafeAreaView>
    );
  }

  if (!car) return null;

  const isRental = car.type === 'rental';
  const isOwner = user?.id === car.owner_id;
  const images = car.images?.length > 0 ? car.images : [];
  const contactPhone = car.phone || car.owner?.phone;
  const contactWhatsapp = car.whatsapp || car.phone || car.owner?.phone;
  const isVerifiedOwner = car.owner?.nin_verified && car.owner?.photo_verified;

  const handleCall = () => {
    if (!contactPhone) return;
    Linking.openURL(`tel:${contactPhone}`);
  };

  const handleWhatsApp = () => {
    if (!contactWhatsapp) return;
    const phone = contactWhatsapp.startsWith('0') ? `234${contactWhatsapp.slice(1)}` : contactWhatsapp.replace('+', '');
    const message = encodeURIComponent(`Hi, I saw your car on TradeNet: "${car.title}". Is it still available?`);
    Linking.openURL(`https://wa.me/${phone}?text=${message}`);
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{car.title}</Text>
        <TouchableOpacity style={styles.headerBtn} onPress={toggleSave}>
          <Ionicons name={saved ? 'heart' : 'heart-outline'} size={20} color={saved ? '#ef4444' : COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>

        {/* ── Image carousel ── */}
        {images.length > 0 ? (
          <View>
            <FlatList
              data={images}
              keyExtractor={(_, i) => String(i)}
              horizontal pagingEnabled showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => setActiveImage(Math.round(e.nativeEvent.contentOffset.x / width))}
              renderItem={({ item }) => (
                <Image source={{ uri: item }} style={styles.carImage} resizeMode="cover" />
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
            <Ionicons name="car-outline" size={72} color={COLORS.primary} />
          </View>
        )}

        <View style={styles.body}>

          {/* ── Title + type badge ── */}
          <View style={styles.titleRow}>
            <Text style={styles.carTitle}>{car.title}</Text>
            <View style={[styles.typeBadge, { borderColor: isRental ? '#60a5fa50' : '#4ade8050' }]}>
              <View style={[styles.typeDot, { backgroundColor: isRental ? '#60a5fa' : '#4ade80' }]} />
              <Text style={[styles.typeBadgeText, { color: isRental ? '#60a5fa' : '#4ade80' }]}>
                {isRental ? 'For Rent' : 'For Sale'}
              </Text>
            </View>
          </View>

          {/* ── Price ── */}
          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatNaira(car.price)}</Text>
            {isRental && car.price_period && (
              <Text style={styles.pricePeriod}>/{car.price_period}</Text>
            )}
          </View>

          {/* ── Specs grid ── */}
          <View style={styles.specsGrid}>
            {car.make && <SpecItem icon="car-outline" label="Make" value={car.make} />}
            {car.model && <SpecItem icon="git-branch-outline" label="Model" value={car.model} />}
            {car.year && <SpecItem icon="calendar-outline" label="Year" value={String(car.year)} />}
            {car.color && <SpecItem icon="color-palette-outline" label="Color" value={car.color} />}
            {car.mileage && (
              <SpecItem icon="speedometer-outline" label="Mileage" value={`${Number(car.mileage).toLocaleString()} km`} />
            )}
            {(car.city || car.state) && (
              <SpecItem icon="location-outline" label="Location"
                value={[car.city, car.state].filter(Boolean).join(', ')} />
            )}
          </View>

          {/* ── Description ── */}
          {car.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{car.description}</Text>
            </View>
          )}

          {/* ── Contact ── */}
          {(contactPhone || contactWhatsapp) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Contact Seller</Text>
              <View style={styles.contactCard}>
                {contactPhone && (
                  <TouchableOpacity style={styles.contactRow} onPress={handleCall}>
                    <View style={styles.contactIconWrap}>
                      <Ionicons name="call-outline" size={17} color={COLORS.textPrimary} />
                    </View>
                    <Text style={styles.contactNumber}>{contactPhone}</Text>
                    <Text style={styles.contactAction}>Call</Text>
                  </TouchableOpacity>
                )}
                {contactPhone && contactWhatsapp && <View style={styles.contactDivider} />}
                {contactWhatsapp && (
                  <TouchableOpacity style={styles.contactRow} onPress={handleWhatsApp}>
                    <View style={[styles.contactIconWrap, styles.waIconWrap]}>
                      <Ionicons name="logo-whatsapp" size={17} color="#25D366" />
                    </View>
                    <Text style={styles.contactNumber}>{contactWhatsapp}</Text>
                    <Text style={[styles.contactAction, { color: '#25D366' }]}>WhatsApp</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* ── Owner card ── */}
          {car.owner && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Listed by</Text>
              <View style={styles.ownerCard}>
                <View style={styles.ownerAvatarWrap}>
                  {car.owner.avatar_url ? (
                    <Image source={{ uri: car.owner.avatar_url }} style={styles.ownerAvatar} />
                  ) : (
                    <Text style={styles.ownerInitial}>
                      {car.owner.full_name?.[0]?.toUpperCase() || '?'}
                    </Text>
                  )}
                  {isVerifiedOwner && (
                    <View style={styles.ownerVerifiedDot}>
                      <Ionicons name="checkmark" size={8} color={COLORS.textOnGold} />
                    </View>
                  )}
                </View>
                <View style={styles.ownerInfo}>
                  <Text style={styles.ownerName}>{car.owner.full_name}</Text>
                  <Text style={styles.ownerLocation}>
                    {[car.owner.city, car.owner.state].filter(Boolean).join(', ') || 'Nigeria'}
                  </Text>
                  {isVerifiedOwner && (
                    <View style={styles.verifiedBadge}>
                      <Ionicons name="shield-checkmark" size={10} color={COLORS.primary} />
                      <Text style={styles.verifiedText}>NIN & Photo Verified</Text>
                    </View>
                  )}
                </View>
                {car.owner.rating > 0 && (
                  <View style={styles.ratingBadge}>
                    <Ionicons name="star" size={11} color={COLORS.primary} />
                    <Text style={styles.ratingText}>{Number(car.owner.rating).toFixed(1)}</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          <Text style={styles.postedTime}>Posted {timeAgo(car.created_at)}</Text>
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
            <Text style={styles.callText}>Call Seller</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => navigation.navigate('EditCar', { carId: car.id })}
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

  // ── Image ──
  scroll: { flex: 1, backgroundColor: COLORS.background },
  carImage: { width, height: 260 },
  imagePlaceholder: {
    width: '100%', height: 240,
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
  carTitle: { flex: 1, fontSize: 20, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.3 },
  typeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: RADIUS.full, paddingVertical: 5, paddingHorizontal: 10,
    borderWidth: 1, flexShrink: 0,
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
  specItem: { flexDirection: 'row', alignItems: 'center', gap: 10, width: '47%' },
  specIconWrap: {
    width: 34, height: 34, borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryMuted, borderWidth: 1,
    borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  specLabel: { fontSize: 11, color: COLORS.textMuted, marginBottom: 2 },
  specValue: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },

  // ── Section ──
  section: {
    backgroundColor: COLORS.surfaceHigh, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.borderMuted,
    padding: 14, marginBottom: 16,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 12 },
  description: { fontSize: 14, lineHeight: 22, color: COLORS.textSecondary },

  // ── Contact ──
  contactCard: {
    borderRadius: RADIUS.md, overflow: 'hidden',
    borderWidth: 1, borderColor: COLORS.borderMuted,
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

  // ── Owner ──
  ownerCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  ownerAvatarWrap: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: COLORS.primaryMuted, borderWidth: 2,
    borderColor: COLORS.border, alignItems: 'center',
    justifyContent: 'center', position: 'relative', flexShrink: 0,
  },
  ownerAvatar: { width: 52, height: 52, borderRadius: 26 },
  ownerInitial: { fontSize: 20, fontWeight: '800', color: COLORS.primary },
  ownerVerifiedDot: {
    position: 'absolute', bottom: 0, right: 0,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: COLORS.primary, alignItems: 'center',
    justifyContent: 'center', borderWidth: 2, borderColor: COLORS.surfaceHigh,
  },
  ownerInfo: { flex: 1, gap: 3 },
  ownerName: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
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

  postedTime: { fontSize: 12, color: COLORS.textMuted, textAlign: 'center', marginTop: 4 },

  // ── Bottom actions ──
  actions: {
    flexDirection: 'row', gap: 10,
    paddingHorizontal: SPACING.margin, paddingVertical: 12,
    backgroundColor: COLORS.surfaceLow, borderTopWidth: 1, borderTopColor: COLORS.borderMuted,
  },
  whatsappBtn: {
    flex: 1, height: 50, borderRadius: RADIUS.md,
    borderWidth: 1.5, borderColor: '#25D366',
    backgroundColor: 'rgba(37,211,102,0.08)',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
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