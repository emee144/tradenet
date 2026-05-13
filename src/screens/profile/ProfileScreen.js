import React, { useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Image, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@stores/authStore';
import { COLORS, RADIUS, SPACING } from '@constants/index';
import StatBox from '@components/profile/StatBox';

const MENU_SECTIONS = [
  {
    title: 'My Listings',
    items: [
      { id: 'MyServices', label: 'My Services', icon: 'construct-outline' },
      { id: 'MyProperties', label: 'My Properties', icon: 'home-outline' },
      { id: 'MyCars', label: 'My Vehicles', icon: 'car-outline' },
      { id: 'MyJobs', label: 'My Jobs', icon: 'bag-handle-outline' },
    ],
  },
  {
    title: 'Activity',
    items: [
      { id: 'MyBookings', label: 'My Bookings', icon: 'calendar-outline' },
      { id: 'MyApplications', label: 'Job Applications', icon: 'document-text-outline' },
      { id: 'SavedItems', label: 'Saved Items', icon: 'heart-outline' },
    ],
  },
  {
    title: 'Account',
    items: [
      { id: 'EditProfile', label: 'Edit Profile', icon: 'person-outline' },
      { id: 'ChangePassword', label: 'Change Password', icon: 'lock-closed-outline' },
      { id: 'Notifications', label: 'Notifications', icon: 'notifications-outline' },
    ],
  },
  {
    title: 'More',
    items: [
      { id: 'Privacy', label: 'Privacy & Security', icon: 'shield-outline' },
      { id: 'Support', label: 'Help & Support', icon: 'help-circle-outline' },
      { id: 'About', label: 'About TradeNet', icon: 'information-circle-outline' },
    ],
  },
];

export default function ProfileScreen({ navigation }) {
  const { user, profile, fetchProfile, signOut } = useAuthStore();

  useEffect(() => { fetchProfile(); }, []);

  const handleSignOut = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: signOut },
    ]);
  };

  const isVerified = profile?.nin_verified && profile?.photo_verified;
  const initial = profile?.full_name?.[0]?.toUpperCase() || '?';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity style={styles.settingsBtn} onPress={() => navigation.navigate('EditProfile')}>
            <Ionicons name="settings-outline" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* ── Profile card ── */}
        <View style={styles.profileCard}>
          <View style={styles.avatarWrap}>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
            ) : (
              <Text style={styles.avatarInitial}>{initial}</Text>
            )}
            {isVerified && (
              <View style={styles.verifiedDot}>
                <Ionicons name="checkmark" size={9} color={COLORS.textOnGold} />
              </View>
            )}
          </View>

          <Text style={styles.name}>{profile?.full_name || 'Your Name'}</Text>
          <Text style={styles.phone}>{user?.phone || ''}</Text>

          {isVerified ? (
            <View style={styles.verifiedBadge}>
              <Ionicons name="shield-checkmark" size={13} color={COLORS.primary} />
              <Text style={styles.verifiedText}>Verified Account</Text>
            </View>
          ) : (
            <View style={styles.unverifiedBadge}>
              <Ionicons name="alert-circle-outline" size={13} color={COLORS.error} />
              <Text style={styles.unverifiedText}>Not verified</Text>
            </View>
          )}

          {profile?.bio ? (
            <Text style={styles.bio} numberOfLines={2}>{profile.bio}</Text>
          ) : null}

          {profile?.city || profile?.state ? (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={13} color={COLORS.textMuted} />
              <Text style={styles.locationText}>
                {[profile.city, profile.state].filter(Boolean).join(', ')}
              </Text>
            </View>
          ) : null}
        </View>

        {/* ── Stats ── */}
        <View style={styles.statsCard}>
          <StatBox value={profile?.total_reviews || 0} label="Reviews" icon="star-outline" />
          <View style={styles.statDivider} />
          <StatBox value={Number(profile?.rating || 0).toFixed(1)} label="Rating" icon="trending-up-outline" />
          <View style={styles.statDivider} />
          <StatBox value="0" label="Bookings" icon="calendar-outline" />
        </View>

        {/* ── Menu sections ── */}
        {MENU_SECTIONS.map((section) => (
          <View key={section.title} style={styles.menuSection}>
            <Text style={styles.menuSectionTitle}>{section.title}</Text>
            <View style={styles.menuCard}>
              {section.items.map((item, index) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.menuItem, index < section.items.length - 1 && styles.menuItemBorder]}
                  onPress={() => navigation.navigate(item.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.menuIconWrap}>
                    <Ionicons name={item.icon} size={18} color={COLORS.primary} />
                  </View>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  {item.badge ? (
                    <View style={styles.menuBadge}>
                      <Text style={styles.menuBadgeText}>{item.badge}</Text>
                    </View>
                  ) : null}
                  <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* ── Sign out ── */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={18} color={COLORS.error} />
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>TradeNet v1.0.0</Text>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { paddingBottom: 20 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.margin, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: COLORS.borderMuted,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary },
  settingsBtn: {
    width: 38, height: 38, borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceHigh, borderWidth: 1,
    borderColor: COLORS.borderMuted, alignItems: 'center', justifyContent: 'center',
  },
  profileCard: {
    alignItems: 'center', padding: SPACING.margin,
    paddingTop: 28, paddingBottom: 20,
  },
  avatarWrap: {
    width: 84, height: 84, borderRadius: 42,
    backgroundColor: COLORS.primaryMuted, borderWidth: 2,
    borderColor: COLORS.border, alignItems: 'center',
    justifyContent: 'center', marginBottom: 14, position: 'relative',
  },
  avatar: { width: 84, height: 84, borderRadius: 42 },
  avatarInitial: { fontSize: 32, fontWeight: '800', color: COLORS.primary },
  verifiedDot: {
    position: 'absolute', bottom: 2, right: 2,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: COLORS.primary, alignItems: 'center',
    justifyContent: 'center', borderWidth: 2,
    borderColor: COLORS.background,
  },
  name: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 4 },
  phone: { fontSize: 13, color: COLORS.textMuted, marginBottom: 10 },
  verifiedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: COLORS.primaryMuted, borderRadius: RADIUS.full,
    paddingVertical: 5, paddingHorizontal: 12, borderWidth: 1,
    borderColor: COLORS.border, marginBottom: 12,
  },
  verifiedText: { fontSize: 12, color: COLORS.primary, fontWeight: '700' },
  unverifiedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(147,0,10,0.15)', borderRadius: RADIUS.full,
    paddingVertical: 5, paddingHorizontal: 12, borderWidth: 1,
    borderColor: 'rgba(255,180,171,0.2)', marginBottom: 12,
  },
  unverifiedText: { fontSize: 12, color: COLORS.error, fontWeight: '700' },
  bio: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 8, paddingHorizontal: 20 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: { fontSize: 12, color: COLORS.textMuted },
  statsCard: {
    flexDirection: 'row', backgroundColor: COLORS.surfaceHigh,
    borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.borderMuted,
    marginHorizontal: SPACING.margin, marginBottom: SPACING.margin,
  },
  statDivider: { width: 1, backgroundColor: COLORS.borderMuted, marginVertical: 12 },
  menuSection: { paddingHorizontal: SPACING.margin, marginBottom: SPACING.margin },
  menuSectionTitle: {
    fontSize: 12, fontWeight: '700', color: COLORS.textMuted,
    marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8,
  },
  menuCard: {
    backgroundColor: COLORS.surfaceHigh, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.borderMuted, overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    gap: 12, paddingVertical: 14, paddingHorizontal: 16,
  },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.borderMuted },
  menuIconWrap: {
    width: 36, height: 36, borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryMuted, borderWidth: 1,
    borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center',
  },
  menuLabel: { flex: 1, fontSize: 14, fontWeight: '500', color: COLORS.textPrimary },
  menuBadge: {
    backgroundColor: COLORS.primaryMuted, borderRadius: RADIUS.full,
    paddingVertical: 2, paddingHorizontal: 8, borderWidth: 1, borderColor: COLORS.border,
  },
  menuBadgeText: { fontSize: 11, fontWeight: '700', color: COLORS.primary },
  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginHorizontal: SPACING.margin, marginBottom: 12,
    backgroundColor: 'rgba(147,0,10,0.15)', borderRadius: RADIUS.lg,
    paddingVertical: 14, borderWidth: 1, borderColor: 'rgba(255,180,171,0.2)',
  },
  signOutText: { fontSize: 15, fontWeight: '700', color: COLORS.error },
  version: { textAlign: 'center', fontSize: 11, color: COLORS.textMuted },
});