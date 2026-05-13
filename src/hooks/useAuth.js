import { useAuthStore } from '@stores/authStore';

export default function useAuth() {
  const {
    user,
    profile,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    sendOtp,
    verifyOtp,
    verifyNin,
    fetchProfile,
    isVerified,
  } = useAuthStore();

  return {
    user,
    profile,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    sendOtp,
    verifyOtp,
    verifyNin,
    fetchProfile,
    isVerified: isVerified(),
    isLoggedIn: !!session,
  };
}