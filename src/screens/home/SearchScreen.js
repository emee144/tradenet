import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@lib/supabase';
import { COLORS, RADIUS, SPACING } from '@constants/index';
import { formatNaira } from '@utils/formatters';

const FILTERS = [
  { id: 'all', label: 'All', icon: 'grid-outline' },
  { id: 'service', label: 'Services', icon: 'construct-outline' },
  { id: 'property', label: 'Property', icon: 'home-outline' },
  { id: 'car', label: 'Cars', icon: 'car-outline' },
  { id: 'job', label: 'Jobs', icon: 'bag-handle-outline' },
];

const RECENT_SEARCHES = [
  'Electrician Lagos',
  '3 bedroom Lekki',
  'Toyota Camry',
  'Graphic Designer',
  'Plumber Abuja',
];

export default function SearchScreen({ navigation, route }) {
  const browseAll = route?.params?.browseAll ?? false;
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (browseAll) fetchAll();
  }, [filter]);

  const fetchAll = async () => {
    setLoading(true);
    setSearched(true);
    try {
      const fetches = [];
      if (filter === 'all' || filter === 'service') {
        fetches.push(
          supabase.from('services').select('id, title, price, price_type, city, state, images, category_id').eq('is_available', true).order('created_at', { ascending: false }).limit(20)
            .then((res) => (res.data || []).map((s) => ({ ...s, _type: 'service' })))
        );
      }
      if (filter === 'all' || filter === 'property') {
        fetches.push(
          supabase.from('properties').select('id, title, price, price_period, type, city, state, images, bedrooms').eq('is_available', true).order('created_at', { ascending: false }).limit(20)
            .then((res) => (res.data || []).map((p) => ({ ...p, _type: 'property' })))
        );
      }
      if (filter === 'all' || filter === 'car') {
        fetches.push(
          supabase.from('cars').select('id, title, price, type, price_period, city, state, images, make, model, year').eq('is_available', true).order('created_at', { ascending: false }).limit(20)
            .then((res) => (res.data || []).map((c) => ({ ...c, _type: 'car' })))
        );
      }
      if (filter === 'all' || filter === 'job') {
        fetches.push(
          supabase.from('jobs').select('id, title, company, job_type, salary_min, salary_max, city, state').eq('is_active', true).order('created_at', { ascending: false }).limit(20)
            .then((res) => (res.data || []).map((j) => ({ ...j, _type: 'job' })))
        );
      }
      const all = (await Promise.all(fetches)).flat();
      setResults(all.sort(() => Math.random() - 0.5));
    } catch (err) {
      console.error('fetchAll:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (q = query) => {
    if (!q.trim()) return;
    Keyboard.dismiss();
    setLoading(true);
    setSearched(true);

    try {
      const term = `%${q.trim()}%`;
      const searches = [];

      if (filter === 'all' || filter === 'service') {
        searches.push(
          supabase
            .from('services')
            .select('id, title, price, price_type, city, state, images, category_id')
            .ilike('title', term)
            .eq('is_available', true)
            .limit(6)
            .then((res) => (res.data || []).map((s) => ({ ...s, _type: 'service' })))
        );
      }

      if (filter === 'all' || filter === 'property') {
        searches.push(
          supabase
            .from('properties')
            .select('id, title, price, price_period, type, city, state, images, bedrooms')
            .ilike('title', term)
            .eq('is_available', true)
            .limit(6)
            .then((res) => (res.data || []).map((p) => ({ ...p, _type: 'property' })))
        );
      }

      if (filter === 'all' || filter === 'car') {
        searches.push(
          supabase
            .from('cars')
            .select('id, title, price, type, price_period, city, state, images, make, model, year')
            .ilike('title', term)
            .eq('is_available', true)
            .limit(6)
            .then((res) => (res.data || []).map((c) => ({ ...c, _type: 'car' })))
        );
      }

      if (filter === 'all' || filter === 'job') {
        searches.push(
          supabase
            .from('jobs')
            .select('id, title, company, job_type, salary_min, salary_max, city, state')
            .ilike('title', term)
            .eq('is_active', true)
            .limit(6)
            .then((res) => (res.data || []).map((j) => ({ ...j, _type: 'job' })))
        );
      }

      const allResults = (await Promise.all(searches)).flat();
      setResults(allResults);
    } catch (err) {
      console.error('search error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const navigateToItem = (item) => {
    if (item._type === 'service') navigation.navigate('ServiceDetail', { serviceId: item.id });
    else if (item._type === 'property') navigation.navigate('PropertyDetail', { propertyId: item.id });
    else if (item._type === 'car') navigation.navigate('CarDetail', { carId: item.id });
    else if (item._type === 'job') navigation.navigate('JobDetail', { jobId: item.id });
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'service': return 'construct-outline';
      case 'property': return 'home-outline';
      case 'car': return 'car-outline';
      case 'job': return 'bag-handle-outline';
      default: return 'search-outline';
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'service': return 'Service';
      case 'property': return 'Property';
      case 'car': return 'Car';
      case 'job': return 'Job';
      default: return '';
    }
  };

  const getItemPrice = (item) => {
    if (item._type === 'job') {
      if (item.salary_min) return `${formatNaira(item.salary_min)}/mo`;
      return 'Salary negotiable';
    }
    if (!item.price) return 'Negotiable';
    if (item._type === 'property') return `${formatNaira(item.price)}${item.price_period ? `/${item.price_period}` : ''}`;
    if (item._type === 'car') return `${formatNaira(item.price)}${item.type === 'rental' && item.price_period ? `/${item.price_period}` : ''}`;
    return formatNaira(item.price);
  };

  const getItemSub = (item) => {
    const loc = [item.city, item.state].filter(Boolean).join(', ') || 'Nigeria';
    if (item._type === 'property') return `${item.bedrooms ? `${item.bedrooms} bed · ` : ''}${loc}`;
    if (item._type === 'car') return `${item.make || ''} ${item.model || ''} ${item.year ? `· ${item.year}` : ''}`.trim();
    if (item._type === 'job') return `${item.company ? `${item.company} · ` : ''}${loc}`;
    return loc;
  };

  const renderResult = ({ item }) => (
    <TouchableOpacity style={styles.resultCard} onPress={() => navigateToItem(item)} activeOpacity={0.8}>
      {/* Image */}
      <View style={styles.resultImgWrap}>
        {item.images && item.images.length > 0 ? (
          <Image source={{ uri: item.images[0] }} style={styles.resultImg} resizeMode="cover" />
        ) : (
          <View style={styles.resultImgPlaceholder}>
            <Ionicons name={getTypeIcon(item._type)} size={24} color={COLORS.primary} />
          </View>
        )}
      </View>

      {/* Body */}
      <View style={styles.resultBody}>
        <View style={styles.resultTypeBadge}>
          <Ionicons name={getTypeIcon(item._type)} size={10} color={COLORS.primary} />
          <Text style={styles.resultTypeText}>{getTypeLabel(item._type)}</Text>
        </View>
        <Text style={styles.resultTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.resultSub} numberOfLines={1}>{getItemSub(item)}</Text>
      </View>

      {/* Price */}
      <View style={styles.resultRight}>
        <Text style={styles.resultPrice}>{getItemPrice(item)}</Text>
        <Ionicons name="chevron-forward" size={14} color={COLORS.textMuted} />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      {/* ── Search bar ── */}
      <View style={styles.searchBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={styles.inputWrap}>
          <Ionicons name="search-outline" size={18} color={COLORS.textMuted} />
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Search TradeNet..."
            placeholderTextColor={COLORS.textMuted}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => handleSearch()}
            returnKeyType="search"
            autoFocus
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(''); setResults([]); setSearched(false); }}>
              <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Filter pills ── */}
      <View style={styles.filtersWrap}>
        <FlatList
          data={FILTERS}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.filterChip, filter === item.id && styles.filterChipActive]}
              onPress={() => { setFilter(item.id); if (query) handleSearch(query); }}
            >
              <Ionicons
                name={item.icon}
                size={14}
                color={filter === item.id ? COLORS.textOnGold : COLORS.textSecondary}
              />
              <Text style={[styles.filterText, filter === item.id && styles.filterTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* ── Content ── */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Searching TradeNet...</Text>
        </View>
      ) : !searched ? (
        // Recent searches
        <View style={styles.recentWrap}>
          <Text style={styles.recentTitle}>Recent searches</Text>
          {RECENT_SEARCHES.map((term, index) => (
            <TouchableOpacity
              key={index}
              style={styles.recentItem}
              onPress={() => { setQuery(term); handleSearch(term); }}
            >
              <View style={styles.recentIconWrap}>
                <Ionicons name="time-outline" size={16} color={COLORS.textMuted} />
              </View>
              <Text style={styles.recentText}>{term}</Text>
              <Ionicons name="arrow-up-outline" size={14} color={COLORS.textMuted} />
            </TouchableOpacity>
          ))}
        </View>
      ) : results.length === 0 ? (
        <View style={styles.centered}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="search-outline" size={32} color={COLORS.primary} />
          </View>
          <Text style={styles.emptyTitle}>No results found</Text>
          <Text style={styles.emptySub}>Try different keywords or change the filter</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => `${item._type}-${item.id}`}
          renderItem={renderResult}
          contentContainerStyle={styles.resultsList}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <Text style={styles.resultsCount}>
              {browseAll && !query
                ? `${results.length} listing${results.length !== 1 ? 's' : ''}`
                : `${results.length} result${results.length !== 1 ? 's' : ''} for "${query}"`}
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },

  // ── Search bar ──
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.margin,
    paddingVertical: 12,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderMuted,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderMuted,
  },
  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceHigh,
    borderRadius: RADIUS.full,
    paddingHorizontal: 14,
    height: 46,
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.borderMuted,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textPrimary,
  },

  // ── Filters ──
  filtersWrap: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderMuted,
  },
  filtersList: {
    paddingHorizontal: SPACING.margin,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceHigh,
    borderWidth: 1,
    borderColor: COLORS.borderMuted,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  filterTextActive: {
    color: COLORS.textOnGold,
  },

  // ── Recent ──
  recentWrap: {
    padding: SPACING.margin,
  },
  recentTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderMuted,
  },
  recentIconWrap: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },

  // ── Results ──
  resultsList: {
    padding: SPACING.margin,
  },
  resultsCount: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 16,
    fontWeight: '500',
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceHigh,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderMuted,
    marginBottom: 10,
    overflow: 'hidden',
  },
  resultImgWrap: {
    width: 80,
    height: 80,
  },
  resultImg: {
    width: '100%',
    height: '100%',
  },
  resultImgPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.surfaceHighest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultBody: {
    flex: 1,
    padding: 12,
    gap: 4,
  },
  resultTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  resultTypeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  resultSub: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  resultRight: {
    paddingRight: 12,
    alignItems: 'flex-end',
    gap: 4,
  },
  resultPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },

  // ── States ──
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.margin,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});