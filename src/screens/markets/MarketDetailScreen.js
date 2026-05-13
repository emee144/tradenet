import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Image, FlatList, Dimensions,
  ActivityIndicator, Alert, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@lib/supabase';
import { useAuthStore } from '@stores/authStore';
import { COLORS, RADIUS, SPACING } from '@constants/index';
import { formatNaira, timeAgo } from '@utils/formatters';

const { width } = Dimensions.get('window');

const CATEGORIES = [
  { id: 'phones', label: 'Phones & Tablets', icon: 'phone-portrait-outline' },
  { id: 'laptops', label: 'Laptops & Computers', icon: 'laptop-outline' },
  { id: 'electronics', label: 'Electronics', icon: 'tv-outline' },
  { id: 'appliances', label: 'Home Appliances', icon: 'thermometer-outline' },
  { id: 'furniture', label: 'Furniture', icon: 'bed-outline' },
  { id: 'home_goods', label: 'Home Goods', icon: 'home-outline' },
];

const CONDITIONS = {
  new: { label: 'Brand New', color: '#4ade80', icon: 'sparkles-outline' },
  fairly_used: { label: 'Fairly Used', color: '#facc15', icon: 'thumbs-up-outline' },
  used: { label: 'Used', color: '#fb923c', icon: 'refresh-outline' },
};

export default function MarketDetailScreen({ navigation, route }) {
  const { itemId } = route.params || {};
  const { user } = useAuthStore();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => { fetchItem(); checkIfSaved(); }, [itemId]);

  const fetchItem = async () => {
    try {
      const { data, error } = await supabase
        .from('market_items')
        .select('*, seller:profiles(id, full_name, avatar_url, phone, nin_verified, photo_verified, city, state, rating)')
        .eq('id', itemId).single();
      if (error) throw error;
      setItem(data);
    } catch (err) {
      Alert.alert('Error', 'Could not load item details.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const checkIfSaved = async () => {
    if (!user) return;
    const { data } = await supabase.from('saved_items').select('id')
      .eq('user_id', user.id).eq('item_type', 'market').eq('item_id', itemId).single();
    setSaved(!!data);
  };

  const toggleSave = async () => {
    if (!user) { Alert.alert('Login required', 'Please log in to save items.'); return; }
    if (saved) {
      await supabase.from('saved_items').delete()
        .eq('user_id', user.id).eq('item_type', 'market').eq('item_id', itemId);
    } else {
      await supabase.from('saved_items').insert({
        user_id: user.id, item_type: 'market', item_id: itemId,
      });
    }
    setSaved(!saved);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}><ActivityIndicator size="large" color={COLORS.primary} /></View>
      </SafeAreaView>
    );
  }

  if (!item) return null;

  const isOwner = user?.id === item.seller_id;
  const images = item.images?.length > 0 ? item.images : [];
  const isVerifiedSeller = item.seller?.nin_verified && item.seller?.photo_verified;
  const catConfig = CATEGORIES.find((c) => c.id === item.category) || CATEGORIES[0];
  const condConfig = CONDITIONS[item.condition] || CONDITIONS.fairly_used;
  const contactPhone = item.phone || item.seller?.phone;
  const contactWhatsapp = item.whatsapp || item.phone || item.seller?.phone;

  const handleCall = () => {
    if (!contactPhone) return;
    Linking.openURL(`tel:${contactPhone}`);
  };

  const handleWhatsApp = () => {
    if (!contactWhatsapp) return;
    const phone = contactWhatsapp.startsWith('0')
      ? `234${contactWhatsapp.slice(1)}`
      : contactWhatsapp.replace('+', '');
    const message = encodeURIComponent(
      `Hi, I saw your listing on TradeNet: "${item.title}". Is it still available?`
    );
    Linking.openURL(`https://wa.me/${phone}?text=${message}`);
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{item.title}</Text>
        <TouchableOpacity style={styles.headerBtn} onPress={toggleSave}>
          <Ionicons name={saved ? 'heart' : 'heart-outline'} size={20}
            color={saved ? '#ef4444' : COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>

        {/* ── Image carousel ── */}
        {images.length > 0 ? (
          <View>
            <FlatList
              data={images}
              keyExtractor={(_, i) => String(i)}
              horizontal pagingEnabled showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) =>
                setActiveImage(Math.round(e.nativeEvent.contentOffset.x / width))
              }
              renderItem={({ item: img }) => (
                <Image source={{ uri: img }} style={styles.mainImage} resizeMode="cover" />
              )}
            />
            {images.length > 1 && (
              <View style={styles.dots}>
                {images.map((_, i) => (
                  <View key={i} style={[styles.dot, i === activeImage && styles.dotActive]} />
                ))}
              </View>
            )}
          </View>
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name={catConfig.icon} size={72} color={COLORS.primary} />
          </View>
        )}

        <View style={styles.body}>

          {/* ── Title + badges ── */}
          <View style={styles.titleRow}>
            <Text style={styles.itemTitle}>{item.title}</Text>
            <View style={[styles.condBadge, { borderColor: condConfig.color + '50' }]}>
              <View style={[styles.condDot, { backgroundColor: condConfig.color }]} />
              <Text style={[styles.condText, { color: condConfig.color }]}>{condConfig.label}</Text>
            </View>
          </View>

          {/* ── Category tag ── */}
          <View style={styles.catTag}>
            <Ionicons name={catConfig.icon} size={12} color={COLORS.primary} />
            <Text style={styles.catTagText}>{catConfig.label}</Text>
          </View>

          {/* ── Price ── */}
          <Text style={styles.price}>
            {item.price ? formatNaira(item.price) : 'Price Negotiable'}
          </Text>

          {/* ── Details grid ── */}
          <View style={styles.detailsGrid}>
            {item.brand && (
              <DetailItem icon="pricetag-outline" label="Brand" value={item.brand} />
            )}
            <DetailItem icon={condConfig.icon} label="Condition" value={condConfig.label} />
            {(item.city || item.state) && (
              <DetailItem icon="location-outline" label="Location"
                value={[item.city, item.state].filter(Boolean).join(', ')} />
            )}
            <DetailItem icon="time-outline" label="Posted" value={timeAgo(item.created_at)} />
          </View>

          {/* ── Description ── */}
          {item.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <View style={styles.descCard}>
                <Text style={styles.descText}>{item.description}</Text>
              </View>
            </View>
          )}

          {/* ── Contact ── */}
          {(contactPhone || contactWhatsapp) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Contact Seller</Text>
              <View style={styles.contactCard}>
                {contactPhone && (
                  <TouchableOpacity style={styles.contactRow} onPress={handleCall}>
                    <View style={styles.contactIconWrap}>
                      <Ionicons name="call-outline" size={17} color={COLORS.textPrimary} />
                    </View>
                    <Text style={styles.contactNumber}>{contactPhone}</Text>
                    <Text style={styles.contactAction}>Call</Text>
                  </TouchableOpacity>
                )}
                {contactPhone && contactWhatsapp && <View style={styles.contactDivider} />}
                {contactWhatsapp && (
                  <TouchableOpacity style={styles.contactRow} onPress={handleWhatsApp}>
                    <View style={[styles.contactIconWrap, styles.waIconWrap]}>
                      <Ionicons name="logo-whatsapp" size={17} color="#25D366" />
                    </View>
                    <Text style={styles.contactNumber}>{contactWhatsapp}</Text>
                    <Text style={[styles.contactAction, { color: '#25D366' }]}>WhatsApp</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* ── Seller card ── */}
          {item.seller && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Seller</Text>
              <View style={styles.sellerCard}>
                <View style={styles.sellerAvatarWrap}>
                  {item.seller.avatar_url ? (
                    <Image source={{ uri: item.seller.avatar_url }} style={styles.sellerAvatar} />
                  ) : (
                    <Text style={styles.sellerInitial}>
                      {item.seller.full_name?.[0]?.toUpperCase() || '?'}
                    </Text>
                  )}
                  {isVerifiedSeller && (
                    <View style={styles.sellerVerifiedDot}>
                      <Ionicons name="checkmark" size={8} color={COLORS.textOnGold} />
                    </View>
                  )}
                </View>
                <View style={styles.sellerInfo}>
                  <Text style={styles.sellerName}>{item.seller.full_name}</Text>
                  <Text style={styles.sellerLocation}>
                    {[item.seller.city, item.seller.state].filter(Boolean).join(', ') || 'Nigeria'}
                  </Text>
                  {isVerifiedSeller && (
                    <View style={styles.verifiedBadge}>
                      <Ionicons name="shield-checkmark" size={10} color={COLORS.primary} />
                      <Text style={styles.verifiedText}>NIN & Photo Verified</Text>
                    </View>
                  )}
                </View>
                {item.seller.rating > 0 && (
                  <View style={styles.ratingBadge}>
                    <Ionicons name="star" size={11} color={COLORS.primary} />
                    <Text style={styles.ratingText}>{Number(item.seller.rating).toFixed(1)}</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* ── Bottom actions ── */}
      {!isOwner ? (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.whatsappBtn} onPress={handleWhatsApp}>
            <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
            <Text style={styles.whatsappText}>WhatsApp</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.callBtn} onPress={handleCall}>
            <Ionicons name="call" size={18} color={COLORS.textOnGold} />
            <Text style={styles.callText}>Call Seller</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.editBtn}
            onPress={() => navigation.navigate('EditMarket', { itemId: item.id })}>
            <Ionicons name="create-outline" size={18} color={COLORS.textOnGold} />
            <Text style={styles.editText}>Edit Listing</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

function DetailItem({ icon, label, value }) {
  return (
    <View style={styles.detailItem}>
      <View style={styles.detailIconWrap}>
        <Ionicons name={icon} size={15} color={COLORS.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue} numberOfLines={1}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.margin, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: COLORS.borderMuted,
  },
  headerBtn: {
    width: 38, height: 38, borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceHigh, borderWidth: 1,
    borderColor: COLORS.borderMuted, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, textAlign: 'center', marginHorizontal: 8 },
  scroll: { flex: 1, backgroundColor: COLORS.background },
  mainImage: { width, height: 280 },
  imagePlaceholder: {
    width: '100%', height: 240,
    backgroundColor: COLORS.surfaceHighest, alignItems: 'center', justifyContent: 'center',
  },
  dots: {
    flexDirection: 'row', justifyContent: 'center', gap: 5,
    paddingVertical: 10, backgroundColor: COLORS.surfaceLow,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.surfaceHighest },
  dotActive: { backgroundColor: COLORS.primary, width: 18 },
  body: { padding: SPACING.margin },
  titleRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    justifyContent: 'space-between', gap: 10, marginBottom: 8,
  },
  itemTitle: { flex: 1, fontSize: 20, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.3 },
  condBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: RADIUS.full, paddingVertical: 5, paddingHorizontal: 10,
    borderWidth: 1, flexShrink: 0,
  },
  condDot: { width: 7, height: 7, borderRadius: 4 },
  condText: { fontSize: 11, fontWeight: '700' },
  catTag: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: COLORS.primaryMuted, borderRadius: RADIUS.full,
    paddingVertical: 4, paddingHorizontal: 10, borderWidth: 1,
    borderColor: COLORS.border, alignSelf: 'flex-start', marginBottom: 14,
  },
  catTagText: { fontSize: 11, fontWeight: '700', color: COLORS.primary },
  price: { fontSize: 30, fontWeight: '800', color: COLORS.primary, letterSpacing: -0.5, marginBottom: 16 },
  detailsGrid: {
    backgroundColor: COLORS.surfaceHigh, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.borderMuted,
    padding: 14, flexDirection: 'row', flexWrap: 'wrap',
    gap: 14, marginBottom: 20,
  },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 10, width: '47%' },
  detailIconWrap: {
    width: 32, height: 32, borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryMuted, borderWidth: 1,
    borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  detailLabel: { fontSize: 11, color: COLORS.textMuted, marginBottom: 2 },
  detailValue: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 10 },
  descCard: {
    backgroundColor: COLORS.surfaceHigh, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.borderMuted, padding: 14,
  },
  descText: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 22 },
  contactCard: {
    backgroundColor: COLORS.surfaceHigh, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.borderMuted, overflow: 'hidden',
  },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  contactIconWrap: {
    width: 38, height: 38, borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceHighest, borderWidth: 1,
    borderColor: COLORS.borderMuted, alignItems: 'center', justifyContent: 'center',
  },
  waIconWrap: { backgroundColor: 'rgba(37,211,102,0.1)', borderColor: 'rgba(37,211,102,0.3)' },
  contactNumber: { flex: 1, fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  contactAction: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
  contactDivider: { height: 1, backgroundColor: COLORS.borderMuted, marginHorizontal: 14 },
  sellerCard: {
    backgroundColor: COLORS.surfaceHigh, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.borderMuted,
    padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  sellerAvatarWrap: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: COLORS.primaryMuted, borderWidth: 2,
    borderColor: COLORS.border, alignItems: 'center',
    justifyContent: 'center', position: 'relative', flexShrink: 0,
  },
  sellerAvatar: { width: 50, height: 50, borderRadius: 25 },
  sellerInitial: { fontSize: 18, fontWeight: '800', color: COLORS.primary },
  sellerVerifiedDot: {
    position: 'absolute', bottom: 0, right: 0,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: COLORS.primary, alignItems: 'center',
    justifyContent: 'center', borderWidth: 2, borderColor: COLORS.surfaceHigh,
  },
  sellerInfo: { flex: 1, gap: 3 },
  sellerName: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  sellerLocation: { fontSize: 12, color: COLORS.textSecondary },
  verifiedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: COLORS.primaryMuted, borderRadius: RADIUS.full,
    paddingVertical: 2, paddingHorizontal: 7, borderWidth: 1,
    borderColor: COLORS.border, alignSelf: 'flex-start',
  },
  verifiedText: { fontSize: 10, color: COLORS.primary, fontWeight: '700' },
  ratingBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: COLORS.primaryMuted, borderRadius: RADIUS.full,
    paddingVertical: 4, paddingHorizontal: 10, borderWidth: 1, borderColor: COLORS.border,
  },
  ratingText: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  actions: {
    flexDirection: 'row', gap: 10,
    paddingHorizontal: SPACING.margin, paddingVertical: 12,
    backgroundColor: COLORS.surfaceLow, borderTopWidth: 1, borderTopColor: COLORS.borderMuted,
  },
  whatsappBtn: {
    flex: 1, height: 50, borderRadius: RADIUS.md,
    borderWidth: 1.5, borderColor: '#25D366',
    backgroundColor: 'rgba(37,211,102,0.08)',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  whatsappText: { fontSize: 14, fontWeight: '700', color: '#25D366' },
  callBtn: {
    flex: 1, height: 50, borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 6,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
  },
  callText: { fontSize: 14, fontWeight: '700', color: COLORS.textOnGold },
  editBtn: {
    flex: 1, height: 50, borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 6,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
  },
  editText: { fontSize: 14, fontWeight: '700', color: COLORS.textOnGold },
});