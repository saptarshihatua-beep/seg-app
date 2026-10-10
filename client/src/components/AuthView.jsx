import React, { useState } from 'react';
import { Shield, Lock, User, Mail, Key, ArrowRight, CheckCircle2, Sparkles, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthView({ onOpenDeliverables }) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('sender');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(name, email, password, role);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const fillQuickDemo = (demoEmail, demoPass) => {
    setIsLogin(true);
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
  };

  return (
    <div className="min-h-[calc(100vh-70px)] flex flex-col justify-center items-center px-4 py-8 relative">
      
      {/* Background Cyber Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-12 gap-8 items-center z-10">
        
        {/* Left Hero Column */}
        <div className="md:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 text-xs font-mono">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Academic Cybersecurity Reference: Project 4a</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
            Secure Enhanced <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
              Geolocking (SEG)
            </span>
          </h1>

          <p className="text-slate-400 text-sm md:text-base leading-relaxed">
            A state-of-the-art implementation of GeoEncryption. Encrypt sensitive documents with client-side AES-256 and restrict cryptographic decryption to verified physical boundaries.
          </p>

          {/* Core Feature Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-2.5">
              <Lock className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
              <div>
                <b className="text-white">AES-256-CBC</b>
                <p className="text-slate-400 mt-0.5">CryptoJS JsonFormatter with PBKDF2 salt & IV</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
              <div>
                <b className="text-white">Ray-Casting PIP</b>
                <p className="text-slate-400 mt-0.5">Server-side mathematical geofence containment</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-2.5">
              <Shield className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
              <div>
                <b className="text-white">KML Export</b>
                <p className="text-slate-400 mt-0.5">Standard Keyhole Markup Language generation</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
              <div>
                <b className="text-white">Single-Use Tokens</b>
                <p className="text-slate-400 mt-0.5">SHA-256 hashed time-bounded access links</p>
              </div>
            </div>
          </div>

          {/* Quick Demo Credentials */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-2 font-mono">
            <span className="text-slate-400 font-bold block">Quick Demo Logins (Click to autofill):</span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => fillQuickDemo('alice.sender@uccs.edu', 'Sender123!')}
                className="px-2.5 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800/60 transition"
              >
                Alice Vance (Sender)
              </button>
              <button
                type="button"
                onClick={() => fillQuickDemo('bob.receiver@uccs.edu', 'Receiver123!')}
                className="px-2.5 py-1.5 rounded-lg bg-blue-950 hover:bg-blue-900 text-blue-300 border border-blue-800/60 transition"
              >
                Bob Miller (Receiver)
              </button>
              <button
                type="button"
                onClick={() => fillQuickDemo('edward@chow-s.com', 'Edward123!')}
                className="px-2.5 py-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/60 transition"
              >
                Dr. Edward Chow (PDF Example)
              </button>
            </div>
          </div>
        </div>

        {/* Right Form Card */}
        <div className="md:col-span-5 bg-slate-900/90 backdrop-blur-md p-6 md:p-8 rounded-3xl border border-cyan-900/50 shadow-2xl space-y-5">
          
          <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs font-mono">
            <button
              type="button"
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 rounded-lg font-bold transition ${isLogin ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'}`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 rounded-lg font-bold transition ${!isLogin ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'}`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-xs font-mono text-cyan-400 mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alice Vance"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-white text-xs font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-mono text-cyan-400 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alice.sender@uccs.edu"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-white text-xs font-mono focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-cyan-400 mb-1">Password</label>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-white text-xs font-mono focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            {!isLogin && (
              <div>
                <label className="block text-xs font-mono text-cyan-400 mb-1">Role Type</label>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <label className={`p-2.5 rounded-xl border cursor-pointer text-center transition ${role === 'sender' ? 'bg-cyan-950/60 border-cyan-500 text-cyan-300 font-bold' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>
                    <input
                      type="radio"
                      name="role"
                      value="sender"
                      checked={role === 'sender'}
                      onChange={() => setRole('sender')}
                      className="hidden"
                    />
                    Sender (Encryptor)
                  </label>
                  <label className={`p-2.5 rounded-xl border cursor-pointer text-center transition ${role === 'receiver' ? 'bg-cyan-950/60 border-cyan-500 text-cyan-300 font-bold' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>
                    <input
                      type="radio"
                      name="role"
                      value="receiver"
                      checked={role === 'receiver'}
                      onChange={() => setRole('receiver')}
                      className="hidden"
                    />
                    Receiver (Recipient)
                  </label>
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/50 text-red-300 text-xs font-mono">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider font-mono shadow-lg shadow-cyan-500/25 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span>{isLogin ? 'Authenticate Session' : 'Create SEG Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
