import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@stores/authStore';
import { COLORS, RADIUS, SPACING } from '@constants/index';

const OTP_LENGTH = 6;
const RESEND_COUNTDOWN = 60;

export default function OtpScreen({ navigation, route }) {
  const { phone, password, nin, mode } = route.params;

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_COUNTDOWN);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef([]);
  const { verifyOtp, signUp, signIn, sendOtp } = useAuthStore();

  useEffect(() => {
    if (countdown <= 0) { setCanResend(true); return; }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleOtpChange = (val, index) => {
    if (!/^\d*$/.test(val)) return;
    const newOtp = [...otp];
    newOtp[index] = val;
    setOtp(newOtp);
    if (val && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
    if (val && index === OTP_LENGTH - 1) {
      const fullOtp = [...newOtp].join('');
      if (fullOtp.length === OTP_LENGTH) handleVerify(fullOtp);
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (fullOtp) => {
    const otpCode = fullOtp || otp.join('');
    if (otpCode.length < OTP_LENGTH) {
      Alert.alert('Incomplete', 'Please enter all 6 digits of the OTP.');
      return;
    }
    setLoading(true);
    try {
      await verifyOtp(phone, otpCode);
      if (mode === 'signup') {
        await signUp({ phone, password, nin });
        await signIn({ phone, password });
        navigation.navigate('Camera', { phone });
      } else if (mode === 'reset') {
        navigation.navigate('ResetPassword', { phone });
      } else if (mode === 'login') {
        navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
      }
    } catch (error) {
      Alert.alert('Invalid OTP', error.message || 'The code you entered is wrong or expired.');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    setResending(true);
    try {
      await sendOtp(phone);
      setOtp(['', '', '', '', '', '']);
      setCountdown(RESEND_COUNTDOWN);
      setCanResend(false);
      inputRefs.current[0]?.focus();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to resend OTP.');
    } finally {
      setResending(false);
    }
  };

  const maskedPhone = phone.replace(/(\+234)(\d{3})(\d{4})(\d{4})/, '$1 $2 **** $4');

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* ── Content ── */}
        <View style={styles.content}>
          <View style={styles.iconWrap}>
            <Ionicons name="chatbubble-ellipses-outline" size={32} color={COLORS.primary} />
          </View>
          <Text style={styles.title}>Enter OTP code</Text>
          <Text style={styles.sub}>
            We sent a 6-digit code to{'\n'}
            <Text style={styles.phone}>{maskedPhone}</Text>
          </Text>

          {/* OTP boxes */}
          <View style={styles.otpRow}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => (inputRefs.current[index] = ref)}
                style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
                value={digit}
                onChangeText={(val) => handleOtpChange(val, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
                autoFocus={index === 0}
              />
            ))}
          </View>

          {/* Timer */}
          <Text style={styles.timerText}>
            {canResend ? "Didn't receive the code?" : `Resend code in ${countdown}s`}
          </Text>

          {/* Resend */}
          <TouchableOpacity
            style={[styles.resendBtn, !canResend && styles.resendDisabled]}
            onPress={handleResend}
            disabled={!canResend || resending}
          >
            {resending ? (
              <ActivityIndicator size="small" color={COLORS.textOnGold} />
            ) : (
              <Text style={[styles.resendText, !canResend && styles.resendTextDisabled]}>
                Resend OTP
              </Text>
            )}
          </TouchableOpacity>

          {/* Verify */}
          <TouchableOpacity
            style={[styles.ctaBtn, loading && styles.ctaBtnDisabled]}
            onPress={() => handleVerify()}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.textOnGold} size="small" />
            ) : (
              <Text style={styles.ctaText}>Verify</Text>
            )}
          </TouchableOpacity>

          {/* Notice */}
          <View style={styles.notice}>
            <Ionicons name="information-circle-outline" size={16} color={COLORS.primary} />
            <Text style={styles.noticeText}>Check your SMS inbox for the verification code.</Text>
          </View>

          {/* Dev skip */}
          {__DEV__ && (
            <TouchableOpacity
              style={styles.skipBtn}
              onPress={async () => {
                setLoading(true);
                try {
                  if (mode === 'signup') {
                    await signUp({ phone, password, nin });
                    await signIn({ phone, password });
                    navigation.navigate('Camera', { phone });
                  } else {
                    navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
                  }
                } catch (error) {
                  Alert.alert('Error', error.message);
                } finally {
                  setLoading(false);
                }
              }}
            >
              <Text style={styles.skipText}>⚙️ Skip OTP (Dev only)</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },

  // ── Header ──
  header: {
    paddingHorizontal: SPACING.margin,
    paddingTop: 8,
    paddingBottom: 4,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderMuted,
  },

  // ── Content ──
  content: {
    flex: 1,
    paddingHorizontal: SPACING.margin,
    paddingTop: 24,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.primaryMuted,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  sub: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginBottom: 32,
  },
  phone: {
    fontWeight: '700',
    color: COLORS.primary,
  },

  // ── OTP boxes ──
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 8,
  },
  otpBox: {
    flex: 1,
    height: 58,
    borderWidth: 1.5,
    borderColor: COLORS.borderMuted,
    borderRadius: RADIUS.md,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
    backgroundColor: COLORS.surfaceHigh,
  },
  otpBoxFilled: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryMuted,
    color: COLORS.primary,
  },

  // ── Timer & resend ──
  timerText: {
    textAlign: 'center',
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  resendBtn: {
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    marginBottom: 24,
    minWidth: 130,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  resendDisabled: {
    backgroundColor: COLORS.surfaceHigh,
    shadowOpacity: 0,
    elevation: 0,
  },
  resendText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textOnGold,
  },
  resendTextDisabled: {
    color: COLORS.textMuted,
  },

  // ── CTA ──
  ctaBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  ctaBtnDisabled: { opacity: 0.6 },
  ctaText: { fontSize: 16, fontWeight: '700', color: COLORS.textOnGold },

  // ── Notice ──
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: COLORS.primaryMuted,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: 14,
  },
  noticeText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
    lineHeight: 18,
  },

  // ── Dev skip ──
  skipBtn: { alignItems: 'center', marginTop: 16, padding: 8 },
  skipText: { fontSize: 12, color: COLORS.textMuted, textDecorationLine: 'underline' },
});