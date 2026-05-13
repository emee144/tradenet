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

export default function MyServicesScreen({ navigation }) {
  const { user } = useAuthStore();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchMyServices(); }, []);

  const fetchMyServices = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('provider_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setServices(data || []);
    } catch (err) {
      console.error('fetchMyServices:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMyServices();
    setRefreshing(false);
  };

  const toggleAvailability = async (service) => {
    const { error } = await supabase
      .from('services')
      .update({ is_available: !service.is_available })
      .eq('id', service.id);
    if (!error) {
      setServices((prev) =>
        prev.map((s) => s.id === service.id ? { ...s, is_available: !s.is_available } : s)
      );
    }
  };

  const handleDelete = (serviceId) => {
    Alert.alert('Delete service', 'Are you sure? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('services').delete().eq('id', serviceId);
          if (!error) setServices((prev) => prev.filter((s) => s.id !== serviceId));
        },
      },
    ]);
  };

  const getPriceLabel = (service) => {
    if (!service.price) return 'Negotiable';
    if (service.price_type === 'hourly') return `${formatNaira(service.price)}/hr`;
    return formatNaira(service.price);
  };

  const renderService = ({ item }) => {
    const hasImage = item.images && item.images.length > 0;

    return (
      <View style={styles.card}>
        {/* Image */}
        <View style={styles.imgWrap}>
          {hasImage ? (
            <Image source={{ uri: item.images[0] }} style={styles.img} resizeMode="cover" />
          ) : (
            <View style={styles.imgPlaceholder}>
              <Ionicons name="construct-outline" size={36} color={COLORS.primary} />
            </View>
          )}

          {/* Status badge */}
          <View style={[styles.statusBadge, item.is_available ? styles.activeBadge : styles.inactiveBadge]}>
            <View style={[styles.statusDot, item.is_available ? styles.activeDot : styles.inactiveDot]} />
            <Text style={[styles.statusText, item.is_available ? styles.activeText : styles.inactiveText]}>
              {item.is_available ? 'Active' : 'Hidden'}
            </Text>
          </View>

          {/* Price badge */}
          <View style={styles.priceBadge}>
            <Text style={styles.priceText}>{getPriceLabel(item)}</Text>
          </View>
        </View>

        {/* Body */}
        <View style={styles.body}>
          <Text style={styles.title} numberOfLines={1}>{item.title}</Text>

          {/* Meta */}
          <View style={styles.metaRow}>
            {item.city || item.state ? (
              <View style={styles.metaItem}>
                <Ionicons name="location-outline" size={13} color={COLORS.textMuted} />
                <Text style={styles.metaText} numberOfLines={1}>
                  {[item.city, item.state].filter(Boolean).join(', ')}
                </Text>
              </View>
            ) : null}
            {item.rating > 0 ? (
              <View style={styles.metaItem}>
                <Ionicons name="star" size={13} color={COLORS.primary} />
                <Text style={[styles.metaText, { color: COLORS.primary }]}>
                  {Number(item.rating).toFixed(1)}
                </Text>
                {item.total_reviews > 0 ? (
                  <Text style={styles.metaText}>({item.total_reviews})</Text>
                ) : null}
              </View>
            ) : null}
          </View>

          <Text style={styles.timeText}>{timeAgo(item.created_at)}</Text>

          <View style={styles.divider} />

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => toggleAvailability(item)}>
              <Ionicons
                name={item.is_available ? 'eye-off-outline' : 'eye-outline'}
                size={15}
                color={COLORS.textSecondary}
              />
              <Text style={styles.actionText}>{item.is_available ? 'Hide' : 'Show'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => navigation.navigate('EditService', { serviceId: item.id })}
            >
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
        <Text style={styles.headerTitle}>My Services</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('PostService')}
        >
          <Ionicons name="add" size={22} color={COLORS.textOnGold} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={services}
          keyExtractor={(item) => item.id}
          renderItem={renderService}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="construct-outline" size={36} color={COLORS.primary} />
              </View>
              <Text style={styles.emptyTitle}>No services yet</Text>
              <Text style={styles.emptySub}>Post your skill and start receiving bookings from clients</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('PostService')}>
                <Ionicons name="add" size={18} color={COLORS.textOnGold} />
                <Text style={styles.emptyBtnText}>Post a service</Text>
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

  // ── Header ──
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

  // ── Card ──
  card: {
    backgroundColor: COLORS.surfaceHigh,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderMuted,
    overflow: 'hidden',
  },

  // ── Image ──
  imgWrap: { height: 160, position: 'relative' },
  img: { width: '100%', height: '100%' },
  imgPlaceholder: {
    width: '100%', height: '100%',
    backgroundColor: COLORS.surfaceHighest,
    alignItems: 'center', justifyContent: 'center',
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

  // ── Body ──
  body: { padding: SPACING.margin },
  title: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 10 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginBottom: 8 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '500' },
  timeText: { fontSize: 11, color: COLORS.textMuted, marginBottom: 12 },
  divider: { height: 1, backgroundColor: COLORS.borderMuted, marginBottom: 12 },

  // ── Actions ──
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