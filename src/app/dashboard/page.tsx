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
  const [editEmail, setEditEmail] = useState('');
  const [checkDate, setCheckDate] = useState('');
  const [selectedShift, setSelectedShift] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [totalWithdrawn, setTotalWithdrawn] = useState(0);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showWithdrawalHistoryModal, setShowWithdrawalHistoryModal] = useState(false);
  const [withdrawalHistory, setWithdrawalHistory] = useState<Array<{
    amount: number;
    withdrawal_date: string;
  }>>([]);

  useEffect(() => {
    const getProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('name, age, rate, email, is_admin')
        .eq('id', user.id)
        .single();

      if (!profile) {
        router.push('/profile');
        return;
      }

      setProfile(profile);
      setEditName(profile.name || '');
      setEditAge(profile.age?.toString() || '');
      setEditRate(profile.rate?.toString() || '');
      setEditEmail(profile.email || '');

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

      // ดึงข้อมูล withdrawals
      const { data: withdrawals } = await supabase
        .from('withdrawals')
        .select('amount')
        .eq('user_id', user.id);

      if (withdrawals) {
        const total = withdrawals.reduce((sum, w) => sum + w.amount, 0);
        setTotalWithdrawn(total);
      }

      // ดึงข้อมูลประวัติการเบิกเงิน
      const { data: withdrawalHistory } = await supabase
        .from('withdrawals')
        .select('amount, withdrawal_date')
        .eq('user_id', user.id)
        .order('withdrawal_date', { ascending: false });

      if (withdrawalHistory) {
        setWithdrawalHistory(withdrawalHistory);
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

      // อ่งการแจ้งเตือนไปยัง Telegram
      const shiftLabel = SHIFTS[selectedShift as keyof typeof SHIFTS]?.label || selectedShift;
      await sendTelegramMessage(`🏢 มีการเช็คอินเข้างาน
👤 ชื่อ: ${profile?.name || 'ไม่ระบุชื่อ'}
📅 วันที่: ${new Date(checkDate).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })}
⏰ กะ: ${shiftLabel}
💰 เรทค่าจ้าง: ${profile?.rate || 0} บาท/วัน`);

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

      // แสดงข้อความแจ้งเตือนเมื่อสำเร็จ
      setSuccessMessage(`เช็คอินสำเร็จ กะ${shiftLabel}`);
      setShowSuccessModal(true);
      
      // ซ่อนข้อความแจ้งเตือนหลังจาก 3 วินาที
      setTimeout(() => {
        setShowSuccessModal(false);
      }, 3000);

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

      if (!user.email) {
        setError('ไม่พบข้อมูลอีเมล');
        return;
      }

      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          name: editName,
          age: parseInt(editAge),
          rate: parseInt(editRate),
          email: user.email,
          updated_at: new Date().toISOString(),
        });

      if (upsertError) {
        setError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
        return;
      }

      setProfile({
        name: editName,
        age: parseInt(editAge),
        rate: parseInt(editRate),
        email: user.email,
        is_admin: profile?.is_admin || false
      });
      
      setShowEditModal(false);
    } catch {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const amount = parseInt(withdrawAmount);
      if (isNaN(amount) || amount <= 0) {
        setError('กรุณาระบุจำนวนเงินที่ถูกต้อง');
        return;
      }

      if (amount > salary - totalWithdrawn) {
        setError('จำนวนเงินที่เบิกต้องไม่เกินยอดคงเหลือ');
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('กรุณาเข้าสู่ระบบ');
        return;
      }

      const withdrawalDate = new Date().toISOString();
      const { error: insertError } = await supabase
        .from('withdrawals')
        .insert({
          user_id: user.id,
          amount: amount,
          withdrawal_date: withdrawalDate
        });

      if (insertError) {
        setError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
        return;
      }

      // อ่งการแจ้งเตือนไปยัง Telegram
      await sendTelegramMessage(`💰 มีการเบิกเงิน
👤 ชื่อ: ${profile?.name || 'ไม่ระบุชื่อ'}
💰 จำนวนเงิน: ${amount.toLocaleString()} บาท
📅 วันที่: ${new Date(withdrawalDate).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })}
💵 ยอดคงเหลือ: ${(salary - totalWithdrawn - amount).toLocaleString()} บาท`);

      // อัพเดทยอดเงินที่เบิกไปแล้ว
      setTotalWithdrawn(prev => prev + amount);
      
      // อัพเดทประวัติการเบิกเงินทันที
      setWithdrawalHistory(prev => [{
        amount: amount,
        withdrawal_date: withdrawalDate
      }, ...prev]);
      
      setShowPaymentModal(false);
      setWithdrawAmount('');
      
      // แสดงข้อความแจ้งเตือนเมื่อสำเร็จ
      setSuccessMessage(`เบิกเงินสำเร็จ ${amount.toLocaleString()} บาท`);
      setShowSuccessModal(true);
      
      // ซ่อนข้อความแจ้งเตือนหลังจาก 3 วินาที
      setTimeout(() => {
        setShowSuccessModal(false);
      }, 3000);

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
          <div className="flex flex-col">
            <div className="flex items-baseline gap-2">
              <h2 className="text-6xl font-league-gothic text-text-light tracking-wide">{profile.name.toUpperCase()}</h2>
              <span className="text-6xl font-league-gothic text-accent">{profile.age}</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-sm text-text-light/60">{profile.email}</p>
              {profile.is_admin && (
                <span className="px-2 py-0.5 bg-accent/20 rounded text-accent text-xs">
                  Admin
                </span>
              )}
            </div>
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
        <button 
          onClick={() => setShowWithdrawalHistoryModal(true)}
          className="w-full text-left group"
        >
          <p className="text-6xl font-league-gothic text-text-light tracking-wide group-hover:text-accent transition-colors">
            {(salary - totalWithdrawn).toLocaleString()}
          </p>
          <p className="text-sm text-text-light/40 mt-1">
            เบิกไปแล้ว: {totalWithdrawn.toLocaleString()}
          </p>
        </button>
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
      <div className="grid grid-cols-2 gap-4 mb-8">
        <button 
          className="btn h-14 text-lg font-medium relative"
          onClick={() => {
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            const formattedDate = `${year}-${month}-${day}`;
            
            setCheckDate(formattedDate);
            setShowCheckInModal(true);
          }}
        >
          <div className="flex flex-col items-center">
            <span>Check in</span>
            <span className="text-xs text-text-light/60 -mt-1">
              {new Date().toLocaleDateString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: '2-digit'
              })}
            </span>
          </div>
        </button>
        <button 
          className="btn h-14 text-lg font-medium"
          onClick={() => setShowPaymentModal(true)}
        >
          Payment
        </button>
      </div>

      {/* Admin Section */}
      {profile.is_admin && (
        <div className="mb-8">
          <div className="h-px bg-text-light/10 mb-4" />
          <h3 className="text-text-light/60 text-sm mb-4">Admin Tools</h3>
          <button 
            className="btn w-full h-14 text-lg font-medium bg-accent/20 hover:bg-accent"
            onClick={() => router.push('/admin/summary')}
          >
            <div className="flex items-center justify-center gap-2">
              <i className="fas fa-chart-bar"></i>
              <span>System Summary</span>
            </div>
          </button>
        </div>
      )}

      {/* Logout */}
      <div className="text-center">
        <button 
          onClick={handleLogout}
          className="text-xs text-text-light/40 hover:text-accent transition-colors"
        >
          Logout
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

              <div>
                <label className="block text-text-light mb-1.5 text-sm">อีเมล</label>
                <input
                  type="email"
                  className="input w-full h-11 bg-text-light/5"
                  value={editEmail}
                  disabled
                  readOnly
                />
                <p className="text-text-light/40 text-xs mt-1">อีเมลไม่สามารถแก้ไขได้</p>
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
              <h2 className="text-2xl font-league-gothic text-text-light">ปฏิทินลงเวลา</h2>
              <button 
                onClick={() => setShowDayTimeModal(false)}
                className="text-text-light/60 hover:text-accent"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="space-y-6">
              {/* ส่วนหัวปฏิทิน */}
              <div className="grid grid-cols-7 gap-1 text-center text-text-light/60 text-sm">
                <div>อา</div>
                <div>จ</div>
                <div>อ</div>
                <div>พ</div>
                <div>พฤ</div>
                <div>ศ</div>
                <div>ส</div>
              </div>

              {/* สร้างปฏิทินจากข้อมูล check-in */}
              {(() => {
                // สร้าง Map ของวันที่มีการ check-in
                const checkInMap = new Map(
                  checkInList.map(checkIn => [
                    checkIn.check_date,
                    checkIn.shift
                  ])
                );

                // หาวันแรกและวันสุดท้ายของเดือนปัจจุบัน
                const today = new Date();
                const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
                const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

                // หาวันแรกที่จะแสดงในปฏิทิน (อาจจะเป็นวันในเดือนก่อน)
                const firstCalendarDay = new Date(firstDay);
                firstCalendarDay.setDate(firstCalendarDay.getDate() - firstCalendarDay.getDay());

                // สร้างอาเรย์ของสัปดาห์
                const weeks: CalendarDay[][] = [];
                let currentWeek: CalendarDay[] = [];
                let currentDate = new Date(firstCalendarDay);

                while (currentDate <= lastDay || currentDate.getDay() !== 0) {
                  if (currentDate.getDay() === 0 && currentWeek.length > 0) {
                    weeks.push(currentWeek);
                    currentWeek = [];
                  }

                  // แปลงวันที่เป็น YYYY-MM-DD โดยไม่ใช้ toISOString
                  const year = currentDate.getFullYear();
                  const month = String(currentDate.getMonth() + 1).padStart(2, '0');
                  const day = String(currentDate.getDate()).padStart(2, '0');
                  const dateString = `${year}-${month}-${day}`;
                  
                  const shift = checkInMap.get(dateString);
                  
                  // แสดงข้อมูลเพื่อ debug
                  console.log('Date:', dateString, 'Has Check-in:', Boolean(shift), 'Shift:', shift);
                  
                  currentWeek.push({
                    date: new Date(currentDate),
                    isCurrentMonth: currentDate.getMonth() === today.getMonth(),
                    hasCheckIn: Boolean(shift),
                    shift: shift
                  });

                  currentDate = new Date(currentDate);
                  currentDate.setDate(currentDate.getDate() + 1);
                }

                if (currentWeek.length > 0) {
                  weeks.push(currentWeek);
                }

                return (
                  <div className="grid gap-1">
                    {weeks.map((week, weekIndex) => (
                      <div key={weekIndex} className="grid grid-cols-7 gap-1">
                        {week.map((day, dayIndex) => (
                          <div
                            key={dayIndex}
                            className={`
                              aspect-square flex flex-col items-center justify-center rounded
                              ${day.isCurrentMonth ? 'text-text-light' : 'text-text-light/20'}
                              ${day.hasCheckIn ? 'bg-white/5' : ''}
                            `}
                          >
                            <span className="text-sm">{day.date.getDate()}</span>
                            {day.hasCheckIn && day.shift && (
                              <div 
                                className={`
                                  w-1.5 h-1.5 rounded-full mt-0.5
                                  ${day.shift === 'morning' ? 'bg-yellow-500' : 
                                    day.shift === 'evening' ? 'bg-blue-500' : 
                                    'bg-accent'}
                                `}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* คำอธิบายสัญลักษณ์ */}
              <div className="flex items-center justify-center gap-4 text-sm text-text-light/60">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                  <span>เช้า</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  <span>เย็น</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                  <span>OT</span>
                </div>
              </div>
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

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-bg-dark rounded-lg p-6 w-full max-w-[340px]">
            <h2 className="text-2xl font-league-gothic text-text-light mb-6">เบิกเงิน</h2>
            
            <form onSubmit={handleWithdraw} className="space-y-4">
              <div>
                <label className="block text-text-light mb-1.5 text-sm">จำนวนเงิน</label>
                <input
                  type="number"
                  className="input w-full h-11"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="ระบุจำนวนเงิน"
                  required
                  min="1"
                  max={salary - totalWithdrawn}
                />
              </div>

              <div className="text-sm text-text-light/60">
                <p>ยอดเงินคงเหลือ: {(salary - totalWithdrawn).toLocaleString()}</p>
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
                    setShowPaymentModal(false);
                    setWithdrawAmount('');
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
                    'เบิกเงิน'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-green-500/90 text-white px-4 py-2 rounded-lg shadow-lg">
          {successMessage}
        </div>
      )}

      {/* Withdrawal History Modal */}
      {showWithdrawalHistoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-bg-dark rounded-lg p-6 w-full max-w-[340px]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-league-gothic text-text-light">ประวัติการเบิกเงิน</h2>
              <button 
                onClick={() => setShowWithdrawalHistoryModal(false)}
                className="text-text-light/60 hover:text-accent"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              {withdrawalHistory.map((withdrawal, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-3 rounded bg-white/5"
                >
                  <div>
                    <p className="text-text-light">
                      {new Date(withdrawal.withdrawal_date).toLocaleDateString('th-TH', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                    <p className="text-accent text-sm">
                      {withdrawal.amount.toLocaleString()} บาท
                    </p>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-accent" />
                </div>
              ))}

              {withdrawalHistory.length === 0 && (
                <p className="text-text-light/60 text-center py-4">
                  ไม่มีประวัติการเบิกเงิน
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
} 