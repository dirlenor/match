"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from '@/lib/auth';

export default function Home() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    if (!email) {
      setError('กรุณากรอกอีเมล');
      return false;
    }
    
    if (!email.includes('@')) {
      setError('กรุณากรอกอีเมลให้ถูกต้อง');
      return false;
    }

    if (!password) {
      setError('กรุณากรอกรหัสผ่าน');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const { error: signInError } = await signIn(email, password, rememberMe);
      if (signInError) {
        if (signInError.message.includes('Invalid login credentials')) {
          setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
        } else if (signInError.message.includes('Email not confirmed')) {
          setError('กรุณายืนยันอีเมลของคุณ');
        } else {
          setError(signInError.message);
        }
        return;
      }
      router.push('/dashboard');
    } catch {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-4 pt-16">
      <div className="text-center mb-16">
        <h1 className="text-[120px] sm:text-[167px] font-league-gothic text-text-light leading-none tracking-[-2%]">MATCH</h1>
        <h2 className="text-[120px] sm:text-[167px] font-league-gothic text-text-light leading-none tracking-wide">TIME</h2>
        <p className="text-text-light mt-4 text-sm">Check in your time and request payment app.</p>
      </div>

      <div className="w-full max-w-[340px]">
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-5">
            <div>
              <label className="block text-text-light mb-1.5 text-sm">อีเมล</label>
              <input 
                type="email" 
                className="input w-full h-11"
                placeholder="กรอกอีเมลของคุณ"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-text-light mb-1.5 text-sm">รหัสผ่าน</label>
              <input 
                type="password" 
                className="input w-full h-11"
                placeholder="กรอกรหัสผ่าน"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="rememberMe"
                className="w-4 h-4 rounded border-2 border-text-light bg-transparent checked:bg-accent checked:border-accent focus:ring-0 focus:ring-offset-0"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <label htmlFor="rememberMe" className="ml-2 text-text-light text-sm cursor-pointer">
                จดจำฉันไว้
              </label>
            </div>
          </div>
          {error && (
            <div className="text-red-500 text-sm text-center bg-red-100/10 p-2 rounded">
              {error}
            </div>
          )}
          <div className="mt-32">
            <button 
              type="submit" 
              className="btn w-full h-11 group relative"
              disabled={loading}
            >
              {loading ? (
                <span className="inline-block animate-spin">
                  <i className="fas fa-circle-notch text-text-light"></i>
                </span>
              ) : (
                <i className="fas fa-arrow-right text-text-light group-hover:text-bg-dark"></i>
              )}
            </button>
          </div>
        </form>

        <div className="text-center mt-4">
          <Link href="/register" className="text-text-light hover:text-accent text-sm">
            ยังไม่มีบัญชี? ลงทะเบียนที่นี่
          </Link>
        </div>
      </div>
    </main>
  );
}
