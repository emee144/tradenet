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

export default function TermsOfServiceScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safe}>

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={NAVY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms of Service</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.lastUpdated}>Last updated: {LAST_UPDATED}</Text>

        <Section title="1. Acceptance of Terms">
          By downloading, installing or using the Tradenet app, you agree to be
          bound by these Terms of Service. If you do not agree to these terms,
          please do not use the app.{'\n\n'}
          These terms apply to all users including service providers, customers,
          landlords, tenants, employers, job seekers, car sellers and buyers.
        </Section>

        <Section title="2. Eligibility">
          To use Tradenet you must:{'\n'}
          • Be at least 18 years old{'\n'}
          • Be a resident of Nigeria or have a valid Nigerian phone number{'\n'}
          • Have a valid National Identification Number (NIN){'\n'}
          • Provide accurate and truthful information during registration{'\n'}
          • Not have been previously banned from the platform
        </Section>

        <Section title="3. Account Registration and Verification">
          • You must register with your real phone number and NIN{'\n'}
          • A live photo is required for identity verification{'\n'}
          • You are responsible for keeping your account credentials secure{'\n'}
          • You must not share your account with anyone{'\n'}
          • You must notify us immediately if you suspect unauthorised access{'\n'}
          • We reserve the right to suspend unverified or suspicious accounts
        </Section>

        <Section title="4. Services Marketplace">
          <Bold>For service providers:</Bold>{'\n'}
          • You must only offer services you are qualified and able to deliver{'\n'}
          • You must not post false, misleading or exaggerated service descriptions{'\n'}
          • You are responsible for delivering services as described{'\n'}
          • You must honour agreed prices and timelines{'\n\n'}
          <Bold>For customers:</Bold>{'\n'}
          • You must pay agreed amounts promptly{'\n'}
          • You must treat service providers with respect{'\n'}
          • You must not make false or malicious complaints
        </Section>

        <Section title="5. Property Listings">
          • All property listings must be accurate and truthful{'\n'}
          • You must only list properties you own or are authorised to list{'\n'}
          • Prices must be clearly stated in Nigerian Naira (₦){'\n'}
          • You must not list properties that are already rented or sold{'\n'}
          • Fraudulent property listings will result in immediate account ban and
          may be reported to the authorities
        </Section>

        <Section title="6. Job Listings">
          • Employers must only post genuine job vacancies{'\n'}
          • Job descriptions must be accurate and not misleading{'\n'}
          • You must not collect any fees from job applicants{'\n'}
          • Salary ranges must be stated honestly{'\n'}
          • We reserve the right to remove any job listing that violates these terms
        </Section>

        <Section title="7. Car Listings">
          • You must only list vehicles you legally own{'\n'}
          • Vehicle condition and details must be accurately described{'\n'}
          • For rentals, you must have appropriate insurance{'\n'}
          • We are not responsible for disputes between buyers and sellers
        </Section>

        <Section title="8. Prohibited Conduct">
          You must NOT:{'\n'}
          • Post false, fraudulent or misleading listings{'\n'}
          • Harass, threaten or abuse other users{'\n'}
          • Use the platform for illegal activities{'\n'}
          • Attempt to scam other users{'\n'}
          • Create multiple accounts{'\n'}
          • Post someone else's personal information without consent{'\n'}
          • Use the app to send spam or unsolicited messages{'\n'}
          • Attempt to hack, damage or disrupt the platform{'\n'}
          • Impersonate another person or organisation{'\n\n'}
          Violation of these rules will result in immediate account suspension
          and may be reported to Nigerian law enforcement.
        </Section>

        <Section title="9. Reviews and Ratings">
          • Reviews must be honest and based on real experiences{'\n'}
          • You must not post fake positive reviews for yourself{'\n'}
          • You must not post malicious or false negative reviews{'\n'}
          • We reserve the right to remove reviews that violate our guidelines
        </Section>

        <Section title="10. Tradenet's Role">
          Tradenet is a marketplace platform. We:{'\n'}
          • Connect users but are NOT a party to any transaction{'\n'}
          • Do not guarantee the quality of any service, property or product{'\n'}
          • Are not responsible for disputes between users{'\n'}
          • Do not employ service providers listed on the platform{'\n'}
          • Strongly recommend users verify listings before paying any money
        </Section>

        <Section title="11. Payments">
          • Payments between users are made directly between the parties{'\n'}
          • Tradenet does not currently process payments between users{'\n'}
          • We are not responsible for any payment disputes{'\n'}
          • Never pay for a service, property or car without verifying it first{'\n'}
          • Report any suspicious payment requests to us immediately
        </Section>

        <Section title="12. Intellectual Property">
          • Tradenet and its logo are our trademarks{'\n'}
          • You retain ownership of content you post (photos, descriptions){'\n'}
          • By posting content, you give us a licence to display it on the platform{'\n'}
          • You must not copy or reproduce any part of Tradenet without permission
        </Section>

        <Section title="13. Termination">
          We may suspend or terminate your account if you:{'\n'}
          • Violate these Terms of Service{'\n'}
          • Engage in fraudulent activity{'\n'}
          • Harass other users{'\n'}
          • Post illegal content{'\n\n'}
          You may delete your account at any time from the Profile settings.
          Upon deletion, your listings will be removed within 30 days.
        </Section>

        <Section title="14. Limitation of Liability">
          Tradenet is provided "as is". We are not liable for:{'\n'}
          • Any loss arising from transactions between users{'\n'}
          • Inaccurate information posted by users{'\n'}
          • Service interruptions or technical issues{'\n'}
          • Any indirect or consequential damages{'\n\n'}
          Our total liability is limited to the amount you paid to us in the
          last 12 months, if any.
        </Section>

        <Section title="15. Governing Law">
          These Terms are governed by the laws of the Federal Republic of Nigeria.
          Any disputes will be resolved in Nigerian courts.
        </Section>

        <Section title="16. Changes to Terms">
          We may update these Terms from time to time. We will notify you through
          the app when significant changes are made. Continued use of Tradenet
          after changes means you accept the updated Terms.
        </Section>

        <Section title="17. Contact Us">
          If you have questions about these Terms:{'\n\n'}
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