import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING } from '@constants/index';

const LINKS = [
  { label: 'Privacy Policy', icon: 'shield-outline', screen: 'PrivacyPolicy' },
  { label: 'Terms of Service', icon: 'document-text-outline', screen: 'TermsOfService' },
  { label: 'Website', icon: 'globe-outline', url: 'https://tradenet.ng' },
  { label: 'Instagram', icon: 'logo-instagram', url: 'https://instagram.com/tradenetng' },
  { label: 'Twitter / X', icon: 'logo-twitter', url: 'https://twitter.com/tradenetng' },
];

const FEATURES = [
  { icon: 'construct-outline', label: 'Services Marketplace' },
  { icon: 'home-outline', label: 'Property Listings' },
  { icon: 'car-outline', label: 'Cars for Sale & Rent' },
  { icon: 'bag-handle-outline', label: 'Job Board' },
  { icon: 'shield-checkmark-outline', label: 'NIN Verified Users' },
  { icon: 'location-outline', label: 'Nigeria-wide Coverage' },
];

export default function AboutScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About TradeNet</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Logo card */}
        <View style={styles.logoCard}>
          <View style={styles.logoBox}>
            <Ionicons name="flash" size={36} color={COLORS.textOnGold} />
          </View>
          <Text style={styles.appName}>TradeNet</Text>
          <Text style={styles.tagline}>Nigeria's Premium Marketplace</Text>
          <View style={styles.versionBadge}>
            <Text style={styles.versionText}>Version 1.0.0</Text>
          </View>
        </View>

        {/* Description */}
        <View style={styles.descCard}>
          <Text style={styles.descText}>
            TradeNet is Nigeria's premier marketplace connecting skilled professionals, property owners, employers, and car dealers with millions of Nigerians looking for quality services and products.{'\n\n'}
            Built for Nigerians, by Nigerians. Every account is NIN-verified for a safe and trusted experience.
          </Text>
        </View>

        {/* Features */}
        <Text style={styles.sectionTitle}>What we offer</Text>
        <View style={styles.featuresGrid}>
          {FEATURES.map((f) => (
            <View key={f.label} style={styles.featureItem}>
              <View style={styles.featureIconWrap}>
                <Ionicons name={f.icon} size={20} color={COLORS.primary} />
              </View>
              <Text style={styles.featureLabel}>{f.label}</Text>
            </View>
          ))}
        </View>

        {/* Links */}
        <Text style={styles.sectionTitle}>Links</Text>
        <View style={styles.linksCard}>
          {LINKS.map((link, index) => (
            <TouchableOpacity
              key={link.label}
              style={[styles.linkRow, index < LINKS.length - 1 && styles.linkBorder]}
              onPress={() => {
                if (link.screen) navigation.navigate(link.screen);
                else if (link.url) Linking.openURL(link.url);
              }}
            >
              <View style={styles.linkIconWrap}>
                <Ionicons name={link.icon} size={18} color={COLORS.primary} />
              </View>
              <Text style={styles.linkLabel}>{link.label}</Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.copyright}>© 2026 TradeNet. All rights reserved.</Text>
        <Text style={styles.madeIn}>Made with love in Nigeria</Text>
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
  logoCard: {
    alignItems: 'center', backgroundColor: COLORS.surfaceHigh,
    borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.borderMuted,
    padding: 28, marginBottom: SPACING.margin,
  },
  logoBox: {
    width: 72, height: 72, borderRadius: RADIUS.xl,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
    marginBottom: 14, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 8,
  },
  appName: { fontSize: 28, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.5, marginBottom: 4 },
  tagline: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 12 },
  versionBadge: {
    backgroundColor: COLORS.primaryMuted, borderRadius: RADIUS.full,
    paddingVertical: 4, paddingHorizontal: 14, borderWidth: 1, borderColor: COLORS.border,
  },
  versionText: { fontSize: 12, fontWeight: '600', color: COLORS.primary },
  descCard: {
    backgroundColor: COLORS.surfaceHigh, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.borderMuted, padding: 16, marginBottom: SPACING.margin,
  },
  descText: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 22 },
  sectionTitle: {
    fontSize: 12, fontWeight: '700', color: COLORS.textMuted,
    marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8,
  },
  featuresGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: SPACING.margin,
  },
  featureItem: {
    width: '47%', backgroundColor: COLORS.surfaceHigh, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.borderMuted,
    padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  featureIconWrap: {
    width: 36, height: 36, borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryMuted, borderWidth: 1,
    borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  featureLabel: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary, flex: 1 },
  linksCard: {
    backgroundColor: COLORS.surfaceHigh, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.borderMuted, overflow: 'hidden', marginBottom: SPACING.margin,
  },
  linkRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 14, paddingHorizontal: 16,
  },
  linkBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.borderMuted },
  linkIconWrap: {
    width: 36, height: 36, borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryMuted, borderWidth: 1,
    borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center',
  },
  linkLabel: { flex: 1, fontSize: 14, fontWeight: '500', color: COLORS.textPrimary },
  copyright: { textAlign: 'center', fontSize: 12, color: COLORS.textMuted, marginBottom: 4 },
  madeIn: { textAlign: 'center', fontSize: 12, color: COLORS.primary, fontWeight: '600' },
});