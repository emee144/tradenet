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
import { COLORS, RADIUS, SPACING, JOB_TYPES } from '@constants/index';
import { formatNaira, timeAgo } from '@utils/formatters';

function JobCard({ job, onPress }) {
  const {
    title,
    company,
    job_type,
    salary_min,
    salary_max,
    city,
    state,
    is_remote,
    deadline,
    employer,
    created_at,
    phone,
    whatsapp,
  } = job;

  const handleCall = (e) => {
    e.stopPropagation();
    const num = phone || employer?.phone;
    if (num) Linking.openURL(`tel:${num}`);
  };

  const handleWhatsApp = (e) => {
    e.stopPropagation();
    const num = whatsapp || phone || employer?.phone;
    if (!num) return;
    const intl = num.startsWith('0') ? `234${num.slice(1)}` : num.replace('+', '');
    Linking.openURL(`https://wa.me/${intl}`);
  };

  const typeConfig = {
    full_time: { label: 'Full-time', bg: '#1e3a8a', text: '#bfdbfe' },
    part_time: { label: 'Part-time', bg: '#4c1d95', text: '#e0e7ff' },
    freelance: { label: 'Freelance', bg: '#14532d', text: '#bbf7d0' },
    contract: { label: 'Contract', bg: '#7c2d12', text: '#fed7aa' },
    internship: { label: 'Internship', bg: '#78350f', text: '#fef3c7' },
  };

  const config = typeConfig[job_type] || typeConfig.full_time;
  const isExpired = deadline && new Date(deadline) < new Date();

  return (
    <TouchableOpacity
      style={[styles.card, isExpired && styles.cardExpired]}
      onPress={onPress}
      activeOpacity={0.88}
    >
      <View style={styles.cardTop}>
        <View style={styles.companyLogo}>
          <Text style={styles.companyLogoText}>
            {(company || title)?.[0]?.toUpperCase() || '?'}
          </Text>
        </View>

        <View style={styles.cardTopInfo}>
          <Text style={styles.jobTitle} numberOfLines={1}>{title}</Text>
          {company && <Text style={styles.companyName}>{company}</Text>}
        </View>

        <View style={[styles.typeBadge, { backgroundColor: config.bg }]}>
          <Text style={[styles.typeBadgeText, { color: config.text }]}>
            {config.label}
          </Text>
        </View>
      </View>

      <View style={styles.tagsRow}>
        {(city || state) && (
          <View style={styles.tag}>
            <Ionicons name="location-outline" size={14} color={COLORS.textMuted} />
            <Text style={styles.tagText}>
              {city}{state ? `, ${state}` : ''}
            </Text>
          </View>
        )}

        {is_remote && (
          <View style={[styles.tag, styles.remoteTag]}>
            <Ionicons name="laptop-outline" size={14} color="#4ade80" />
            <Text style={styles.remoteTagText}>Remote</Text>
          </View>
        )}

        {(salary_min || salary_max) && (
          <View style={[styles.tag, styles.salaryTag]}>
            <Ionicons name="cash-outline" size={14} color={COLORS.primary} />
            <Text style={styles.salaryText}>
              {salary_min && salary_max
                ? `${formatNaira(salary_min)} - ${formatNaira(salary_max)}`
                : salary_min
                ? `From ${formatNaira(salary_min)}`
                : `Up to ${formatNaira(salary_max)}`}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.cardFooter}>
        {employer?.nin_verified && employer?.photo_verified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="shield-checkmark" size={14} color="#4ade80" />
            <Text style={styles.verifiedText}>Verified</Text>
          </View>
        )}

        <Text style={styles.postedTime}>{timeAgo(created_at)}</Text>

        {isExpired && <Text style={styles.expiredText}>Expired</Text>}

        <View style={styles.contactBtns}>
          {(phone || employer?.phone) && (
            <TouchableOpacity style={styles.contactIcon} onPress={handleCall}>
              <Ionicons name="call" size={13} color={COLORS.primary} />
            </TouchableOpacity>
          )}
          {(whatsapp || phone || employer?.phone) && (
            <TouchableOpacity style={styles.waIcon} onPress={handleWhatsApp}>
              <Ionicons name="logo-whatsapp" size={13} color="#25D366" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function JobsScreen({ navigation }) {
  const { user } = useAuthStore();
  const [activeType, setActiveType] = useState('all');
  const [search, setSearch] = useState('');
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, [activeType]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('jobs')
        .select(`
          *,
          employer:profiles(id, full_name, avatar_url, nin_verified, photo_verified, city, state)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (activeType !== 'all') {
        query = query.eq('job_type', activeType);
      }

      const { data, error } = await query;
      if (error) throw error;
      setJobs(data || []);
    } catch (err) {
      console.error('fetchJobs:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchJobs();
    setRefreshing(false);
  };

  const filtered = jobs.filter((j) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      j.title?.toLowerCase().includes(q) ||
      j.company?.toLowerCase().includes(q) ||
      j.city?.toLowerCase().includes(q) ||
      j.state?.toLowerCase().includes(q)
    );
  });

  const tabs = [
    { id: 'all', label: 'All Jobs' },
    ...JOB_TYPES.map((t) => ({ id: t.id, label: t.label })),
  ];

  return (
    <SafeAreaView style={styles.safe}>
      {/* Dark Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Jobs</Text>
          <Text style={styles.subtitle}>Find your next opportunity</Text>
        </View>

        <TouchableOpacity
          style={styles.postBtn}
          onPress={() => navigation.navigate('PostJob')}
        >
          <Ionicons name="add" size={20} color={COLORS.textOnGold} />
          <Text style={styles.postBtnText}>Post Job</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search job title, company, location..."
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

      {/* Job Type Tabs */}
      <View style={styles.tabsContainer}>
        <FlatList
          data={tabs}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsRow}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.tab, activeType === item.id && styles.tabActive]}
              onPress={() => setActiveType(item.id)}
            >
              <Text style={[styles.tabText, activeType === item.id && styles.tabTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Results Count */}
      {!loading && (
        <View style={styles.resultRow}>
          <Text style={styles.resultText}>
            {filtered.length} job{filtered.length !== 1 ? 's' : ''} found
          </Text>
        </View>
      )}

      {/* Job List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <JobCard
              job={item}
              onPress={() => navigation.navigate('JobDetail', { jobId: item.id })}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="briefcase-outline" size={60} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>No jobs found</Text>
              <Text style={styles.emptySub}>
                {search ? 'Try different keywords' : 'No jobs available in this category yet'}
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

  // Header
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

  // Search
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

  // Tabs
  tabsContainer: { backgroundColor: COLORS.surface },
  tabsRow: { paddingHorizontal: SPACING.margin, paddingVertical: SPACING.sm, gap: 10 },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceHigh,
  },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { fontSize: 13, fontWeight: '500', color: COLORS.textPrimary },
  tabTextActive: { color: COLORS.textOnGold, fontWeight: '700' },

  // Results
  resultRow: {
    paddingHorizontal: SPACING.margin,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.background,
  },
  resultText: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },

  // List
  listContent: { padding: SPACING.margin, paddingTop: SPACING.sm },

  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Card
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 0.5,
    borderColor: COLORS.borderMuted,
  },
  cardExpired: { opacity: 0.65 },
  cardTop: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.md },
  companyLogo: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  companyLogoText: { fontSize: 18, fontWeight: '700', color: COLORS.textOnGold },
  cardTopInfo: { flex: 1 },
  jobTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  companyName: { fontSize: 13, color: COLORS.textMuted },

  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    alignSelf: 'flex-start',
  },
  typeBadgeText: { fontSize: 11, fontWeight: '700' },

  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: SPACING.md },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.surfaceHigh,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  remoteTag: { backgroundColor: '#052e16' },
  salaryTag: { backgroundColor: '#451a03' },
  salaryText: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  tagText: { fontSize: 12, color: COLORS.textPrimary },

  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 0.5,
    borderTopColor: COLORS.borderMuted,
    paddingTop: SPACING.sm,
  },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  verifiedText: { fontSize: 12, color: '#4ade80', fontWeight: '600' },
  postedTime: { fontSize: 12, color: COLORS.textMuted },
  expiredText: { fontSize: 12, color: '#f87171', fontWeight: '600' },
  contactBtns: { flexDirection: 'row', gap: 6, marginLeft: 'auto' },
  contactIcon: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: COLORS.primaryMuted, borderWidth: 1,
    borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center',
  },
  waIcon: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(37,211,102,0.1)', borderWidth: 1,
    borderColor: 'rgba(37,211,102,0.3)', alignItems: 'center', justifyContent: 'center',
  },

  // Empty
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: COLORS.textPrimary, marginTop: 12 },
  emptySub: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', marginTop: 6 },
});