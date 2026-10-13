import React, { useState } from 'react';
import { 
  FileText, Lock, MapPin, Send, CheckCircle2, XCircle, 
  ArrowRight, Shield, Key, Navigation, Radio, Database, Cpu
} from 'lucide-react';

export default function WorkflowVisualizer() {
  const [activeStep, setActiveStep] = useState(1);

  const steps = [
    {
      id: 1,
      number: '01',
      title: 'Select Document',
      category: 'Client Ingestion',
      icon: FileText,
      tag: 'Payload Preparation',
      summary: 'The sender uploads a confidential document or pastes sensitive text directly into the client application.',
      technicalDetails: [
        'Supports standard document payloads: PDF, TXT, JSON, memos, and classified archives.',
        'File is processed in-memory via client FileReader without plaintext cloud upload.',
        'Original filename, size, and MIME-type are extracted for cryptographic packaging.'
      ],
      spatialGraphic: 'document'
    },
    {
      id: 2,
      number: '02',
      title: 'Encrypt Document',
      category: 'Cryptographic Core',
      icon: Lock,
      tag: 'Client-Side AES-256',
      summary: 'The payload is encrypted in the user’s browser using AES-256-CBC before any transmission across the network.',
      technicalDetails: [
        'Key derivation powered by PBKDF2 with 1,000 iterations and cryptographically random 128-bit salt.',
        'Random 128-bit IV generated per document to prevent pattern frequency analysis.',
        'Plaintext document never touches the server or the database.'
      ],
      spatialGraphic: 'encryption'
    },
    {
      id: 3,
      number: '03',
      title: 'Define Geofence & Recipient',
      category: 'Spatial Geometry',
      icon: MapPin,
      tag: 'GIS Polygon Bounds',
      summary: 'The sender designates an authorized recipient and draws a precise multi-vertex polygon geofence on the GIS map.',
      technicalDetails: [
        'Polygon boundaries stored in standardized WGS-84 coordinate arrays ([lng, lat] pairs).',
        'Automatic OGC KML 2.2 file generation with LinearRing geometry and 150m boundary tolerance.',
        'Support for campus boundaries, secure facilities, and precise facility perimeters.'
      ],
      spatialGraphic: 'polygon'
    },
    {
      id: 4,
      number: '04',
      title: 'Deliver Secure Access',
      category: 'Zero-Knowledge Escrow',
      icon: Send,
      tag: 'PostgreSQL & Single-Use Token',
      summary: 'Encrypted ciphertext is stored in Neon PostgreSQL and a secure single-use access token is minted.',
      technicalDetails: [
        'Access token is cryptographically hashed with SHA-256 before database storage.',
        'Decryption key is stored in zero-knowledge serverless escrow, bound to the geofence policy.',
        'Custom delivery link or notification routed to the designated recipient.'
      ],
      spatialGraphic: 'token'
    },
    {
      id: 5,
      number: '05',
      title: 'Verify Authorization & Location',
      category: 'Physical Telemetry',
      icon: Navigation,
      tag: 'Ray-Casting Algorithm',
      summary: 'The recipient authenticates and submits verifiable device GPS coordinates upon opening the document link.',
      technicalDetails: [
        'Browser Geolocation API captures WGS-84 latitude/longitude with horizontal accuracy metric.',
        'Server executes Jordan Curve Point-in-Polygon (PIP) Ray-Casting algorithm in O(N) complexity.',
        'Anti-spoofing timestamp checks prevent stale coordinate replay attacks.'
      ],
      spatialGraphic: 'verification'
    },
    {
      id: 6,
      number: '06',
      title: 'Grant or Deny Access',
      category: 'Zero-Trust Decision',
      icon: Shield,
      tag: 'Access Enforcement',
      summary: 'If inside boundary, the escrow key is released to decrypt in the browser. If outside, access is strictly rejected.',
      technicalDetails: [
        'Inside Geofence: Single-use token is marked consumed, escrow key released, client decrypts payload.',
        'Outside Geofence: Rejection HTTP 403 OUT_OF_BOUNDS logged with calculated distance to perimeter.',
        'Token Replay Defense: Consumed token is invalidated forever (TOKEN_ALREADY_USED).'
      ],
      spatialGraphic: 'decision'
    }
  ];

  const current = steps.find(s => s.id === activeStep) || steps[0];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-slate-900">
      
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/70 border border-cyan-500/40 text-cyan-400 text-xs font-mono mb-4">
          <Cpu className="w-3.5 h-3.5" />
          <span>Section B • Formal System Pipeline</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          How Secure Enhanced Geolocking Works
        </h2>
        <p className="mt-3 text-sm sm:text-base text-slate-400">
          A zero-trust cryptographic pipeline bridging mathematical physical space with end-to-end symmetric encryption.
        </p>
      </div>

      {/* Step Selector Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2 mb-10">
        {steps.map((s) => {
          const Icon = s.icon;
          const isActive = s.id === activeStep;
          return (
            <button
              key={s.id}
              onClick={() => setActiveStep(s.id)}
              className={`p-3.5 rounded-2xl border text-left transition-all duration-300 flex flex-col justify-between ${
                isActive 
                  ? 'bg-gradient-to-b from-cyan-950/80 to-slate-900 border-cyan-500 text-white shadow-lg shadow-cyan-950/50 scale-[1.02]' 
                  : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-3">
                <span className={`text-[11px] font-mono font-bold ${isActive ? 'text-cyan-400' : 'text-slate-500'}`}>
                  {s.number}
                </span>
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-300' : 'text-slate-600'}`} />
              </div>
              <span className="text-xs font-semibold leading-snug line-clamp-2">
                {s.title}
              </span>
            </button>
          );
        })}
      </div>

      {/* Interactive Spatial Workflow Display Box */}
      <div className="bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-cyan-900/40 rounded-3xl p-6 sm:p-10 backdrop-blur-xl shadow-2xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left Explanation Column */}
        <div className="lg:col-span-6 space-y-5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md bg-cyan-950 border border-cyan-800 text-[11px] font-mono text-cyan-300 uppercase">
              Phase {current.number} • {current.category}
            </span>
            <span className="px-2.5 py-1 rounded-md bg-slate-800/80 text-[11px] font-mono text-slate-300">
              {current.tag}
            </span>
          </div>

          <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {current.title}
          </h3>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            {current.summary}
          </p>

          {/* Technical Details Bulletins */}
          <div className="space-y-2.5 pt-2">
            <span className="text-xs font-mono uppercase text-slate-400 font-bold block">
              Architectural Specifications:
            </span>
            {current.technicalDetails.map((detail, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-300 font-mono bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/60">
                <span className="text-cyan-400 font-bold mt-0.5">•</span>
                <span>{detail}</span>
              </div>
            ))}
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-3 pt-4">
            <button
              onClick={() => setActiveStep(prev => prev > 1 ? prev - 1 : 6)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition"
            >
              Previous Phase
            </button>
            <button
              onClick={() => setActiveStep(prev => prev < 6 ? prev + 1 : 1)}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono transition flex items-center gap-1.5"
            >
              <span>Next Phase</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Spatial Diagram Illustration */}
        <div className="lg:col-span-6 flex items-center justify-center p-4">
          <div className="relative w-full aspect-square max-w-[420px] rounded-3xl bg-slate-950/90 border border-cyan-800/40 p-6 flex flex-col items-center justify-center shadow-inner overflow-hidden">
            
            {/* Background Radar Rings */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
              <div className="w-64 h-64 rounded-full border border-cyan-400" />
              <div className="absolute w-44 h-44 rounded-full border border-cyan-400/60" />
              <div className="absolute w-24 h-24 rounded-full border border-cyan-400/40" />
            </div>

            {/* Stage-Specific Spatial Interactive Visual */}
            {activeStep === 1 && (
              <div className="relative z-10 text-center space-y-4 animate-fadeIn">
                <div className="w-24 h-32 mx-auto rounded-2xl bg-slate-900 border-2 border-cyan-400/60 shadow-xl shadow-cyan-500/20 p-3 flex flex-col justify-between">
                  <div className="flex justify-between items-center text-cyan-400">
                    <FileText className="w-5 h-5" />
                    <span className="text-[10px] font-mono">.TXT</span>
                  </div>
                  <div className="space-y-1.5 opacity-60">
                    <div className="h-1 bg-cyan-400 rounded w-full" />
                    <div className="h-1 bg-cyan-400 rounded w-3/4" />
                    <div className="h-1 bg-cyan-400 rounded w-5/6" />
                  </div>
                  <div className="text-[9px] font-mono text-cyan-300">CONFIDENTIAL</div>
                </div>
                <div className="text-xs font-mono text-slate-400">Client Memory • Ingestion Buffer</div>
              </div>
            )}

            {activeStep === 2 && (
              <div className="relative z-10 text-center space-y-4 animate-fadeIn">
                <div className="relative w-32 h-32 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-2 border-dashed border-cyan-400 animate-spin" style={{ animationDuration: '10s' }} />
                  <div className="w-20 h-20 rounded-2xl bg-cyan-950 border border-cyan-400 flex items-center justify-center text-cyan-300 shadow-xl shadow-cyan-500/30">
                    <Lock className="w-8 h-8 text-cyan-400" />
                  </div>
                </div>
                <div className="font-mono text-xs text-cyan-300">
                  <span>AES-256-CBC • PBKDF2(Salt, IV)</span>
                  <div className="text-[10px] text-slate-500 mt-1">Ciphertext Generated Locally</div>
                </div>
              </div>
            )}

            {activeStep === 3 && (
              <div className="relative z-10 text-center space-y-4 animate-fadeIn">
                <div className="relative w-48 h-36 mx-auto border-2 border-cyan-400/80 bg-cyan-950/20 rounded-xl flex items-center justify-center overflow-hidden">
                  <svg className="w-full h-full p-2" viewBox="0 0 100 100">
                    <polygon points="15,20 85,25 75,80 25,75" fill="rgba(0, 229, 255, 0.15)" stroke="#00e5ff" strokeWidth="2" strokeDasharray="3 3" />
                    <circle cx="50" cy="50" r="4" fill="#38bdf8" />
                  </svg>
                  <div className="absolute top-2 left-2 text-[9px] font-mono text-cyan-400">OGC KML 2.2 Boundary</div>
                </div>
                <div className="text-xs font-mono text-slate-400">WGS-84 Polygon Perimeter Coordinates</div>
              </div>
            )}

            {activeStep === 4 && (
              <div className="relative z-10 text-center space-y-4 animate-fadeIn">
                <div className="p-4 rounded-2xl bg-slate-900 border border-cyan-500/50 shadow-xl text-left font-mono space-y-2 max-w-xs">
                  <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold">
                    <Database className="w-4 h-4" />
                    <span>Neon PostgreSQL Escrow</span>
                  </div>
                  <div className="text-[10px] text-slate-400 bg-slate-950 p-2 rounded-lg break-all">
                    token_hash: SHA256(8bd13d...)<br />
                    status: "active" | single_use: true
                  </div>
                </div>
                <div className="text-xs font-mono text-slate-400">Escrow Key Locked • Token Dispatched</div>
              </div>
            )}

            {activeStep === 5 && (
              <div className="relative z-10 text-center space-y-4 animate-fadeIn">
                <div className="relative w-40 h-40 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border border-cyan-500/40 animate-ping" style={{ animationDuration: '3s' }} />
                  <div className="w-24 h-24 rounded-full bg-cyan-950/80 border-2 border-cyan-400 flex flex-col items-center justify-center text-cyan-300">
                    <Navigation className="w-7 h-7 text-cyan-400" />
                    <span className="text-[9px] font-mono mt-1">Ray-Casting</span>
                  </div>
                </div>
                <div className="text-xs font-mono text-cyan-300">
                  Jordan Curve PIP Verification in O(N)
                </div>
              </div>
            )}

            {activeStep === 6 && (
              <div className="relative z-10 text-center space-y-4 animate-fadeIn">
                <div className="grid grid-cols-2 gap-3 max-w-xs">
                  <div className="p-3 rounded-2xl bg-emerald-950/50 border border-emerald-500/60 text-emerald-300 text-center font-mono">
                    <CheckCircle2 className="w-6 h-6 mx-auto mb-1 text-emerald-400" />
                    <b className="text-[11px] block">INSIDE BOUNDS</b>
                    <span className="text-[9px] text-emerald-400/80">Key Released (200)</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-rose-950/50 border border-rose-500/60 text-rose-300 text-center font-mono">
                    <XCircle className="w-6 h-6 mx-auto mb-1 text-rose-400" />
                    <b className="text-[11px] block">OUTSIDE BOUNDS</b>
                    <span className="text-[9px] text-rose-400/80">Access Denied (403)</span>
                  </div>
                </div>
                <div className="text-xs font-mono text-slate-400">Decryption Permitted Only Upon Valid Coordinate Match</div>
              </div>
            )}

            {/* Bottom Live Pipeline Telemetry */}
            <div className="mt-4 pt-3 border-t border-slate-900 w-full flex items-center justify-between text-[10px] font-mono text-slate-500">
              <span>Security State: Active</span>
              <span className="text-cyan-400">Enforced by Serverless API</span>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
