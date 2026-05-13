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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@lib/supabase';
import { useAuthStore } from '@stores/authStore';
import { COLORS, RADIUS, SPACING, SERVICE_CATEGORIES } from '@constants/index';
import CategoryPills from '@components/home/CategoryPills';
import ServiceCard from '@components/home/ServiceCard';

export default function ServicesScreen({ navigation }) {
  const { user } = useAuthStore();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [services, setServices] = useState([]);
  const [savedIds, setSavedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchServices();
    fetchSaved();
  }, [selectedCategory]);

  const fetchServices = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('services')
        .select(`
          *,
          provider:profiles(
            id, full_name, avatar_url,
            nin_verified, photo_verified,
            city, state
          )
        `)
        .eq('is_available', true)
        .order('created_at', { ascending: false });

      if (selectedCategory !== 'all') {
        query = query.eq('category_id', selectedCategory);
      }

      const { data, error } = await query;
      if (error) throw error;
      setServices(data || []);
    } catch (err) {
      console.error('fetchServices:', err.message);
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
      .eq('item_type', 'service');
    setSavedIds((data || []).map((d) => d.item_id));
  };

  const toggleSave = async (serviceId) => {
    if (!user) {
      navigation.navigate('Login');
      return;
    }
    const isSaved = savedIds.includes(serviceId);
    if (isSaved) {
      await supabase
        .from('saved_items')
        .delete()
        .eq('user_id', user.id)
        .eq('item_type', 'service')
        .eq('item_id', serviceId);
      setSavedIds((prev) => prev.filter((id) => id !== serviceId));
    } else {
      await supabase
        .from('saved_items')
        .insert({ user_id: user.id, item_type: 'service', item_id: serviceId });
      setSavedIds((prev) => [...prev, serviceId]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchServices();
    await fetchSaved();
    setRefreshing(false);
  };

  const filteredServices = services.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.title?.toLowerCase().includes(q) ||
      s.city?.toLowerCase().includes(q) ||
      s.state?.toLowerCase().includes(q)
    );
  });

  return (
    <SafeAreaView style={styles.safe}>
      {/* ── Dark Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Services</Text>
          <Text style={styles.subtitle}>Find skilled professionals near you</Text>
        </View>

        <TouchableOpacity
          style={styles.postBtn}
          onPress={() => navigation.navigate('PostService')}
        >
          <Ionicons name="add" size={20} color={COLORS.textOnGold} />
          <Text style={styles.postBtnText}>Post Service</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search services, skills, location..."
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

      {/* Category Pills */}
      <View style={styles.pillsContainer}>
        <CategoryPills
          categories={SERVICE_CATEGORIES}
          selected={selectedCategory}
          onSelect={setSelectedCategory}
        />
      </View>

      {/* Results Count */}
      {!loading && (
        <View style={styles.resultRow}>
          <Text style={styles.resultText}>
            {filteredServices.length} service{filteredServices.length !== 1 ? 's' : ''} found
          </Text>
        </View>
      )}

      {/* Services List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredServices}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ServiceCard
              service={item}
              saved={savedIds.includes(item.id)}
              onPress={() => navigation.navigate('ServiceDetail', { serviceId: item.id })}
              onSave={() => toggleSave(item.id)}
            />
          )}
          contentContainerStyle={styles.listContent}
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
              <Ionicons name="search-outline" size={60} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>No services found</Text>
              <Text style={styles.emptySub}>
                {search ? 'Try different keywords' : 'No services in this category yet'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

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
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  postBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: RADIUS.full,
  },
  postBtnText: {
    color: COLORS.textOnGold,
    fontWeight: '600',
    fontSize: 14,
  },

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
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: COLORS.textPrimary,
  },

  // Pills
  pillsContainer: {
    backgroundColor: COLORS.surface,
    paddingBottom: SPACING.sm,
  },

  // Results
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.margin,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.background,
  },
  resultText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },

  // List
  listContent: {
    padding: SPACING.margin,
    paddingTop: SPACING.sm,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Empty State
  empty: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: 12,
  },
  emptySub: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 40,
  },
});