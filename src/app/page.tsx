"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import LoginForm from '@/components/LoginForm';

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  const checkSession = useCallback(async () => {
    try {
      // ตรวจสอบ session จาก localStorage ก่อน
      const localSession = localStorage.getItem('supabase.auth.token');
      if (localSession) {
        router.push('/dashboard');
        return;
      }

      // ถ้าไม่มีใน localStorage ให้ตรวจสอบ session ปัจจุบัน
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // ตรวจสอบว่ามีข้อมูล profile หรือไม่
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          router.push('/dashboard');
        } else {
          router.push('/profile');
        }
      } else {
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error checking session:', error);
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="animate-spin text-4xl">
          <i className="fas fa-circle-notch text-text-light"></i>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-4 pt-16">
      <div className="text-center mb-16">
        <h1 className="text-[120px] sm:text-[167px] font-league-gothic text-text-light leading-none tracking-[-2%]">MATCH</h1>
        <h2 className="text-[120px] sm:text-[167px] font-league-gothic text-text-light leading-none tracking-wide">TIME</h2>
        <p className="text-text-light mt-4 text-sm">Check in your time and request payment app.</p>
      </div>

      <div className="w-full max-w-[340px]">
        <LoginForm />
      </div>
    </main>
  );
}
