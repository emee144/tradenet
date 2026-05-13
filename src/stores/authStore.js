import { create } from 'zustand';
import { supabase } from '@lib/supabase';

export const useAuthStore = create((set, get) => ({
  user: null,
  profile: null,
  session: null,
  loading: true,

  setSession: (session) => {
    set({ session, user: session?.user ?? null, loading: false });
  },

  setProfile: (profile) => set({ profile }),

  sendOtp: async (phone) => {
    const { data, error } = await supabase.functions.invoke('send-otp', {
      body: { phone },
    });
    if (error) throw new Error(error.message);
    return data;
  },

  verifyOtp: async (phone, otp) => {
    const { data, error } = await supabase.functions.invoke('verify-otp', {
      body: { phone, otp },
    });
    if (error) throw new Error(error.message);
    return data;
  },


  signUp: async ({ phone, password, nin }) => {

    const { data: existingNin } = await supabase
      .from('profiles')
      .select('id')
      .eq('nin', nin)
      .maybeSingle();

    if (existingNin) {
      throw new Error('This NIN is already registered to another account.');
    }

    // Step 2 — Create auth user
    const { data, error } = await supabase.auth.signUp({ phone, password });
    if (error) throw new Error(error.message);

    // Set session so the profile insert below passes RLS (auth.uid() = id)
    if (data.session) {
      await supabase.auth.setSession(data.session);
      set({ session: data.session, user: data.user });
    }

    // Step 3 — Create profile with NIN
    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          phone,
          nin,
          nin_verified: false,
          photo_verified: false,
          created_at: new Date().toISOString(),
        });
      if (profileError) throw new Error(profileError.message);
    }

    return data;
  },

  // ── Sign in ──
  signIn: async ({ phone, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      phone,
      password,
    });
    if (error) throw new Error(error.message);
    set({ session: data.session, user: data.user });
    return data;
  },

  uploadVerificationPhoto: async (base64Photo) => {
    const { user } = get();
    if (!user) throw new Error('Not logged in');

    const { data, error } = await supabase.functions.invoke('upload-verification-photo', {
      body: { userId: user.id, photo: base64Photo },
    });
    if (error) throw new Error(error.message);

    await supabase
      .from('profiles')
      .update({ photo_verified: true, photo_url: data.url })
      .eq('id', user.id);

    return data;
  },

  fetchProfile: async () => {
    const { user } = get();
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!error && data) set({ profile: data });
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, profile: null, session: null });
  },


  isVerified: () => {
    const { profile } = get();
    return profile?.nin_verified && profile?.photo_verified;
  },
}));