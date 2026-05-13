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
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { supabase } from '@lib/supabase';
import { useAuthStore } from '@stores/authStore';
import { COLORS, RADIUS, SPACING, JOB_TYPES, NIGERIAN_STATES } from '@constants/index';

export default function EditJobScreen({ navigation, route }) {
  const { jobId } = route.params;
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [requirements, setRequirements] = useState(['']);
  const [form, setForm] = useState({
    title: '',
    description: '',
    company: '',
    job_type: '',
    salary_min: '',
    salary_max: '',
    state: '',
    city: '',
    is_remote: false,
    deadline: '',
    is_active: true,
    phone: '',
    whatsapp: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchJob();
  }, []);

  const fetchJob = async () => {
    try {
      const { data, error } = await supabase.from('jobs').select('*').eq('id', jobId).single();
      if (error) throw error;

      setForm({
        title: data.title || '',
        description: data.description || '',
        company: data.company || '',
        job_type: data.job_type || '',
        salary_min: data.salary_min ? String(data.salary_min) : '',
        salary_max: data.salary_max ? String(data.salary_max) : '',
        state: data.state || '',
        city: data.city || '',
        is_remote: data.is_remote || false,
        deadline: data.deadline || '',
        is_active: data.is_active ?? true,
        phone: data.phone || '',
        whatsapp: data.whatsapp || '',
      });
      setRequirements(data.requirements?.length > 0 ? data.requirements : ['']);
    } catch (err) {
      Alert.alert('Error', 'Failed to load job.');
      navigation.goBack();
    } finally {
      setFetching(false);
    }
  };

  const update = (key, val) => {
    setForm((f) => ({ ...f, [key]: val }));
    setErrors((e) => ({ ...e, [key]: null }));
  };

  const addRequirement = () => setRequirements((prev) => [...prev, '']);

  const updateRequirement = (index, val) => {
    setRequirements((prev) => {
      const updated = [...prev];
      updated[index] = val;
      return updated;
    });
  };

  const removeRequirement = (index) => {
    setRequirements((prev) => prev.filter((_, i) => i !== index));
  };

  const validate = () => {
    const e = {};
    if (!form.title?.trim()) e.title = 'Job title is required';
    if (!form.job_type) e.job_type = 'Please select a job type';
    if (!form.state) e.state = 'Please select a state';
    if (form.phone && !/^0[7-9][01]\d{8}$/.test(form.phone)) e.phone = 'Enter a valid Nigerian number';
    if (form.whatsapp && !/^0[7-9][01]\d{8}$/.test(form.whatsapp)) e.whatsapp = 'Enter a valid Nigerian number';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const cleanRequirements = requirements.filter((r) => r.trim());

      const { error } = await supabase.from('jobs').update({
        title: form.title.trim(),
        description: form.description.trim(),
        company: form.company.trim(),
        job_type: form.job_type,
        salary_min: form.salary_min ? parseFloat(form.salary_min) : null,
        salary_max: form.salary_max ? parseFloat(form.salary_max) : null,
        state: form.state,
        city: form.city.trim(),
        is_remote: form.is_remote,
        requirements: cleanRequirements,
        deadline: form.deadline || null,
        is_active: form.is_active,
        phone: form.phone.trim() || null,
        whatsapp: form.whatsapp.trim() || null,
        updated_at: new Date().toISOString(),
      }).eq('id', jobId);

      if (error) throw error;

      Alert.alert('Updated! ✅', 'Job updated successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Job', 'Are you sure? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('jobs').delete().eq('id', jobId);
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Job</Text>
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Ionicons name="trash-outline" size={22} color="#ef4444" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Active Toggle */}
        <View style={styles.section}>
          <View style={styles.availRow}>
            <View>
              <Text style={styles.availLabel}>Job Active</Text>
              <Text style={styles.availSub}>Toggle off to close this job</Text>
            </View>
            <Switch
              value={form.is_active}
              onValueChange={(v) => update('is_active', v)}
              trackColor={{ false: '#334155', true: COLORS.primary }}
              thumbColor={form.is_active ? '#fff' : '#94a3b8'}
            />
          </View>
        </View>

        {/* Job Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Job Information</Text>

          <Field label="Job Title *" error={errors.title}>
            <TextInput
              style={styles.input}
              placeholder="e.g. Senior Graphic Designer"
              placeholderTextColor={COLORS.textMuted}
              value={form.title}
              onChangeText={(v) => update('title', v)}
            />
          </Field>

          <Field label="Company Name">
            <TextInput
              style={styles.input}
              placeholder="e.g. TechSolutions Ltd"
              placeholderTextColor={COLORS.textMuted}
              value={form.company}
              onChangeText={(v) => update('company', v)}
            />
          </Field>

          <Field label="Job Description">
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="Describe the role, responsibilities..."
              placeholderTextColor={COLORS.textMuted}
              value={form.description}
              onChangeText={(v) => update('description', v)}
              multiline
              numberOfLines={5}
            />
          </Field>
        </View>

        {/* Job Type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Job Type *</Text>
          {errors.job_type && <Text style={styles.errorText}>{errors.job_type}</Text>}

          <View style={styles.typeGrid}>
            {JOB_TYPES.map((jt) => (
              <TouchableOpacity
                key={jt.id}
                style={[styles.typeChip, form.job_type === jt.id && styles.typeChipActive]}
                onPress={() => update('job_type', jt.id)}
              >
                <Ionicons 
                  name={jt.icon || 'briefcase-outline'} 
                  size={18} 
                  color={form.job_type === jt.id ? COLORS.textOnGold : COLORS.textPrimary} 
                />
                <Text style={[styles.typeChipText, form.job_type === jt.id && styles.typeChipTextActive]}>
                  {jt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.remoteRow}>
            <View>
              <Text style={styles.remoteLabel}>Remote Position</Text>
              <Text style={styles.remoteSub}>Candidates can work remotely</Text>
            </View>
            <Switch
              value={form.is_remote}
              onValueChange={(v) => update('is_remote', v)}
              trackColor={{ false: '#334155', true: COLORS.primary }}
              thumbColor={form.is_remote ? '#fff' : '#94a3b8'}
            />
          </View>
        </View>

        {/* Salary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Salary Range (₦/month)</Text>
          <Field label="Minimum (₦)">
            <View style={styles.priceInputWrap}>
              <Text style={styles.nairaSign}>₦</Text>
              <TextInput
                style={styles.priceInput}
                placeholder="e.g. 150000"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="numeric"
                value={form.salary_min}
                onChangeText={(v) => update('salary_min', v)}
              />
            </View>
          </Field>
          <Field label="Maximum (₦)">
            <View style={styles.priceInputWrap}>
              <Text style={styles.nairaSign}>₦</Text>
              <TextInput
                style={styles.priceInput}
                placeholder="e.g. 300000"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="numeric"
                value={form.salary_max}
                onChangeText={(v) => update('salary_max', v)}
              />
            </View>
          </Field>
        </View>

        {/* Requirements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Requirements</Text>
          {requirements.map((req, index) => (
            <View key={index} style={styles.requirementRow}>
              <Ionicons name="checkmark-circle" size={16} color={COLORS.primary} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder={`Requirement ${index + 1}`}
                placeholderTextColor={COLORS.textMuted}
                value={req}
                onChangeText={(v) => updateRequirement(index, v)}
              />
              {requirements.length > 1 && (
                <TouchableOpacity onPress={() => removeRequirement(index)}>
                  <Ionicons name="trash-outline" size={20} color="#ef4444" />
                </TouchableOpacity>
              )}
            </View>
          ))}
          <TouchableOpacity style={styles.addReqBtn} onPress={addRequirement}>
            <Ionicons name="add-circle" size={20} color={COLORS.primary} />
            <Text style={styles.addReqText}>Add Requirement</Text>
          </TouchableOpacity>
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

          <Field label="City">
            <TextInput
              style={styles.input}
              placeholder="e.g. Lagos"
              placeholderTextColor={COLORS.textMuted}
              value={form.city}
              onChangeText={(v) => update('city', v)}
            />
          </Field>

          <Field label="Application Deadline (optional)">
            <TextInput
              style={styles.input}
              placeholder="e.g. 2026-06-30"
              placeholderTextColor={COLORS.textMuted}
              value={form.deadline}
              onChangeText={(v) => update('deadline', v)}
            />
          </Field>
        </View>

        {/* Contact Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <Text style={styles.sectionSub}>Let applicants reach you directly (optional)</Text>

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
  typeChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  typeChipText: { fontSize: 13, fontWeight: '500', color: COLORS.textPrimary },
  typeChipTextActive: { color: COLORS.textOnGold, fontWeight: '700' },

  remoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
  },
  remoteLabel: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  remoteSub: { fontSize: 13, color: COLORS.textMuted },

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

  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: SPACING.sm,
  },
  addReqBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  addReqText: { fontSize: 14, color: COLORS.primary, fontWeight: '600' },

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