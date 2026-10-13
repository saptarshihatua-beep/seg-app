import React, { useState, useRef } from 'react';
import { 
  Shield, Lock, User, Mail, Key, ArrowRight, CheckCircle2, 
  Sparkles, MapPin, Activity, Terminal, ExternalLink 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Cinematic3DHero from './3d/Cinematic3DHero';
import WorkflowVisualizer from './landing/WorkflowVisualizer';
import SecurityArchitectureSection from './landing/SecurityArchitectureSection';
import InteractiveDemonstrationSandbox from './landing/InteractiveDemonstrationSandbox';
import FeatureShowcase from './landing/FeatureShowcase';
import TrustCallToAction from './landing/TrustCallToAction';

export default function AuthView({ onOpenDeliverables }) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('sender');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const authCardRef = useRef(null);
  const demoSectionRef = useRef(null);
  const securitySectionRef = useRef(null);

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
    // Smooth scroll to form card
    if (authCardRef.current) {
      authCardRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToAuth = () => {
    if (authCardRef.current) {
      authCardRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToDemo = () => {
    if (demoSectionRef.current) {
      demoSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToSecurity = () => {
    if (securitySectionRef.current) {
      securitySectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#060a12] text-slate-100 overflow-x-hidden">
      
      {/* 1. Cinematic 3D Opening Hero Scene */}
      <Cinematic3DHero
        onLaunchApp={scrollToAuth}
        onExploreDemo={scrollToDemo}
        onExploreSecurity={scrollToSecurity}
      />

      {/* 2. Interactive Sign-In / Registration Section */}
      <section ref={authCardRef} className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Quick Persona Cards & Academic Overview */}
          <div className="md:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 text-xs font-mono">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Interactive Dual-Persona Authentication</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Access the Production Application
            </h2>

            <p className="text-slate-300 text-sm leading-relaxed">
              Experience the complete sender-to-receiver workflow. Select one of the pre-configured academic personas below to instantly autofill test credentials, or register your own custom identity.
            </p>

            {/* Quick Demo Login Cards */}
            <div className="space-y-3 font-mono text-xs">
              <span className="text-slate-400 font-bold block text-[11px] uppercase tracking-wider">
                Select Test Persona to Autofill:
              </span>

              {/* Persona 1: Alice Vance (Sender) */}
              <button
                type="button"
                onClick={() => fillQuickDemo('alice.sender@uccs.edu', 'Sender123!')}
                className="w-full text-left p-3.5 rounded-2xl bg-gradient-to-r from-cyan-950/80 to-slate-900 border border-cyan-800/60 hover:border-cyan-400 text-cyan-300 transition-all flex items-center justify-between group shadow-sm"
              >
                <div>
                  <b className="text-white block group-hover:text-cyan-300 transition-colors">
                    Alice Vance (Sender)
                  </b>
                  <span className="text-[11px] text-slate-400">alice.sender@uccs.edu • Composes & Geolocks</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-900 text-cyan-300 border border-cyan-700">
                  Encryptor
                </span>
              </button>

              {/* Persona 2: Bob Miller (Receiver) */}
              <button
                type="button"
                onClick={() => fillQuickDemo('bob.receiver@uccs.edu', 'Receiver123!')}
                className="w-full text-left p-3.5 rounded-2xl bg-gradient-to-r from-blue-950/80 to-slate-900 border border-blue-800/60 hover:border-blue-400 text-blue-300 transition-all flex items-center justify-between group shadow-sm"
              >
                <div>
                  <b className="text-white block group-hover:text-blue-300 transition-colors">
                    Bob Miller (Receiver)
                  </b>
                  <span className="text-[11px] text-slate-400">bob.receiver@uccs.edu • Decrypts at Boundary</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-900 text-blue-300 border border-blue-700">
                  Recipient
                </span>
              </button>

              {/* Persona 3: Dr. Edward Chow */}
              <button
                type="button"
                onClick={() => fillQuickDemo('edward@chow-s.com', 'Edward123!')}
                className="w-full text-left p-3 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 text-slate-300 transition-all flex items-center justify-between"
              >
                <div>
                  <b className="text-slate-200 block text-xs">Dr. Edward Chow (Faculty)</b>
                  <span className="text-[10px] text-slate-500">edward@chow-s.com</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                  Sender
                </span>
              </button>
            </div>
          </div>

          {/* Right Column: Authentication Card Form */}
          <div className="md:col-span-6 bg-slate-900/90 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-cyan-900/50 shadow-2xl space-y-5">
            
            {/* Tab Switcher: Sign In vs Register */}
            <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs font-mono">
              <button
                type="button"
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-2.5 rounded-lg font-bold transition ${isLogin ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'}`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-2.5 rounded-lg font-bold transition ${!isLogin ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'}`}
              >
                Register
              </button>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              
              {!isLogin && (
                <div>
                  <label className="block text-xs font-mono text-cyan-400 mb-1">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Alice Vance"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white text-xs font-mono focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-mono text-cyan-400 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alice.sender@uccs.edu"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white text-xs font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-cyan-400 mb-1">Password</label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white text-xs font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              {!isLogin && (
                <div>
                  <label className="block text-xs font-mono text-cyan-400 mb-1">Designated Role</label>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <label className={`p-3 rounded-xl border cursor-pointer text-center transition ${role === 'sender' ? 'bg-cyan-950/70 border-cyan-500 text-cyan-300 font-bold' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>
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
                    <label className={`p-3 rounded-xl border cursor-pointer text-center transition ${role === 'receiver' ? 'bg-cyan-950/70 border-cyan-500 text-cyan-300 font-bold' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>
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
                <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/50 text-red-300 text-xs font-mono">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-cyan-400 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider font-mono shadow-lg shadow-cyan-500/25 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <span>{loading ? 'Authenticating...' : (isLogin ? 'Authenticate Session' : 'Create SEG Account')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

            </form>

            <div className="text-center pt-2">
              <span className="text-[11px] font-mono text-slate-500">
                Connected to Neon PostgreSQL 17 • SSL Pooled
              </span>
            </div>

          </div>

        </div>

      </section>

      {/* 3. Section B: How SEG Works */}
      <WorkflowVisualizer />

      {/* 4. Section C: Security Architecture */}
      <div ref={securitySectionRef}>
        <SecurityArchitectureSection />
      </div>

      {/* 5. Section D: Interactive Product Demonstration */}
      <div ref={demoSectionRef}>
        <InteractiveDemonstrationSandbox />
      </div>

      {/* 6. Section E: Feature Presentation */}
      <FeatureShowcase />

      {/* 7. Section F: Trust and Call to Action */}
      <TrustCallToAction
        onLaunchApp={scrollToAuth}
        onOpenDeliverables={onOpenDeliverables}
      />

    </div>
  );
}
