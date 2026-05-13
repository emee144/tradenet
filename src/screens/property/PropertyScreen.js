import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Image,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@lib/supabase';
import { useAuthStore } from '@stores/authStore';
import { COLORS, RADIUS, SPACING, PROPERTY_TYPES } from '@constants/index';
import { formatNaira, timeAgo } from '@utils/formatters';

function PropertyCard({ property, onPress }) {
  const { title, type, price, price_period, bedrooms, bathrooms, toilet, city, state, images, owner, phone, whatsapp, created_at } = property;
  const hasImage = images && images.length > 0;

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

  const typeConfig = {
    rent: { label: 'For Rent' },
    buy: { label: 'For Sale' },
    land: { label: 'Land' },
    commercial: { label: 'Commercial' },
    shortlet: { label: 'Shortlet' },
  };

  const config = typeConfig[type] || typeConfig.rent;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.88}>
      <View style={styles.cardImgWrap}>
        {hasImage ? (
          <Image source={{ uri: images[0] }} style={styles.cardImg} resizeMode="cover" />
        ) : (
          <View style={styles.cardImgPlaceholder}>
            <Ionicons name="home-outline" size={48} color={COLORS.primary} />
          </View>
        )}

        <View style={styles.typeBadge}>
          <Text style={styles.typeBadgeText}>{config.label}</Text>
        </View>

        <View style={styles.priceBadge}>
          <Text style={styles.priceBadgeText}>
            {formatNaira(price)}
            {price_period ? `/${price_period}` : ''}
          </Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={2}>{title}</Text>

        <View style={styles.cardMeta}>
          {bedrooms && (
            <View style={styles.metaItem}>
              <Ionicons name="bed-outline" size={14} color={COLORS.textMuted} />
              <Text style={styles.metaText}>{bedrooms} bed</Text>
            </View>
          )}
          {bathrooms && (
            <View style={styles.metaItem}>
              <Ionicons name="water-outline" size={14} color={COLORS.textMuted} />
              <Text style={styles.metaText}>{bathrooms} bath</Text>
            </View>
          )}
          {toilet && (
            <View style={styles.metaItem}>
              <Ionicons name="reader-outline" size={14} color={COLORS.textMuted} />
              <Text style={styles.metaText}>{toilet} toilet{toilet !== 1 ? 's' : ''}</Text>
            </View>
          )}
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.location}>
            <Ionicons name="location-outline" size={14} color={COLORS.textMuted} />
            <Text style={styles.locationText} numberOfLines={1}>
              {city}{state ? `, ${state}` : ''}
            </Text>
            {created_at && <Text style={styles.postedTime}>{timeAgo(created_at)}</Text>}
          </View>

          <View style={styles.contactBtns}>
            {(phone || owner?.phone) && (
              <TouchableOpacity style={styles.contactIcon} onPress={handleCall}>
                <Ionicons name="call" size={14} color={COLORS.primary} />
              </TouchableOpacity>
            )}
            {(whatsapp || phone || owner?.phone) && (
              <TouchableOpacity style={styles.waIcon} onPress={handleWhatsApp}>
                <Ionicons name="logo-whatsapp" size={14} color="#25D366" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function PropertyScreen({ navigation }) {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchProperties();
  }, [activeTab]);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('properties')
        .select(`
          *,
          owner:profiles(id, full_name, avatar_url, nin_verified, photo_verified, city, state)
        `)
        .eq('is_available', true)
        .order('created_at', { ascending: false });

      if (activeTab !== 'all') {
        query = query.eq('type', activeTab);
      }

      const { data, error } = await query;
      if (error) throw error;
      setProperties(data || []);
    } catch (err) {
      console.error('fetchProperties:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProperties();
    setRefreshing(false);
  };

  const filtered = properties.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.title?.toLowerCase().includes(q) ||
      p.city?.toLowerCase().includes(q) ||
      p.state?.toLowerCase().includes(q) ||
      p.address?.toLowerCase().includes(q)
    );
  });

  const tabs = [
    { id: 'all', label: 'All', icon: 'grid-outline' },
    { id: 'rent', label: 'Rent', icon: 'key-outline' },
    { id: 'buy', label: 'Sale', icon: 'cash-outline' },
    { id: 'land', label: 'Land', icon: 'map-outline' },
    { id: 'commercial', label: 'Commercial', icon: 'business-outline' },
    { id: 'shortlet', label: 'Shortlet', icon: 'bed-outline' },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Properties</Text>
          <Text style={styles.subtitle}>Rent • Buy • Sell</Text>
        </View>

        <TouchableOpacity style={styles.postBtn} onPress={() => navigation.navigate('PostProperty')}>
          <Ionicons name="add" size={20} color={COLORS.textOnGold} />
          <Text style={styles.postBtnText}>Post Property</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search location, title, or type..."
            placeholderTextColor={COLORS.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Tabs with Icons Only */}
      <View style={styles.tabsContainer}>
        <FlatList
          data={tabs}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsRow}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.tab, activeTab === item.id && styles.tabActive]}
              onPress={() => setActiveTab(item.id)}
            >
              <Ionicons 
                name={item.icon} 
                size={16} 
                color={activeTab === item.id ? COLORS.textOnGold : COLORS.textPrimary} 
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.tabText, activeTab === item.id && styles.tabTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Results */}
      {!loading && (
        <View style={styles.resultRow}>
          <Text style={styles.resultText}>
            {filtered.length} propert{filtered.length !== 1 ? 'ies' : 'y'} found
          </Text>
        </View>
      )}

      {/* List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PropertyCard
              property={item}
              onPress={() => navigation.navigate('PropertyDetail', { propertyId: item.id })}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="home-outline" size={60} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>No properties found</Text>
              <Text style={styles.emptySub}>
                {search ? 'Try different keywords' : 'No listings available yet'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },

  header: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.margin,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: { fontSize: 24, fontWeight: '700', color: COLORS.textPrimary },
  subtitle: { fontSize: 14, color: COLORS.textMuted, marginTop: 2 },

  postBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: RADIUS.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  postBtnText: { color: COLORS.textOnGold, fontWeight: '600', fontSize: 14 },

  searchContainer: {
    paddingHorizontal: SPACING.margin,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.surface,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceHigh,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    height: 52,
    borderWidth: 1,
    borderColor: COLORS.borderMuted,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 15, color: COLORS.textPrimary },

  tabsContainer: { backgroundColor: COLORS.surface },
  tabsRow: { paddingHorizontal: SPACING.margin, paddingVertical: SPACING.sm, gap: 10 },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceHigh,
  },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { fontSize: 13, fontWeight: '500', color: COLORS.textPrimary },
  tabTextActive: { color: COLORS.textOnGold, fontWeight: '700' },

  resultRow: {
    paddingHorizontal: SPACING.margin,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.background,
  },
  resultText: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },

  listContent: { padding: SPACING.margin, paddingTop: SPACING.sm },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    marginBottom: SPACING.md,
    borderWidth: 0.5,
    borderColor: COLORS.borderMuted,
  },
  cardImgWrap: { height: 180, position: 'relative' },
  cardImg: { width: '100%', height: '100%' },
  cardImgPlaceholder: {
    flex: 1,
    backgroundColor: COLORS.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  typeBadgeText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  priceBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  priceBadgeText: { color: COLORS.textOnGold, fontWeight: '700', fontSize: 13 },

  cardBody: { padding: SPACING.lg },
  cardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 8 },
  cardMeta: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 13, color: COLORS.textMuted },

  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  location: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 },
  locationText: { fontSize: 13, color: COLORS.textMuted, flex: 1 },
  postedTime: { fontSize: 11, color: COLORS.textMuted },
  contactBtns: { flexDirection: 'row', gap: 6, marginLeft: 8 },
  contactIcon: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: COLORS.primaryMuted, borderWidth: 1,
    borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center',
  },
  waIcon: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: 'rgba(37,211,102,0.1)', borderWidth: 1,
    borderColor: 'rgba(37,211,102,0.3)', alignItems: 'center', justifyContent: 'center',
  },

  empty: { alignItems: 'center', paddingTop: 80 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: COLORS.textPrimary, marginTop: 12 },
  emptySub: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', marginTop: 6 },
});