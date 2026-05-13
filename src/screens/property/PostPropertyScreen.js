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
import { COLORS, RADIUS, SPACING, PROPERTY_TYPES, NIGERIAN_STATES } from '@constants/index';

const AMENITIES_LIST = [
  'Electricity', 'Water', 'Security', 'Parking', 'Generator',
  'Swimming Pool', 'Gym', 'WiFi', 'Air Conditioning', 'Furnished',
  'Boys Quarters', 'Fence', 'CCTV', 'Elevator', 'Balcony',
];

export default function PostPropertyScreen({ navigation }) {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState([]);
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [form, setForm] = useState({
    title: '',
    description: '',
    type: '',
    price: '',
    price_period: 'yearly',
    bedrooms: '',
    bathrooms: '',
    toilet: '',
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

  const toggleAmenity = (amenity) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  const validate = () => {
    const e = {};
    if (!form.title?.trim()) e.title = 'Title is required';
    if (!form.type) e.type = 'Please select a property type';
    if (!form.price) e.price = 'Price is required';
    if (!form.state) e.state = 'Please select a state';
    if (!form.city?.trim()) e.city = 'City is required';
    if (form.phone && !/^0[7-9][01]\d{8}$/.test(form.phone)) e.phone = 'Enter a valid Nigerian number (e.g. 08012345678)';
    if (form.whatsapp && !/^0[7-9][01]\d{8}$/.test(form.whatsapp)) e.whatsapp = 'Enter a valid Nigerian number (e.g. 08012345678)';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 8,
    });
    if (!result.canceled) {
      setImages((prev) => [...prev, ...result.assets].slice(0, 8));
    }
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async () => {
    const urls = [];
    for (const img of images) {
      const ext = img.uri.split('.').pop().toLowerCase();
      const fileName = `properties/${user.id}/${Date.now()}.${ext}`;
      const mimeType = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
      const response = await fetch(img.uri);
      const arrayBuffer = await response.arrayBuffer();

      const { error } = await supabase.storage
        .from('property-images')
        .upload(fileName, arrayBuffer, { contentType: mimeType });

      if (!error) {
        const { data: urlData } = supabase.storage
          .from('property-images')
          .getPublicUrl(fileName);
        urls.push(urlData.publicUrl);
      }
    }
    return urls;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    if (!user) {
      Alert.alert('Error', 'You must be logged in');
      return;
    }

    setLoading(true);
    try {
      let imageUrls = [];
      if (images.length > 0) {
        imageUrls = await uploadImages();
      }

      const { error } = await supabase.from('properties').insert({
        owner_id: user.id,
        title: form.title.trim(),
        description: form.description.trim(),
        type: form.type,
        price: parseFloat(form.price),
        price_period: form.price_period,
        bedrooms: form.bedrooms ? parseInt(form.bedrooms) : null,
        bathrooms: form.bathrooms ? parseInt(form.bathrooms) : null,
        toilet: form.toilet ? parseInt(form.toilet) : null,
        state: form.state,
        city: form.city.trim(),
        address: form.address.trim(),
        images: imageUrls,
        amenities: selectedAmenities,
        is_available: true,
        phone: form.phone.trim() || null,
        whatsapp: form.whatsapp.trim() || null,
      });

      if (error) throw error;

      Alert.alert('Success! 🎉', 'Your property has been listed successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to post property');
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
        <Text style={styles.headerTitle}>List a Property</Text>
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
          <Text style={styles.sectionSub}>Add up to 8 photos (highly recommended)</Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesRow}>
            {images.map((img, index) => (
              <View key={index} style={styles.imageWrap}>
                <Image source={{ uri: img.uri }} style={styles.imageThumb} />
                <TouchableOpacity style={styles.removeImg} onPress={() => removeImage(index)}>
                  <Ionicons name="close-circle" size={20} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ))}

            {images.length < 8 && (
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

          <Field label="Property Title *" error={errors.title}>
            <TextInput
              style={styles.input}
              placeholder="e.g. 4 Bedroom Duplex in Banana Island"
              placeholderTextColor={COLORS.textMuted}
              value={form.title}
              onChangeText={(v) => update('title', v)}
            />
          </Field>

          <Field label="Description">
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="Describe the property in detail..."
              placeholderTextColor={COLORS.textMuted}
              value={form.description}
              onChangeText={(v) => update('description', v)}
              multiline
              numberOfLines={5}
            />
          </Field>
        </View>

        {/* Property Type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Property Type *</Text>
          {errors.type && <Text style={styles.errorText}>{errors.type}</Text>}

          <View style={styles.typeGrid}>
            {PROPERTY_TYPES.map((pt) => (
              <TouchableOpacity
                key={pt.value}
                style={[styles.typeChip, form.type === pt.value && styles.typeChipActive]}
                onPress={() => update('type', pt.value)}
              >
                <Ionicons 
                  name={pt.icon || 'home-outline'} 
                  size={18} 
                  color={form.type === pt.value ? COLORS.textOnGold : COLORS.textPrimary} 
                />
                <Text style={[styles.typeChipText, form.type === pt.value && styles.typeChipTextActive]}>
                  {pt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Pricing */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pricing</Text>

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

          <Field label="Price Period">
            <View style={styles.periodRow}>
              {['yearly', 'monthly', 'total'].map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[styles.periodBtn, form.price_period === p && styles.periodBtnActive]}
                  onPress={() => update('price_period', p)}
                >
                  <Text style={[styles.periodBtnText, form.price_period === p && styles.periodBtnTextActive]}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Field>
        </View>

       {/* Property Details */}
<View style={styles.section}>
  <Text style={styles.sectionTitle}>Property Details</Text>
  
  <View style={styles.rowFields}>
    <View style={{ flex: 1 }}>
      <Field label="Bedrooms">
        <TextInput
          style={styles.input}
          placeholder="e.g. 3"
          keyboardType="numeric"
          value={form.bedrooms}
          onChangeText={(v) => update('bedrooms', v)}
        />
      </Field>
    </View>

    <View style={{ width: SPACING.md }} />

    <View style={{ flex: 1 }}>
      <Field label="Bathrooms">
        <TextInput
          style={styles.input}
          placeholder="e.g. 3"
          keyboardType="numeric"
          value={form.bathrooms}
          onChangeText={(v) => update('bathrooms', v)}
        />
      </Field>
    </View>
  </View>

  <View style={styles.rowFields}>
    <View style={{ flex: 1 }}>
      <Field label="Toilets">
        <TextInput
          style={styles.input}
          placeholder="e.g. 3"
          keyboardType="numeric"
          value={form.toilet}
          onChangeText={(v) => update('toilet', v)}
        />
      </Field>
    </View>
  </View>
</View>

        {/* Amenities */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Amenities</Text>
          <View style={styles.amenitiesGrid}>
            {AMENITIES_LIST.map((a) => (
              <TouchableOpacity
                key={a}
                style={[styles.amenityChip, selectedAmenities.includes(a) && styles.amenityChipActive]}
                onPress={() => toggleAmenity(a)}
              >
                {selectedAmenities.includes(a) && <Ionicons name="checkmark-circle" size={16} color={COLORS.textOnGold} />}
                <Text style={[styles.amenityText, selectedAmenities.includes(a) && styles.amenityTextActive]}>
                  {a}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Location - Dropdown for State */}
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
              placeholder="e.g. Lekki Phase 1"
              placeholderTextColor={COLORS.textMuted}
              value={form.city}
              onChangeText={(v) => update('city', v)}
            />
          </Field>

          <Field label="Full Address (optional)">
            <TextInput
              style={styles.input}
              placeholder="e.g. 12 Admiralty Way"
              placeholderTextColor={COLORS.textMuted}
              value={form.address}
              onChangeText={(v) => update('address', v)}
            />
          </Field>
        </View>

        {/* Contact Information */}
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
              <Text style={styles.submitText}>List Property</Text>
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 10,
  },
  sectionSub: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: SPACING.md,
  },

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
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
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
  picker: {
    height: 52,
    color: COLORS.textPrimary,
  },

  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  typeChip: {
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
  typeChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  typeChipText: { fontSize: 13, fontWeight: '500', color: COLORS.textPrimary },
  typeChipTextActive: { color: COLORS.textOnGold, fontWeight: '700' },

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

  periodRow: { flexDirection: 'row', gap: 10 },
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

  rowFields: { flexDirection: 'row', gap: SPACING.md },

  amenitiesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  amenityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.borderMuted,
    backgroundColor: COLORS.surfaceHigh,
  },
  amenityChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  amenityText: { fontSize: 13, color: COLORS.textPrimary },
  amenityTextActive: { color: COLORS.textOnGold, fontWeight: '700' },

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