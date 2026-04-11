import React, { useState } from 'react';
import { supabase } from './lib/supabase';
import logo from './assets/logo.png';
import { Lock, Mail, Loader2, AlertCircle } from 'lucide-react';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Development bypass (if no supabase configured)
    if (email === 'admin@refodile.co.za' && password === 'admin123') {
      onLogin({ email, role: 'Admin', full_name: 'Dr. Tebeila' });
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      // Fetch profile role if needed here
      onLogin(data.user);
    } catch (err) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
          <div className="p-8 pt-12 text-center">
            <img src={logo} alt="Logo" className="h-20 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-medical-dark tracking-tight">Staff Login</h2>
            <p className="text-medical-grey text-sm mt-2">Refodile Patient Management System</p>
          </div>

          <form onSubmit={handleLogin} className="p-8 pt-0 space-y-5">
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-sm">
                <AlertCircle size={18} />
                {error}
              </div>
            )}

            <div className="space-y-1">
              <label className="label">Work Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 text-gray-400" size={18} />
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-10" 
                  placeholder="name@refodile.co.za"
                  required 
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 text-gray-400" size={18} />
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-10" 
                  placeholder="••••••••"
                  required 
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="btn-primary w-full py-4 text-lg font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all mt-4"
            >
              {loading ? <Loader2 className="animate-spin" /> : 'Log In'}
            </button>
            
            <div className="mt-8 text-center text-xs text-medical-grey border-t pt-6">
              <p>© 2026 Refodile Health Centre (Dr Tebeila Dental Studio)</p>
              <p className="mt-1">Authorised Personnel Only</p>
            </div>
          </form>
        </div>
        
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">Secure Medical Grade System</p>
        </div>
      </div>
    </div>
  );
}
