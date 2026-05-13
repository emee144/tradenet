import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator, Alert, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@lib/supabase';
import { COLORS, RADIUS, SPACING, PROPERTY_TYPES, NIGERIAN_STATES } from '@constants/index';

const AMENITIES_LIST = [
  'Electricity', 'Water', 'Security', 'Parking', 'Generator',
  'Swimming Pool', 'Gym', 'WiFi', 'Air Conditioning', 'Furnished',
  'Boys Quarters', 'Fence', 'CCTV', 'Elevator', 'Balcony',
];

export default function EditPropertyScreen({ navigation, route }) {
  const { propertyId } = route.params;
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [images, setImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [form, setForm] = useState({
    title: '', description: '', type: '',
    price: '', price_period: 'yearly',
    bedrooms: '', bathrooms: '', toilet: '',
    state: '', city: '', address: '',
    phone: '', whatsapp: '',
    is_available: true,
  });
  const [errors, setErrors] = useState({});

  useEffect(() => { fetchProperty(); }, []);

  const fetchProperty = async () => {
    try {
      const { data, error } = await supabase.from('properties').select('*').eq('id', propertyId).single();
      if (error) throw error;
      setForm({
        title: data.title || '',
        description: data.description || '',
        type: data.type || '',
        price: data.price ? String(data.price) : '',
        price_period: data.price_period || 'yearly',
        bedrooms: data.bedrooms ? String(data.bedrooms) : '',
        bathrooms: data.bathrooms ? String(data.bathrooms) : '',
        toilet: data.toilet ? String(data.toilet) : '',
        state: data.state || '',
        city: data.city || '',
        address: data.address || '',
        phone: data.phone || '',
        whatsapp: data.whatsapp || '',
        is_available: data.is_available ?? true,
      });
      setExistingImages(data.images || []);
      setSelectedAmenities(data.amenities || []);
    } catch (err) {
      Alert.alert('Error', 'Failed to load property.');
      navigation.goBack();
    } finally {
      setFetching(false);
    }
  };

  const update = (key, val) => {
    setForm((f) => ({ ...f, [key]: val }));
    setErrors((e) => ({ ...e, [key]: null }));
  };

  const toggleAmenity = (a) =>
    setSelectedAmenities((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]
    );

  const validate = () => {
    const e = {};
    if (!form.title) e.title = 'Title is required';
    if (!form.type) e.type = 'Please select a property type';
    if (!form.price) e.price = 'Price is required';
    if (!form.state) e.state = 'Please select a state';
    if (!form.city) e.city = 'City is required';
    if (form.phone && !/^0[7-9][01]\d{8}$/.test(form.phone)) e.phone = 'Enter a valid Nigerian number (e.g. 08012345678)';
    if (form.whatsapp && !/^0[7-9][01]\d{8}$/.test(form.whatsapp)) e.whatsapp = 'Enter a valid Nigerian number (e.g. 08012345678)';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaType.Images,
      allowsMultipleSelection: true, quality: 0.7, selectionLimit: 8,
    });
    if (!result.canceled) setImages((prev) => [...prev, ...result.assets].slice(0, 8));
  };

  const uploadNewImages = async () => {
    const urls = [];
    for (const img of images) {
      const ext = img.uri.split('.').pop().toLowerCase();
      const fileName = `properties/${Date.now()}.${ext}`;
      const mimeType = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
      const response = await fetch(img.uri);
      const arrayBuffer = await response.arrayBuffer();
      const { error } = await supabase.storage.from('property-images').upload(fileName, arrayBuffer, { contentType: mimeType });
      if (!error) {
        const { data } = supabase.storage.from('property-images').getPublicUrl(fileName);
        urls.push(data.publicUrl);
      }
    }
    return urls;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      let newUrls = images.length > 0 ? await uploadNewImages() : [];
      const { error } = await supabase.from('properties').update({
        title: form.title.trim(),
        description: form.description.trim(),
        type: form.type,
        price: parseFloat(form.price),
        price_period: form.price_period,
        bedrooms: form.bedrooms ? parseInt(form.bedrooms) : null,
        bathrooms: form.bathrooms ? parseInt(form.bathrooms) : null,
        toilet: form.toilet ? parseInt(form.toilet) : null,
        state: form.state, city: form.city.trim(),
        address: form.address.trim(),
        images: [...existingImages, ...newUrls],
        amenities: selectedAmenities,
        phone: form.phone.trim() || null,
        whatsapp: form.whatsapp.trim() || null,
        is_available: form.is_available,
        updated_at: new Date().toISOString(),
      }).eq('id', propertyId);
      if (error) throw error;
      Alert.alert('Updated!', 'Property updated successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete property', 'Are you sure? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('properties').delete().eq('id', propertyId);
          if (!error) navigation.goBack();
        },
      },
    ]);
  };

  if (fetching) return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.centered}><ActivityIndicator size="large" color={COLORS.primary} /></View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={styles.safe}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Property</Text>
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Ionicons name="trash-outline" size={20} color={COLORS.error} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* ── Availability ── */}
        <View style={styles.section}>
          <View style={styles.availRow}>
            <View>
              <Text style={styles.availLabel}>Property available</Text>
              <Text style={styles.availSub}>Toggle off to hide from listings</Text>
            </View>
            <TouchableOpacity
              style={[styles.toggle, form.is_available && styles.toggleOn]}
              onPress={() => update('is_available', !form.is_available)}
            >
              <View style={[styles.toggleThumb, form.is_available && styles.toggleThumbOn]} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Images ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Photos</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {existingImages.map((url, i) => (
              <View key={`e-${i}`} style={styles.imageWrap}>
                <Image source={{ uri: url }} style={styles.imageThumb} />
                <TouchableOpacity style={styles.removeImg}
                  onPress={() => setExistingImages((p) => p.filter((_, x) => x !== i))}>
                  <Ionicons name="close-circle" size={20} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ))}
            {images.map((img, i) => (
              <View key={`n-${i}`} style={styles.imageWrap}>
                <Image source={{ uri: img.uri }} style={styles.imageThumb} />
                <TouchableOpacity style={styles.removeImg}
                  onPress={() => setImages((p) => p.filter((_, x) => x !== i))}>
                  <Ionicons name="close-circle" size={20} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ))}
            {(existingImages.length + images.length) < 8 && (
              <TouchableOpacity style={styles.addImageBtn} onPress={pickImages}>
                <Ionicons name="camera-outline" size={28} color={COLORS.primary} />
                <Text style={styles.addImageText}>Add Photo</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>

        {/* ── Basic Info ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          <Field label="Title *" error={errors.title}>
            <TextInput style={styles.input} placeholderTextColor={COLORS.textMuted}
              placeholder="e.g. 3 Bedroom Flat in Lekki"
              value={form.title} onChangeText={(v) => update('title', v)} />
          </Field>
          <Field label="Description">
            <TextInput style={[styles.input, styles.textarea]} placeholderTextColor={COLORS.textMuted}
              placeholder="Describe the property..." value={form.description}
              onChangeText={(v) => update('description', v)}
              multiline numberOfLines={4} textAlignVertical="top" />
          </Field>
        </View>

        {/* ── Property Type ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Property Type *</Text>
          {errors.type && <Text style={styles.errorText}>{errors.type}</Text>}
          <View style={styles.typeGrid}>
            {PROPERTY_TYPES.map((pt) => (
              <TouchableOpacity key={pt.value}
                style={[styles.typeChip, form.type === pt.value && styles.typeChipActive]}
                onPress={() => update('type', pt.value)}>
                <Text style={[styles.typeChipText, form.type === pt.value && styles.typeChipTextActive]}>
                  {pt.label}
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
              <TextInput style={styles.priceInput} placeholderTextColor={COLORS.textMuted}
                placeholder="0.00" value={form.price}
                onChangeText={(v) => update('price', v)} keyboardType="numeric" />
            </View>
          </Field>
          <Field label="Price period">
            <View style={styles.periodRow}>
              {['yearly', 'monthly', 'total'].map((p) => (
                <TouchableOpacity key={p}
                  style={[styles.periodBtn, form.price_period === p && styles.periodBtnActive]}
                  onPress={() => update('price_period', p)}>
                  <Text style={[styles.periodBtnText, form.price_period === p && styles.periodBtnTextActive]}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Field>
        </View>

        {/* ── Details ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.rowFields}>
            <View style={{ flex: 1 }}>
              <Field label="Bedrooms">
                <TextInput style={styles.input} placeholderTextColor={COLORS.textMuted}
                  placeholder="e.g. 3" value={form.bedrooms}
                  onChangeText={(v) => update('bedrooms', v)} keyboardType="numeric" />
              </Field>
            </View>
            <View style={{ width: 12 }} />
            <View style={{ flex: 1 }}>
              <Field label="Bathrooms">
                <TextInput style={styles.input} placeholderTextColor={COLORS.textMuted}
                  placeholder="e.g. 2" value={form.bathrooms}
                  onChangeText={(v) => update('bathrooms', v)} keyboardType="numeric" />
              </Field>
            </View>
          </View>
          <View style={styles.rowFields}>
            <View style={{ flex: 1 }}>
              <Field label="Toilets">
                <TextInput style={styles.input} placeholderTextColor={COLORS.textMuted}
                  placeholder="e.g. 2" value={form.toilet}
                  onChangeText={(v) => update('toilet', v)} keyboardType="numeric" />
              </Field>
            </View>
          </View>
        </View>

        {/* ── Amenities ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Amenities</Text>
          <View style={styles.amenitiesGrid}>
            {AMENITIES_LIST.map((a) => (
              <TouchableOpacity key={a}
                style={[styles.amenityChip, selectedAmenities.includes(a) && styles.amenityChipActive]}
                onPress={() => toggleAmenity(a)}>
                {selectedAmenities.includes(a) && (
                  <Ionicons name="checkmark" size={12} color={COLORS.textOnGold} />
                )}
                <Text style={[styles.amenityText, selectedAmenities.includes(a) && styles.amenityTextActive]}>
                  {a}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
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
                <Picker.Item label="Select State" value="" color={COLORS.textMuted} />
                {NIGERIAN_STATES.map((s) => (
                  <Picker.Item key={s} label={s} value={s} color={COLORS.textPrimary} />
                ))}
              </Picker>
            </View>
          </Field>
          <Field label="City *" error={errors.city}>
            <TextInput style={styles.input} placeholderTextColor={COLORS.textMuted}
              placeholder="e.g. Lekki" value={form.city}
              onChangeText={(v) => update('city', v)} />
          </Field>
          <Field label="Address">
            <TextInput style={styles.input} placeholderTextColor={COLORS.textMuted}
              placeholder="e.g. 5 Victoria Island Road" value={form.address}
              onChangeText={(v) => update('address', v)} />
          </Field>
        </View>

        {/* ── Contact ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <Text style={styles.sectionSub}>Let interested buyers/tenants reach you directly (optional)</Text>

          <Field label="Phone Number" error={errors.phone}>
            <View style={styles.contactInputWrap}>
              <Ionicons name="call-outline" size={18} color={COLORS.textMuted} style={styles.contactIcon} />
              <TextInput
                style={styles.contactInput}
                placeholder="e.g. 08012345678"
                placeholderTextColor={COLORS.textMuted}
                value={form.phone}
                onChangeText={(v) => update('phone', v)}
                keyboardType="phone-pad"
                maxLength={11}
              />
            </View>
          </Field>

          <Field label="WhatsApp Number" error={errors.whatsapp}>
            <View style={styles.contactInputWrap}>
              <Ionicons name="logo-whatsapp" size={18} color="#25D366" style={styles.contactIcon} />
              <TextInput
                style={styles.contactInput}
                placeholder="e.g. 08012345678"
                placeholderTextColor={COLORS.textMuted}
                value={form.whatsapp}
                onChangeText={(v) => update('whatsapp', v)}
                keyboardType="phone-pad"
                maxLength={11}
              />
            </View>
          </Field>
        </View>

        {/* ── Save ── */}
        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={handleSave} disabled={loading} activeOpacity={0.85}
        >
          {loading ? <ActivityIndicator color={COLORS.textOnGold} size="small" /> : (
            <>
              <Ionicons name="checkmark-circle" size={22} color={COLORS.textOnGold} />
              <Text style={styles.submitText}>Save Changes</Text>
            </>
          )}
        </TouchableOpacity>
        <View style={{ height: 40 }} />
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
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },

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
  deleteBtn: {
    width: 38, height: 38, borderRadius: RADIUS.md,
    backgroundColor: 'rgba(147,0,10,0.15)', borderWidth: 1,
    borderColor: 'rgba(255,180,171,0.2)', alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary },

  scroll: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { padding: SPACING.margin },

  // ── Section ──
  section: {
    backgroundColor: COLORS.surfaceHigh, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.borderMuted,
    padding: SPACING.margin, marginBottom: SPACING.sm,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.sm },

  // ── Availability ──
  availRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  availLabel: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  availSub: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  toggle: {
    width: 46, height: 26, borderRadius: 13,
    backgroundColor: COLORS.surfaceHighest, padding: 3, justifyContent: 'center',
  },
  toggleOn: { backgroundColor: COLORS.primary },
  toggleThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', alignSelf: 'flex-start' },
  toggleThumbOn: { alignSelf: 'flex-end' },

  // ── Images ──
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

  // ── Fields ──
  fieldWrap: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 7 },
  input: {
    backgroundColor: COLORS.surfaceHighest, borderWidth: 1, borderColor: COLORS.borderMuted,
    borderRadius: RADIUS.md, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: COLORS.textPrimary,
  },
  textarea: { height: 110, textAlignVertical: 'top' },
  errorText: { fontSize: 12, color: '#ef4444', marginTop: 4 },

  // ── Property type ──
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip: {
    paddingVertical: 9, paddingHorizontal: 16, borderRadius: RADIUS.full,
    borderWidth: 1, borderColor: COLORS.borderMuted, backgroundColor: COLORS.surfaceHighest,
  },
  typeChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  typeChipText: { fontSize: 13, fontWeight: '500', color: COLORS.textSecondary },
  typeChipTextActive: { color: COLORS.textOnGold, fontWeight: '700' },

  // ── Price ──
  priceInputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surfaceHighest, borderWidth: 1,
    borderColor: COLORS.borderMuted, borderRadius: RADIUS.md, paddingHorizontal: 14,
  },
  nairaSign: { fontSize: 18, fontWeight: '700', color: COLORS.primary, marginRight: 6 },
  priceInput: { flex: 1, fontSize: 16, color: COLORS.textPrimary, paddingVertical: 12 },
  periodRow: { flexDirection: 'row', gap: 8 },
  periodBtn: {
    flex: 1, paddingVertical: 11, borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceHighest, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.borderMuted,
  },
  periodBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  periodBtnText: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },
  periodBtnTextActive: { color: COLORS.textOnGold },

  rowFields: { flexDirection: 'row' },

  // ── Amenities ──
  amenitiesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  amenityChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingVertical: 7, paddingHorizontal: 12, borderRadius: RADIUS.full,
    borderWidth: 1, borderColor: COLORS.borderMuted, backgroundColor: COLORS.surfaceHighest,
  },
  amenityChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  amenityText: { fontSize: 12, fontWeight: '500', color: COLORS.textSecondary },
  amenityTextActive: { color: COLORS.textOnGold, fontWeight: '700' },

  // ── State picker ──
  pickerWrap: {
    backgroundColor: COLORS.surfaceHighest, borderWidth: 1,
    borderColor: COLORS.borderMuted, borderRadius: RADIUS.md, overflow: 'hidden',
  },
  picker: { height: 52, color: COLORS.textPrimary },

  // ── Contact ──
  sectionSub: { fontSize: 12, color: COLORS.textMuted, marginBottom: SPACING.sm, marginTop: -4 },
  contactInputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surfaceHighest, borderWidth: 1,
    borderColor: COLORS.borderMuted, borderRadius: RADIUS.md, paddingHorizontal: 14,
  },
  contactIcon: { marginRight: 8 },
  contactInput: { flex: 1, fontSize: 15, color: COLORS.textPrimary, paddingVertical: 12 },

  // ── Submit ──
  submitBtn: {
    backgroundColor: COLORS.primary, height: 56, borderRadius: RADIUS.md,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    marginTop: SPACING.sm, shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { fontSize: 16, fontWeight: '700', color: COLORS.textOnGold },
});