import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING } from '@constants/index';

const NAVY = '#0f2d5c';
const LAST_UPDATED = 'May 2026';

export default function PrivacyPolicyScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safe}>

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={NAVY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.lastUpdated}>Last updated: {LAST_UPDATED}</Text>

        <Section title="1. Introduction">
          Tradenet ("we", "our", or "us") is committed to protecting your personal
          information. This Privacy Policy explains how we collect, use, store, and
          protect your data when you use the Tradenet mobile application.{'\n\n'}
          By using Tradenet, you agree to the collection and use of information
          in accordance with this policy and the Nigeria Data Protection Regulation (NDPR).
        </Section>

        <Section title="2. Information We Collect">
          <Bold>a) Account Information</Bold>{'\n'}
          When you register, we collect:{'\n'}
          • Your phone number{'\n'}
          • Password (stored securely, never in plain text){'\n'}
          • National Identification Number (NIN){'\n'}
          • Live verification photo{'\n\n'}
          <Bold>b) Profile Information</Bold>{'\n'}
          Information you choose to provide:{'\n'}
          • Full name{'\n'}
          • Profile photo{'\n'}
          • Location (state and city){'\n'}
          • Bio and service descriptions{'\n\n'}
          <Bold>c) Usage Information</Bold>{'\n'}
          • Services, properties, jobs and cars you view or post{'\n'}
          • Bookings and applications you make{'\n'}
          • Items you save to favourites{'\n\n'}
          <Bold>d) Device Information</Bold>{'\n'}
          • Device type and operating system{'\n'}
          • App version and crash reports
        </Section>

        <Section title="3. How We Use Your Information">
          We use your information to:{'\n'}
          • Verify your identity and prevent fraud{'\n'}
          • Create and manage your account{'\n'}
          • Connect you with service providers, landlords, employers and buyers{'\n'}
          • Send OTP verification codes to your phone{'\n'}
          • Improve the app and fix technical issues{'\n'}
          • Respond to your support requests{'\n'}
          • Comply with Nigerian law and regulations
        </Section>

        <Section title="4. NIN and Verification Data">
          Your National Identification Number (NIN) and live verification photo are
          collected solely for identity verification purposes.{'\n\n'}
          • Your NIN is verified against government records and stored securely{'\n'}
          • Your live photo is stored in a private, encrypted storage bucket{'\n'}
          • This data is never shared with other users or third parties{'\n'}
          • Only authorised Tradenet staff can access verification data for review{'\n'}
          • You may request deletion of your verification data by contacting us
        </Section>

        <Section title="5. How We Share Your Information">
          We do NOT sell your personal data. We only share data in these situations:{'\n\n'}
          <Bold>Service providers:</Bold>{'\n'}
          • Supabase (database and file storage — data stored securely){'\n'}
          • SMS delivery provider (for OTP only — only your phone number is shared){'\n\n'}
          <Bold>Other users:</Bold>{'\n'}
          • Your name, profile photo, city, rating and verified status are visible
          to other users when you post a service, property, job or listing{'\n\n'}
          <Bold>Legal requirements:</Bold>{'\n'}
          • We may disclose your data if required by Nigerian law or court order
        </Section>

        <Section title="6. Data Storage and Security">
          • All data is stored on secure Supabase servers{'\n'}
          • Passwords are hashed and never stored in plain text{'\n'}
          • Verification photos are stored in private encrypted buckets{'\n'}
          • We use Row Level Security (RLS) to ensure users can only access their own data{'\n'}
          • API keys and sensitive credentials are never stored in the app{'\n'}
          • We regularly review our security practices
        </Section>

        <Section title="7. Data Retention">
          • Your account data is kept for as long as your account is active{'\n'}
          • If you delete your account, your personal data is deleted within 30 days{'\n'}
          • Some data may be retained longer if required by Nigerian law{'\n'}
          • OTP codes are automatically deleted after 10 minutes
        </Section>

        <Section title="8. Your Rights (NDPR)">
          Under the Nigeria Data Protection Regulation, you have the right to:{'\n'}
          • Access the personal data we hold about you{'\n'}
          • Correct inaccurate data{'\n'}
          • Request deletion of your data{'\n'}
          • Object to how we use your data{'\n'}
          • Withdraw consent at any time{'\n\n'}
          To exercise any of these rights, contact us at:{'\n'}
          <Bold>privacy@tradenet.com</Bold>
        </Section>

        <Section title="9. Children's Privacy">
          Tradenet is not intended for anyone under the age of 18. We do not
          knowingly collect data from minors. If you believe a minor has registered,
          please contact us immediately and we will delete the account.
        </Section>

        <Section title="10. Changes to This Policy">
          We may update this Privacy Policy from time to time. We will notify you
          of significant changes through the app. Continued use of Tradenet
          after changes means you accept the updated policy.
        </Section>

        <Section title="11. Contact Us">
          If you have questions about this Privacy Policy or how we handle your data:{'\n\n'}
          <Bold>Tradenet</Bold>{'\n'}
          Email: tradenetapp@gmail.com{'\n'}
          phone/whatsapp: +234 8138997811{'\n'}
          Nigeria
        </Section>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionBody}>{children}</Text>
    </View>
  );
}

function Bold({ children }) {
  return <Text style={styles.bold}>{children}</Text>;
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },

  header: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: NAVY,
  },

  // ── Content ──
  content: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: SPACING.xl,
    flexGrow: 1,
  },
  lastUpdated: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: SPACING.lg,
    fontStyle: 'italic',
  },

  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: NAVY,
    marginBottom: SPACING.sm,
  },
  sectionBody: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
  },
  bold: {
    fontWeight: '700',
    color: NAVY,
  },
});