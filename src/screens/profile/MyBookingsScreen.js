import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@lib/supabase';
import { useAuthStore } from '@stores/authStore';
import { COLORS, RADIUS, SPACING } from '@constants/index';
import { formatNaira, timeAgo } from '@utils/formatters';

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: '#facc15', icon: 'time-outline' },
  confirmed: { label: 'Confirmed', color: '#4ade80', icon: 'checkmark-circle-outline' },
  completed: { label: 'Completed', color: '#60a5fa', icon: 'trophy-outline' },
  cancelled: { label: 'Cancelled', color: COLORS.error, icon: 'close-circle-outline' },
};

export default function MyBookingsScreen({ navigation }) {
  const { user } = useAuthStore();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchBookings(); }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*, service:services(title, images), provider:profiles!provider_id(full_name), client:profiles!client_id(full_name)')
        .or(`client_id.eq.${user.id},provider_id.eq.${user.id}`)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setBookings(data || []);
    } catch (err) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => { setRefreshing(true); await fetchBookings(); setRefreshing(false); };

  const updateStatus = async (bookingId, status) => {
    const { error } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', bookingId);
    if (error) { Alert.alert('Error', error.message); return; }
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status } : b))
    );
  };

  const renderBooking = ({ item }) => {
    const config = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
    const isClient = item.client_id === user.id;
    const isProvider = item.provider_id === user.id;
    const otherParty = isClient ? item.provider?.full_name : item.client?.full_name;
    const showActions = isProvider && item.status === 'pending';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardIconWrap}>
            <Ionicons name="calendar-outline" size={22} color={COLORS.primary} />
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle} numberOfLines={1}>{item.service?.title || 'Service'}</Text>
            <Text style={styles.cardSub}>{isClient ? `Provider: ${otherParty}` : `Client: ${otherParty}`}</Text>
          </View>
          <View style={[styles.statusBadge, { borderColor: config.color + '40' }]}>
            <Ionicons name={config.icon} size={12} color={config.color} />
            <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
          </View>
        </View>

        <View style={styles.cardMeta}>
          {item.amount ? (
            <View style={styles.metaItem}>
              <Ionicons name="cash-outline" size={13} color={COLORS.primary} />
              <Text style={styles.metaPrice}>{formatNaira(item.amount)}</Text>
            </View>
          ) : null}
          {item.scheduled_at ? (
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={13} color={COLORS.textMuted} />
              <Text style={styles.metaText}>{new Date(item.scheduled_at).toLocaleDateString()}</Text>
            </View>
          ) : null}
          <Text style={styles.metaTime}>{timeAgo(item.created_at)}</Text>
        </View>

        {item.notes ? (
          <Text style={styles.notes} numberOfLines={2}>{item.notes}</Text>
        ) : null}

        {showActions && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.rejectBtn}
              onPress={() => updateStatus(item.id, 'cancelled')}
            >
              <Ionicons name="close-circle-outline" size={16} color="#ef4444" />
              <Text style={styles.rejectText}>Decline</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.acceptBtn}
              onPress={() => updateStatus(item.id, 'confirmed')}
            >
              <Ionicons name="checkmark-circle-outline" size={16} color={COLORS.textOnGold} />
              <Text style={styles.acceptText}>Accept</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Bookings</Text>
        <View style={{ width: 38 }} />
      </View>

      {loading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color={COLORS.primary} /></View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => item.id}
          renderItem={renderBooking}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="calendar-outline" size={36} color={COLORS.primary} />
              </View>
              <Text style={styles.emptyTitle}>No bookings yet</Text>
              <Text style={styles.emptySub}>Your service bookings will appear here</Text>
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
    backgroundColor: COLORS.surfaceHigh, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.borderMuted, padding: SPACING.margin,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  cardIconWrap: {
    width: 44, height: 44, borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryMuted, borderWidth: 1,
    borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 3 },
  cardSub: { fontSize: 12, color: COLORS.textSecondary },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: RADIUS.full, paddingVertical: 4, paddingHorizontal: 8,
    borderWidth: 1, backgroundColor: 'transparent',
  },
  statusText: { fontSize: 11, fontWeight: '700' },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaPrice: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
  metaText: { fontSize: 12, color: COLORS.textSecondary },
  metaTime: { fontSize: 11, color: COLORS.textMuted, marginLeft: 'auto' },
  notes: { fontSize: 12, color: COLORS.textSecondary, marginTop: 8, lineHeight: 18 },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  rejectBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 10, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: '#ef444450', backgroundColor: 'rgba(239,68,68,0.08)',
  },
  rejectText: { fontSize: 13, fontWeight: '700', color: '#ef4444' },
  acceptBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 10, borderRadius: RADIUS.md, backgroundColor: COLORS.primary,
  },
  acceptText: { fontSize: 13, fontWeight: '700', color: COLORS.textOnGold },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIconWrap: {
    width: 80, height: 80, borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryMuted, borderWidth: 1,
    borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 8 },
  emptySub: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center' },
});