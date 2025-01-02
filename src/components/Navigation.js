import { useAuth } from '../auth/AuthContext';
import { checkSpecialAccess } from '../auth/authUtils';
import Link from 'next/link';

export default function Navigation() {
  const { user } = useAuth();
  
  console.log('Current user:', user);
  console.log('Is special access:', user?.email ? checkSpecialAccess(user.email) : false);
  
  return (
    <nav className="bg-bg-dark p-4">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard" className="nav-link">
            หน้าหลัก
          </Link>
          {user && checkSpecialAccess(user.email) && (
            <>
              <span className="special-badge bg-green-500 text-white px-2 py-1 rounded text-sm">
                🌟 ผู้ใช้พิเศษ ({user.email})
              </span>
              <Link href="/summary" className="nav-link">
                สรุปข้อมูล
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
} 