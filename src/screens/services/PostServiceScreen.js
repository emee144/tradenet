import React, { useState } from 'react';
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
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@lib/supabase';
import { useAuthStore } from '@stores/authStore';
import { COLORS, RADIUS, SPACING, SERVICE_CATEGORIES, NIGERIAN_STATES } from '@constants/index';

const PRICE_TYPES = [
  { id: 'fixed', label: 'Fixed Price' },
  { id: 'hourly', label: 'Hourly Rate' },
  { id: 'negotiable', label: 'Negotiable' },
];

export default function PostServiceScreen({ navigation }) {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState([]);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category_id: '',
    price: '',
    price_type: 'fixed',
    state: '',
    city: '',
    address: '',
    phone: '',
    whatsapp: '',
  });
  const [errors, setErrors] = useState({});

  const update = (key, val) => {
    setForm((f) => ({ ...f, [key]: val }));
    setErrors((e) => ({ ...e, [key]: null }));
  };

  const validate = () => {
    const e = {};
    if (!form.title?.trim()) e.title = 'Title is required';
    if (!form.category_id) e.category_id = 'Please select a category';
    if (!form.state) e.state = 'Please select a state';
    if (!form.city?.trim()) e.city = 'City is required';
    if (form.phone && !/^0[7-9][01]\d{8}$/.test(form.phone)) e.phone = 'Enter a valid Nigerian number (e.g. 08012345678)';
    if (form.whatsapp && !/^0[7-9][01]\d{8}$/.test(form.whatsapp)) e.whatsapp = 'Enter a valid Nigerian number (e.g. 08012345678)';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaType.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 5,
    });
    if (!result.canceled) {
      setImages((prev) => [...prev, ...result.assets].slice(0, 5));
    }
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async () => {
    const urls = [];
    for (const img of images) {
      const ext = img.uri.split('.').pop().toLowerCase();
      const fileName = `services/${user.id}/${Date.now()}.${ext}`;
      const mimeType = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;

      const response = await fetch(img.uri);
      const arrayBuffer = await response.arrayBuffer();

      const { error } = await supabase.storage
        .from('service-images')
        .upload(fileName, arrayBuffer, { contentType: mimeType });

      if (!error) {
        const { data: urlData } = supabase.storage
          .from('service-images')
          .getPublicUrl(fileName);
        urls.push(urlData.publicUrl);
      }
    }
    return urls;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    if (!user) {
      Alert.alert('Error', 'You must be logged in to post a service.');
      return;
    }

    setLoading(true);
    try {
      let imageUrls = [];
      if (images.length > 0) {
        imageUrls = await uploadImages();
      }

      const { error } = await supabase.from('services').insert({
        provider_id: user.id,
        title: form.title.trim(),
        description: form.description.trim(),
        category_id: form.category_id,
        price: form.price ? parseFloat(form.price) : null,
        price_type: form.price_type,
        state: form.state,
        city: form.city.trim(),
        address: form.address.trim(),
        images: imageUrls,
        is_available: true,
        phone: form.phone.trim() || null,
        whatsapp: form.whatsapp.trim() || null,
      });

      if (error) throw error;

      Alert.alert('Success! 🎉', 'Your service has been posted successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to post service');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post a Service</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Images */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Photos</Text>
          <Text style={styles.sectionSub}>Add up to 5 photos (optional but recommended)</Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesRow}>
            {images.map((img, index) => (
              <View key={index} style={styles.imageWrap}>
                <Image source={{ uri: img.uri }} style={styles.imageThumb} />
                <TouchableOpacity style={styles.removeImg} onPress={() => removeImage(index)}>
                  <Ionicons name="close-circle" size={20} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ))}

            {images.length < 5 && (
              <TouchableOpacity style={styles.addImageBtn} onPress={pickImages}>
                <Ionicons name="camera-outline" size={32} color={COLORS.primary} />
                <Text style={styles.addImageText}>Add Photo</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>

        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>

          <Field label="Service Title *" error={errors.title}>
            <TextInput
              style={styles.input}
              placeholder="e.g. Professional Plumbing Service"
              placeholderTextColor={COLORS.textMuted}
              value={form.title}
              onChangeText={(v) => update('title', v)}
            />
          </Field>

          <Field label="Description">
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="Describe your service in detail..."
              placeholderTextColor={COLORS.textMuted}
              value={form.description}
              onChangeText={(v) => update('description', v)}
              multiline
              numberOfLines={5}
            />
          </Field>
        </View>

        {/* Category with Icons Only */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Category *</Text>
          {errors.category_id && <Text style={styles.errorText}>{errors.category_id}</Text>}

          <View style={styles.categoryGrid}>
            {SERVICE_CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryChip, form.category_id === cat.id && styles.categoryChipActive]}
                onPress={() => update('category_id', cat.id)}
              >
                <Ionicons
                  name={cat.icon}
                  size={18}
                  color={form.category_id === cat.id ? COLORS.textOnGold : COLORS.textPrimary}
                />
                <Text style={[styles.categoryChipText, form.category_id === cat.id && styles.categoryChipTextActive]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Pricing */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pricing</Text>

          <View style={styles.priceTypeRow}>
            {PRICE_TYPES.map((pt) => (
              <TouchableOpacity
                key={pt.id}
                style={[styles.priceTypeBtn, form.price_type === pt.id && styles.priceTypeBtnActive]}
                onPress={() => update('price_type', pt.id)}
              >
                <Text style={[styles.priceTypeBtnText, form.price_type === pt.id && styles.priceTypeBtnTextActive]}>
                  {pt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {form.price_type !== 'negotiable' && (
            <Field label="Price (₦)">
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
          )}
        </View>

        {/* Location - State as Dropdown */}
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
              placeholder="e.g. Ibadan"
              placeholderTextColor={COLORS.textMuted}
              value={form.city}
              onChangeText={(v) => update('city', v)}
            />
          </Field>

          <Field label="Full Address (optional)">
            <TextInput
              style={styles.input}
              placeholder="e.g. 45 Aare Avenue, Oluyole"
              placeholderTextColor={COLORS.textMuted}
              value={form.address}
              onChangeText={(v) => update('address', v)}
            />
          </Field>
        </View>

        {/* Contact Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <Text style={styles.sectionSub}>Let interested clients reach you directly (optional)</Text>

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

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.textOnGold} size="small" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={22} color={COLORS.textOnGold} />
              <Text style={styles.submitText}>Post Service</Text>
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

  imagesRow: { flexDirection: 'row' },
  imageWrap: { position: 'relative', marginRight: 12 },
  imageThumb: { width: 85, height: 85, borderRadius: RADIUS.md },
  removeImg: { position: 'absolute', top: -6, right: -6 },
  addImageBtn: {
    width: 85,
    height: 85,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
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

  pickerContainer: {
    backgroundColor: COLORS.surfaceHigh,
    borderWidth: 1,
    borderColor: COLORS.borderMuted,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  picker: { height: 52, color: COLORS.textPrimary },

  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.borderMuted,
    backgroundColor: COLORS.surfaceHigh,
  },
  categoryChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  categoryChipText: { fontSize: 13, fontWeight: '500', color: COLORS.textPrimary },
  categoryChipTextActive: { color: COLORS.textOnGold, fontWeight: '700' },

  priceTypeRow: { flexDirection: 'row', gap: 10, marginBottom: SPACING.md },
  priceTypeBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceHigh,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderMuted,
  },
  priceTypeBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  priceTypeBtnText: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary },
  priceTypeBtnTextActive: { color: COLORS.textOnGold },

  priceInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceHigh,
    borderWidth: 1,
    borderColor: COLORS.borderMuted,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
  },
  nairaSign: { fontSize: 18, fontWeight: '700', color: COLORS.primary, marginRight: 6 },
  priceInput: { flex: 1, fontSize: 16, color: COLORS.textPrimary },

  contactInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceHigh,
    borderWidth: 1,
    borderColor: COLORS.borderMuted,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
  },
  contactIcon: { marginRight: 8 },
  contactInput: { flex: 1, fontSize: 15, color: COLORS.textPrimary, paddingVertical: 12 },

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