import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@lib/supabase';
import { useAuthStore } from '@stores/authStore';
import { COLORS, RADIUS, SPACING } from '@constants/index';
import { formatNaira, timeAgo } from '@utils/formatters';

export default function MyCarsScreen({ navigation }) {
  const { user } = useAuthStore();
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchMyCars();
  }, []);

  const fetchMyCars = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cars')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCars(data || []);
    } catch (err) {
      console.error('fetchMyCars:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMyCars();
    setRefreshing(false);
  };

  const toggleAvailability = async (car) => {
    const { error } = await supabase
      .from('cars')
      .update({ is_available: !car.is_available })
      .eq('id', car.id);

    if (!error) {
      setCars((prev) =>
        prev.map((c) =>
          c.id === car.id ? { ...c, is_available: !c.is_available } : c
        )
      );
    }
  };

  const handleDelete = (carId) => {
    Alert.alert('Delete Listing', 'Are you sure? This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('cars').delete().eq('id', carId);
          if (!error) {
            setCars((prev) => prev.filter((c) => c.id !== carId));
          }
        },
      },
    ]);
  };

  const renderCar = ({ item }) => {
    const hasImage = item.images && item.images.length > 0;
    const isRental = item.type === 'rental';

    return (
      <View style={styles.card}>
        {/* Image */}
        <View style={styles.cardImgWrap}>
          {hasImage ? (
            <Image source={{ uri: item.images[0] }} style={styles.cardImg} resizeMode="cover" />
          ) : (
            <View style={styles.cardImgPlaceholder}>
              <Ionicons name="car-outline" size={48} color={COLORS.textMuted} />
            </View>
          )}

          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>
              {isRental ? 'For Rent' : 'For Sale'}
            </Text>
          </View>

          <View style={[
            styles.statusBadge,
            item.is_available ? styles.activeBadge : styles.inactiveBadge,
          ]}>
            <Text style={styles.statusText}>
              {item.is_available ? 'ACTIVE' : 'HIDDEN'}
            </Text>
          </View>
        </View>

        {/* Body */}
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.cardMeta}>
            {item.make} {item.model} {item.year ? `· ${item.year}` : ''}
          </Text>

          <View style={styles.cardRow}>
            <Text style={styles.cardPrice}>
              {formatNaira(item.price)}
              {isRental && item.price_period ? `/${item.price_period}` : ''}
            </Text>
            <Text style={styles.cardTime}>{timeAgo(item.created_at)}</Text>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => toggleAvailability(item)}
            >
              <Ionicons
                name={item.is_available ? 'eye-off-outline' : 'eye-outline'}
                size={18}
                color={COLORS.textPrimary}
              />
              <Text style={styles.actionText}>
                {item.is_available ? 'Hide' : 'Show'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => navigation.navigate('EditCar', { carId: item.id })}
            >
              <Ionicons name="create-outline" size={18} color={COLORS.textPrimary} />
              <Text style={styles.actionText}>Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.deleteBtn]}
              onPress={() => handleDelete(item.id)}
            >
              <Ionicons name="trash-outline" size={18} color="#ef4444" />
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
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Vehicle Listings</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('PostCar')}
        >
          <Ionicons name="add" size={24} color={COLORS.textOnGold} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={cars}
          keyExtractor={(item) => item.id}
          renderItem={renderCar}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="car-outline" size={70} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>No vehicle listings yet</Text>
              <Text style={styles.emptySub}>
                You haven't posted any vehicles yet
              </Text>
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => navigation.navigate('PostCar')}
              >
                <Ionicons name="add" size={20} color={COLORS.textOnGold} />
                <Text style={styles.emptyBtnText}>List a Vehicle</Text>
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
    backgroundColor: COLORS.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.margin,
    paddingVertical: 16,
  },
  backBtn: { padding: 4 },
  addBtn: {
    backgroundColor: COLORS.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },

  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  list: { padding: SPACING.margin, paddingTop: 8 },

  // Card
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    marginBottom: SPACING.md,
    borderWidth: 0.5,
    borderColor: COLORS.borderMuted,
  },
  cardImgWrap: { height: 160, position: 'relative' },
  cardImg: { width: '100%', height: '100%' },
  cardImgPlaceholder: {
    width: '100%',
    height: '100%',
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
    backgroundColor: COLORS.primary,
  },
  typeBadgeText: { fontSize: 12, fontWeight: '700', color: COLORS.textOnGold },

  statusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  activeBadge: { backgroundColor: '#14532d' },
  inactiveBadge: { backgroundColor: '#334155' },
  statusText: { fontSize: 11, fontWeight: '700', color: '#fff' },

  cardBody: { padding: SPACING.lg },
  cardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  cardMeta: { fontSize: 13, color: COLORS.textMuted, marginBottom: 12 },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardPrice: { fontSize: 17, fontWeight: '700', color: COLORS.primary },
  cardTime: { fontSize: 12, color: COLORS.textMuted },

  // Actions
  actions: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: SPACING.md,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.borderMuted,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceHigh,
    borderWidth: 1,
    borderColor: COLORS.borderMuted,
  },
  actionText: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary },
  deleteBtn: { borderColor: '#7f1d1d' },
  deleteText: { color: '#ef4444' },

  // Empty
  empty: { alignItems: 'center', paddingTop: 100 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, marginTop: 16, marginBottom: 6 },
  emptySub: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center' },
  emptyBtn: {
    marginTop: 24,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
  },
  emptyBtnText: { fontSize: 15, fontWeight: '700', color: COLORS.textOnGold },
});