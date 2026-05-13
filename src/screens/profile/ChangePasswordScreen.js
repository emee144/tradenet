import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@lib/supabase';
import { COLORS, RADIUS, SPACING } from '@constants/index';

export default function ChangePasswordScreen({ navigation }) {
  const [form, setForm] = useState({ current: '', newPass: '', confirm: '' });
  const [show, setShow] = useState({ current: false, newPass: false, confirm: false });
  const [loading, setLoading] = useState(false);

  const update = (key, val) => setForm((f) => ({ ...f, [key]: val }));
  const toggleShow = (key) => setShow((s) => ({ ...s, [key]: !s[key] }));

  const handleChange = async () => {
    if (!form.current || !form.newPass || !form.confirm) {
      Alert.alert('Error', 'All fields are required.'); return;
    }
    if (form.newPass.length < 8) {
      Alert.alert('Error', 'New password must be at least 8 characters.'); return;
    }
    if (form.newPass !== form.confirm) {
      Alert.alert('Error', 'New passwords do not match.'); return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: form.newPass });
      if (error) throw error;
      Alert.alert('Success', 'Password changed successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const PasswordField = ({ label, fieldKey }) => (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputRow}>
        <Ionicons name="lock-closed-outline" size={18} color={COLORS.textMuted} style={{ marginRight: 10 }} />
        <TextInput
          style={styles.input}
          placeholder="••••••••"
          placeholderTextColor={COLORS.textMuted}
          secureTextEntry={!show[fieldKey]}
          value={form[fieldKey]}
          onChangeText={(v) => update(fieldKey, v)}
        />
        <TouchableOpacity onPress={() => toggleShow(fieldKey)}>
          <Ionicons name={show[fieldKey] ? 'eye-outline' : 'eye-off-outline'} size={18} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Change Password</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.iconWrap}>
          <Ionicons name="lock-closed-outline" size={32} color={COLORS.primary} />
        </View>
        <Text style={styles.title}>Update your password</Text>
        <Text style={styles.sub}>Choose a strong password that you have not used before</Text>

        <View style={styles.card}>
          <PasswordField label="Current password" fieldKey="current" />
          <PasswordField label="New password" fieldKey="newPass" />
          <PasswordField label="Confirm new password" fieldKey="confirm" />
        </View>

        <View style={styles.requirementsBox}>
          <Text style={styles.requirementsTitle}>Password requirements:</Text>
          {['At least 8 characters', 'Mix of letters and numbers recommended'].map((req) => (
            <View key={req} style={styles.requirementItem}>
              <Ionicons name="checkmark-circle-outline" size={14} color={COLORS.primary} />
              <Text style={styles.requirementText}>{req}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.ctaBtn, loading && styles.ctaBtnDisabled]}
          onPress={handleChange} disabled={loading} activeOpacity={0.85}
        >
          {loading ? <ActivityIndicator color={COLORS.textOnGold} size="small" /> : (
            <>
              <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.textOnGold} />
              <Text style={styles.ctaText}>Change Password</Text>
            </>
          )}
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
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
  iconWrap: {
    width: 72, height: 72, borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryMuted, borderWidth: 1,
    borderColor: COLORS.border, alignItems: 'center',
    justifyContent: 'center', marginBottom: 16, alignSelf: 'center',
  },
  title: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary, textAlign: 'center', marginBottom: 6 },
  sub: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  card: {
    backgroundColor: COLORS.surfaceHigh, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.borderMuted,
    padding: SPACING.margin, marginBottom: 14,
  },
  fieldWrap: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 7 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surfaceHighest, borderWidth: 1, borderColor: COLORS.borderMuted,
    borderRadius: RADIUS.md, paddingHorizontal: 14, height: 52,
  },
  input: { flex: 1, fontSize: 15, color: COLORS.textPrimary },
  requirementsBox: {
    backgroundColor: COLORS.primaryMuted, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border,
    padding: 14, marginBottom: 20,
  },
  requirementsTitle: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 8 },
  requirementItem: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 5 },
  requirementText: { fontSize: 12, color: COLORS.textSecondary },
  ctaBtn: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.md, height: 54,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  ctaBtnDisabled: { opacity: 0.6 },
  ctaText: { fontSize: 16, fontWeight: '700', color: COLORS.textOnGold },
});