import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, ActivityIndicator, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING } from '@constants/index';

const FAQS = [
  { q: 'How do I verify my account?', a: 'Account verification happens during signup. You need to provide your NIN and take a live photo. Once reviewed, your account will be marked as verified.' },
  { q: 'How do I post a service?', a: 'Tap the + button at the bottom of the screen, then select the type of listing you want to post and fill in the details.' },
  { q: 'How do I contact a service provider?', a: 'Open the service listing and tap on the provider profile to see their contact details.' },
  { q: 'Is my NIN safe?', a: 'Yes. Your NIN is encrypted and stored securely. It is never shared with other users or third parties.' },
  { q: 'How do I delete my account?', a: 'Go to Profile → Privacy & Security → Delete Account. Your data will be permanently deleted within 30 days.' },
];

export default function SupportScreen({ navigation }) {
  const [openFaq, setOpenFaq] = useState(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) { Alert.alert('Error', 'Please enter your message.'); return; }
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setMessage('');
      Alert.alert('Sent!', 'Your message has been sent. We will respond within 24 hours.');
    }, 1500);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Contact options */}
        <View style={styles.contactRow}>
          <TouchableOpacity style={styles.contactBtn} onPress={() => Linking.openURL('mailto:tradenetapp@gmail.com')}>
            <View style={styles.contactIconWrap}>
              <Ionicons name="mail-outline" size={22} color={COLORS.primary} />
            </View>
            <Text style={styles.contactLabel}>Email Us</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.contactBtn} onPress={() => Linking.openURL('https://wa.me/+2348138997811')}>
            <View style={styles.contactIconWrap}>
              <Ionicons name="logo-whatsapp" size={22} color={COLORS.primary} />
            </View>
            <Text style={styles.contactLabel}>WhatsApp</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.contactBtn} onPress={() => Linking.openURL('tel:+2348000000000')}>
            <View style={styles.contactIconWrap}>
              <Ionicons name="call-outline" size={22} color={COLORS.primary} />
            </View>
            <Text style={styles.contactLabel}>Call Us</Text>
          </TouchableOpacity>
        </View>

        {/* FAQs */}
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        <View style={styles.faqCard}>
          {FAQS.map((faq, index) => (
            <View key={index} style={[styles.faqItem, index < FAQS.length - 1 && styles.faqBorder]}>
              <TouchableOpacity
                style={styles.faqQuestion}
                onPress={() => setOpenFaq(openFaq === index ? null : index)}
              >
                <Text style={styles.faqQ}>{faq.q}</Text>
                <Ionicons
                  name={openFaq === index ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={COLORS.textMuted}
                />
              </TouchableOpacity>
              {openFaq === index && (
                <Text style={styles.faqA}>{faq.a}</Text>
              )}
            </View>
          ))}
        </View>

        {/* Send message */}
        <Text style={styles.sectionTitle}>Send us a message</Text>
        <View style={styles.messageCard}>
          <TextInput
            style={styles.messageInput}
            placeholder="Describe your issue or question..."
            placeholderTextColor={COLORS.textMuted}
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          <TouchableOpacity
            style={[styles.sendBtn, sending && styles.sendBtnDisabled]}
            onPress={handleSend} disabled={sending}
          >
            {sending ? <ActivityIndicator color={COLORS.textOnGold} size="small" /> : (
              <>
                <Ionicons name="send-outline" size={16} color={COLORS.textOnGold} />
                <Text style={styles.sendBtnText}>Send Message</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

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
  contactRow: { flexDirection: 'row', gap: 10, marginBottom: SPACING.margin },
  contactBtn: {
    flex: 1, backgroundColor: COLORS.surfaceHigh, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.borderMuted,
    padding: 14, alignItems: 'center', gap: 8,
  },
  contactIconWrap: {
    width: 48, height: 48, borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryMuted, borderWidth: 1,
    borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center',
  },
  contactLabel: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },
  sectionTitle: {
    fontSize: 12, fontWeight: '700', color: COLORS.textMuted,
    marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8,
  },
  faqCard: {
    backgroundColor: COLORS.surfaceHigh, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.borderMuted, overflow: 'hidden', marginBottom: SPACING.margin,
  },
  faqItem: { padding: 14 },
  faqBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.borderMuted },
  faqQuestion: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  faqQ: { flex: 1, fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  faqA: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 20, marginTop: 10 },
  messageCard: {
    backgroundColor: COLORS.surfaceHigh, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.borderMuted, padding: 14, marginBottom: 10,
  },
  messageInput: {
    fontSize: 14, color: COLORS.textPrimary,
    minHeight: 100, marginBottom: 12,
  },
  sendBtn: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.md, height: 48,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
  },
  sendBtnDisabled: { opacity: 0.6 },
  sendBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.textOnGold },
});