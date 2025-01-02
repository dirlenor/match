import { supabase } from './supabase';

export type AuthError = {
  message: string;
};

export async function signUp(email: string, password: string): Promise<{ error: AuthError | null }> {
  try {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin
      }
    });

    if (error) {
      return { error: { message: error.message } };
    }

    return { error: null };
  } catch (err) {
    return { error: { message: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' } };
  }
}

export async function signIn(email: string, password: string, rememberMe: boolean = false): Promise<{ error: AuthError | null }> {
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  // Set session persistence after sign in
  if (!error && rememberMe) {
    await supabase.auth.getSession();
  }

  if (error) {
    return { error: { message: error.message } };
  }

  return { error: null };
}

export async function signOut(): Promise<{ error: AuthError | null }> {
  const { error } = await supabase.auth.signOut();

  if (error) {
    return { error: { message: error.message } };
  }

  return { error: null };
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return !!user;
} 