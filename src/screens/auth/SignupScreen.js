import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@stores/authStore';
import { COLORS, RADIUS, SPACING } from '@constants/index';
import { validateNigerianPhone, validateNIN, validatePassword } from '@utils/validators';

export default function SignupScreen({ navigation }) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nin, setNin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const { sendOtp } = useAuthStore();

  const validate = () => {
    const newErrors = {};
    if (!phone) newErrors.phone = 'Phone number is required';
    else if (!validateNigerianPhone(phone)) newErrors.phone = 'Enter a valid Nigerian phone number e.g 08012345678';
    if (!password) newErrors.password = 'Password is required';
    else if (!validatePassword(password)) newErrors.password = 'Password must be at least 8 characters';
    if (!confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
    else if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (!nin) newErrors.nin = 'NIN is required';
    else if (!validateNIN(nin)) newErrors.nin = 'NIN must be exactly 11 digits';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const formattedPhone = phone.startsWith('0') ? '+234' + phone.slice(1) : phone;
      if (!__DEV__) await sendOtp(formattedPhone);
      navigation.navigate('Otp', { phone: formattedPhone, password, nin, mode: 'signup' });
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* ── Header ── */}
          <View style={styles.header}>
            <View style={styles.logoBox}>
              <Ionicons name="flash" size={24} color={COLORS.textOnGold} />
            </View>
            <Text style={styles.appName}>TradeNet</Text>
            <Text style={styles.appTagline}>Nigeria's Premium Marketplace</Text>
          </View>

          {/* ── Form ── */}
          <View style={styles.form}>
            <Text style={styles.formTitle}>Create account</Text>
            <Text style={styles.formSub}>Join thousands of Nigerians on TradeNet</Text>

            <Field label="Phone number" error={errors.phone}>
              <View style={[styles.inputRow, errors.phone && styles.inputError]}>
                <Ionicons name="call-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="08012345678"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={(v) => { setPhone(v); setErrors((e) => ({ ...e, phone: null })); }}
                  maxLength={11}
                />
              </View>
            </Field>

            <Field label="Password" error={errors.password}>
              <View style={[styles.inputRow, errors.password && styles.inputError]}>
                <Ionicons name="lock-closed-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Min. 8 characters"
                  placeholderTextColor={COLORS.textMuted}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={(v) => { setPassword(v); setErrors((e) => ({ ...e, password: null })); }}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                  <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={18} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>
            </Field>

            <Field label="Confirm password" error={errors.confirmPassword}>
              <View style={[styles.inputRow, errors.confirmPassword && styles.inputError]}>
                <Ionicons name="lock-closed-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Repeat your password"
                  placeholderTextColor={COLORS.textMuted}
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={(v) => { setConfirmPassword(v); setErrors((e) => ({ ...e, confirmPassword: null })); }}
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeBtn}>
                  <Ionicons name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'} size={18} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>
            </Field>

            <Field label="NIN (National ID Number)" error={errors.nin}>
              <View style={[styles.inputRow, errors.nin && styles.inputError]}>
                <Ionicons name="card-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="11-digit NIN"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="number-pad"
                  value={nin}
                  onChangeText={(v) => { setNin(v); setErrors((e) => ({ ...e, nin: null })); }}
                  maxLength={11}
                />
              </View>
            </Field>

            {/* Camera notice */}
            <View style={styles.cameraNotice}>
              <Ionicons name="camera-outline" size={16} color={COLORS.primary} />
              <Text style={styles.cameraText}>
                A live photo will be taken to verify your identity after OTP confirmation
              </Text>
            </View>

            {/* CTA */}
            <TouchableOpacity
              style={[styles.ctaBtn, loading && styles.ctaBtnDisabled]}
              onPress={handleContinue}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.textOnGold} size="small" />
              ) : (
                <Text style={styles.ctaText}>Continue</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.otpNote}>A verification code will be sent to your phone</Text>

            <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.loginLink}>
              <Text style={styles.loginText}>
                Already have an account?{' '}
                <Text style={styles.loginBold}>Log in</Text>
              </Text>
            </TouchableOpacity>

            <Text style={styles.terms}>
              By creating an account you agree to our{' '}
              <Text style={styles.termsLink} onPress={() => navigation.navigate('TermsOfService')}>Terms of Service</Text>
              {' '}and{' '}
              <Text style={styles.termsLink} onPress={() => navigation.navigate('PrivacyPolicy')}>Privacy Policy</Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  scroll: { flexGrow: 1 },

  // ── Header ──
  header: {
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.margin,
    paddingTop: 32,
    paddingBottom: 28,
    alignItems: 'flex-start',
  },
  logoBox: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  appName: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  appTagline: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },

  // ── Form ──
  form: {
    flex: 1,
    backgroundColor: COLORS.surfaceLow,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: SPACING.margin,
    paddingTop: 28,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderMuted,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  formSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 24,
  },
  fieldWrap: { marginBottom: 16 },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 7,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceHigh,
    borderWidth: 1,
    borderColor: COLORS.borderMuted,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    height: 52,
  },
  inputError: { borderColor: '#ef4444' },
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  eyeBtn: { padding: 4 },
  errorText: { fontSize: 12, color: '#ef4444', marginTop: 5, marginLeft: 2 },

  // ── Camera notice ──
  cameraNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: COLORS.primaryMuted,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: 14,
    marginBottom: 20,
  },
  cameraText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
    lineHeight: 18,
  },

  // ── CTA ──
  ctaBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  ctaBtnDisabled: { opacity: 0.6 },
  ctaText: { fontSize: 16, fontWeight: '700', color: COLORS.textOnGold },

  // ── Bottom ──
  otpNote: { textAlign: 'center', fontSize: 12, color: COLORS.textMuted, marginBottom: 16 },
  loginLink: { alignItems: 'center', marginBottom: 16 },
  loginText: { fontSize: 13, color: COLORS.textSecondary },
  loginBold: { color: COLORS.primary, fontWeight: '700' },
  terms: { textAlign: 'center', fontSize: 11, color: COLORS.textMuted, lineHeight: 18 },
  termsLink: { color: COLORS.primary, fontWeight: '500' },
});