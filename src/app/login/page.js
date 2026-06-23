'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, User, AlertCircle, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // If user is already logged in, redirect to home
    const saved = localStorage.getItem('currentSimulatedUser');
    if (saved) {
      router.push('/');
    }
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        localStorage.setItem('currentSimulatedUser', JSON.stringify(result.user));
        // Dispatch event so other components know (like Navbar)
        window.dispatchEvent(new Event('currentSimulatedUserChanged'));
        router.push('/');
      } else {
        setError(result.error || 'ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900 py-12 px-4 sm:px-6 lg:px-8 min-h-screen">
      <div className="max-w-md w-full space-y-8 bg-white/10 dark:bg-black/20 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl relative overflow-hidden">
        
        {/* Decorative Gradients */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-indigo-500/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-purple-500/30 rounded-full blur-3xl" />
        
        <div className="text-center relative">
          <div className="mx-auto h-16 w-16 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 text-3xl">
            🐜
          </div>
          <h2 className="mt-6 text-2xl font-black text-white tracking-tight">
            ระบบรายงานตรวจนับจำนวนแมลง
          </h2>
          <p className="mt-2 text-xs font-bold text-slate-300">
            บริษัท พี.เอส.ฟู้ด โปรดักส์ จำกัด
          </p>
        </div>

        <form className="mt-8 space-y-6 relative" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-200 px-4 py-3 rounded-2xl flex items-center gap-2.5 text-xs font-semibold animate-pulse">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-extrabold text-slate-200 mb-1.5">
                ชื่อผู้ใช้งาน
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3 border border-white/10 bg-white/5 rounded-2xl text-white placeholder-slate-450 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition-all"
                  placeholder="เช่น emp001 หรือ admin"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-200 mb-1.5">
                รหัสผ่าน
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3 border border-white/10 bg-white/5 rounded-2xl text-white placeholder-slate-450 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition-all"
                  placeholder="กรอกรหัสผ่านของคุณ"
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-black rounded-2xl text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all shadow-lg shadow-indigo-500/20 active:scale-[0.98]"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'เข้าสู่ระบบ'
              )}
            </button>
          </div>
        </form>

        <div className="text-center mt-6 text-[10px] text-slate-450 font-medium">
          ระบบสารสนเทศความปลอดภัยอาหารภายในโรงงานตามมาตรฐาน GMP/HACCP
        </div>
      </div>
    </div>
  );
}
