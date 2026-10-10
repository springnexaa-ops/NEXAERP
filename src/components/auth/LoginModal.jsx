import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Sparkles,
  Building2,
  Pill,
  ShoppingBag,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Globe,
  FlaskConical,
  Anchor
} from 'lucide-react';

export function LoginModal({ isOpen, onClose }) {
  const { login, showToast } = useApp();
  const [email, setEmail] = useState('admin@springnexa.com');
  const [password, setPassword] = useState('AdminPassword@123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      onClose();
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const setDemoCredentials = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 px-6 py-6 border-b border-slate-800 text-center relative">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 via-indigo-600 to-violet-600 mx-auto flex items-center justify-center shadow-lg shadow-indigo-500/25 text-white font-black text-xl mb-3">
            N
          </div>
          <h2 className="text-xl font-black text-white tracking-tight">Nexa ERP Security Portal</h2>
          <p className="text-xs text-slate-400 mt-1">SpringNexa Private Limited • Enterprise Identity</p>
          <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            BCrypt + JWT + Lockout Armed
          </span>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="text-slate-300 block mb-1 font-semibold">User Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@store.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-300 block mb-1 font-semibold">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full pl-10 pr-10 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-500 via-indigo-600 to-violet-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/25 flex items-center justify-center space-x-2 transition-all active:scale-98 disabled:opacity-50"
          >
            <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
            <span>{loading ? 'Authenticating...' : 'Sign In to Workspace'}</span>
          </button>

          {/* Quick Demo Credentials Bar */}
          <div className="pt-3 border-t border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" /> 1-Click Role Logins (Demo)
            </span>

            <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
              <button
                type="button"
                onClick={() => setDemoCredentials('admin@springnexa.com', 'AdminPassword@123')}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/50 text-left transition-all group"
              >
                <div className="font-bold text-white text-[11px] group-hover:text-indigo-300 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" /> Super Admin
                </div>
                <div className="text-[10px] text-slate-500">SpringNexa Platform</div>
              </button>

              <button
                type="button"
                onClick={() => setDemoCredentials('vikram@transglobalexim.com', 'EximOwner@123')}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-teal-500/50 text-left transition-all group"
              >
                <div className="font-bold text-white text-[11px] group-hover:text-teal-300 flex items-center gap-1">
                  <Globe className="w-3 h-3 text-teal-400" /> ImpoExpo Owner
                </div>
                <div className="text-[10px] text-slate-500">TransGlobal Cargo</div>
              </button>

              <button
                type="button"
                onClick={() => setDemoCredentials('cha@transglobalexim.com', 'ChaBroker@123')}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-sky-500/50 text-left transition-all group"
              >
                <div className="font-bold text-white text-[11px] group-hover:text-sky-300 flex items-center gap-1">
                  <Anchor className="w-3 h-3 text-sky-400" /> CHA Broker
                </div>
                <div className="text-[10px] text-slate-500">TransGlobal Customs</div>
              </button>

              <button
                type="button"
                onClick={() => setDemoCredentials('sanjay@sanjeevanimeds.in', 'PharmaOwner@123')}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-rose-500/50 text-left transition-all group"
              >
                <div className="font-bold text-white text-[11px] group-hover:text-rose-300 flex items-center gap-1">
                  <Pill className="w-3 h-3 text-rose-400" /> Pharma Owner
                </div>
                <div className="text-[10px] text-slate-500">Sanjeevani Meds</div>
              </button>

              <button
                type="button"
                onClick={() => setDemoCredentials('director@apexdiagnostics.com', 'LabOwner@123')}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 text-left transition-all group"
              >
                <div className="font-bold text-white text-[11px] group-hover:text-cyan-300 flex items-center gap-1">
                  <FlaskConical className="w-3 h-3 text-cyan-400" /> LMIS Director
                </div>
                <div className="text-[10px] text-slate-500">Apex Pathology</div>
              </button>

              <button
                type="button"
                onClick={() => setDemoCredentials('rajesh@laxmikirana.in', 'KiranaOwner@123')}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/50 text-left transition-all group"
              >
                <div className="font-bold text-white text-[11px] group-hover:text-emerald-300 flex items-center gap-1">
                  <ShoppingBag className="w-3 h-3 text-emerald-400" /> Kiryana Owner
                </div>
                <div className="text-[10px] text-slate-500">Laxmi Kirana</div>
              </button>

              <button
                type="button"
                onClick={() => setDemoCredentials('rohan@sanjeevanimeds.in', 'Cashier@123')}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-sky-500/50 text-left transition-all group"
              >
                <div className="font-bold text-white text-[11px] group-hover:text-sky-300 flex items-center gap-1">
                  <CreditCard className="w-3 h-3 text-sky-400" /> Counter Cashier
                </div>
                <div className="text-[10px] text-slate-500">Fast POS Shift</div>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
