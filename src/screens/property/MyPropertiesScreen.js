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

const TYPE_CONFIG = {
  rent: { label: 'For Rent', color: '#60a5fa' },
  buy: { label: 'For Sale', color: '#4ade80' },
  land: { label: 'Land', color: '#fb923c' },
  commercial: { label: 'Commercial', color: '#c084fc' },
  shortlet: { label: 'Shortlet', color: '#facc15' },
};

export default function MyPropertiesScreen({ navigation }) {
  const { user } = useAuthStore();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchMyProperties(); }, []);

  const fetchMyProperties = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setProperties(data || []);
    } catch (err) {
      console.error('fetchMyProperties:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMyProperties();
    setRefreshing(false);
  };

  const toggleAvailability = async (property) => {
    const { error } = await supabase
      .from('properties')
      .update({ is_available: !property.is_available })
      .eq('id', property.id);
    if (!error) {
      setProperties((prev) =>
        prev.map((p) => p.id === property.id ? { ...p, is_available: !p.is_available } : p)
      );
    }
  };

  const handleDelete = (propertyId) => {
    Alert.alert('Delete property', 'Are you sure? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('properties').delete().eq('id', propertyId);
          if (!error) setProperties((prev) => prev.filter((p) => p.id !== propertyId));
        },
      },
    ]);
  };

  const renderProperty = ({ item }) => {
    const hasImage = item.images && item.images.length > 0;
    const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.rent;

    return (
      <View style={styles.card}>
        {/* Image */}
        <View style={styles.imgWrap}>
          {hasImage ? (
            <Image source={{ uri: item.images[0] }} style={styles.img} resizeMode="cover" />
          ) : (
            <View style={styles.imgPlaceholder}>
              <Ionicons name="home-outline" size={36} color={COLORS.primary} />
            </View>
          )}

          {/* Type badge */}
          <View style={[styles.typeBadge, { borderColor: config.color + '50' }]}>
            <View style={[styles.typeDot, { backgroundColor: config.color }]} />
            <Text style={[styles.typeBadgeText, { color: config.color }]}>{config.label}</Text>
          </View>

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
              {formatNaira(item.price)}{item.price_period ? `/${item.price_period}` : ''}
            </Text>
          </View>
        </View>

        {/* Body */}
        <View style={styles.body}>
          <Text style={styles.title} numberOfLines={1}>{item.title}</Text>

          {/* Specs */}
          <View style={styles.specsRow}>
            {item.bedrooms ? (
              <View style={styles.specItem}>
                <Ionicons name="bed-outline" size={13} color={COLORS.textMuted} />
                <Text style={styles.specText}>{item.bedrooms} bed{item.bedrooms !== 1 ? 's' : ''}</Text>
              </View>
            ) : null}
            {item.bathrooms ? (
              <View style={styles.specItem}>
                <Ionicons name="water-outline" size={13} color={COLORS.textMuted} />
                <Text style={styles.specText}>{item.bathrooms} bath{item.bathrooms !== 1 ? 's' : ''}</Text>
              </View>
            ) : null}
            {item.toilet ? (
              <View style={styles.specItem}>
                <Ionicons name="reader-outline" size={13} color={COLORS.textMuted} />
                <Text style={styles.specText}>{item.toilet} toilet{item.toilet !== 1 ? 's' : ''}</Text>
              </View>
            ) : null}
            {item.city || item.state ? (
              <View style={styles.specItem}>
                <Ionicons name="location-outline" size={13} color={COLORS.textMuted} />
                <Text style={styles.specText} numberOfLines={1}>
                  {[item.city, item.state].filter(Boolean).join(', ')}
                </Text>
              </View>
            ) : null}
          </View>

          <Text style={styles.timeText}>{timeAgo(item.created_at)}</Text>

          {/* Divider */}
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
              onPress={() => navigation.navigate('EditProperty', { propertyId: item.id })}
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
        <Text style={styles.headerTitle}>My Properties</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('PostProperty')}
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
          data={properties}
          keyExtractor={(item) => item.id}
          renderItem={renderProperty}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="home-outline" size={36} color={COLORS.primary} />
              </View>
              <Text style={styles.emptyTitle}>No properties yet</Text>
              <Text style={styles.emptySub}>List a property and reach thousands of buyers and renters</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('PostProperty')}>
                <Ionicons name="add" size={18} color={COLORS.textOnGold} />
                <Text style={styles.emptyBtnText}>List a property</Text>
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
  imgWrap: { height: 170, position: 'relative' },
  img: { width: '100%', height: '100%' },
  imgPlaceholder: {
    width: '100%', height: '100%',
    backgroundColor: COLORS.surfaceHighest,
    alignItems: 'center', justifyContent: 'center',
  },
  typeBadge: {
    position: 'absolute', top: 10, left: 10,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(0,0,0,0.65)', borderRadius: RADIUS.full,
    paddingVertical: 4, paddingHorizontal: 10, borderWidth: 1,
  },
  typeDot: { width: 6, height: 6, borderRadius: 3 },
  typeBadgeText: { fontSize: 10, fontWeight: '700' },
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
  specsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 8 },
  specItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  specText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '500' },
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