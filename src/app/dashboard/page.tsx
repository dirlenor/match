"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface Profile {
  name: string;
  age: number;
  rate: number;
}

interface CheckIn {
  check_date: string;
  shift: string;
}

const SHIFTS = {
  morning: { label: 'เช้า (8:30 - 17:30)', value: 'morning', hours: 8 },
  evening: { label: 'เย็น (12:30 - 21:30)', value: 'evening', hours: 8 },
  overtime: { label: 'OT (8:30 - 21:30)', value: 'overtime', hours: 13 }
};

export default function Dashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [dayTime, setDayTime] = useState(0);
  const [overTime, setOverTime] = useState(0);
  const [salary, setSalary] = useState(0);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showDayTimeModal, setShowDayTimeModal] = useState(false);
  const [showOTModal, setShowOTModal] = useState(false);
  const [checkInList, setCheckInList] = useState<CheckIn[]>([]);
  const [editName, setEditName] = useState('');
  const [editAge, setEditAge] = useState('');
  const [editRate, setEditRate] = useState('');
  const [checkDate, setCheckDate] = useState('');
  const [selectedShift, setSelectedShift] = useState('');
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

      // ดึงข้อมูล check ins และคำนวณ salary และ day time
      const { data: checkIns } = await supabase
        .from('check_ins')
        .select('check_date, shift')
        .eq('user_id', user.id)
        .order('check_date', { ascending: true });

      if (checkIns) {
        setCheckInList(checkIns);
        
        // นับจำนวนวันทั้งหมดที่เข้างาน
        setDayTime(checkIns.length);
        
        // คำนวณชั่วโมง OT (4 ชั่วโมงต่อวัน)
        const otDays = checkIns.filter(checkIn => checkIn.shift === 'overtime');
        const otHours = otDays.length * 4; // 4 ชั่วโมง OT ต่อวัน
        setOverTime(otHours);
        
        // คำนวณ salary
        // - เงินเดือนปกติ: จำนวนวันทั้งหมด × rate
        // - OT: จำนวนชั่วโมง OT × 60 บาท
        const normalSalary = checkIns.length * profile.rate;
        const otSalary = otHours * 60;
        const totalSalary = normalSalary + otSalary;
        
        setSalary(totalSalary);
      }
    };

    getProfile();
  }, [router]);

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('กรุณาเข้าสู่ระบบ');
        return;
      }

      // ตรวจสอบว่าเคย check in วันที่เลือกไว้แล้วหรือไม่
      const { data: existingCheckIn } = await supabase
        .from('check_ins')
        .select('id')
        .eq('user_id', user.id)
        .eq('check_date', checkDate)
        .single();

      if (existingCheckIn) {
        setError('คุณได้ลงเวลาของวันที่เลือกไปแล้ว');
        return;
      }

      const { error: insertError } = await supabase
        .from('check_ins')
        .insert({
          user_id: user.id,
          check_date: checkDate,
          shift: selectedShift
        });

      if (insertError) {
        setError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
        return;
      }

      // อัพเดท salary และ day time
      if (profile) {
        const { data: checkIns } = await supabase
          .from('check_ins')
          .select('check_date, shift')
          .eq('user_id', user.id)
          .order('check_date', { ascending: true });

        if (checkIns) {
          setCheckInList(checkIns);
          
          // นับจำนวนวันทั้งหมดที่เข้างาน
          setDayTime(checkIns.length);
          
          // คำนวณชั่วโมง OT (4 ชั่วโมงต่อวัน)
          const otDays = checkIns.filter(checkIn => checkIn.shift === 'overtime');
          const otHours = otDays.length * 4; // 4 ชั่วโมง OT ต่อวัน
          setOverTime(otHours);
          
          // คำนวณ salary
          // - เงินเดือนปกติ: จำนวนวันทั้งหมด × rate
          // - OT: จำนวนชั่วโมง OT × 60 บาท
          const normalSalary = checkIns.length * profile.rate;
          const otSalary = otHours * 60;
          const totalSalary = normalSalary + otSalary;
          
          setSalary(totalSalary);
        }
      }
      
      setShowCheckInModal(false);
      setCheckDate('');
      setSelectedShift('');
    } catch {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

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
    <main className="min-h-screen bg-bg-dark px-layout-x py-layout-y">
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
        <button 
          onClick={() => setShowDayTimeModal(true)}
          className="w-full text-left"
        >
          <p className="text-6xl font-league-gothic text-text-light tracking-wide hover:text-accent transition-colors">
            {dayTime}
          </p>
        </button>
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
        <button 
          onClick={() => setShowOTModal(true)}
          className="w-full text-left"
        >
          <p className="text-6xl font-league-gothic text-text-light tracking-wide hover:text-accent transition-colors">
            {overTime}
          </p>
        </button>
        <div className="mt-4 h-px bg-text-light/10" />
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <button 
          className="btn h-14 text-lg font-medium"
          onClick={() => setShowCheckInModal(true)}
        >
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

      {/* Check In Modal */}
      {showCheckInModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-bg-dark rounded-lg p-6 w-full max-w-[340px]">
            <h2 className="text-2xl font-league-gothic text-text-light mb-6">ลงเวลาทำงาน</h2>
            
            <form onSubmit={handleCheckIn} className="space-y-4">
              <div>
                <label className="block text-text-light mb-1.5 text-sm">วันที่</label>
                <input
                  type="date"
                  className="input w-full h-11"
                  value={checkDate}
                  onChange={(e) => setCheckDate(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-text-light mb-1.5 text-sm">กะ</label>
                <select
                  className="input w-full h-11"
                  value={selectedShift}
                  onChange={(e) => setSelectedShift(e.target.value)}
                  required
                >
                  <option value="">เลือกกะ</option>
                  {Object.entries(SHIFTS).map(([key, { label, value }]) => (
                    <option key={key} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              {error && (
                <div className="text-red-500 text-sm text-center bg-red-100/10 p-2 rounded">
                  {error}
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCheckInModal(false);
                    setCheckDate('');
                    setSelectedShift('');
                    setError('');
                  }}
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

      {/* Day Time List Modal */}
      {showDayTimeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-bg-dark rounded-lg p-6 w-full max-w-[340px]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-league-gothic text-text-light">รายการลงเวลา</h2>
              <button 
                onClick={() => setShowDayTimeModal(false)}
                className="text-text-light/60 hover:text-accent"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              {checkInList.map((checkIn, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-3 rounded bg-white/5"
                >
                  <div>
                    <p className="text-text-light">
                      {new Date(checkIn.check_date).toLocaleDateString('th-TH', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                    <p className="text-text-light/60 text-sm">
                      {SHIFTS[checkIn.shift as keyof typeof SHIFTS].label}
                    </p>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-accent" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* OT List Modal */}
      {showOTModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-bg-dark rounded-lg p-6 w-full max-w-[340px]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-league-gothic text-text-light">รายการ OT</h2>
              <button 
                onClick={() => setShowOTModal(false)}
                className="text-text-light/60 hover:text-accent"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              {checkInList
                .filter(checkIn => checkIn.shift === 'overtime')
                .map((checkIn, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-3 rounded bg-white/5"
                  >
                    <div>
                      <p className="text-text-light">
                        {new Date(checkIn.check_date).toLocaleDateString('th-TH', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                      <p className="text-text-light/60 text-sm">
                        {SHIFTS[checkIn.shift as keyof typeof SHIFTS].label}
                      </p>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-accent" />
                  </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
} 