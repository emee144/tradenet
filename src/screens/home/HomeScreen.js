import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@lib/supabase';
import { useAuthStore } from '@stores/authStore';
import { COLORS, RADIUS, SPACING } from '@constants/index';
import { formatNaira } from '@utils/formatters';

const CATEGORIES = [
  { id: 'skills', label: 'Skills', icon: 'construct-outline', screen: 'ServicesMain' },
  { id: 'services', label: 'Services', icon: 'briefcase-outline', screen: 'ServicesMain' },
  { id: 'property', label: 'Property', icon: 'home-outline', screen: 'PropertyMain' },
  { id: 'cars', label: 'Vehicles', icon: 'car-outline', screen: 'CarsMain' },
  { id: 'jobs', label: 'Jobs', icon: 'bag-handle-outline', screen: 'JobsMain' },
  { id: 'market', label: 'Market', icon: 'storefront-outline', screen: 'MarketMain' },
];

export default function HomeScreen({ navigation }) {
  const { user, profile, fetchProfile } = useAuthStore();
  const [trending, setTrending] = useState([]);
  const [savedIds, setSavedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchTrending();
    fetchSaved();
  }, []);

  const fetchTrending = async () => {
    setLoading(true);
    try {
      const [servicesRes, propertiesRes, carsRes] = await Promise.all([
        supabase.from('services').select('*, provider:profiles(full_name, nin_verified, photo_verified, city, state)').eq('is_available', true).order('created_at', { ascending: false }).limit(4),
        supabase.from('properties').select('*, owner:profiles(full_name, nin_verified, photo_verified)').eq('is_available', true).order('created_at', { ascending: false }).limit(3),
        supabase.from('cars').select('*, owner:profiles(full_name, nin_verified, photo_verified)').eq('is_available', true).order('created_at', { ascending: false }).limit(3),
      ]);
      const services = (servicesRes.data || []).map((s) => ({ ...s, _type: 'service' }));
      const properties = (propertiesRes.data || []).map((p) => ({ ...p, _type: 'property' }));
      const cars = (carsRes.data || []).map((c) => ({ ...c, _type: 'car' }));
      setTrending([...services, ...properties, ...cars].sort(() => Math.random() - 0.5));
    } catch (err) {
      console.error('fetchTrending:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSaved = async () => {
    if (!user) return;
    const { data } = await supabase.from('saved_items').select('item_id').eq('user_id', user.id);
    setSavedIds((data || []).map((d) => d.item_id));
  };

  const toggleSave = async (item) => {
    if (!user) { navigation.navigate('Login'); return; }
    const isSaved = savedIds.includes(item.id);
    if (isSaved) {
      await supabase.from('saved_items').delete().eq('user_id', user.id).eq('item_id', item.id);
      setSavedIds((p) => p.filter((id) => id !== item.id));
    } else {
      await supabase.from('saved_items').insert({ user_id: user.id, item_type: item._type, item_id: item.id });
      setSavedIds((p) => [...p, item.id]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTrending();
    await fetchSaved();
    setRefreshing(false);
  };

  const navigateToItem = (item) => {
    if (item._type === 'service') navigation.navigate('ServiceDetail', { serviceId: item.id });
    else if (item._type === 'property') navigation.navigate('PropertyDetail', { propertyId: item.id });
    else if (item._type === 'car') navigation.navigate('CarDetail', { carId: item.id });
  };

  const getItemPrice = (item) => {
    if (item._type === 'service') return item.price ? `${formatNaira(item.price)}${item.price_type === 'hourly' ? '/hr' : ''}` : 'Negotiable';
    if (item._type === 'property') return `${formatNaira(item.price)}${item.price_period ? `/${item.price_period}` : ''}`;
    if (item._type === 'car') return `${formatNaira(item.price)}${item.type === 'rental' && item.price_period ? `/${item.price_period}` : ''}`;
    return '';
  };

  const getItemLocation = (item) => {
    const city = item.city || item.provider?.city || item.owner?.city || '';
    const state = item.state || item.provider?.state || item.owner?.state || '';
    return city ? `${city}${state ? `, ${state}` : ''}` : state || 'Nigeria';
  };

  const isVerified = (item) => {
    const person = item.provider || item.owner;
    return person?.nin_verified && person?.photo_verified;
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        {/* ── Top App Bar ── */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.locationBtn}>
            <Ionicons name="location-outline" size={16} color={COLORS.textSecondary} />
            <Text style={styles.locationText}>{profile?.city || 'Lagos'}, Nigeria</Text>
          </TouchableOpacity>
          <Text style={styles.appName}>TradeNet</Text>
          <TouchableOpacity style={styles.notifBtn} onPress={() => navigation.navigate('Notifications')}>
            <Ionicons name="notifications-outline" size={22} color={COLORS.textPrimary} />
            <View style={styles.notifDot} />
          </TouchableOpacity>
        </View>

        {/* ── Hero Banner ── */}
        <View style={styles.heroBannerWrap}>
          <ImageBackground
            source={{ uri: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800' }}
            style={styles.heroBanner}
            imageStyle={{ borderRadius: RADIUS.xl }}
          >
            <View style={styles.heroBannerOverlay} />
            <View style={styles.heroBannerContent}>
              <Text style={styles.heroBannerTitle}>Trade Skills & Goods{'\n'}in Nigeria</Text>
              <Text style={styles.heroBannerSub}>PREMIUM MARKETPLACE</Text>
            </View>
          </ImageBackground>
        </View>

        {/* ── Search bar ── */}
        <View style={styles.searchWrap}>
          <TouchableOpacity style={styles.searchBar} onPress={() => navigation.navigate('Search')} activeOpacity={0.85}>
            <Ionicons name="search-outline" size={18} color={COLORS.textMuted} />
            <Text style={styles.searchPlaceholder}>Find services, properties, cars...</Text>
          </TouchableOpacity>
        </View>

        {/* ── Browse Categories ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Browse Categories</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Search', { browseAll: true })}>
              <Text style={styles.sectionLink}>View All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity key={cat.id} style={styles.categoryCard} onPress={() => navigation.navigate(cat.screen)} activeOpacity={0.75}>
                <View style={styles.categoryIconWrap}>
                  <Ionicons name={cat.icon} size={24} color={COLORS.primary} />
                </View>
                <Text style={styles.categoryLabel}>{cat.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Trending Near You ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Trending Near You</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Search', { browseAll: true })}>
              <Text style={styles.sectionLink}>View All</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.centered}><ActivityIndicator size="large" color={COLORS.primary} /></View>
          ) : (
            <FlatList
              data={trending}
              keyExtractor={(item) => `${item._type}-${item.id}`}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.trendingList}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.trendingCard} onPress={() => navigateToItem(item)} activeOpacity={0.88}>
                  <View style={styles.trendingImgWrap}>
                    {item.images && item.images.length > 0 ? (
                      <Image source={{ uri: item.images[0] }} style={styles.trendingImg} resizeMode="cover" />
                    ) : (
                      <View style={styles.trendingImgPlaceholder}>
                        <Ionicons
                          name={item._type === 'property' ? 'home-outline' : item._type === 'car' ? 'car-outline' : 'construct-outline'}
                          size={40}
                          color={COLORS.primary}
                        />
                      </View>
                    )}
                    {isVerified(item) && (
                      <View style={styles.verifiedBadge}>
                        <Ionicons name="checkmark-circle" size={12} color={COLORS.primary} />
                        <Text style={styles.verifiedText}>VERIFIED</Text>
                      </View>
                    )}
                    <TouchableOpacity style={styles.saveBtn} onPress={() => toggleSave(item)}>
                      <Ionicons name={savedIds.includes(item.id) ? 'heart' : 'heart-outline'} size={16} color={savedIds.includes(item.id) ? '#ef4444' : '#fff'} />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.trendingBody}>
                    <Text style={styles.trendingPrice}>{getItemPrice(item)}</Text>
                    <Text style={styles.trendingTitle} numberOfLines={1}>{item.title}</Text>
                    <View style={styles.trendingLocation}>
                      <Ionicons name="location-outline" size={12} color={COLORS.textMuted} />
                      <Text style={styles.trendingLocationText} numberOfLines={1}>{getItemLocation(item)}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyTrending}>
                  <Text style={styles.emptyText}>No listings yet — be the first to post!</Text>
                </View>
              }
            />
          )}
        </View>

        {/* ── Post banner ── */}
        <TouchableOpacity style={styles.postBanner} onPress={() => navigation.navigate('PropertyMain')} activeOpacity={0.85}>
          <View style={styles.postBannerLeft}>
            <Text style={styles.postBannerTitle}>Ready to sell or offer a service?</Text>
            <Text style={styles.postBannerSub}>Post your listing and reach thousands</Text>
          </View>
          <View style={styles.postBannerIcon}>
            <Ionicons name="arrow-forward" size={20} color={COLORS.textOnGold} />
          </View>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── FAB ── */}
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('Post')} activeOpacity={0.85}>
        <Ionicons name="add" size={30} color={COLORS.textOnGold} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.margin, paddingVertical: 14, backgroundColor: COLORS.surface },
  locationBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
  appName: { fontSize: 20, fontWeight: '800', color: COLORS.primary, letterSpacing: -0.5 },
  notifBtn: { position: 'relative', width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  notifDot: { position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary, borderWidth: 1.5, borderColor: COLORS.surface },
  heroBannerWrap: { paddingHorizontal: SPACING.margin, paddingTop: SPACING.gutter, paddingBottom: SPACING.sm },
  heroBanner: { height: 180, borderRadius: RADIUS.xl, overflow: 'hidden', justifyContent: 'flex-end' },
  heroBannerOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: RADIUS.xl },
  heroBannerContent: { padding: SPACING.gutter, paddingBottom: 20 },
  heroBannerTitle: { fontSize: 22, fontWeight: '800', color: '#fff', lineHeight: 30, marginBottom: 6 },
  heroBannerSub: { fontSize: 11, fontWeight: '700', color: COLORS.primary, letterSpacing: 1.5 },
  searchWrap: { paddingHorizontal: SPACING.margin, paddingVertical: SPACING.sm },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.surfaceHigh, borderRadius: RADIUS.full, paddingHorizontal: 18, height: 48, borderWidth: 1, borderColor: COLORS.borderMuted },
  searchPlaceholder: { fontSize: 14, color: COLORS.textMuted },
  section: { paddingHorizontal: SPACING.margin, marginBottom: SPACING.md },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.gutter },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  sectionLink: { fontSize: 13, fontWeight: '600', color: COLORS.primary },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.gutter },
  categoryCard: { width: '30%', backgroundColor: COLORS.surfaceHigh, borderRadius: RADIUS.lg, padding: SPACING.gutter, alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: COLORS.borderMuted, minHeight: 88 },
  categoryIconWrap: { width: 44, height: 44, borderRadius: RADIUS.full, backgroundColor: COLORS.primaryMuted, alignItems: 'center', justifyContent: 'center' },
  categoryLabel: { fontSize: 12, fontWeight: '600', color: COLORS.textPrimary, textAlign: 'center' },
  locationTabs: { flexDirection: 'row', gap: 6 },
  locationTabActive: { backgroundColor: COLORS.primary, borderRadius: RADIUS.full, paddingVertical: 4, paddingHorizontal: 12 },
  locationTabActiveText: { fontSize: 12, fontWeight: '700', color: COLORS.textOnGold },
  locationTab: { backgroundColor: COLORS.surfaceHighest, borderRadius: RADIUS.full, paddingVertical: 4, paddingHorizontal: 12 },
  locationTabText: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary },
  trendingList: { gap: SPACING.gutter, paddingRight: SPACING.margin },
  trendingCard: { width: 240, backgroundColor: COLORS.surfaceHigh, borderRadius: RADIUS.lg, overflow: 'hidden', borderWidth: 0.5, borderColor: COLORS.borderMuted },
  trendingImgWrap: { height: 130, position: 'relative' },
  trendingImg: { width: '100%', height: '100%' },
  trendingImgPlaceholder: { width: '100%', height: '100%', backgroundColor: COLORS.surfaceHighest, alignItems: 'center', justifyContent: 'center' },

  verifiedBadge: { position: 'absolute', top: 8, right: 8, flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: RADIUS.sm, paddingVertical: 3, paddingHorizontal: 6 },
  verifiedText: { fontSize: 9, fontWeight: '700', color: COLORS.primary, letterSpacing: 0.5 },
  saveBtn: { position: 'absolute', top: 8, left: 8, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  trendingBody: { padding: SPACING.gutter, gap: 5 },
  trendingPrice: { fontSize: 17, fontWeight: '700', color: COLORS.primary },
  trendingTitle: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary },
  trendingLocation: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  trendingLocationText: { fontSize: 11, color: COLORS.textMuted, flex: 1 },
  postBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, marginHorizontal: SPACING.margin, padding: SPACING.gutter, marginBottom: SPACING.sm },
  postBannerLeft: { flex: 1 },
  postBannerTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textOnGold, marginBottom: 3 },
  postBannerSub: { fontSize: 12, color: COLORS.textOnGold, opacity: 0.8 },
  postBannerIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.15)', alignItems: 'center', justifyContent: 'center', marginLeft: SPACING.sm },
  fab: { position: 'absolute', right: 20, bottom: 90, width: 58, height: 58, borderRadius: 29, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 10 },
  centered: { paddingVertical: 40, alignItems: 'center' },
  emptyTrending: { width: 240, height: 130, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 13, color: COLORS.textMuted, textAlign: 'center' },
});