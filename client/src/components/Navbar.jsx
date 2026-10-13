import React from 'react';
import { Shield, Lock, MapPin, Terminal, BookOpen, LogOut, User, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ activeView, setActiveView, onOpenDeliverables }) {
  const { user, logout, login } = useAuth();

  const handleQuickSwitch = async (email, password) => {
    try {
      await login(email, password);
    } catch (e) {
      console.error('Quick switch failed:', e);
    }
  };

  return (
    <nav className="bg-slate-950/90 backdrop-blur-md border-b border-cyan-900/40 sticky top-0 z-[1500] px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-950 border border-cyan-500/50 text-cyan-400 shadow-lg shadow-cyan-500/20">
            <Shield className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-wider text-white">SEG</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
                v2.0 PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">Secure Enhanced Geolocking</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        {user && (
          <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800 text-xs font-mono">
            <button
              onClick={() => setActiveView('compose')}
              className={`px-3 py-1.5 rounded-lg transition ${activeView === 'compose' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              Compose & Lock
            </button>
            <button
              onClick={() => setActiveView('sender_dash')}
              className={`px-3 py-1.5 rounded-lg transition ${activeView === 'sender_dash' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              Sender Repository
            </button>

            <button
              onClick={() => setActiveView('receiver_dash')}
              className={`px-3 py-1.5 rounded-lg transition ${activeView === 'receiver_dash' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              Receiver Inbox
            </button>

            <button
              onClick={() => setActiveView('verify')}
              className={`px-3 py-1.5 rounded-lg transition ${activeView === 'verify' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              Verify Geofence
            </button>

            <button
              onClick={() => setActiveView('audit')}
              className={`px-3 py-1.5 rounded-lg transition ${activeView === 'audit' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              Audit Logs
            </button>
          </div>
        )}

        {/* Right Section: Deliverables Report + User Account Switcher */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenDeliverables}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-900/80 to-cyan-950 border border-cyan-500/50 text-cyan-300 text-xs font-mono hover:scale-105 transition shadow-sm"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Academic Deliverables</span>
          </button>

          {user ? (
            <div className="flex items-center gap-2">
              {/* Quick Persona Switcher for effortless presentation */}
              <div className="hidden lg:flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800 text-[10px] font-mono">
                <span className="text-slate-500">Persona:</span>
                <button
                  type="button"
                  onClick={() => handleQuickSwitch('alice.sender@uccs.edu', 'Sender123!')}
                  className={`px-1.5 py-0.5 rounded ${user.email === 'alice.sender@uccs.edu' ? 'bg-cyan-900 text-cyan-300 font-bold' : 'text-slate-400 hover:text-white'}`}
                >
                  Alice (Sender)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickSwitch('bob.receiver@uccs.edu', 'Receiver123!')}
                  className={`px-1.5 py-0.5 rounded ${user.email === 'bob.receiver@uccs.edu' ? 'bg-cyan-900 text-cyan-300 font-bold' : 'text-slate-400 hover:text-white'}`}
                >
                  Bob (Receiver)
                </button>
              </div>

              <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold text-white">{user.name}</div>
                  <div className="text-[10px] text-cyan-400 font-mono uppercase">{user.role}</div>
                </div>
                <button
                  onClick={logout}
                  className="p-2 rounded-lg bg-slate-900 hover:bg-red-950/60 text-slate-400 hover:text-red-400 transition"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </nav>
  );
}
