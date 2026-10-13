import React, { useState } from 'react';
import { 
  Shield, FileText, Send, Inbox, Navigation, Terminal, 
  BookOpen, LogOut, User, Settings, ChevronLeft, ChevronRight, 
  Activity, CheckCircle2, Lock, Key, Globe, Menu, X, Bell
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function SidebarLayout({
  activeView,
  setActiveView,
  onOpenDeliverables,
  children
}) {
  const { user, logout, login } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleQuickSwitch = async (email, password) => {
    try {
      await login(email, password);
    } catch (e) {
      console.error('Quick switch error:', e);
    }
  };

  const navItems = [
    {
      group: 'Document Workflows',
      items: [
        {
          id: 'compose',
          label: 'Compose & Geolock',
          icon: FileText,
          roles: ['sender', 'receiver', 'admin'],
          badge: 'Encrypt'
        },
        {
          id: 'sender_dash',
          label: 'Sender Repository',
          icon: Send,
          roles: ['sender', 'receiver', 'admin'],
          badge: 'Docs'
        },
        {
          id: 'receiver_dash',
          label: 'Receiver Inbox',
          icon: Inbox,
          roles: ['sender', 'receiver', 'admin'],
          badge: 'Inbox'
        }
      ]
    },
    {
      group: 'Security & Verification',
      items: [
        {
          id: 'verify',
          label: 'Verify Geofence',
          icon: Navigation,
          roles: ['sender', 'receiver', 'admin'],
          badge: 'GPS'
        },
        {
          id: 'audit',
          label: 'Audit Logs & Events',
          icon: Terminal,
          roles: ['sender', 'admin', 'receiver'],
          badge: 'Postgres'
        }
      ]
    }
  ];

  // Breadcrumb generation based on active view
  const viewTitles = {
    compose: 'Compose & Geolock Document',
    sender_dash: 'Sender Document Repository',
    receiver_dash: 'Receiver Secure Inbox',
    verify: 'Physical Geofence Verification',
    audit: 'PostgreSQL Tamper-Evident Audit Logs'
  };

  return (
    <div className="min-h-screen bg-[#060a12] text-slate-100 flex flex-col font-sans">
      
      {/* Top Header Bar */}
      <header className="h-16 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-40 px-4 lg:px-6 flex items-center justify-between gap-4">
        
        {/* Left: Mobile Toggle + Breadcrumb */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white lg:hidden"
            title="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-950 border border-cyan-500/50 text-cyan-400">
              <Shield className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-sm tracking-wider text-white hidden sm:inline">SEG v2.0 PRO</span>
            <span className="text-slate-600 hidden sm:inline">/</span>
            <span className="text-xs font-mono font-medium text-cyan-300">
              {viewTitles[activeView] || 'Application Dashboard'}
            </span>
          </div>
        </div>

        {/* Right Header: System Status + Persona Switcher + Profile */}
        <div className="flex items-center gap-3">
          
          {/* Live Neon DB Badge */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>Neon DB: Online</span>
          </div>

          {/* Quick Persona Switcher for Evaluation */}
          <div className="hidden lg:flex items-center gap-1 bg-slate-900/90 px-2 py-1 rounded-xl border border-slate-800 text-[11px] font-mono">
            <span className="text-slate-500 mr-1 text-[10px]">Switch:</span>
            <button
              onClick={() => handleQuickSwitch('alice.sender@uccs.edu', 'Sender123!')}
              className={`px-2 py-0.5 rounded-lg transition ${user?.email === 'alice.sender@uccs.edu' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              Alice (Sender)
            </button>
            <button
              onClick={() => handleQuickSwitch('bob.receiver@uccs.edu', 'Receiver123!')}
              className={`px-2 py-0.5 rounded-lg transition ${user?.email === 'bob.receiver@uccs.edu' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              Bob (Receiver)
            </button>
          </div>

          {/* Academic Deliverables Button */}
          <button
            onClick={onOpenDeliverables}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-white text-xs font-mono transition"
          >
            <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Deliverables</span>
          </button>

          {/* Settings Modal Button */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition"
            title="Settings & System Profile"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* User Profile Summary */}
          {user && (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-900 to-blue-950 border border-cyan-500/50 flex items-center justify-center font-bold text-xs text-cyan-300 font-mono">
                {user.name ? user.name[0].toUpperCase() : 'U'}
              </div>
              <div className="hidden xl:block text-left">
                <div className="text-xs font-bold text-white leading-tight">{user.name}</div>
                <div className="text-[10px] text-cyan-400 font-mono uppercase">{user.role}</div>
              </div>
              <button
                onClick={logout}
                className="p-2 rounded-xl bg-slate-900 hover:bg-rose-950/50 text-slate-400 hover:text-rose-400 transition"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

      </header>

      {/* Main Body Area: Sidebar + Content */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Desktop Sidebar */}
        <aside className={`hidden lg:flex flex-col justify-between bg-slate-950/70 border-r border-slate-800/80 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
          
          <div className="p-4 space-y-6">
            
            {/* Collapse / Expand Toggle Button */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-900">
              {!isCollapsed && (
                <span className="text-[11px] font-mono uppercase text-slate-500 font-bold tracking-wider">
                  Navigation
                </span>
              )}
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition ml-auto"
                title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
              >
                {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
            </div>

            {/* Nav Groups */}
            {navItems.map((group, gIdx) => (
              <div key={gIdx} className="space-y-1.5">
                {!isCollapsed && (
                  <span className="text-[10px] font-mono uppercase text-slate-500 font-bold px-2 block">
                    {group.group}
                  </span>
                )}
                <div className="space-y-1">
                  {group.items
                    .filter(item => !user || item.roles.includes(user.role))
                    .map((item) => {
                      const Icon = item.icon;
                      const isActive = activeView === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => setActiveView(item.id)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-mono transition-all text-left ${
                            isActive
                              ? 'bg-gradient-to-r from-cyan-950/90 to-blue-950/80 border border-cyan-500/60 text-cyan-300 font-bold shadow-md shadow-cyan-950/40'
                              : 'text-slate-400 hover:bg-slate-900/80 hover:text-slate-200 border border-transparent'
                          }`}
                          title={item.label}
                        >
                          <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                          {!isCollapsed && (
                            <span className="truncate">{item.label}</span>
                          )}
                        </button>
                      );
                    })}
                </div>
              </div>
            ))}

          </div>

          {/* Bottom Sidebar Info Box */}
          {!isCollapsed && (
            <div className="p-4 border-t border-slate-900 text-[11px] font-mono text-slate-500 space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span>Algorithm:</span>
                <span className="text-cyan-300">AES-256-CBC</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Geofencing:</span>
                <span className="text-cyan-300">Ray-Casting PIP</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Database:</span>
                <span className="text-emerald-400">PostgreSQL 17</span>
              </div>
            </div>
          )}

        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/95 p-6 lg:hidden flex flex-col justify-between overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <span className="font-extrabold text-base text-white">SEG Navigation</span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {navItems.map((group, gIdx) => (
                <div key={gIdx} className="space-y-2">
                  <span className="text-[11px] font-mono text-slate-500 uppercase font-bold">{group.group}</span>
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeView === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setActiveView(item.id);
                            setMobileMenuOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-mono text-left ${
                            isActive ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-300'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-6 border-t border-slate-800 space-y-3">
              <button
                onClick={() => {
                  onOpenDeliverables();
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2.5 rounded-xl bg-slate-900 text-cyan-300 text-xs font-mono text-center"
              >
                Academic Deliverables Report
              </button>
              <button
                onClick={logout}
                className="w-full py-2.5 rounded-xl bg-rose-950/60 text-rose-300 text-xs font-mono text-center"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}

        {/* Main Application Content Container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>

      </div>

      {/* Settings & System Profile Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-cyan-800/50 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-white text-base">System Configuration & Profile</h3>
              </div>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="p-1.5 rounded-lg bg-slate-950 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Current User:</span>
                <span className="text-white font-bold">{user?.name} ({user?.role})</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Authenticated Email:</span>
                <span className="text-cyan-300">{user?.email}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Database Engine:</span>
                <span className="text-emerald-400">Neon PostgreSQL 17 (Online)</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Deployment Target:</span>
                <span className="text-cyan-300">Vercel Serverless (seg-app-he2u)</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Encryption Standard:</span>
                <span className="text-cyan-300">AES-256-CBC + PBKDF2</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono"
              >
                Close Settings
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
