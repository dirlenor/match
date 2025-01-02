"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signUp } from '@/lib/auth';

export default function Register() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validateForm = () => {
    if (!email) {
      setError('กรุณากรอกอีเมล');
      return false;
    }
    
    // ตรวจสอบรูปแบบอีเมลอย่างง่าย
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('กรุณากรอกอีเมลให้ถูกต้อง');
      return false;
    }

    // ตรวจสอบความยาวของอีเมล
    const [localPart, domain] = email.split('@');
    if (localPart.length < 2 || domain.length < 4) {
      setError('กรุณาใช้อีเมลที่ถูกต้อง เช่น user@example.com');
      return false;
    }

    if (!password) {
      setError('กรุณากรอกรหัสผ่าน');
      return false;
    }

    if (password.length < 6) {
      setError('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return false;
    }

    if (password !== confirmPassword) {
      setError('รหัสผ่านไม่ตรงกัน');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const { error: signUpError } = await signUp(email, password);
      if (signUpError) {
        if (signUpError.message.includes('email')) {
          setError('อีเมลนี้ถูกใช้งานแล้ว');
        } else if (signUpError.message.includes('invalid')) {
          setError('กรุณาใช้อีเมลที่ถูกต้อง เช่น user@example.com');
        } else {
          setError(signUpError.message);
        }
        return;
      }
      setSuccess(true);
      // Redirect to profile page after successful registration
      router.push('/profile');
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
                placeholder="กรอกอีเมลของคุณ เช่น user@example.com"
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
            <div>
              <label className="block text-text-light mb-1.5 text-sm">ยืนยันรหัสผ่าน</label>
              <input 
                type="password" 
                className="input w-full h-11"
                placeholder="กรอกรหัสผ่านอีกครั้ง"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </div>
          {error && (
            <div className="text-red-500 text-sm text-center bg-red-100/10 p-2 rounded">
              {error}
            </div>
          )}
          {success && (
            <div className="space-y-2">
              <div className="text-green-500 text-sm text-center bg-green-100/10 p-2 rounded">
                ลงทะเบียนสำเร็จ! กรลังพาคุณไปยังหน้ากรอกข้อมูลส่วนตัว...
              </div>
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
          <Link href="/" className="text-text-light hover:text-accent text-sm">
            มีบัญชีอยู่แล้ว? เข้าสู่ระบบที่นี่
          </Link>
        </div>
      </div>
    </main>
  );
} 