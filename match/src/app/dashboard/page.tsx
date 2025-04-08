"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { sendTelegramMessage } from '@/utils/telegram';

interface Profile {
  name: string;
  age: number;
  rate: number;
  email: string;
  is_admin: boolean;
}

interface CheckIn {
  check_date: string;
  shift: string;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  hasCheckIn: boolean;
  shift: string | undefined;
}

interface WithdrawalHistory {
  amount: number;
  withdrawal_date: string;
}

const SHIFTS = {
  morning: { label: 'เช้า (8:30 - 17:30)', value: 'morning', hours: 8 },
  evening: { label: 'เย็น (12:30 - 21:30)', value: 'evening', hours: 8 },
  overtime: { label: 'OT (8:30 - 21:30)', value: 'overtime', hours: 13 }
};

export default function Dashboard() {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editName, setEditName] = useState('');
  const [editAge, setEditAge] = useState('');
  const [editRate, setEditRate] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [checkInList, setCheckInList] = useState<CheckIn[]>([]);
  const [dayTime, setDayTime] = useState(0);
  const [overTime, setOverTime] = useState(0);
  const [salary, setSalary] = useState(0);
  const [totalWithdrawn, setTotalWithdrawn] = useState(0);
  const [withdrawalHistory, setWithdrawalHistory] = useState<WithdrawalHistory[]>([]);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          router.push('/');
          return;
        }

        // ตรวจสอบว่า token ยังใช้งานได้
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          console.error('User error:', userError);
          await supabase.auth.signOut();
          router.push('/');
          return;
        }

        // ถ้าผ่านการตรวจสอบแล้ว ดึงข้อมูล profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('name, age, rate, email, is_admin')
          .eq('id', user.id)
          .single();

        if (profileError || !profile) {
          console.error('Profile error:', profileError);
          router.push('/profile');
          return;
        }

        setProfile(profile);
        setEditName(profile.name || '');
        setEditAge(profile.age?.toString() || '');
        setEditRate(profile.rate?.toString() || '');
        setEditEmail(profile.email || '');

        // ดึงข้อมูล check ins และคำนวณ salary และ day time
        const { data: checkIns, error: checkInsError } = await supabase
          .from('check_ins')
          .select('check_date, shift')
          .eq('user_id', user.id)
          .order('check_date', { ascending: true });

        if (checkInsError) {
          console.error('Check-ins error:', checkInsError);
          return;
        }

        if (checkIns) {
          setCheckInList(checkIns);
          setDayTime(checkIns.length);
          const otDays = checkIns.filter(checkIn => checkIn.shift === 'overtime');
          const otHours = otDays.length * 4;
          setOverTime(otHours);
          const normalSalary = checkIns.length * profile.rate;
          const otSalary = otHours * 60;
          const totalSalary = normalSalary + otSalary;
          setSalary(totalSalary);
        }

        // ดึงข้อมูล withdrawals
        const { data: withdrawals, error: withdrawalsError } = await supabase
          .from('withdrawals')
          .select('amount')
          .eq('user_id', user.id);

        if (withdrawalsError) {
          console.error('Withdrawals error:', withdrawalsError);
          return;
        }

        if (withdrawals) {
          const total = withdrawals.reduce((sum, w) => sum + w.amount, 0);
          setTotalWithdrawn(total);
        }

        // ดึงข้อมูลประวัติการเบิกเงิน
        const { data: withdrawalHistory, error: historyError } = await supabase
          .from('withdrawals')
          .select('amount, withdrawal_date')
          .eq('user_id', user.id)
          .order('withdrawal_date', { ascending: false });

        if (historyError) {
          console.error('History error:', historyError);
          return;
        }

        if (withdrawalHistory) {
          setWithdrawalHistory(withdrawalHistory);
        }
      } catch (error) {
        console.error('Unexpected error:', error);
        router.push('/');
      }
    };

    checkAuth();
  }, [router]);

  // ... rest of the component code ...
} 