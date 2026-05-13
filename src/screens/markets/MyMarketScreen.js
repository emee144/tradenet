import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Image, ActivityIndicator,
  RefreshControl, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@lib/supabase';
import { useAuthStore } from '@stores/authStore';
import { COLORS, RADIUS, SPACING } from '@constants/index';
import { formatNaira, timeAgo } from '@utils/formatters';

const CATEGORIES = [
  { id: 'phones', label: 'Phones & Tablets', icon: 'phone-portrait-outline' },
  { id: 'laptops', label: 'Laptops & Computers', icon: 'laptop-outline' },
  { id: 'electronics', label: 'Electronics', icon: 'tv-outline' },
  { id: 'appliances', label: 'Home Appliances', icon: 'thermometer-outline' },
  { id: 'furniture', label: 'Furniture', icon: 'bed-outline' },
  { id: 'home_goods', label: 'Home Goods', icon: 'home-outline' },
];

const CONDITIONS = {
  new: { label: 'Brand New', color: '#4ade80' },
  fairly_used: { label: 'Fairly Used', color: '#facc15' },
  used: { label: 'Used', color: '#fb923c' },
};

export default function MyMarketScreen({ navigation }) {
  const { user } = useAuthStore();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchMyItems(); }, []);

  const fetchMyItems = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('market_items')
        .select('*')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setItems(data || []);
    } catch (err) {
      console.error('fetchMyItems:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMyItems();
    setRefreshing(false);
  };

  const toggleAvailability = async (item) => {
    const { error } = await supabase
      .from('market_items')
      .update({ is_available: !item.is_available })
      .eq('id', item.id);
    if (!error) {
      setItems((prev) =>
        prev.map((i) => i.id === item.id ? { ...i, is_available: !i.is_available } : i)
      );
    }
  };

  const handleDelete = (itemId) => {
    Alert.alert('Delete listing', 'Are you sure? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('market_items').delete().eq('id', itemId);
          if (!error) setItems((prev) => prev.filter((i) => i.id !== itemId));
          else Alert.alert('Error', error.message);
        },
      },
    ]);
  };

  const getCatConfig = (cat) => CATEGORIES.find((c) => c.id === cat) || CATEGORIES[0];
  const getCondConfig = (cond) => CONDITIONS[cond] || CONDITIONS.fairly_used;

  const renderItem = ({ item }) => {
    const hasImage = item.images && item.images.length > 0;
    const catConfig = getCatConfig(item.category);
    const condConfig = getCondConfig(item.condition);

    return (
      <View style={styles.card}>
        {/* Image */}
        <View style={styles.imgWrap}>
          {hasImage ? (
            <Image source={{ uri: item.images[0] }} style={styles.img} resizeMode="cover" />
          ) : (
            <View style={styles.imgPlaceholder}>
              <Ionicons name={catConfig.icon} size={36} color={COLORS.primary} />
            </View>
          )}

          {/* Status badge */}
          <View style={[styles.statusBadge, item.is_available ? styles.activeBadge : styles.inactiveBadge]}>
            <View style={[styles.statusDot, item.is_available ? styles.activeDot : styles.inactiveDot]} />
            <Text style={[styles.statusText, item.is_available ? styles.activeText : styles.inactiveText]}>
              {item.is_available ? 'Active' : 'Hidden'}
            </Text>
          </View>

          {/* Price */}
          <View style={styles.priceBadge}>
            <Text style={styles.priceText}>
              {item.price ? formatNaira(item.price) : 'Negotiable'}
            </Text>
          </View>
        </View>

        {/* Body */}
        <View style={styles.body}>
          {/* Category + Condition */}
          <View style={styles.tagsRow}>
            <View style={styles.catTag}>
              <Ionicons name={catConfig.icon} size={11} color={COLORS.primary} />
              <Text style={styles.catTagText}>{catConfig.label}</Text>
            </View>
            <View style={[styles.condTag, { borderColor: condConfig.color + '40' }]}>
              <View style={[styles.condDot, { backgroundColor: condConfig.color }]} />
              <Text style={[styles.condTagText, { color: condConfig.color }]}>{condConfig.label}</Text>
            </View>
          </View>

          <Text style={styles.title} numberOfLines={1}>{item.title}</Text>

          {item.brand ? (
            <Text style={styles.brand}>{item.brand}</Text>
          ) : null}

          <Text style={styles.timeText}>{timeAgo(item.created_at)}</Text>

          <View style={styles.divider} />

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => toggleAvailability(item)}>
              <Ionicons
                name={item.is_available ? 'eye-off-outline' : 'eye-outline'}
                size={15} color={COLORS.textSecondary}
              />
              <Text style={styles.actionText}>{item.is_available ? 'Hide' : 'Show'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn}
              onPress={() => navigation.navigate('EditMarket', { itemId: item.id })}>
              <Ionicons name="create-outline" size={15} color={COLORS.textSecondary} />
              <Text style={styles.actionText}>Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.deleteBtn]}
              onPress={() => handleDelete(item.id)}
            >
              <Ionicons name="trash-outline" size={15} color={COLORS.error} />
              <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Listings</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('PostMarket')}>
          <Ionicons name="add" size={22} color={COLORS.textOnGold} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
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
              <Text style={styles.emptyTitle}>No listings yet</Text>
              <Text style={styles.emptySub}>List an item and start selling on TradeNet</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('PostMarket')}>
                <Ionicons name="add" size={18} color={COLORS.textOnGold} />
                <Text style={styles.emptyBtnText}>List an item</Text>
              </TouchableOpacity>
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.margin, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: COLORS.borderMuted,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceHigh, borderWidth: 1,
    borderColor: COLORS.borderMuted, alignItems: 'center', justifyContent: 'center',
  },
  addBtn: {
    width: 38, height: 38, borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: SPACING.margin, gap: 12 },
  card: {
    backgroundColor: COLORS.surfaceHigh, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.borderMuted, overflow: 'hidden',
  },
  imgWrap: { height: 160, position: 'relative' },
  img: { width: '100%', height: '100%' },
  imgPlaceholder: {
    width: '100%', height: '100%',
    backgroundColor: COLORS.surfaceHighest, alignItems: 'center', justifyContent: 'center',
  },
  statusBadge: {
    position: 'absolute', top: 10, right: 10,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: RADIUS.full, paddingVertical: 4, paddingHorizontal: 10,
  },
  activeBadge: { backgroundColor: 'rgba(74,222,128,0.15)', borderWidth: 1, borderColor: 'rgba(74,222,128,0.3)' },
  inactiveBadge: { backgroundColor: COLORS.surfaceHighest, borderWidth: 1, borderColor: COLORS.borderMuted },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  activeDot: { backgroundColor: '#4ade80' },
  inactiveDot: { backgroundColor: COLORS.textMuted },
  statusText: { fontSize: 10, fontWeight: '700' },
  activeText: { color: '#4ade80' },
  inactiveText: { color: COLORS.textMuted },
  priceBadge: {
    position: 'absolute', bottom: 10, left: 10,
    backgroundColor: COLORS.primary, borderRadius: RADIUS.full,
    paddingVertical: 5, paddingHorizontal: 12,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 4, elevation: 3,
  },
  priceText: { fontSize: 13, fontWeight: '700', color: COLORS.textOnGold },
  body: { padding: SPACING.margin },
  tagsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  catTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.primaryMuted, borderRadius: RADIUS.full,
    paddingVertical: 3, paddingHorizontal: 8, borderWidth: 1, borderColor: COLORS.border,
  },
  catTagText: { fontSize: 10, fontWeight: '700', color: COLORS.primary },
  condTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: RADIUS.full, paddingVertical: 3, paddingHorizontal: 8, borderWidth: 1,
  },
  condDot: { width: 5, height: 5, borderRadius: 3 },
  condTagText: { fontSize: 10, fontWeight: '700' },
  title: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  brand: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 4 },
  timeText: { fontSize: 11, color: COLORS.textMuted, marginBottom: 12 },
  divider: { height: 1, backgroundColor: COLORS.borderMuted, marginBottom: 12 },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 5, paddingVertical: 9,
    borderRadius: RADIUS.md, borderWidth: 1,
    borderColor: COLORS.borderMuted, backgroundColor: COLORS.surfaceHighest,
  },
  actionText: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },
  deleteBtn: { borderColor: 'rgba(255,180,171,0.2)', backgroundColor: 'rgba(147,0,10,0.15)' },
  deleteText: { color: COLORS.error },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIconWrap: {
    width: 80, height: 80, borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryMuted, borderWidth: 1,
    borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 8 },
  emptySub: {
    fontSize: 14, color: COLORS.textSecondary, textAlign: 'center',
    paddingHorizontal: SPACING.margin, marginBottom: 24,
  },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.primary, borderRadius: RADIUS.md,
    paddingVertical: 12, paddingHorizontal: 24,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
  },
  emptyBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.textOnGold },
});