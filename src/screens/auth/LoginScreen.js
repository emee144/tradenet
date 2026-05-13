import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@stores/authStore';
import { COLORS, RADIUS, SPACING } from '@constants/index';
import { validateNigerianPhone, validatePassword, formatToInternational } from '@utils/validators';

export default function LoginScreen({ navigation }) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const { signIn } = useAuthStore();

  const validate = () => {
    const newErrors = {};
    if (!phone) newErrors.phone = 'Phone number is required';
    else if (!validateNigerianPhone(phone)) newErrors.phone = 'Enter a valid Nigerian phone number e.g 08012345678';
    if (!password) newErrors.password = 'Password is required';
    else if (!validatePassword(password)) newErrors.password = 'Password must be at least 8 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const formattedPhone = formatToInternational(phone);
      await signIn({ phone: formattedPhone, password });
    } catch (error) {
      Alert.alert('Login Failed', error.message || 'Incorrect phone number or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    if (!phone) { Alert.alert('Enter phone number', 'Please enter your phone number first.'); return; }
    if (!validateNigerianPhone(phone)) { Alert.alert('Invalid phone', 'Enter a valid Nigerian phone number.'); return; }
    navigation.navigate('Otp', { phone: formatToInternational(phone), mode: 'reset' });
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
            <Text style={styles.formTitle}>Welcome back</Text>
            <Text style={styles.formSub}>Log in to your TradeNet account</Text>

            {/* Phone */}
            <View style={styles.fieldWrap}>
              <Text style={styles.label}>Phone number</Text>
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
                  returnKeyType="next"
                />
              </View>
              {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
            </View>

            {/* Password */}
            <View style={styles.fieldWrap}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Password</Text>
                <TouchableOpacity onPress={handleForgotPassword}>
                  <Text style={styles.forgotText}>Forgot password?</Text>
                </TouchableOpacity>
              </View>
              <View style={[styles.inputRow, errors.password && styles.inputError]}>
                <Ionicons name="lock-closed-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Your password"
                  placeholderTextColor={COLORS.textMuted}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={(v) => { setPassword(v); setErrors((e) => ({ ...e, password: null })); }}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                  <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={18} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>
              {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.ctaBtn, loading && styles.ctaBtnDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.textOnGold} size="small" />
              ) : (
                <Text style={styles.ctaText}>Log in</Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Sign up link */}
            <TouchableOpacity onPress={() => navigation.navigate('Signup')} style={styles.signupLink}>
              <Text style={styles.signupText}>
                Don't have an account?{' '}
                <Text style={styles.signupBold}>Create one</Text>
              </Text>
            </TouchableOpacity>

            {/* Terms */}
            <Text style={styles.terms}>
              By logging in you agree to our{' '}
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
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 7 },
  forgotText: { fontSize: 12, color: COLORS.primary, fontWeight: '600' },
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
  input: { flex: 1, fontSize: 15, color: COLORS.textPrimary },
  eyeBtn: { padding: 4 },
  errorText: { fontSize: 12, color: '#ef4444', marginTop: 5, marginLeft: 2 },

  // ── CTA ──
  ctaBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    marginTop: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  ctaBtnDisabled: { opacity: 0.6 },
  ctaText: { fontSize: 16, fontWeight: '700', color: COLORS.textOnGold },

  // ── Divider ──
  divider: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.borderMuted },
  dividerText: { fontSize: 12, color: COLORS.textMuted },

  // ── Bottom ──
  signupLink: { alignItems: 'center', marginBottom: 16 },
  signupText: { fontSize: 13, color: COLORS.textSecondary },
  signupBold: { color: COLORS.primary, fontWeight: '700' },
  terms: { textAlign: 'center', fontSize: 11, color: COLORS.textMuted, lineHeight: 18 },
  termsLink: { color: COLORS.primary, fontWeight: '500' },
});