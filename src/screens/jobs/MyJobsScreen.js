import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
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

export default function MyJobsScreen({ navigation }) {
  const { user } = useAuthStore();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchMyJobs(); }, []);

  const fetchMyJobs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*, applications:job_applications(count)')
        .eq('employer_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setJobs(data || []);
    } catch (err) {
      console.error('fetchMyJobs:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMyJobs();
    setRefreshing(false);
  };

  const toggleActive = async (job) => {
    const { error } = await supabase
      .from('jobs')
      .update({ is_active: !job.is_active })
      .eq('id', job.id);
    if (!error) {
      setJobs((prev) =>
        prev.map((j) => j.id === job.id ? { ...j, is_active: !j.is_active } : j)
      );
    }
  };

  const handleDelete = (jobId) => {
    Alert.alert('Delete job', 'Are you sure? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('jobs').delete().eq('id', jobId);
          if (!error) setJobs((prev) => prev.filter((j) => j.id !== jobId));
        },
      },
    ]);
  };

  const getJobTypeLabel = (type) => {
    const map = {
      full_time: 'Full-time',
      part_time: 'Part-time',
      freelance: 'Freelance',
      contract: 'Contract',
      internship: 'Internship',
    };
    return map[type] || type;
  };

  const renderJob = ({ item }) => {
    const appCount = item.applications?.[0]?.count || 0;

    return (
      <View style={styles.card}>
        {/* Card header */}
        <View style={styles.cardHeader}>
          <View style={styles.cardIconWrap}>
            <Ionicons name="bag-handle-outline" size={22} color={COLORS.primary} />
          </View>
          <View style={styles.cardHeaderInfo}>
            <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
            {item.company ? (
              <Text style={styles.cardCompany} numberOfLines={1}>{item.company}</Text>
            ) : null}
          </View>
          <View style={[styles.statusBadge, item.is_active ? styles.activeBadge : styles.inactiveBadge]}>
            <View style={[styles.statusDot, item.is_active ? styles.activeDot : styles.inactiveDot]} />
            <Text style={[styles.statusText, item.is_active ? styles.activeText : styles.inactiveText]}>
              {item.is_active ? 'Active' : 'Closed'}
            </Text>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Meta row */}
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="briefcase-outline" size={13} color={COLORS.textMuted} />
            <Text style={styles.metaText}>{getJobTypeLabel(item.job_type)}</Text>
          </View>
          {(item.city || item.state) ? (
            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={13} color={COLORS.textMuted} />
              <Text style={styles.metaText} numberOfLines={1}>
                {[item.city, item.state].filter(Boolean).join(', ')}
              </Text>
            </View>
          ) : null}
          {item.is_remote && (
            <View style={styles.metaItem}>
              <Ionicons name="globe-outline" size={13} color={COLORS.primary} />
              <Text style={[styles.metaText, { color: COLORS.primary }]}>Remote</Text>
            </View>
          )}
        </View>

        {/* Salary */}
        {(item.salary_min || item.salary_max) ? (
          <View style={styles.salaryRow}>
            <Ionicons name="cash-outline" size={14} color={COLORS.primary} />
            <Text style={styles.salaryText}>
              {item.salary_min && item.salary_max
                ? `${formatNaira(item.salary_min)} – ${formatNaira(item.salary_max)}/mo`
                : item.salary_min
                ? `From ${formatNaira(item.salary_min)}/mo`
                : `Up to ${formatNaira(item.salary_max)}/mo`}
            </Text>
          </View>
        ) : null}

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="people-outline" size={14} color={COLORS.textMuted} />
            <Text style={styles.statText}>{appCount} applicant{appCount !== 1 ? 's' : ''}</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="time-outline" size={14} color={COLORS.textMuted} />
            <Text style={styles.statText}>{timeAgo(item.created_at)}</Text>
          </View>
          {item.deadline ? (
            <View style={styles.statItem}>
              <Ionicons name="calendar-outline" size={14} color={COLORS.textMuted} />
              <Text style={styles.statText}>Due {item.deadline}</Text>
            </View>
          ) : null}
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => toggleActive(item)}>
            <Ionicons
              name={item.is_active ? 'pause-circle-outline' : 'play-circle-outline'}
              size={16}
              color={COLORS.textSecondary}
            />
            <Text style={styles.actionText}>{item.is_active ? 'Close' : 'Reopen'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate('EditJob', { jobId: item.id })}
          >
            <Ionicons name="create-outline" size={16} color={COLORS.textSecondary} />
            <Text style={styles.actionText}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.deleteBtn]}
            onPress={() => handleDelete(item.id)}
          >
            <Ionicons name="trash-outline" size={16} color={COLORS.error} />
            <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
          </TouchableOpacity>
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
        <Text style={styles.headerTitle}>My Job Listings</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('PostJob')}>
          <Ionicons name="add" size={22} color={COLORS.textOnGold} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={(item) => item.id}
          renderItem={renderJob}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="bag-handle-outline" size={36} color={COLORS.primary} />
              </View>
              <Text style={styles.emptyTitle}>No job listings yet</Text>
              <Text style={styles.emptySub}>Post a job and start receiving applications</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('PostJob')}>
                <Ionicons name="add" size={18} color={COLORS.textOnGold} />
                <Text style={styles.emptyBtnText}>Post a job</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.margin,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderMuted,
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

  list: {
    padding: SPACING.margin,
    gap: 12,
  },

  // ── Card ──
  card: {
    backgroundColor: COLORS.surfaceHigh,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderMuted,
    padding: SPACING.margin,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  cardIconWrap: {
    width: 44, height: 44, borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryMuted, borderWidth: 1,
    borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  cardHeaderInfo: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 2 },
  cardCompany: { fontSize: 12, color: COLORS.textSecondary },

  // Status badge
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingVertical: 4, paddingHorizontal: 10, borderRadius: RADIUS.full,
  },
  activeBadge: { backgroundColor: 'rgba(76,175,80,0.15)' },
  inactiveBadge: { backgroundColor: COLORS.surfaceHighest },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  activeDot: { backgroundColor: '#4caf50' },
  inactiveDot: { backgroundColor: COLORS.textMuted },
  statusText: { fontSize: 11, fontWeight: '700' },
  activeText: { color: '#4caf50' },
  inactiveText: { color: COLORS.textMuted },

  divider: { height: 1, backgroundColor: COLORS.borderMuted, marginVertical: 12 },

  // Meta
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 10 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '500' },

  // Salary
  salaryRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.primaryMuted, borderRadius: RADIUS.md,
    paddingVertical: 8, paddingHorizontal: 12, marginBottom: 12,
    borderWidth: 1, borderColor: COLORS.border,
  },
  salaryText: { fontSize: 13, fontWeight: '700', color: COLORS.primary },

  // Stats
  statsRow: { flexDirection: 'row', gap: 16, marginBottom: 4 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statText: { fontSize: 12, color: COLORS.textMuted },

  // Actions
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

  // Empty
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIconWrap: {
    width: 80, height: 80, borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryMuted, borderWidth: 1,
    borderColor: COLORS.border, alignItems: 'center',
    justifyContent: 'center', marginBottom: 20,
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