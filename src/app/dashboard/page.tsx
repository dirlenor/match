"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, signOut } from '@/lib/auth';

export default function Dashboard() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = await isAuthenticated();
      if (!authenticated) {
        router.push('/');
      }
    };
    checkAuth();
  }, [router]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-4 pt-16">
      <div className="text-center mb-16">
        <h1 className="text-[120px] sm:text-[167px] font-league-gothic text-text-light leading-none tracking-wide">MATCH</h1>
        <h2 className="text-[120px] sm:text-[167px] font-league-gothic text-text-light leading-none tracking-wide">TIME</h2>
      </div>

      <div className="w-full max-w-[340px]">
        <div className="text-center mb-8">
          <p className="text-text-light text-lg">Welcome to Dashboard</p>
        </div>

        <button 
          onClick={handleSignOut}
          className="btn w-full h-11"
        >
          Sign Out
        </button>
      </div>
    </main>
  );
} 