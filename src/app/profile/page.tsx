"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function Profile() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [rate, setRate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('กรุณาเข้าสู่ระบบ');
        return;
      }

      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          name,
          age: parseInt(age),
          rate: parseInt(rate),
          updated_at: new Date().toISOString(),
        });

      if (upsertError) {
        setError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
        return;
      }

      router.push('/dashboard');
    } catch (err) {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-bg-dark p-8">
      <div className="max-w-[340px] mx-auto">
        <h1 className="text-3xl font-league-gothic text-text-light tracking-wide text-center mb-2">Profile</h1>
        <p className="text-text-light/60 text-sm text-center mb-8">Check in your time and request payment app.</p>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="block text-text-light mb-1.5 text-sm">Name</label>
            <input
              type="text"
              className="input w-full h-11"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-text-light mb-1.5 text-sm">Age</label>
            <input
              type="number"
              className="input w-full h-11"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              required
              min="1"
              max="100"
            />
          </div>

          <div>
            <label className="block text-text-light mb-1.5 text-sm">Rate</label>
            <input
              type="number"
              className="input w-full h-11"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              required
              min="0"
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center bg-red-100/10 p-2 rounded">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn w-full h-11 mt-8"
            disabled={loading}
          >
            {loading ? (
              <span className="inline-block animate-spin">
                <i className="fas fa-circle-notch text-text-light"></i>
              </span>
            ) : (
              'บันทึกข้อมูล'
            )}
          </button>
        </form>
      </div>
    </main>
  );
} 