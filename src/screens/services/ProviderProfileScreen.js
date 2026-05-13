import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Image, ActivityIndicator,
  RefreshControl, ScrollView, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@lib/supabase';
import { COLORS, RADIUS, SPACING } from '@constants/index';
import { formatNaira, timeAgo } from '@utils/formatters';

export default function ProviderProfileScreen({ navigation, route }) {
  const { providerId } = route.params;
  const [profile, setProfile] = useState(null);
  const [services, setServices] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('services');

  useEffect(() => { fetchProvider(); }, [providerId]);

  const fetchProvider = async () => {
    setLoading(true);
    try {
      const [profileRes, servicesRes, reviewsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', providerId).single(),
        supabase.from('services').select('*').eq('provider_id', providerId).eq('is_available', true).order('created_at', { ascending: false }),
        supabase.from('reviews').select('*, reviewer:profiles!reviewer_id(full_name, avatar_url)').eq('reviewed_id', providerId).order('created_at', { ascending: false }),
      ]);
      setProfile(profileRes.data);
      setServices(servicesRes.data || []);
      setReviews(reviewsRes.data || []);
    } catch (err) {
      console.error('fetchProvider:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => { setRefreshing(true); await fetchProvider(); setRefreshing(false); };

  const isVerified = profile?.nin_verified && profile?.photo_verified;
  const initial = profile?.full_name?.[0]?.toUpperCase() || '?';
  const location = [profile?.city, profile?.state].filter(Boolean).join(', ') || 'Nigeria';

  const getPriceLabel = (service) => {
    if (!service.price) return 'Negotiable';
    if (service.price_type === 'hourly') return `${formatNaira(service.price)}/hr`;
    return formatNaira(service.price);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingHeader}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        {/* ── Hero ── */}
        <View style={styles.hero}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color={COLORS.textPrimary} />
          </TouchableOpacity>

          {/* Avatar */}
          <View style={styles.avatarWrap}>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
            ) : (
              <Text style={styles.avatarInitial}>{initial}</Text>
            )}
            {isVerified && (
              <View style={styles.verifiedDot}>
                <Ionicons name="checkmark" size={9} color={COLORS.textOnGold} />
              </View>
            )}
          </View>

          <Text style={styles.name}>{profile?.full_name || 'Provider'}</Text>

          {/* Location */}
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={13} color={COLORS.textMuted} />
            <Text style={styles.locationText}>{location}</Text>
          </View>

          {/* Verified badge */}
          {isVerified && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="shield-checkmark" size={13} color={COLORS.primary} />
              <Text style={styles.verifiedText}>Verified Account</Text>
            </View>
          )}

          {/* Stats row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{services.length}</Text>
              <Text style={styles.statLabel}>Services</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{Number(profile?.rating || 0).toFixed(1)}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{profile?.total_reviews || 0}</Text>
              <Text style={styles.statLabel}>Reviews</Text>
            </View>
          </View>

          {/* Bio */}
          {profile?.bio ? (
            <Text style={styles.bio}>{profile.bio}</Text>
          ) : null}
        </View>

        {/* ── Tabs ── */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'services' && styles.tabActive]}
            onPress={() => setActiveTab('services')}
          >
            <Ionicons name="construct-outline" size={15} color={activeTab === 'services' ? COLORS.textOnGold : COLORS.textSecondary} />
            <Text style={[styles.tabText, activeTab === 'services' && styles.tabTextActive]}>
              Services ({services.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'reviews' && styles.tabActive]}
            onPress={() => setActiveTab('reviews')}
          >
            <Ionicons name="star-outline" size={15} color={activeTab === 'reviews' ? COLORS.textOnGold : COLORS.textSecondary} />
            <Text style={[styles.tabText, activeTab === 'reviews' && styles.tabTextActive]}>
              Reviews ({reviews.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Services tab ── */}
        {activeTab === 'services' && (
          <View style={styles.tabContent}>
            {services.length === 0 ? (
              <View style={styles.emptyTab}>
                <Ionicons name="construct-outline" size={28} color={COLORS.textMuted} />
                <Text style={styles.emptyTabText}>No services listed yet</Text>
              </View>
            ) : (
              services.map((service) => {
                const hasImage = service.images && service.images.length > 0;
                return (
                  <TouchableOpacity
                    key={service.id}
                    style={styles.serviceCard}
                    onPress={() => navigation.navigate('ServiceDetail', { serviceId: service.id })}
                    activeOpacity={0.85}
                  >
                    <View style={styles.serviceImgWrap}>
                      {hasImage ? (
                        <Image source={{ uri: service.images[0] }} style={styles.serviceImg} resizeMode="cover" />
                      ) : (
                        <View style={styles.serviceImgPlaceholder}>
                          <Ionicons name="construct-outline" size={24} color={COLORS.primary} />
                        </View>
                      )}
                    </View>
                    <View style={styles.serviceBody}>
                      <Text style={styles.serviceTitle} numberOfLines={1}>{service.title}</Text>
                      <View style={styles.serviceMeta}>
                        <Ionicons name="location-outline" size={12} color={COLORS.textMuted} />
                        <Text style={styles.serviceMetaText} numberOfLines={1}>
                          {[service.city, service.state].filter(Boolean).join(', ') || 'Nigeria'}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.serviceRight}>
                      <Text style={styles.servicePrice}>{getPriceLabel(service)}</Text>
                      <Ionicons name="chevron-forward" size={14} color={COLORS.textMuted} />
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        )}

        {/* ── Reviews tab ── */}
        {activeTab === 'reviews' && (
          <View style={styles.tabContent}>
            {reviews.length === 0 ? (
              <View style={styles.emptyTab}>
                <Ionicons name="star-outline" size={28} color={COLORS.textMuted} />
                <Text style={styles.emptyTabText}>No reviews yet</Text>
              </View>
            ) : (
              reviews.map((review) => (
                <View key={review.id} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <View style={styles.reviewAvatarWrap}>
                      {review.reviewer?.avatar_url ? (
                        <Image source={{ uri: review.reviewer.avatar_url }} style={styles.reviewAvatar} />
                      ) : (
                        <Text style={styles.reviewAvatarInitial}>
                          {review.reviewer?.full_name?.[0]?.toUpperCase() || '?'}
                        </Text>
                      )}
                    </View>
                    <View style={styles.reviewInfo}>
                      <Text style={styles.reviewerName}>{review.reviewer?.full_name || 'User'}</Text>
                      <Text style={styles.reviewTime}>{timeAgo(review.created_at)}</Text>
                    </View>
                    <View style={styles.reviewStars}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Ionicons
                          key={star}
                          name={star <= review.rating ? 'star' : 'star-outline'}
                          size={13}
                          color={COLORS.primary}
                        />
                      ))}
                    </View>
                  </View>
                  {review.comment ? (
                    <Text style={styles.reviewComment}>{review.comment}</Text>
                  ) : null}
                </View>
              ))
            )}
          </View>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>

      {/* ── Contact FAB ── */}
      {profile?.phone && (
        <TouchableOpacity
          style={styles.contactFab}
          onPress={() => Linking.openURL(`tel:${profile.phone}`)}
          activeOpacity={0.85}
        >
          <Ionicons name="call-outline" size={20} color={COLORS.textOnGold} />
          <Text style={styles.contactFabText}>Contact Provider</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingHeader: {
    paddingHorizontal: SPACING.margin, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: COLORS.borderMuted,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceHigh, borderWidth: 1,
    borderColor: COLORS.borderMuted, alignItems: 'center', justifyContent: 'center',
  },

  // ── Hero ──
  hero: {
    backgroundColor: COLORS.surfaceLow,
    paddingHorizontal: SPACING.margin,
    paddingTop: 14,
    paddingBottom: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderMuted,
  },
  avatarWrap: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: COLORS.primaryMuted, borderWidth: 3,
    borderColor: COLORS.border, alignItems: 'center',
    justifyContent: 'center', marginTop: 16, marginBottom: 14,
    position: 'relative',
  },
  avatar: { width: 88, height: 88, borderRadius: 44 },
  avatarInitial: { fontSize: 32, fontWeight: '800', color: COLORS.primary },
  verifiedDot: {
    position: 'absolute', bottom: 2, right: 2,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: COLORS.primary, alignItems: 'center',
    justifyContent: 'center', borderWidth: 2, borderColor: COLORS.surfaceLow,
  },
  name: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 6, letterSpacing: -0.3 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 10 },
  locationText: { fontSize: 13, color: COLORS.textSecondary },
  verifiedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: COLORS.primaryMuted, borderRadius: RADIUS.full,
    paddingVertical: 5, paddingHorizontal: 14, borderWidth: 1,
    borderColor: COLORS.border, marginBottom: 16,
  },
  verifiedText: { fontSize: 12, fontWeight: '700', color: COLORS.primary },

  // ── Stats ──
  statsRow: {
    flexDirection: 'row', backgroundColor: COLORS.surfaceHigh,
    borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.borderMuted,
    width: '100%', marginBottom: 14,
  },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  statDivider: { width: 1, backgroundColor: COLORS.borderMuted, marginVertical: 10 },
  statValue: { fontSize: 20, fontWeight: '800', color: COLORS.primary, marginBottom: 2 },
  statLabel: { fontSize: 11, color: COLORS.textMuted, fontWeight: '500' },
  bio: {
    fontSize: 13, color: COLORS.textSecondary, textAlign: 'center',
    lineHeight: 20, paddingHorizontal: 10,
  },

  // ── Tabs ──
  tabs: {
    flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: COLORS.borderMuted,
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 14,
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabActive: {
    backgroundColor: COLORS.primaryMuted,
    borderBottomColor: COLORS.primary,
  },
  tabText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  tabTextActive: { color: COLORS.primary },

  // ── Tab content ──
  tabContent: { padding: SPACING.margin, gap: 10 },
  emptyTab: {
    alignItems: 'center', paddingVertical: 40, gap: 10,
  },
  emptyTabText: { fontSize: 14, color: COLORS.textMuted },

  // ── Service card ──
  serviceCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surfaceHigh, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.borderMuted, overflow: 'hidden',
  },
  serviceImgWrap: { width: 80, height: 80 },
  serviceImg: { width: '100%', height: '100%' },
  serviceImgPlaceholder: {
    width: '100%', height: '100%',
    backgroundColor: COLORS.surfaceHighest, alignItems: 'center', justifyContent: 'center',
  },
  serviceBody: { flex: 1, padding: 12, gap: 5 },
  serviceTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  serviceMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  serviceMetaText: { fontSize: 12, color: COLORS.textMuted },
  serviceRight: { paddingRight: 12, alignItems: 'flex-end', gap: 4 },
  servicePrice: { fontSize: 13, fontWeight: '700', color: COLORS.primary },

  // ── Review card ──
  reviewCard: {
    backgroundColor: COLORS.surfaceHigh, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.borderMuted, padding: 14,
  },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  reviewAvatarWrap: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.primaryMuted, borderWidth: 1,
    borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  reviewAvatar: { width: 36, height: 36, borderRadius: 18 },
  reviewAvatarInitial: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
  reviewInfo: { flex: 1 },
  reviewerName: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },
  reviewTime: { fontSize: 11, color: COLORS.textMuted },
  reviewStars: { flexDirection: 'row', gap: 2 },
  reviewComment: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 20 },

  // ── Contact FAB ──
  contactFab: {
    position: 'absolute', bottom: 20, left: SPACING.margin, right: SPACING.margin,
    backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, height: 54,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 10,
  },
  contactFabText: { fontSize: 16, fontWeight: '700', color: COLORS.textOnGold },
});