import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING } from '@constants/index';

const NOTIFICATION_SETTINGS = [
  {
    title: 'Bookings',
    items: [
      { id: 'new_booking', label: 'New booking requests', icon: 'calendar-outline', defaultOn: true },
      { id: 'booking_update', label: 'Booking updates', icon: 'refresh-circle-outline', defaultOn: true },
    ],
  },
  {
    title: 'Jobs',
    items: [
      { id: 'new_application', label: 'New job applications', icon: 'document-text-outline', defaultOn: true },
      { id: 'application_update', label: 'Application status updates', icon: 'notifications-outline', defaultOn: true },
    ],
  },
  {
    title: 'Account',
    items: [
      { id: 'security', label: 'Security alerts', icon: 'shield-outline', defaultOn: true },
      { id: 'promotions', label: 'Promotions & offers', icon: 'gift-outline', defaultOn: false },
      { id: 'newsletter', label: 'TradeNet newsletter', icon: 'mail-outline', defaultOn: false },
    ],
  },
];

export default function NotificationsScreen({ navigation }) {
  const [settings, setSettings] = useState(() => {
    const initial = {};
    NOTIFICATION_SETTINGS.forEach((section) => {
      section.items.forEach((item) => { initial[item.id] = item.defaultOn; });
    });
    return initial;
  });

  const toggle = (id) => setSettings((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.infoBox}>
          <Ionicons name="notifications-outline" size={20} color={COLORS.primary} />
          <Text style={styles.infoText}>Choose which notifications you want to receive from TradeNet</Text>
        </View>

        {NOTIFICATION_SETTINGS.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.card}>
              {section.items.map((item, index) => (
                <View
                  key={item.id}
                  style={[styles.row, index < section.items.length - 1 && styles.rowBorder]}
                >
                  <View style={styles.rowIconWrap}>
                    <Ionicons name={item.icon} size={18} color={COLORS.primary} />
                  </View>
                  <Text style={styles.rowLabel}>{item.label}</Text>
                  <Switch
                    value={settings[item.id]}
                    onValueChange={() => toggle(item.id)}
                    trackColor={{ false: COLORS.surfaceHighest, true: COLORS.primary }}
                    thumbColor={settings[item.id] ? COLORS.textOnGold : COLORS.textMuted}
                  />
                </View>
              ))}
            </View>
          </View>
        ))}
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
  infoBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.primaryMuted, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border, padding: 14, marginBottom: SPACING.margin,
  },
  infoText: { flex: 1, fontSize: 13, color: COLORS.textSecondary, lineHeight: 18 },
  section: { marginBottom: SPACING.margin },
  sectionTitle: {
    fontSize: 12, fontWeight: '700', color: COLORS.textMuted,
    marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8,
  },
  card: {
    backgroundColor: COLORS.surfaceHigh, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.borderMuted, overflow: 'hidden',
  },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 14, paddingHorizontal: 16,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.borderMuted },
  rowIconWrap: {
    width: 36, height: 36, borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryMuted, borderWidth: 1,
    borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center',
  },
  rowLabel: { flex: 1, fontSize: 14, fontWeight: '500', color: COLORS.textPrimary },
});