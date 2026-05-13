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
import { COLORS, RADIUS, SPACING, SERVICE_CATEGORIES } from '@constants/index';
import { formatNaira, timeAgo } from '@utils/formatters';

const { width } = Dimensions.get('window');

export default function ServiceDetailScreen({ navigation, route }) {
  const { serviceId } = route.params;
  const { user } = useAuthStore();
  const [service, setService] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    fetchService();
    fetchReviews();
    checkIfSaved();
  }, [serviceId]);

  const fetchService = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select(`*, provider:profiles(id, full_name, avatar_url, phone, nin_verified, photo_verified, city, state, rating, total_reviews, bio)`)
        .eq('id', serviceId).single();
      if (error) throw error;
      setService(data);
    } catch (error) {
      Alert.alert('Error', 'Could not load service details.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    const { data } = await supabase
      .from('reviews')
      .select('*, reviewer:profiles(full_name, avatar_url)')
      .eq('service_id', serviceId)
      .order('created_at', { ascending: false })
      .limit(5);
    setReviews(data || []);
  };

  const checkIfSaved = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('saved_items').select('id')
      .eq('user_id', user.id).eq('item_type', 'service').eq('item_id', serviceId).single();
    setSaved(!!data);
  };

  const toggleSave = async () => {
    if (!user) { Alert.alert('Login required', 'Please log in to save services.'); return; }
    if (saved) {
      await supabase.from('saved_items').delete().eq('user_id', user.id).eq('item_type', 'service').eq('item_id', serviceId);
    } else {
      await supabase.from('saved_items').insert({ user_id: user.id, item_type: 'service', item_id: serviceId });
    }
    setSaved(!saved);
  };

  const handleBook = async () => {
    if (!user) { Alert.alert('Login required', 'Please log in to book this service.'); return; }
    setBooking(true);
    try {
      const { error } = await supabase.from('bookings').insert({
        client_id: user.id, provider_id: service.provider_id,
        service_id: serviceId, status: 'pending', amount: service.price,
      });
      if (error) throw error;
      Alert.alert('Booking sent!', 'Your booking request has been sent. The provider will contact you shortly.');
    } catch (error) {
      Alert.alert('Error', error.message || 'Booking failed. Please try again.');
    } finally {
      setBooking(false);
    }
  };

  const handleCall = () => {
    const phone = service.phone || service.provider?.phone;
    if (!phone) return;
    Linking.openURL(`tel:${phone}`);
  };

  const handleWhatsApp = () => {
    const phone = service.whatsapp || service.phone || service.provider?.phone;
    if (!phone) return;
    const intl = phone.startsWith('0') ? `234${phone.slice(1)}` : phone.replace('+', '');
    const message = encodeURIComponent(`Hi, I saw your service on TradeNet: "${service.title}". I'd like to enquire.`);
    Linking.openURL(`https://wa.me/${intl}?text=${message}`);
  };

  const getCategoryName = (categoryId) => {
    const cat = SERVICE_CATEGORIES.find((c) => c.id === categoryId);
    return cat ? cat.name : categoryId;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}><ActivityIndicator size="large" color={COLORS.primary} /></View>
      </SafeAreaView>
    );
  }

  if (!service) return null;

  const isOwner = user?.id === service.provider_id;
  const images = service.images?.length > 0 ? service.images : [];
  const isVerifiedProvider = service.provider?.nin_verified && service.provider?.photo_verified;

  return (
    <SafeAreaView style={styles.safe}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{service.title}</Text>
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
                <Image source={{ uri: item }} style={styles.serviceImage} resizeMode="cover" />
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
            <Ionicons name="construct-outline" size={60} color={COLORS.primary} />
          </View>
        )}

        <View style={styles.body}>

          {/* ── Title + category ── */}
          <View style={styles.titleRow}>
            <Text style={styles.serviceTitle}>{service.title}</Text>
            <View style={styles.categoryTag}>
              <Ionicons name="construct-outline" size={11} color={COLORS.primary} />
              <Text style={styles.categoryTagText}>{getCategoryName(service.category_id)}</Text>
            </View>
          </View>

          {/* ── Chips ── */}
          <View style={styles.chipsRow}>
            {service.city || service.state ? (
              <View style={styles.chip}>
                <Ionicons name="location-outline" size={12} color={COLORS.textMuted} />
                <Text style={styles.chipText}>
                  {[service.city, service.state].filter(Boolean).join(', ')}
                </Text>
              </View>
            ) : null}
            {service.rating > 0 ? (
              <View style={[styles.chip, styles.ratingChip]}>
                <Ionicons name="star" size={12} color={COLORS.primary} />
                <Text style={[styles.chipText, { color: COLORS.primary }]}>
                  {Number(service.rating).toFixed(1)} ({service.total_reviews})
                </Text>
              </View>
            ) : null}
            <View style={styles.chip}>
              <Ionicons name="time-outline" size={12} color={COLORS.textMuted} />
              <Text style={styles.chipText}>
                {service.price_type === 'hourly' ? 'Hourly rate' : service.price_type === 'negotiable' ? 'Negotiable' : 'Fixed price'}
              </Text>
            </View>
          </View>

          {/* ── Price card ── */}
          <View style={styles.priceCard}>
            <View>
              <Text style={styles.priceLabel}>Starting price</Text>
              <Text style={styles.priceValue}>
                {service.price ? formatNaira(service.price) : 'Contact for price'}
                {service.price_type === 'hourly' ? <Text style={styles.priceSuffix}>/hr</Text> : null}
              </Text>
            </View>
            <View style={styles.priceActions}>
              <TouchableOpacity style={styles.iconBtn} onPress={handleCall}>
                <Ionicons name="call-outline" size={18} color={COLORS.textPrimary} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.iconBtn, styles.waBtn]} onPress={handleWhatsApp}>
                <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Provider card ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About the provider</Text>
            <TouchableOpacity
              style={styles.providerCard}
              onPress={() => navigation.navigate('ProviderProfile', { providerId: service.provider_id })}
              activeOpacity={0.85}
            >
              <View style={styles.providerAvatarWrap}>
                {service.provider?.avatar_url ? (
                  <Image source={{ uri: service.provider.avatar_url }} style={styles.providerAvatar} />
                ) : (
                  <Text style={styles.providerInitial}>
                    {service.provider?.full_name?.[0]?.toUpperCase() || '?'}
                  </Text>
                )}
                {isVerifiedProvider && (
                  <View style={styles.providerVerifiedDot}>
                    <Ionicons name="checkmark" size={8} color={COLORS.textOnGold} />
                  </View>
                )}
              </View>
              <View style={styles.providerInfo}>
                <Text style={styles.providerName}>{service.provider?.full_name}</Text>
                <Text style={styles.providerLocation}>
                  {[service.provider?.city, service.provider?.state].filter(Boolean).join(', ') || 'Nigeria'}
                </Text>
                {isVerifiedProvider && (
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="shield-checkmark" size={10} color={COLORS.primary} />
                    <Text style={styles.verifiedText}>NIN & Photo Verified</Text>
                  </View>
                )}
              </View>
              <View style={styles.providerRight}>
                {service.provider?.rating > 0 ? (
                  <View style={styles.ratingBadge}>
                    <Ionicons name="star" size={11} color={COLORS.primary} />
                    <Text style={styles.ratingText}>{Number(service.provider.rating).toFixed(1)}</Text>
                  </View>
                ) : null}
                <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
              </View>
            </TouchableOpacity>
            {service.provider?.bio ? (
              <Text style={styles.providerBio}>{service.provider.bio}</Text>
            ) : null}
          </View>

          {/* ── Description ── */}
          {service.description ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About this service</Text>
              <View style={styles.descCard}>
                <Text style={styles.description}>{service.description}</Text>
              </View>
            </View>
          ) : null}

          {/* ── Reviews ── */}
          {reviews.length > 0 ? (
            <View style={styles.section}>
              <View style={styles.sectionRow}>
                <Text style={styles.sectionTitle}>Reviews</Text>
                <Text style={styles.sectionCount}>{service.total_reviews} total</Text>
              </View>
              {reviews.map((review) => (
                <View key={review.id} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <View style={styles.reviewAvatarWrap}>
                      <Text style={styles.reviewInitial}>
                        {review.reviewer?.full_name?.[0]?.toUpperCase() || '?'}
                      </Text>
                    </View>
                    <View style={styles.reviewMeta}>
                      <Text style={styles.reviewName}>{review.reviewer?.full_name}</Text>
                      <View style={styles.reviewStars}>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Ionicons key={s} name={s <= review.rating ? 'star' : 'star-outline'} size={11} color={COLORS.primary} />
                        ))}
                      </View>
                    </View>
                    <Text style={styles.reviewTime}>{timeAgo(review.created_at)}</Text>
                  </View>
                  {review.comment ? <Text style={styles.reviewComment}>{review.comment}</Text> : null}
                </View>
              ))}
            </View>
          ) : null}

          <Text style={styles.postedTime}>Posted {timeAgo(service.created_at)}</Text>
          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* ── Bottom actions ── */}
      {!isOwner ? (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.saveActionBtn} onPress={toggleSave}>
            <Ionicons name={saved ? 'heart' : 'heart-outline'} size={20} color={saved ? '#ef4444' : COLORS.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.bookBtn, booking && styles.bookBtnDisabled]}
            onPress={handleBook} disabled={booking} activeOpacity={0.85}
          >
            {booking ? (
              <ActivityIndicator size="small" color={COLORS.textOnGold} />
            ) : (
              <>
                <Ionicons name="calendar-outline" size={18} color={COLORS.textOnGold} />
                <Text style={styles.bookText}>Book this service</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => navigation.navigate('EditService', { serviceId: service.id })}
          >
            <Ionicons name="create-outline" size={18} color={COLORS.textOnGold} />
            <Text style={styles.editText}>Edit service</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
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
  serviceImage: { width, height: 260 },
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
  titleRow: { marginBottom: 12 },
  serviceTitle: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 8, letterSpacing: -0.3 },
  categoryTag: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    alignSelf: 'flex-start', backgroundColor: COLORS.primaryMuted,
    borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.full, paddingVertical: 4, paddingHorizontal: 10,
  },
  categoryTagText: { fontSize: 11, fontWeight: '700', color: COLORS.primary },

  // ── Chips ──
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.surfaceHigh, borderWidth: 1, borderColor: COLORS.borderMuted,
    borderRadius: RADIUS.full, paddingVertical: 5, paddingHorizontal: 10,
  },
  ratingChip: { backgroundColor: COLORS.primaryMuted, borderColor: COLORS.border },
  chipText: { fontSize: 12, fontWeight: '500', color: COLORS.textSecondary },

  // ── Price card ──
  priceCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.surfaceHigh, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.borderMuted, padding: 16, marginBottom: 20,
  },
  priceLabel: { fontSize: 12, color: COLORS.textMuted, marginBottom: 4 },
  priceValue: { fontSize: 26, fontWeight: '800', color: COLORS.primary, letterSpacing: -0.5 },
  priceSuffix: { fontSize: 14, fontWeight: '400', color: COLORS.textMuted },
  priceActions: { flexDirection: 'row', gap: 10 },
  iconBtn: {
    width: 44, height: 44, borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceHighest, borderWidth: 1,
    borderColor: COLORS.borderMuted, alignItems: 'center', justifyContent: 'center',
  },
  waBtn: { backgroundColor: 'rgba(37,211,102,0.1)', borderColor: 'rgba(37,211,102,0.3)' },

  // ── Section ──
  section: { marginBottom: 20 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 10 },
  sectionCount: { fontSize: 12, color: COLORS.textMuted },

  // ── Provider card ──
  providerCard: {
    backgroundColor: COLORS.surfaceHigh, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.borderMuted,
    padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10,
  },
  providerAvatarWrap: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: COLORS.primaryMuted, borderWidth: 2,
    borderColor: COLORS.border, alignItems: 'center',
    justifyContent: 'center', position: 'relative', flexShrink: 0,
  },
  providerAvatar: { width: 50, height: 50, borderRadius: 25 },
  providerInitial: { fontSize: 18, fontWeight: '800', color: COLORS.primary },
  providerVerifiedDot: {
    position: 'absolute', bottom: 0, right: 0,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: COLORS.primary, alignItems: 'center',
    justifyContent: 'center', borderWidth: 2, borderColor: COLORS.surfaceHigh,
  },
  providerInfo: { flex: 1, gap: 3 },
  providerName: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  providerLocation: { fontSize: 12, color: COLORS.textSecondary },
  verifiedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: COLORS.primaryMuted, borderRadius: RADIUS.full,
    paddingVertical: 2, paddingHorizontal: 7, borderWidth: 1,
    borderColor: COLORS.border, alignSelf: 'flex-start',
  },
  verifiedText: { fontSize: 10, color: COLORS.primary, fontWeight: '700' },
  providerRight: { alignItems: 'center', gap: 6 },
  ratingBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: COLORS.primaryMuted, borderRadius: RADIUS.full,
    paddingVertical: 3, paddingHorizontal: 8, borderWidth: 1, borderColor: COLORS.border,
  },
  ratingText: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  providerBio: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 20, paddingHorizontal: 4 },

  // ── Description ──
  descCard: {
    backgroundColor: COLORS.surfaceHigh, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.borderMuted, padding: 14,
  },
  description: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 22 },

  // ── Reviews ──
  reviewCard: {
    backgroundColor: COLORS.surfaceHigh, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.borderMuted,
    padding: 14, marginBottom: 8,
  },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  reviewAvatarWrap: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: COLORS.primaryMuted, borderWidth: 1,
    borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  reviewInitial: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
  reviewMeta: { flex: 1 },
  reviewName: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 3 },
  reviewStars: { flexDirection: 'row', gap: 2 },
  reviewTime: { fontSize: 11, color: COLORS.textMuted },
  reviewComment: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 20 },

  postedTime: { fontSize: 12, color: COLORS.textMuted, textAlign: 'center', marginBottom: 10 },

  // ── Bottom actions ──
  actions: {
    flexDirection: 'row', gap: 10,
    paddingHorizontal: SPACING.margin, paddingVertical: 12,
    backgroundColor: COLORS.surfaceLow, borderTopWidth: 1, borderTopColor: COLORS.borderMuted,
  },
  saveActionBtn: {
    width: 50, height: 50, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.borderMuted,
    backgroundColor: COLORS.surfaceHigh, alignItems: 'center', justifyContent: 'center',
  },
  bookBtn: {
    flex: 1, height: 50, borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 7,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
  },
  bookBtnDisabled: { opacity: 0.6 },
  bookText: { fontSize: 15, fontWeight: '700', color: COLORS.textOnGold },
  editBtn: {
    flex: 1, height: 50, borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 6,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
  },
  editText: { fontSize: 14, fontWeight: '700', color: COLORS.textOnGold },
});