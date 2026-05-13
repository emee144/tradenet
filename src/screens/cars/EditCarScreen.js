import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';
import { supabase } from '@lib/supabase';
import { useAuthStore } from '@stores/authStore';
import { COLORS, RADIUS, SPACING, NIGERIAN_STATES } from '@constants/index';

const CAR_COLORS = ['Black', 'White', 'Silver', 'Red', 'Blue', 'Grey', 'Brown', 'Gold', 'Green', 'Other'];
const PRICE_PERIODS = [
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
];

export default function EditCarScreen({ navigation, route }) {
  const { carId } = route.params;
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [images, setImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [form, setForm] = useState({
    title: '', make: '', model: '', year: '',
    color: '', type: 'sale', price: '',
    price_period: 'daily', mileage: '',
    description: '', state: '', city: '',
    phone: '', whatsapp: '',
    is_available: true,
  });
  const [errors, setErrors] = useState({});

  useEffect(() => { fetchCar(); }, []);

  const fetchCar = async () => {
    try {
      const { data, error } = await supabase.from('cars').select('*').eq('id', carId).single();
      if (error) throw error;

      setForm({
        title: data.title || '',
        make: data.make || '',
        model: data.model || '',
        year: data.year ? String(data.year) : '',
        color: data.color || '',
        type: data.type || 'sale',
        price: data.price ? String(data.price) : '',
        price_period: data.price_period || 'daily',
        mileage: data.mileage ? String(data.mileage) : '',
        description: data.description || '',
        state: data.state || '',
        city: data.city || '',
        phone: data.phone || '',
        whatsapp: data.whatsapp || '',
        is_available: data.is_available ?? true,
      });
      setExistingImages(data.images || []);
    } catch (err) {
      Alert.alert('Error', 'Failed to load car.');
      navigation.goBack();
    } finally {
      setFetching(false);
    }
  };

  const update = (key, val) => {
    setForm((f) => ({ ...f, [key]: val }));
    setErrors((e) => ({ ...e, [key]: null }));
  };

  const validate = () => {
    const e = {};
    if (!form.title?.trim()) e.title = 'Title is required';
    if (!form.make?.trim()) e.make = 'Make is required';
    if (!form.model?.trim()) e.model = 'Model is required';
    if (!form.price) e.price = 'Price is required';
    if (!form.state) e.state = 'Please select a state';
    if (!form.city?.trim()) e.city = 'City is required';
    if (form.phone && !/^0[7-9][01]\d{8}$/.test(form.phone)) e.phone = 'Enter valid Nigerian number';
    if (form.whatsapp && !/^0[7-9][01]\d{8}$/.test(form.whatsapp)) e.whatsapp = 'Enter valid Nigerian number';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.7,
      selectionLimit: 8,
    });
    if (!result.canceled) {
      setImages((prev) => [...prev, ...result.assets].slice(0, 8));
    }
  };

  const removeImage = (index) => setImages((prev) => prev.filter((_, i) => i !== index));

  const uploadNewImages = async () => {
    const urls = [];
    for (const img of images) {
      const ext = img.uri.split('?')[0].split('.').pop().toLowerCase();
      const fileName = `cars/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const mimeType = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : `image/${ext}`;

      const formData = new FormData();
      formData.append('file', { uri: img.uri, name: `photo.${ext}`, type: mimeType });

      const { error } = await supabase.storage
        .from('car-images')
        .upload(fileName, formData);

      if (error) throw new Error(`Image upload failed: ${error.message}`);
      const { data } = supabase.storage.from('car-images').getPublicUrl(fileName);
      urls.push(data.publicUrl);
    }
    return urls;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      let newUrls = images.length > 0 ? await uploadNewImages() : [];
      const { error } = await supabase.from('cars').update({
        title: form.title.trim(),
        make: form.make.trim(),
        model: form.model.trim(),
        year: form.year ? parseInt(form.year) : null,
        color: form.color,
        type: form.type,
        price: parseFloat(form.price),
        price_period: form.type === 'rental' ? form.price_period : null,
        mileage: form.mileage ? parseInt(form.mileage) : null,
        description: form.description.trim(),
        state: form.state,
        city: form.city.trim(),
        phone: form.phone.trim() || null,
        whatsapp: form.whatsapp.trim() || null,
        images: [...existingImages, ...newUrls],
        is_available: form.is_available,
        updated_at: new Date().toISOString(),
      }).eq('id', carId);

      if (error) throw error;
      Alert.alert('Updated! ✅', 'Vehicle listing updated successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete listing', 'Are you sure? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('cars').delete().eq('id', carId);
          if (!error) navigation.goBack();
        },
      },
    ]);
  };

  if (fetching) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Vehicle Listing</Text>
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Ionicons name="trash-outline" size={22} color="#ef4444" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Availability */}
        <View style={styles.section}>
          <View style={styles.availRow}>
            <View>
              <Text style={styles.availLabel}>Vehicle Available</Text>
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

        {/* Images */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Photos</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesRow}>
            {existingImages.map((url, i) => (
              <View key={`e-${i}`} style={styles.imageWrap}>
                <Image source={{ uri: url }} style={styles.imageThumb} />
                <TouchableOpacity style={styles.removeImg} onPress={() => setExistingImages(p => p.filter((_, x) => x !== i))}>
                  <Ionicons name="close-circle" size={20} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ))}
            {images.map((img, i) => (
              <View key={`n-${i}`} style={styles.imageWrap}>
                <Image source={{ uri: img.uri }} style={styles.imageThumb} />
                <TouchableOpacity style={styles.removeImg} onPress={() => setImages(p => p.filter((_, x) => x !== i))}>
                  <Ionicons name="close-circle" size={20} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ))}
            {(existingImages.length + images.length) < 8 && (
              <TouchableOpacity style={styles.addImageBtn} onPress={pickImages}>
                <Ionicons name="camera-outline" size={32} color={COLORS.primary} />
                <Text style={styles.addImageText}>Add Photo</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>

        {/* Listing Type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Listing Type</Text>
          <View style={styles.typeRow}>
            <TouchableOpacity
              style={[styles.typeBtn, form.type === 'sale' && styles.typeBtnActive]}
              onPress={() => update('type', 'sale')}
            >
              <Ionicons name="cash-outline" size={20} color={form.type === 'sale' ? COLORS.textOnGold : COLORS.textPrimary} />
              <Text style={[styles.typeBtnText, form.type === 'sale' && styles.typeBtnTextActive]}>For Sale</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.typeBtn, form.type === 'rental' && styles.typeBtnActive]}
              onPress={() => update('type', 'rental')}
            >
              <Ionicons name="key-outline" size={20} color={form.type === 'rental' ? COLORS.textOnGold : COLORS.textPrimary} />
              <Text style={[styles.typeBtnText, form.type === 'rental' && styles.typeBtnTextActive]}>For Rent</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Vehicle Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vehicle Details</Text>

          <Field label="Title *" error={errors.title}>
            <TextInput style={styles.input} placeholder="e.g. 2019 Toyota Camry" placeholderTextColor={COLORS.textMuted} value={form.title} onChangeText={(v) => update('title', v)} />
          </Field>

          <View style={styles.rowFields}>
            <View style={{ flex: 1 }}>
              <Field label="Make *" error={errors.make}>
                <TextInput style={styles.input} placeholder="Toyota" placeholderTextColor={COLORS.textMuted} value={form.make} onChangeText={(v) => update('make', v)} />
              </Field>
            </View>
            <View style={{ width: SPACING.md }} />
            <View style={{ flex: 1 }}>
              <Field label="Model *" error={errors.model}>
                <TextInput style={styles.input} placeholder="Camry" placeholderTextColor={COLORS.textMuted} value={form.model} onChangeText={(v) => update('model', v)} />
              </Field>
            </View>
          </View>

          <View style={styles.rowFields}>
            <View style={{ flex: 1 }}>
              <Field label="Year">
                <TextInput style={styles.input} placeholder="2019" keyboardType="numeric" maxLength={4} value={form.year} onChangeText={(v) => update('year', v)} />
              </Field>
            </View>
            <View style={{ width: SPACING.md }} />
            <View style={{ flex: 1 }}>
              <Field label="Mileage (km)">
                <TextInput style={styles.input} placeholder="45000" keyboardType="numeric" value={form.mileage} onChangeText={(v) => update('mileage', v)} />
              </Field>
            </View>
          </View>

          <Text style={styles.label}>Color</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SPACING.md }}>
            {CAR_COLORS.map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.colorChip, form.color === c && styles.colorChipActive]}
                onPress={() => update('color', c)}
              >
                <Text style={[styles.colorChipText, form.color === c && styles.colorChipTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Field label="Description">
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="Describe the car condition, features..."
              placeholderTextColor={COLORS.textMuted}
              value={form.description}
              onChangeText={(v) => update('description', v)}
              multiline
              numberOfLines={4}
            />
          </Field>
        </View>

        {/* Price */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Price</Text>
          <Field label="Amount (₦) *" error={errors.price}>
            <View style={styles.priceInputWrap}>
              <Text style={styles.nairaSign}>₦</Text>
              <TextInput
                style={styles.priceInput}
                placeholder="0"
                keyboardType="numeric"
                value={form.price}
                onChangeText={(v) => update('price', v)}
              />
            </View>
          </Field>

          {form.type === 'rental' && (
            <Field label="Price Period">
              <View style={styles.periodRow}>
                {PRICE_PERIODS.map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    style={[styles.periodBtn, form.price_period === p.id && styles.periodBtnActive]}
                    onPress={() => update('price_period', p.id)}
                  >
                    <Text style={[styles.periodBtnText, form.price_period === p.id && styles.periodBtnTextActive]}>
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Field>
          )}
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>

          <Field label="State *" error={errors.state}>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={form.state}
                onValueChange={(value) => update('state', value)}
                style={styles.picker}
                dropdownIconColor={COLORS.primary}
              >
                <Picker.Item label="Select State" value="" />
                {NIGERIAN_STATES.map((s) => (
                  <Picker.Item key={s} label={s} value={s} />
                ))}
              </Picker>
            </View>
          </Field>

          <Field label="City *" error={errors.city}>
            <TextInput
              style={styles.input}
              placeholder="e.g. Lagos"
              placeholderTextColor={COLORS.textMuted}
              value={form.city}
              onChangeText={(v) => update('city', v)}
            />
          </Field>
        </View>

        {/* Contact Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <Text style={styles.sectionSub}>Let buyers reach you directly (optional)</Text>

          <Field label="Phone Number" error={errors.phone}>
            <View style={styles.contactInputWrap}>
              <Ionicons name="call-outline" size={18} color={COLORS.textMuted} />
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
              <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
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

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.textOnGold} size="small" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={22} color={COLORS.textOnGold} />
              <Text style={styles.submitText}>Save Changes</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 80 }} />
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
    backgroundColor: COLORS.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.margin,
    paddingVertical: 16,
  },
  backBtn: { padding: 4 },
  deleteBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },

  scroll: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { padding: SPACING.margin },

  section: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 0.5,
    borderColor: COLORS.borderMuted,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 8 },
  sectionSub: { fontSize: 13, color: COLORS.textMuted, marginBottom: SPACING.md },

  availRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  availLabel: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  availSub: { fontSize: 13, color: COLORS.textMuted },

  toggle: {
    width: 46, height: 26, borderRadius: 13,
    backgroundColor: COLORS.surfaceHigh,
    padding: 3,
    justifyContent: 'center',
  },
  toggleOn: { backgroundColor: COLORS.primary },
  toggleThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', alignSelf: 'flex-start' },
  toggleThumbOn: { alignSelf: 'flex-end' },

  imagesRow: { flexDirection: 'row' },
  imageWrap: { position: 'relative', marginRight: 12 },
  imageThumb: { width: 85, height: 85, borderRadius: RADIUS.md },
  removeImg: { position: 'absolute', top: -6, right: -6 },
  addImageBtn: {
    width: 85, height: 85, borderRadius: RADIUS.md,
    borderWidth: 1.5, borderStyle: 'dashed', borderColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.surfaceHigh,
  },
  addImageText: { fontSize: 11, color: COLORS.primary, marginTop: 4 },

  fieldWrap: { marginBottom: SPACING.md },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 6 },
  input: {
    backgroundColor: COLORS.surfaceHigh,
    borderWidth: 1,
    borderColor: COLORS.borderMuted,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  textarea: { height: 110, textAlignVertical: 'top' },
  errorText: { fontSize: 12, color: '#ef4444', marginTop: 4 },

  typeRow: { flexDirection: 'row', gap: SPACING.md },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceHigh,
    borderWidth: 1,
    borderColor: COLORS.borderMuted,
  },
  typeBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  typeBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  typeBtnTextActive: { color: COLORS.textOnGold, fontWeight: '700' },

  rowFields: { flexDirection: 'row', gap: SPACING.md },

  colorChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.borderMuted,
    backgroundColor: COLORS.surfaceHigh,
    marginRight: SPACING.sm,
  },
  colorChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  colorChipText: { fontSize: 13, fontWeight: '500', color: COLORS.textPrimary },
  colorChipTextActive: { color: COLORS.textOnGold, fontWeight: '700' },

  priceInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceHigh,
    borderWidth: 1,
    borderColor: COLORS.borderMuted,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
  },
  nairaSign: { fontSize: 18, fontWeight: '700', color: COLORS.primary, marginRight: 8 },
  priceInput: { flex: 1, fontSize: 16, color: COLORS.textPrimary },

  periodRow: { flexDirection: 'row', gap: SPACING.md },
  periodBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceHigh,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderMuted,
  },
  periodBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  periodBtnText: { fontSize: 13, color: COLORS.textPrimary },
  periodBtnTextActive: { color: COLORS.textOnGold, fontWeight: '700' },

  pickerContainer: {
    backgroundColor: COLORS.surfaceHigh,
    borderWidth: 1,
    borderColor: COLORS.borderMuted,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  picker: { height: 52, color: COLORS.textPrimary },

  contactInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceHigh,
    borderWidth: 1,
    borderColor: COLORS.borderMuted,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
  },
  contactIcon: { marginRight: 10 },
  contactInput: { flex: 1, fontSize: 15, color: COLORS.textPrimary },

  submitBtn: {
    backgroundColor: COLORS.primary,
    height: 56,
    borderRadius: RADIUS.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: SPACING.md,
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitText: { fontSize: 16, fontWeight: '700', color: COLORS.textOnGold },
});