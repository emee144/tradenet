import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
  Linking,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@lib/supabase';
import { useAuthStore } from '@stores/authStore';
import { COLORS, RADIUS, SPACING } from '@constants/index';
import { formatNaira, timeAgo } from '@utils/formatters';

export default function JobDetailScreen({ navigation, route }) {
  const { jobId } = route.params;
  const { user, profile } = useAuthStore();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [applied, setApplied] = useState(false);
  const [applying, setApplying] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');

  useEffect(() => {
    fetchJob();
    checkSavedAndApplied();
  }, [jobId]);

  const fetchJob = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          employer:profiles(
            id, full_name, avatar_url, phone,
            nin_verified, photo_verified,
            city, state, rating, total_reviews
          )
        `)
        .eq('id', jobId)
        .single();

      if (error) throw error;
      setJob(data);
    } catch (error) {
      Alert.alert('Error', 'Could not load job details.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const checkSavedAndApplied = async () => {
    if (!user) return;
    const [savedRes, appliedRes] = await Promise.all([
      supabase
        .from('saved_items')
        .select('id')
        .eq('user_id', user.id)
        .eq('item_type', 'job')
        .eq('item_id', jobId)
        .single(),
      supabase
        .from('job_applications')
        .select('id')
        .eq('job_id', jobId)
        .eq('applicant_id', user.id)
        .single(),
    ]);
    setSaved(!!savedRes.data);
    setApplied(!!appliedRes.data);
  };

  const toggleSave = async () => {
    if (!user) {
      Alert.alert('Login required', 'Please log in to save jobs.');
      return;
    }
    if (saved) {
      await supabase
        .from('saved_items')
        .delete()
        .eq('user_id', user.id)
        .eq('item_type', 'job')
        .eq('item_id', jobId);
    } else {
      await supabase
        .from('saved_items')
        .insert({ user_id: user.id, item_type: 'job', item_id: jobId });
    }
    setSaved(!saved);
  };

  const handleApply = async () => {
    if (!user) {
      Alert.alert('Login required', 'Please log in to apply.');
      return;
    }
    setApplying(true);
    try {
      const { error } = await supabase.from('job_applications').insert({
        job_id: jobId,
        applicant_id: user.id,
        cover_letter: coverLetter.trim() || null,
        status: 'pending',
      });
      if (error) throw error;
      setApplied(true);
      setShowApplyModal(false);
      Alert.alert(
        'Application Sent! 🎉',
        'Your application has been submitted. The employer will review it.'
      );
    } catch (error) {
      if (error.message?.includes('unique')) {
        Alert.alert('Already Applied', 'You have already applied for this job.');
        setApplied(true);
      } else {
        Alert.alert('Error', error.message || 'Application failed. Please try again.');
      }
    } finally {
      setApplying(false);
    }
  };

  const handleContact = () => {
    const phone = job.phone || job.employer?.phone;
    if (!phone) return;
    Linking.openURL(`tel:${phone}`);
  };

  const handleWhatsApp = () => {
    const phone = job.whatsapp || job.phone || job.employer?.phone;
    if (!phone) return;
    const intl = phone.startsWith('0') ? `234${phone.slice(1)}` : phone.replace('+', '');
    const message = encodeURIComponent(
      `Hi, I saw your job posting on Tradenet: "${job.title}". I'd like to enquire.`
    );
    Linking.openURL(`https://wa.me/${intl}?text=${message}`);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!job) return null;

  const isOwner = user?.id === job.employer_id;
  const isExpired = job.deadline && new Date(job.deadline) < new Date();

  return (
    <SafeAreaView style={styles.safe}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.topBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Job Details</Text>
        <TouchableOpacity style={styles.topBtn} onPress={toggleSave}>
          <Ionicons
            name={saved ? 'bookmark' : 'bookmark-outline'}
            size={24}
            color={saved ? COLORS.primary : COLORS.textPrimary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.body}>
          {/* Job Header */}
          <View style={styles.headerCard}>
            <View style={styles.companyLogo}>
              <Text style={styles.companyLogoText}>
                {(job.company || job.title)?.[0]?.toUpperCase() || '?'}
              </Text>
            </View>
            <Text style={styles.jobTitle}>{job.title}</Text>
            {job.company && <Text style={styles.companyName}>{job.company}</Text>}

            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeText}>{job.job_type?.replace('_', ' ').toUpperCase()}</Text>
            </View>
          </View>

          {/* Salary */}
          {(job.salary_min || job.salary_max) && (
            <View style={styles.salaryCard}>
              <Ionicons name="cash-outline" size={24} color={COLORS.primary} />
              <View>
                <Text style={styles.salaryLabel}>Monthly Salary</Text>
                <Text style={styles.salaryValue}>
                  {job.salary_min && job.salary_max
                    ? `${formatNaira(job.salary_min)} – ${formatNaira(job.salary_max)}`
                    : job.salary_min
                    ? `From ${formatNaira(job.salary_min)}`
                    : `Up to ${formatNaira(job.salary_max)}`}
                </Text>
              </View>
            </View>
          )}

          {/* Deadline */}
          {job.deadline && (
            <View style={[styles.deadlineCard, isExpired && styles.deadlineExpired]}>
              <Ionicons name="time-outline" size={18} color={isExpired ? '#f87171' : COLORS.textPrimary} />
              <Text style={[styles.deadlineText, isExpired && styles.deadlineTextExpired]}>
                {isExpired ? 'Expired' : `Deadline: ${new Date(job.deadline).toLocaleDateString('en-NG')}`}
              </Text>
            </View>
          )}

          {/* Description */}
          {job.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Job Description</Text>
              <Text style={styles.descriptionText}>{job.description}</Text>
            </View>
          )}

          {/* Requirements */}
          {job.requirements && job.requirements.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Requirements</Text>
              <View style={styles.requirementsList}>
                {job.requirements.map((req, i) => (
                  <View key={i} style={styles.requirementItem}>
                    <Ionicons name="checkmark-circle" size={16} color={COLORS.primary} />
                    <Text style={styles.requirementText}>{req}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Employer Info */}
          {job.employer && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About the Employer</Text>
              <View style={styles.employerCard}>
                <View style={styles.employerLeft}>
                  <View style={styles.employerAvatar}>
                    {job.employer.avatar_url ? (
                      <Image source={{ uri: job.employer.avatar_url }} style={styles.avatarImg} />
                    ) : (
                      <Text style={styles.avatarInitial}>
                        {job.employer.full_name?.[0] || '?'}
                      </Text>
                    )}
                  </View>
                  <View>
                    <Text style={styles.employerName}>{job.employer.full_name}</Text>
                    <Text style={styles.employerLocation}>
                      {job.employer.city}{job.employer.state ? `, ${job.employer.state}` : ''}
                    </Text>
                    {job.employer.nin_verified && job.employer.photo_verified && (
                      <View style={styles.verifiedBadge}>
                        <Ionicons name="shield-checkmark" size={14} color="#4ade80" />
                        <Text style={styles.verifiedText}>Verified Employer</Text>
                      </View>
                    )}
                  </View>
                </View>

                <View style={styles.contactBtns}>
                  <TouchableOpacity style={styles.contactBtn} onPress={handleContact}>
                    <Ionicons name="call-outline" size={20} color={COLORS.primary} />
                  </TouchableOpacity>
                  {(job.whatsapp || job.phone || job.employer?.phone) && (
                    <TouchableOpacity style={[styles.contactBtn, styles.waBtn]} onPress={handleWhatsApp}>
                      <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {(job.phone || job.whatsapp) && (
                <View style={styles.listingContactWrap}>
                  {job.phone && (
                    <TouchableOpacity style={styles.listingContactRow} onPress={handleContact}>
                      <View style={styles.listingContactIcon}>
                        <Ionicons name="call-outline" size={15} color={COLORS.primary} />
                      </View>
                      <Text style={styles.listingContactNum}>{job.phone}</Text>
                      <Text style={styles.listingContactLabel}>Call</Text>
                    </TouchableOpacity>
                  )}
                  {job.phone && job.whatsapp && <View style={styles.listingContactDivider} />}
                  {job.whatsapp && (
                    <TouchableOpacity style={styles.listingContactRow} onPress={handleWhatsApp}>
                      <View style={[styles.listingContactIcon, { backgroundColor: '#f0fdf4' }]}>
                        <Ionicons name="logo-whatsapp" size={15} color="#25D366" />
                      </View>
                      <Text style={styles.listingContactNum}>{job.whatsapp}</Text>
                      <Text style={[styles.listingContactLabel, { color: '#25D366' }]}>WhatsApp</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          )}

          <Text style={styles.postedTime}>Posted {timeAgo(job.created_at)}</Text>
          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Action Buttons */}
      {isOwner ? (
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => navigation.navigate('EditJob', { jobId: job.id })}
          >
            <Ionicons name="create-outline" size={18} color={COLORS.textOnGold} />
            <Text style={styles.editText}>Edit Listing</Text>
          </TouchableOpacity>
        </View>
      ) : !isExpired ? (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.saveBtn} onPress={toggleSave}>
            <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={22} color={saved ? COLORS.primary : COLORS.textPrimary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.applyBtn, applied && styles.applyBtnApplied]}
            onPress={() => applied ? null : setShowApplyModal(true)}
          >
            <Ionicons name={applied ? 'checkmark-circle' : 'send-outline'} size={18} color="#fff" />
            <Text style={styles.applyText}>{applied ? 'Applied ✓' : 'Apply Now'}</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Apply Modal */}
      <Modal visible={showApplyModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Apply for this Job</Text>
              <TouchableOpacity onPress={() => setShowApplyModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalJobTitle}>{job.title}</Text>
            {job.company && <Text style={styles.modalCompany}>{job.company}</Text>}

            <Text style={styles.modalLabel}>Cover Letter (Optional)</Text>
            <TextInput
              style={styles.coverLetterInput}
              placeholder="Why are you a good fit for this role?"
              multiline
              numberOfLines={6}
              value={coverLetter}
              onChangeText={setCoverLetter}
            />

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleApply}
              disabled={applying}
            >
              {applying ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="send-outline" size={18} color="#fff" />
                  <Text style={styles.submitText}>Submit Application</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  topBar: {
    backgroundColor: COLORS.surface,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.margin,
    paddingVertical: 14,
  },
  topBtn: { padding: 4 },
  topTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: COLORS.textPrimary, textAlign: 'center' },

  scroll: { flex: 1 },
  body: { padding: SPACING.margin },

  headerCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    marginBottom: SPACING.md,
    borderWidth: 0.5,
    borderColor: COLORS.borderMuted,
  },
  companyLogo: {
    width: 70,
    height: 70,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  companyLogoText: { fontSize: 26, fontWeight: '700', color: COLORS.textOnGold },
  jobTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, textAlign: 'center', marginBottom: 4 },
  companyName: { fontSize: 14, color: COLORS.textMuted, marginBottom: 12 },

  typeBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
  },
  typeBadgeText: { fontSize: 12, fontWeight: '700', color: COLORS.textOnGold },

  salaryCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: SPACING.md,
  },
  salaryLabel: { fontSize: 13, color: COLORS.textMuted },
  salaryValue: { fontSize: 17, fontWeight: '700', color: COLORS.primary },

  deadlineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  deadlineExpired: { backgroundColor: '#fee2e2' },
  deadlineText: { fontSize: 14, color: COLORS.textPrimary },
  deadlineTextExpired: { color: '#ef4444' },

  section: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 0.5,
    borderColor: COLORS.borderMuted,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 10 },
  descriptionText: { fontSize: 14, lineHeight: 22, color: COLORS.textPrimary },

  requirementsList: { gap: 10 },
  requirementItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  requirementText: { fontSize: 14, color: COLORS.textPrimary, flex: 1 },

  employerCard: {
    backgroundColor: COLORS.surfaceHigh,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  employerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  employerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: { width: '100%', height: '100%', borderRadius: 25 },
  avatarInitial: { fontSize: 20, fontWeight: '700', color: COLORS.textOnGold },
  employerName: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  employerLocation: { fontSize: 13, color: COLORS.textMuted },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  verifiedText: { fontSize: 12, color: '#4ade80', fontWeight: '600' },
  contactBtns: { flexDirection: 'row', gap: 8 },
  contactBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waBtn: { backgroundColor: '#f0fdf4' },
  listingContactWrap: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: COLORS.borderMuted,
  },
  listingContactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: SPACING.md,
  },
  listingContactIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listingContactNum: { flex: 1, fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  listingContactLabel: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  listingContactDivider: { height: 0.5, backgroundColor: COLORS.borderMuted, marginHorizontal: SPACING.md },

  postedTime: { fontSize: 13, color: COLORS.textMuted, textAlign: 'center', marginTop: 10 },

  actions: {
    flexDirection: 'row',
    gap: SPACING.md,
    padding: SPACING.margin,
    backgroundColor: COLORS.surface,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.borderMuted,
  },
  saveBtn: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtn: {
    flex: 1,
    height: 52,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  applyBtnApplied: { backgroundColor: '#475569' },
  applyText: { fontSize: 16, fontWeight: '700', color: COLORS.textOnGold },
  editBtn: {
    flex: 1,
    height: 52,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  editText: { fontSize: 16, fontWeight: '700', color: COLORS.textOnGold },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: SPACING.lg,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  modalJobTitle: { fontSize: 16, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 4 },
  modalCompany: { fontSize: 14, color: COLORS.textMuted, marginBottom: 16 },
  modalLabel: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 6 },
  coverLetterInput: {
    backgroundColor: COLORS.surfaceHigh,
    borderWidth: 1,
    borderColor: COLORS.borderMuted,
    borderRadius: RADIUS.md,
    height: 140,
    padding: SPACING.md,
    fontSize: 14,
    color: COLORS.textPrimary,
    textAlignVertical: 'top',
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    height: 52,
    borderRadius: RADIUS.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: SPACING.lg,
  },
  submitText: { fontSize: 16, fontWeight: '700', color: COLORS.textOnGold },
});