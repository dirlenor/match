"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface Profile {
  name: string;
  rate: number;
}

export default function Dashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [dayTime] = useState(10);
  const [overTime] = useState(4);
  const [salary] = useState(5000);

  useEffect(() => {
    const getProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('name, rate')
        .eq('id', user.id)
        .single();

      if (!profile) {
        router.push('/profile');
        return;
      }

      setProfile(profile);
    };

    getProfile();
  }, [router]);

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
        <div className="flex items-baseline gap-2">
          <h2 className="text-6xl font-league-gothic text-text-light tracking-wide">{profile.name.toUpperCase()}</h2>
          <span className="text-6xl font-league-gothic text-accent">{profile.rate}</span>
        </div>
        <div className="mt-4 h-px bg-text-light/10" />
      </div>

      {/* Salary Section */}
      <div className="mb-12">
        <p className="text-text-light/60 text-sm mb-1">Salary</p>
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
    </main>
  );
} 