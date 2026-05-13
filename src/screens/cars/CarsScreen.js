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
import { Picker } from '@react-native-picker/picker';
import { supabase } from '@lib/supabase';
import { COLORS, RADIUS, SPACING } from '@constants/index';
import CarCard from '@components/cars/CarCard';

const TABS = [
  { id: 'all', label: 'All Vehicles' },
  { id: 'sale', label: 'For Sale' },
  { id: 'rental', label: 'For Rent' },
];

export default function CarsScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchCars();
  }, [activeTab]);

  const fetchCars = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('cars')
        .select(`
          *,
          owner:profiles(id, full_name, avatar_url, nin_verified, photo_verified, city, state)
        `)
        .eq('is_available', true)
        .order('created_at', { ascending: false });

      if (activeTab !== 'all') {
        query = query.eq('type', activeTab);
      }

      const { data, error } = await query;
      if (error) throw error;
      setCars(data || []);
    } catch (error) {
      console.error('fetchCars error:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCars();
    setRefreshing(false);
  };

  const filteredCars = cars.filter((car) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      car.title?.toLowerCase().includes(q) ||
      car.make?.toLowerCase().includes(q) ||
      car.model?.toLowerCase().includes(q) ||
      car.city?.toLowerCase().includes(q) ||
      car.state?.toLowerCase().includes(q)
    );
  });

  return (
    <SafeAreaView style={styles.safe}>
      {/* Hero / Header */}
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <View>
            <Text style={styles.heroTitle}>Vehicles Marketplace</Text>
            <Text style={styles.heroSub}>Buy • Sell • Rent Vehicles</Text>
          </View>
          <TouchableOpacity
            style={styles.postBtn}
            onPress={() => navigation.navigate('PostCar')}
          >
            <Ionicons name="add" size={18} color={COLORS.textOnGold} />
            <Text style={styles.postBtnText}>Post Vehicle</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search make, model, city..."
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

        {/* Dropdown Filter */}
        <View style={styles.section}>
          <Text style={styles.label}>Filter by Type</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={activeTab}
              onValueChange={(value) => setActiveTab(value)}
              style={styles.picker}
              dropdownIconColor={COLORS.primary}
            >
              {TABS.map((tab) => (
                <Picker.Item key={tab.id} label={tab.label} value={tab.id} />
              ))}
            </Picker>
          </View>
        </View>
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredCars}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <CarCard
              car={item}
              onPress={() => navigation.navigate('CarDetail', { carId: item.id })}
            />
          )}
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
              <Ionicons name="car-outline" size={60} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>No cars found</Text>
              <Text style={styles.emptySub}>
                {search ? 'Try different keywords' : 'No cars listed yet.\nBe the first to post!'}
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

  hero: {
    backgroundColor: COLORS.surface,
    padding: SPACING.margin,
    paddingTop: 12,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  heroTitle: { fontSize: 22, fontWeight: '700', color: COLORS.textPrimary },
  heroSub: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },

  postBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: RADIUS.full,
  },
  postBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.textOnGold },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.surfaceHigh,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.borderMuted,
    marginBottom: 16,
  },
  searchInput: { flex: 1, fontSize: 15, color: COLORS.textPrimary },

  section: { marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 6 },

  pickerContainer: {
    backgroundColor: COLORS.surfaceHigh,
    borderWidth: 1,
    borderColor: COLORS.borderMuted,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  picker: {
    height: 52,
    color: COLORS.textPrimary,
  },

  list: { padding: SPACING.margin, paddingTop: 8 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  empty: { alignItems: 'center', paddingTop: 80 },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: COLORS.textPrimary, marginTop: 12, marginBottom: 6 },
  emptySub: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', lineHeight: 20 },
});