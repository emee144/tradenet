import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, TextInput, ActivityIndicator,
  RefreshControl, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { supabase } from '@lib/supabase';
import { useAuthStore } from '@stores/authStore';
import { COLORS, RADIUS, SPACING } from '@constants/index';
import { formatNaira, timeAgo } from '@utils/formatters';

const CATEGORIES = [
  { id: 'all', label: 'All Items', icon: 'grid-outline' },
  { id: 'phones', label: 'Phones & Tablets', icon: 'phone-portrait-outline' },
  { id: 'laptops', label: 'Laptops & Computers', icon: 'laptop-outline' },
  { id: 'electronics', label: 'Electronics', icon: 'tv-outline' },
  { id: 'appliances', label: 'Home Appliances', icon: 'thermometer-outline' },
  { id: 'furniture', label: 'Furniture', icon: 'bed-outline' },
  { id: 'home_goods', label: 'Home Goods', icon: 'home-outline' },
];

export default function MarketScreen({ navigation }) {
  const { user } = useAuthStore();
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [items, setItems] = useState([]);
  const [savedIds, setSavedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchItems(); }, [category]);

  useEffect(() => { fetchSaved(); }, []);

  const fetchItems = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('market_items')
        .select('*, seller:profiles(id, full_name, avatar_url, city, state, nin_verified, photo_verified)')
        .eq('is_available', true)
        .order('created_at', { ascending: false });

      if (category !== 'all') query = query.eq('category', category);

      const { data, error } = await query;
      if (error) throw error;
      setItems(data || []);
    } catch (err) {
      console.error('fetchItems:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSaved = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('saved_items')
      .select('item_id')
      .eq('user_id', user.id)
      .eq('item_type', 'market');
    setSavedIds((data || []).map((d) => d.item_id));
  };

  const toggleSave = async (item) => {
    if (!user) { navigation.navigate('Login'); return; }
    const isSaved = savedIds.includes(item.id);
    if (isSaved) {
      await supabase.from('saved_items').delete()
        .eq('user_id', user.id).eq('item_id', item.id);
      setSavedIds((p) => p.filter((id) => id !== item.id));
    } else {
      await supabase.from('saved_items').insert({
        user_id: user.id, item_type: 'market', item_id: item.id,
      });
      setSavedIds((p) => [...p, item.id]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchItems();
    await fetchSaved();
    setRefreshing(false);
  };

  const filteredItems = items.filter((item) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      item.title?.toLowerCase().includes(q) ||
      item.brand?.toLowerCase().includes(q) ||
      item.description?.toLowerCase().includes(q) ||
      item.city?.toLowerCase().includes(q)
    );
  });

  const activeConfig = CATEGORIES.find((c) => c.id === category) || CATEGORIES[0];
  const isVerified = (item) => item.seller?.nin_verified && item.seller?.photo_verified;

  const renderItem = ({ item }) => {
    const hasImage = item.images && item.images.length > 0;
    const saved = savedIds.includes(item.id);
    const location = [item.city, item.state].filter(Boolean).join(', ') || 'Nigeria';

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('MarketDetail', { itemId: item.id })}
        activeOpacity={0.85}
      >
        {/* Image */}
        <View style={styles.imgWrap}>
          {hasImage ? (
            <Image source={{ uri: item.images[0] }} style={styles.img} resizeMode="cover" />
          ) : (
            <View style={styles.imgPlaceholder}>
              <Ionicons name={CATEGORIES.find((c) => c.id === item.category)?.icon || 'storefront-outline'} size={36} color={COLORS.primary} />
            </View>
          )}

          {/* Save btn */}
          <TouchableOpacity style={styles.saveBtn} onPress={() => toggleSave(item)}>
            <Ionicons name={saved ? 'heart' : 'heart-outline'} size={16} color={saved ? '#ef4444' : '#fff'} />
          </TouchableOpacity>

          {/* Verified */}
          {isVerified(item) && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={11} color={COLORS.primary} />
              <Text style={styles.verifiedText}>VERIFIED</Text>
            </View>
          )}

          {/* Price */}
          <View style={styles.priceBadge}>
            <Text style={styles.priceText}>{item.price ? formatNaira(item.price) : 'Negotiable'}</Text>
          </View>
        </View>

        {/* Body */}
        <View style={styles.body}>
          {/* Category tag */}
          <View style={styles.catTag}>
            <Ionicons name={CATEGORIES.find((c) => c.id === item.category)?.icon || 'storefront-outline'} size={10} color={COLORS.primary} />
            <Text style={styles.catTagText}>
              {CATEGORIES.find((c) => c.id === item.category)?.label || 'Market'}
            </Text>
          </View>

          <Text style={styles.title} numberOfLines={1}>{item.title}</Text>

          {item.brand && (
            <Text style={styles.brand} numberOfLines={1}>{item.brand}</Text>
          )}

          <View style={styles.footer}>
            <View style={styles.locationWrap}>
              <Ionicons name="location-outline" size={12} color={COLORS.textMuted} />
              <Text style={styles.locationText} numberOfLines={1}>{location}</Text>
            </View>
            <Text style={styles.timeText}>{timeAgo(item.created_at)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Market</Text>
          <Text style={styles.headerSub}>Buy & sell items in Nigeria</Text>
        </View>
        <TouchableOpacity style={styles.postBtn} onPress={() => navigation.navigate('PostMarketItem')}>
          <Ionicons name="add" size={18} color={COLORS.textOnGold} />
          <Text style={styles.postBtnText}>Sell</Text>
        </TouchableOpacity>
      </View>

      {/* ── Search ── */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={17} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search phones, laptops, furniture..."
            placeholderTextColor={COLORS.textMuted}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={17} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Filter dropdown ── */}
      <View style={styles.filterRow}>
        <View style={styles.filterLeft}>
          <View style={styles.filterIconWrap}>
            <Ionicons name={activeConfig.icon} size={15} color={COLORS.primary} />
          </View>
          <View style={styles.pickerWrap}>
            <Picker
              selectedValue={category}
              onValueChange={(val) => setCategory(val)}
              style={styles.picker}
              dropdownIconColor={COLORS.primary}
            >
              {CATEGORIES.map((c) => (
                <Picker.Item key={c.id} label={c.label} value={c.id} color={COLORS.textPrimary} />
              ))}
            </Picker>
          </View>
        </View>
        <Text style={styles.resultCount}>
          {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* ── List ── */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="storefront-outline" size={36} color={COLORS.primary} />
              </View>
              <Text style={styles.emptyTitle}>No items found</Text>
              <Text style={styles.emptySub}>
                {search ? 'Try a different search term' : 'Be the first to list an item'}
              </Text>
              {!search && (
                <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('PostMarketItem')}>
                  <Ionicons name="add" size={18} color={COLORS.textOnGold} />
                  <Text style={styles.emptyBtnText}>List an item</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },

  // ── Header ──
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.margin, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: COLORS.borderMuted,
  },
  headerLeft: { gap: 2 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.5 },
  headerSub: { fontSize: 13, color: COLORS.textSecondary },
  postBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: COLORS.primary, borderRadius: RADIUS.full,
    paddingVertical: 8, paddingHorizontal: 16,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
  },
  postBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.textOnGold },

  // ── Search ──
  searchWrap: { paddingHorizontal: SPACING.margin, paddingVertical: 10 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.surfaceHigh, borderRadius: RADIUS.full,
    paddingHorizontal: 14, height: 46,
    borderWidth: 1, borderColor: COLORS.borderMuted,
  },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.textPrimary },

  // ── Filter ──
  filterRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.margin, paddingBottom: 10,
  },
  filterLeft: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.surfaceHigh, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.borderMuted,
    paddingLeft: 10, flex: 1, marginRight: 12, overflow: 'hidden',
  },
  filterIconWrap: {
    width: 28, height: 28, borderRadius: RADIUS.sm,
    backgroundColor: COLORS.primaryMuted, borderWidth: 1,
    borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  pickerWrap: { flex: 1 },
  picker: { height: 48, color: COLORS.textPrimary },
  resultCount: { fontSize: 12, color: COLORS.textMuted, fontWeight: '500', flexShrink: 0 },

  // ── Grid ──
  list: { padding: SPACING.margin, flexGrow: 1 },
  row: { gap: 10, marginBottom: 10 },

  // ── Card ──
  card: {
    flex: 1, backgroundColor: COLORS.surfaceHigh,
    borderRadius: RADIUS.lg, borderWidth: 1,
    borderColor: COLORS.borderMuted, overflow: 'hidden',
  },
  imgWrap: { height: 140, position: 'relative' },
  img: { width: '100%', height: '100%' },
  imgPlaceholder: {
    width: '100%', height: '100%',
    backgroundColor: COLORS.surfaceHighest,
    alignItems: 'center', justifyContent: 'center',
  },
  saveBtn: {
    position: 'absolute', top: 8, left: 8,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },
  verifiedBadge: {
    position: 'absolute', top: 8, right: 8,
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: RADIUS.sm,
    paddingVertical: 3, paddingHorizontal: 6,
  },
  verifiedText: { fontSize: 9, fontWeight: '700', color: COLORS.primary, letterSpacing: 0.5 },
  priceBadge: {
    position: 'absolute', bottom: 8, left: 8,
    backgroundColor: COLORS.primary, borderRadius: RADIUS.full,
    paddingVertical: 3, paddingHorizontal: 10,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 4, elevation: 3,
  },
  priceText: { fontSize: 11, fontWeight: '700', color: COLORS.textOnGold },

  // ── Body ──
  body: { padding: 10, gap: 4 },
  catTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    alignSelf: 'flex-start',
  },
  catTagText: { fontSize: 9, fontWeight: '700', color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 0.5 },
  title: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },
  brand: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '500' },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  locationWrap: { flexDirection: 'row', alignItems: 'center', gap: 3, flex: 1 },
  locationText: { fontSize: 10, color: COLORS.textMuted, flex: 1 },
  timeText: { fontSize: 10, color: COLORS.textMuted },

  // ── States ──
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyIconWrap: {
    width: 80, height: 80, borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryMuted, borderWidth: 1,
    borderColor: COLORS.border, alignItems: 'center',
    justifyContent: 'center', marginBottom: 20,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 8 },
  emptySub: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 20 },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.primary, borderRadius: RADIUS.md,
    paddingVertical: 12, paddingHorizontal: 24,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
  },
  emptyBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.textOnGold },
});