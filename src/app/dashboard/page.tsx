"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface Profile {
  name: string;
  age: number;
  rate: number;
}

export default function Dashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [dayTime] = useState(0);
  const [overTime] = useState(0);
  const [salary] = useState(0);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editAge, setEditAge] = useState('');
  const [editRate, setEditRate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const getProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('name, age, rate')
        .eq('id', user.id)
        .single();

      if (!profile) {
        router.push('/profile');
        return;
      }

      setProfile(profile);
      setEditName(profile.name);
      setEditAge(profile.age.toString());
      setEditRate(profile.rate.toString());
    };

    getProfile();
  }, [router]);

  const handleEditSubmit = async (e: React.FormEvent) => {
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
          name: editName,
          age: parseInt(editAge),
          rate: parseInt(editRate),
          updated_at: new Date().toISOString(),
        });

      if (upsertError) {
        setError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
        return;
      }

      setProfile({
        name: editName,
        age: parseInt(editAge),
        rate: parseInt(editRate)
      });
      
      setShowEditModal(false);
    } catch {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  if (!profile) {
    return null;
  }

  return (
    <main className="min-h-screen bg-bg-dark p-8">
      {/* Logo */}
      <div className="mb-12 text-center">
        <h1 className="text-3xl font-league-gothic text-text-light tracking-wide">MATCH</h1>
      </div>

      {/* Welcome Section */}
      <div className="mb-12">
        <p className="text-text-light/60 text-sm mb-1">Welcome ,</p>
        <div className="flex items-baseline justify-between">
          <div className="flex items-baseline gap-2">
            <h2 className="text-6xl font-league-gothic text-text-light tracking-wide">{profile.name.toUpperCase()}</h2>
            <span className="text-6xl font-league-gothic text-accent">{profile.age}</span>
          </div>
          <button 
            onClick={() => setShowEditModal(true)}
            className="text-text-light/60 hover:text-accent"
          >
            <i className="fas fa-edit"></i>
          </button>
        </div>
        <div className="mt-4 h-px bg-text-light/10" />
      </div>

      {/* Salary Section */}
      <div className="mb-12">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-text-light/60 text-sm">Salary</p>
          <p className="text-decorate text-sm">( rate : {profile.rate} )</p>
        </div>
        <p className="text-6xl font-league-gothic text-text-light tracking-wide">
          {salary.toLocaleString()}
        </p>
        <div className="mt-4 h-px bg-text-light/10" />
      </div>

      {/* Day Time Section */}
      <div className="mb-12">
        <p className="text-text-light/60 text-sm mb-1">Day Time</p>
        <p className="text-6xl font-league-gothic text-text-light tracking-wide">{dayTime}</p>
        <div className="mt-2 bg-text-light/20 h-1.5 rounded-full overflow-hidden">
          <div 
            className="h-full bg-accent rounded-full transition-all duration-300"
            style={{ width: `${(dayTime / 24) * 100}%` }}
          />
        </div>
        <div className="mt-4 h-px bg-text-light/10" />
      </div>

      {/* Over Time Section */}
      <div className="mb-12">
        <p className="text-text-light/60 text-sm mb-1">Over Time</p>
        <p className="text-6xl font-league-gothic text-text-light tracking-wide">{overTime}</p>
        <div className="mt-4 h-px bg-text-light/10" />
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <button className="btn h-14 text-lg font-medium">
          Check in
        </button>
        <button className="btn h-14 text-lg font-medium">
          Payment
        </button>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-bg-dark rounded-lg p-6 w-full max-w-[340px]">
            <h2 className="text-2xl font-league-gothic text-text-light mb-6">แก้ไขข้อมูล</h2>
            
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-text-light mb-1.5 text-sm">ชื่อ</label>
                <input
                  type="text"
                  className="input w-full h-11"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-text-light mb-1.5 text-sm">อายุ</label>
                <input
                  type="number"
                  className="input w-full h-11"
                  value={editAge}
                  onChange={(e) => setEditAge(e.target.value)}
                  required
                  min="1"
                  max="100"
                />
              </div>

              <div>
                <label className="block text-text-light mb-1.5 text-sm">อัตราค่าจ้าง</label>
                <input
                  type="number"
                  className="input w-full h-11"
                  value={editRate}
                  onChange={(e) => setEditRate(e.target.value)}
                  required
                  min="0"
                />
              </div>

              {error && (
                <div className="text-red-500 text-sm text-center bg-red-100/10 p-2 rounded">
                  {error}
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="btn-secondary flex-1 h-11"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="btn flex-1 h-11"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="inline-block animate-spin">
                      <i className="fas fa-circle-notch text-text-light"></i>
                    </span>
                  ) : (
                    'บันทึก'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
} 