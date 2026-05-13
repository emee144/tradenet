import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator, Alert, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@lib/supabase';
import { useAuthStore } from '@stores/authStore';
import { COLORS, RADIUS, SPACING, NIGERIAN_STATES } from '@constants/index';

export default function EditProfileScreen({ navigation }) {
  const { user, profile, fetchProfile } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [avatar, setAvatar] = useState(null);
  const [form, setForm] = useState({
    full_name: '', bio: '', city: '', state: '', address: '', email: '',
  });

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || '',
        bio: profile.bio || '',
        city: profile.city || '',
        state: profile.state || '',
        address: profile.address || '',
        email: profile.email || '',
      });
    }
  }, [profile]);

  const update = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const pickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaType.Images,
      quality: 0.7, allowsEditing: true, aspect: [1, 1],
    });
    if (!result.canceled) setAvatar(result.assets[0]);
  };

  const uploadAvatar = async () => {
    if (!avatar) return profile?.avatar_url || null;
    const ext = avatar.uri.split('.').pop().toLowerCase();
    const fileName = `avatars/${user.id}.${ext}`;
    const mimeType = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
    const response = await fetch(avatar.uri);
    const arrayBuffer = await response.arrayBuffer();
    const { error } = await supabase.storage
      .from('avatars').upload(fileName, arrayBuffer, { contentType: mimeType, upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleSave = async () => {
    if (!form.full_name.trim()) {
      Alert.alert('Error', 'Full name is required.'); return;
    }
    setLoading(true);
    try {
      const avatar_url = await uploadAvatar();
      const { error } = await supabase.from('profiles').update({
        full_name: form.full_name.trim(),
        bio: form.bio.trim(),
        city: form.city.trim(),
        state: form.state,
        address: form.address.trim(),
        email: form.email.trim(),
        avatar_url,
        updated_at: new Date().toISOString(),
      }).eq('id', user.id);
      if (error) throw error;
      await fetchProfile();
      Alert.alert('Updated!', 'Your profile has been updated.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const avatarSource = avatar?.uri || profile?.avatar_url;
  const initial = form.full_name?.[0]?.toUpperCase() || '?';

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <TouchableOpacity style={styles.avatarWrap} onPress={pickAvatar}>
            {avatarSource ? (
              <Image source={{ uri: avatarSource }} style={styles.avatar} />
            ) : (
              <Text style={styles.avatarInitial}>{initial}</Text>
            )}
            <View style={styles.editOverlay}>
              <Ionicons name="camera" size={16} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={styles.avatarHint}>Tap to change photo</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Info</Text>
          <Field label="Full name *">
            <TextInput style={styles.input} placeholderTextColor={COLORS.textMuted}
              placeholder="Your full name" value={form.full_name} onChangeText={(v) => update('full_name', v)} />
          </Field>
          <Field label="Email address">
            <TextInput style={styles.input} placeholderTextColor={COLORS.textMuted}
              placeholder="your@email.com" value={form.email}
              onChangeText={(v) => update('email', v)} keyboardType="email-address" autoCapitalize="none" />
          </Field>
          <Field label="Bio">
            <TextInput style={[styles.input, styles.textarea]} placeholderTextColor={COLORS.textMuted}
              placeholder="Tell people about yourself..." value={form.bio}
              onChangeText={(v) => update('bio', v)} multiline numberOfLines={3} textAlignVertical="top" />
          </Field>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          <Field label="State">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {NIGERIAN_STATES.map((s) => (
                <TouchableOpacity key={s}
                  style={[styles.stateChip, form.state === s && styles.stateChipActive]}
                  onPress={() => update('state', s)}>
                  <Text style={[styles.stateChipText, form.state === s && styles.stateChipTextActive]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Field>
          <Field label="City">
            <TextInput style={styles.input} placeholderTextColor={COLORS.textMuted}
              placeholder="e.g. Ikeja" value={form.city} onChangeText={(v) => update('city', v)} />
          </Field>
          <Field label="Address">
            <TextInput style={styles.input} placeholderTextColor={COLORS.textMuted}
              placeholder="Your address" value={form.address} onChangeText={(v) => update('address', v)} />
          </Field>
        </View>

        <TouchableOpacity style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
          onPress={handleSave} disabled={loading} activeOpacity={0.85}>
          {loading ? <ActivityIndicator color={COLORS.textOnGold} size="small" /> : (
            <>
              <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.textOnGold} />
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </>
          )}
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ label, children }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>{label}</Text>
      {children}
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
  scroll: { padding: SPACING.margin },
  avatarSection: { alignItems: 'center', marginBottom: SPACING.margin },
  avatarWrap: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: COLORS.primaryMuted, borderWidth: 2,
    borderColor: COLORS.border, alignItems: 'center',
    justifyContent: 'center', marginBottom: 8, position: 'relative',
  },
  avatar: { width: 90, height: 90, borderRadius: 45 },
  avatarInitial: { fontSize: 34, fontWeight: '800', color: COLORS.primary },
  editOverlay: {
    position: 'absolute', bottom: 0, right: 0,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: COLORS.primary, alignItems: 'center',
    justifyContent: 'center', borderWidth: 2, borderColor: COLORS.background,
  },
  avatarHint: { fontSize: 12, color: COLORS.textMuted },
  section: {
    backgroundColor: COLORS.surfaceHigh, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.borderMuted,
    padding: SPACING.margin, marginBottom: SPACING.margin,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 16 },
  fieldWrap: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 7 },
  input: {
    backgroundColor: COLORS.surfaceHighest, borderWidth: 1, borderColor: COLORS.borderMuted,
    borderRadius: RADIUS.md, paddingHorizontal: 14, height: 50,
    fontSize: 15, color: COLORS.textPrimary,
  },
  textarea: { height: 90, paddingTop: 12 },
  stateChip: {
    paddingVertical: 6, paddingHorizontal: 14, borderRadius: RADIUS.full,
    borderWidth: 1, borderColor: COLORS.borderMuted,
    backgroundColor: COLORS.surfaceHighest, marginRight: 8, marginBottom: 8,
  },
  stateChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  stateChipText: { fontSize: 12, fontWeight: '500', color: COLORS.textSecondary },
  stateChipTextActive: { color: COLORS.textOnGold, fontWeight: '700' },
  saveBtn: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.md, height: 54,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: COLORS.textOnGold },
});