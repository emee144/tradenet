import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@lib/supabase';
import { useAuthStore } from '@stores/authStore';
import { COLORS, RADIUS, SPACING } from '@constants/index';
import { formatNaira, timeAgo } from '@utils/formatters';

const TYPE_ICONS = {
  service: 'construct-outline',
  property: 'home-outline',
  car: 'car-outline',
  job: 'bag-handle-outline',
  market_item: 'storefront-outline',
};

export default function SavedItemsScreen({ navigation }) {
  const { user } = useAuthStore();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchSaved(); }, []);

  const fetchSaved = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('saved_items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;

      // Fetch details for each saved item
      const enriched = await Promise.all((data || []).map(async (saved) => {
        const table = saved.item_type === 'service' ? 'services'
          : saved.item_type === 'property' ? 'properties'
          : saved.item_type === 'car' ? 'cars'
          : saved.item_type === 'market_item' ? 'market_items' : 'jobs';
        const { data: detail } = await supabase.from(table).select('*').eq('id', saved.item_id).single();
        return { ...saved, detail };
      }));
      setItems(enriched.filter((i) => i.detail));
    } catch (err) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => { setRefreshing(true); await fetchSaved(); setRefreshing(false); };

  const unsave = async (savedId) => {
    await supabase.from('saved_items').delete().eq('id', savedId);
    setItems((prev) => prev.filter((i) => i.id !== savedId));
  };

  const navigateToItem = (item) => {
    if (item.item_type === 'service') navigation.navigate('ServiceDetail', { serviceId: item.item_id });
    else if (item.item_type === 'property') navigation.navigate('PropertyDetail', { propertyId: item.item_id });
    else if (item.item_type === 'car') navigation.navigate('CarDetail', { carId: item.item_id });
    else if (item.item_type === 'job') navigation.navigate('JobDetail', { jobId: item.item_id });
    else if (item.item_type === 'market_item') navigation.navigate('MarketDetail', { itemId: item.item_id });
  };

  const renderItem = ({ item }) => {
    const { detail, item_type } = item;
    const hasImage = detail?.images?.length > 0;
    return (
      <TouchableOpacity style={styles.card} onPress={() => navigateToItem(item)} activeOpacity={0.85}>
        <View style={styles.imgWrap}>
          {hasImage ? (
            <Image source={{ uri: detail.images[0] }} style={styles.img} resizeMode="cover" />
          ) : (
            <View style={styles.imgPlaceholder}>
              <Ionicons name={TYPE_ICONS[item_type] || 'heart-outline'} size={28} color={COLORS.primary} />
            </View>
          )}
          <View style={styles.typeBadge}>
            <Ionicons name={TYPE_ICONS[item_type]} size={10} color={COLORS.primary} />
            <Text style={styles.typeText}>{item_type === 'market_item' ? 'Market' : item_type.charAt(0).toUpperCase() + item_type.slice(1)}</Text>
          </View>
        </View>
        <View style={styles.body}>
          <Text style={styles.title} numberOfLines={1}>{detail.title}</Text>
          {detail.price ? (
            <Text style={styles.price}>{formatNaira(detail.price)}</Text>
          ) : null}
          <Text style={styles.savedTime}>Saved {timeAgo(item.created_at)}</Text>
        </View>
        <TouchableOpacity style={styles.unsaveBtn} onPress={() => unsave(item.id)}>
          <Ionicons name="heart" size={18} color="#ef4444" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saved Items</Text>
        <View style={{ width: 38 }} />
      </View>

      {loading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color={COLORS.primary} /></View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="heart-outline" size={36} color={COLORS.primary} />
              </View>
              <Text style={styles.emptyTitle}>Nothing saved yet</Text>
              <Text style={styles.emptySub}>Tap the heart icon on any listing to save it here</Text>
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
  headerTitle: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: SPACING.margin, gap: 10 },
  card: {
    flexDirection: 'row', backgroundColor: COLORS.surfaceHigh,
    borderRadius: RADIUS.lg, borderWidth: 1,
    borderColor: COLORS.borderMuted, overflow: 'hidden',
  },
  imgWrap: { width: 90, height: 90, position: 'relative' },
  img: { width: '100%', height: '100%' },
  imgPlaceholder: {
    width: '100%', height: '100%',
    backgroundColor: COLORS.surfaceHighest, alignItems: 'center', justifyContent: 'center',
  },
  typeBadge: {
    position: 'absolute', bottom: 6, left: 6,
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(0,0,0,0.65)', borderRadius: RADIUS.sm,
    paddingVertical: 2, paddingHorizontal: 5,
  },
  typeText: { fontSize: 9, fontWeight: '700', color: COLORS.primary },
  body: { flex: 1, padding: 12, justifyContent: 'center', gap: 4 },
  title: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  price: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
  savedTime: { fontSize: 11, color: COLORS.textMuted },
  unsaveBtn: { padding: 14, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIconWrap: {
    width: 80, height: 80, borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryMuted, borderWidth: 1,
    borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 8 },
  emptySub: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', paddingHorizontal: 30 },
});