import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator, Alert, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@lib/supabase';
import { useAuthStore } from '@stores/authStore';
import { COLORS, RADIUS, SPACING, NIGERIAN_STATES } from '@constants/index';

const CATEGORIES = [
  { id: 'phones', label: 'Phones & Tablets', icon: 'phone-portrait-outline' },
  { id: 'laptops', label: 'Laptops & Computers', icon: 'laptop-outline' },
  { id: 'electronics', label: 'Electronics', icon: 'tv-outline' },
  { id: 'appliances', label: 'Home Appliances', icon: 'thermometer-outline' },
  { id: 'furniture', label: 'Furniture', icon: 'bed-outline' },
  { id: 'home_goods', label: 'Home Goods', icon: 'home-outline' },
];

const CONDITIONS = [
  { id: 'new', label: 'Brand New', icon: 'sparkles-outline' },
  { id: 'fairly_used', label: 'Fairly Used', icon: 'thumbs-up-outline' },
  { id: 'used', label: 'Used', icon: 'refresh-outline' },
];

export default function PostMarketItemScreen({ navigation }) {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState([]);
  const [form, setForm] = useState({
    title: '', description: '', category: '',
    brand: '', price: '', condition: 'fairly_used',
    state: '', city: '', phone: '', whatsapp: '',
  });
  const [errors, setErrors] = useState({});

  const update = (key, val) => {
    setForm((f) => ({ ...f, [key]: val }));
    setErrors((e) => ({ ...e, [key]: null }));
  };

  const validate = () => {
    const e = {};
    if (!form.title?.trim()) e.title = 'Title is required';
    if (!form.category) e.category = 'Please select a category';
    if (!form.price) e.price = 'Price is required';
    if (!form.state) e.state = 'Please select a state';
    if (!form.city?.trim()) e.city = 'City is required';
    if (form.phone && !/^0[7-9][01]\d{8}$/.test(form.phone)) e.phone = 'Enter a valid Nigerian number';
    if (form.whatsapp && !/^0[7-9][01]\d{8}$/.test(form.whatsapp)) e.whatsapp = 'Enter a valid Nigerian number';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true, quality: 0.8, selectionLimit: 8,
    });
    if (!result.canceled) setImages((prev) => [...prev, ...result.assets].slice(0, 8));
  };

  const uploadImages = async () => {
    const urls = [];
    for (const img of images) {
      const ext = img.uri.split('.').pop().toLowerCase().split('?')[0];
      const fileName = `market/${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const mimeType = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : `image/${ext}`;
      const response = await fetch(img.uri);
      const arrayBuffer = await response.arrayBuffer();
      const { error } = await supabase.storage
        .from('market-images')
        .upload(fileName, arrayBuffer, { contentType: mimeType });
      if (!error) {
        const { data } = supabase.storage.from('market-images').getPublicUrl(fileName);
        urls.push(data.publicUrl);
      }
    }
    return urls;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const imageUrls = images.length > 0 ? await uploadImages() : [];
      const { error } = await supabase.from('market_items').insert({
        seller_id: user.id,
        title: form.title.trim(),
        description: form.description.trim() || null,
        category: form.category,
        brand: form.brand.trim() || null,
        price: form.price ? parseFloat(form.price) : null,
        condition: form.condition,
        state: form.state,
        city: form.city.trim(),
        phone: form.phone.trim() || null,
        whatsapp: form.whatsapp.trim() || null,
        images: imageUrls,
        is_available: true,
      });
      if (error) throw error;
      Alert.alert('Posted!', 'Your item is now live on the market.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>List an Item</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Photos ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Photos</Text>
          <Text style={styles.sectionSub}>Add up to 8 photos (recommended)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {images.map((img, i) => (
              <View key={i} style={styles.imageWrap}>
                <Image source={{ uri: img.uri }} style={styles.imageThumb} />
                <TouchableOpacity style={styles.removeImg}
                  onPress={() => setImages((p) => p.filter((_, x) => x !== i))}>
                  <Ionicons name="close-circle" size={20} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ))}
            {images.length < 8 && (
              <TouchableOpacity style={styles.addImageBtn} onPress={pickImages}>
                <Ionicons name="camera-outline" size={28} color={COLORS.primary} />
                <Text style={styles.addImageText}>Add Photo</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>

        {/* ── Basic Info ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Item Details</Text>

          <Field label="Title *" error={errors.title}>
            <TextInput style={styles.input} placeholderTextColor={COLORS.textMuted}
              placeholder="e.g. iPhone 14 Pro Max 256GB"
              value={form.title} onChangeText={(v) => update('title', v)} />
          </Field>

          <Field label="Brand">
            <TextInput style={styles.input} placeholderTextColor={COLORS.textMuted}
              placeholder="e.g. Apple, Samsung, LG"
              value={form.brand} onChangeText={(v) => update('brand', v)} />
          </Field>

          <Field label="Description">
            <TextInput style={[styles.input, styles.textarea]} placeholderTextColor={COLORS.textMuted}
              placeholder="Describe the item condition, specs, reason for selling..."
              value={form.description} onChangeText={(v) => update('description', v)}
              multiline numberOfLines={4} textAlignVertical="top" />
          </Field>
        </View>

        {/* ── Category ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Category *</Text>
          {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryChip, form.category === cat.id && styles.categoryChipActive]}
                onPress={() => update('category', cat.id)}
              >
                <Ionicons
                  name={cat.icon}
                  size={16}
                  color={form.category === cat.id ? COLORS.textOnGold : COLORS.textSecondary}
                />
                <Text style={[styles.categoryChipText, form.category === cat.id && styles.categoryChipTextActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Condition ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Condition</Text>
          <View style={styles.conditionRow}>
            {CONDITIONS.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={[styles.conditionBtn, form.condition === c.id && styles.conditionBtnActive]}
                onPress={() => update('condition', c.id)}
              >
                <Ionicons
                  name={c.icon}
                  size={16}
                  color={form.condition === c.id ? COLORS.textOnGold : COLORS.textSecondary}
                />
                <Text style={[styles.conditionText, form.condition === c.id && styles.conditionTextActive]}>
                  {c.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Price ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Price</Text>
          <Field label="Amount (₦) *" error={errors.price}>
            <View style={styles.priceInputWrap}>
              <Text style={styles.nairaSign}>₦</Text>
              <TextInput
                style={styles.priceInput}
                placeholder="0"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="numeric"
                value={form.price}
                onChangeText={(v) => update('price', v)}
              />
            </View>
          </Field>
        </View>

        {/* ── Location ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          <Field label="State *" error={errors.state}>
            <View style={styles.pickerWrap}>
              <Picker
                selectedValue={form.state}
                onValueChange={(val) => update('state', val)}
                style={styles.picker}
                dropdownIconColor={COLORS.primary}
              >
                <Picker.Item label="Select State" value="" color={COLORS.textMuted} backgroundColor={COLORS.surfaceHigh} />
                {NIGERIAN_STATES.map((s) => (
                  <Picker.Item key={s} label={s} value={s} color={COLORS.textPrimary} backgroundColor={COLORS.surfaceHigh} />
                ))}
              </Picker>
            </View>
          </Field>
          <Field label="City *" error={errors.city}>
            <TextInput style={styles.input} placeholderTextColor={COLORS.textMuted}
              placeholder="e.g. Ikeja" value={form.city}
              onChangeText={(v) => update('city', v)} />
          </Field>
        </View>

        {/* ── Contact ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <Text style={styles.sectionSub}>Let buyers reach you directly (optional)</Text>
          <Field label="Phone Number" error={errors.phone}>
            <View style={styles.contactWrap}>
              <Ionicons name="call-outline" size={18} color={COLORS.textMuted} />
              <TextInput style={styles.contactInput} placeholderTextColor={COLORS.textMuted}
                placeholder="e.g. 08012345678" value={form.phone}
                onChangeText={(v) => update('phone', v)}
                keyboardType="phone-pad" maxLength={11} />
            </View>
          </Field>
          <Field label="WhatsApp Number" error={errors.whatsapp}>
            <View style={styles.contactWrap}>
              <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
              <TextInput style={styles.contactInput} placeholderTextColor={COLORS.textMuted}
                placeholder="e.g. 08012345678" value={form.whatsapp}
                onChangeText={(v) => update('whatsapp', v)}
                keyboardType="phone-pad" maxLength={11} />
            </View>
          </Field>
        </View>

        {/* ── Submit ── */}
        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={handleSubmit} disabled={loading} activeOpacity={0.85}
        >
          {loading ? <ActivityIndicator color={COLORS.textOnGold} size="small" /> : (
            <>
              <Ionicons name="checkmark-circle" size={22} color={COLORS.textOnGold} />
              <Text style={styles.submitText}>Post Item</Text>
            </>
          )}
        </TouchableOpacity>
        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ label, error, children }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>{label}</Text>
      {children}
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
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
  scroll: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { padding: SPACING.margin },
  section: {
    backgroundColor: COLORS.surfaceHigh, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.borderMuted,
    padding: SPACING.margin, marginBottom: SPACING.sm,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  sectionSub: { fontSize: 12, color: COLORS.textMuted, marginBottom: 14 },
  imageWrap: { position: 'relative', marginRight: 12 },
  imageThumb: { width: 85, height: 85, borderRadius: RADIUS.md },
  removeImg: { position: 'absolute', top: -6, right: -6 },
  addImageBtn: {
    width: 85, height: 85, borderRadius: RADIUS.md,
    borderWidth: 1.5, borderStyle: 'dashed', borderColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.primaryMuted, gap: 4,
  },
  addImageText: { fontSize: 10, color: COLORS.primary, fontWeight: '600' },
  fieldWrap: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 7 },
  input: {
    backgroundColor: COLORS.surfaceHighest, borderWidth: 1, borderColor: COLORS.borderMuted,
    borderRadius: RADIUS.md, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: COLORS.textPrimary,
  },
  textarea: { height: 110, textAlignVertical: 'top' },
  errorText: { fontSize: 12, color: '#ef4444', marginTop: 4 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  categoryChip: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    paddingVertical: 9, paddingHorizontal: 14, borderRadius: RADIUS.full,
    borderWidth: 1, borderColor: COLORS.borderMuted, backgroundColor: COLORS.surfaceHighest,
  },
  categoryChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  categoryChipText: { fontSize: 12, fontWeight: '500', color: COLORS.textSecondary },
  categoryChipTextActive: { color: COLORS.textOnGold, fontWeight: '700' },
  conditionRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  conditionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 11, borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceHighest, borderWidth: 1, borderColor: COLORS.borderMuted,
  },
  conditionBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  conditionText: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },
  conditionTextActive: { color: COLORS.textOnGold },
  priceInputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surfaceHighest, borderWidth: 1,
    borderColor: COLORS.borderMuted, borderRadius: RADIUS.md, paddingHorizontal: 14,
  },
  nairaSign: { fontSize: 18, fontWeight: '700', color: COLORS.primary, marginRight: 6 },
  priceInput: { flex: 1, fontSize: 16, color: COLORS.textPrimary, paddingVertical: 12 },
  pickerWrap: {
    backgroundColor: COLORS.surfaceHighest, borderWidth: 1,
    borderColor: COLORS.borderMuted, borderRadius: RADIUS.md, overflow: 'hidden',
  },
  picker: { height: 52, color: COLORS.textPrimary },
  contactWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.surfaceHighest, borderWidth: 1,
    borderColor: COLORS.borderMuted, borderRadius: RADIUS.md, paddingHorizontal: 14,
  },
  contactInput: { flex: 1, fontSize: 15, color: COLORS.textPrimary, paddingVertical: 12 },
  submitBtn: {
    backgroundColor: COLORS.primary, height: 56, borderRadius: RADIUS.md,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    marginTop: SPACING.sm, shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { fontSize: 16, fontWeight: '700', color: COLORS.textOnGold },
});