import React from 'react';
import { 
  ShieldCheck, Lock, Key, Terminal, Database, 
  MapPin, AlertOctagon, CheckCircle2, Server, EyeOff
} from 'lucide-react';

export default function SecurityArchitectureSection() {
  const pillars = [
    {
      icon: Lock,
      title: 'Client-Side AES-256-CBC Cryptography',
      standard: 'NIST FIPS 197 & PBKDF2',
      details: [
        'Document content is encrypted directly within the client browser before network egress.',
        'Cryptographic keys are derived using PBKDF2 with 1,000 rounds, 128-bit random salt, and 128-bit initialization vector (IV).',
        'Ciphertext is formatted via CryptoJS JsonFormatter compatible with OpenSSL standards.'
      ]
    },
    {
      icon: Server,
      title: 'Zero-Knowledge Serverless Key Escrow',
      standard: 'Neon PostgreSQL 17 Pooled SSL',
      details: [
        'Decryption passphrases are held in an isolated escrow table, inaccessible to unauthorized endpoints.',
        'The serverless backend cannot decrypt documents in transit; it only releases the key when location criteria are met.',
        'Key release triggers atomic database state transition from "active" to "accessed".'
      ]
    },
    {
      icon: MapPin,
      title: 'Mathematical Ray-Casting Geofencing',
      standard: 'Jordan Curve Theorem (PIP)',
      details: [
        'Server-side Point-in-Polygon calculation tests whether horizontal ray intersects polygon edges an odd or even number of times.',
        'Haversine formula computes perimeter distance in meters for strict proximity verification.',
        'Evaluated exclusively on the backend serverless function; client cannot bypass mathematical boundaries.'
      ]
    },
    {
      icon: Key,
      title: 'SHA-256 Ephemeral Single-Use Tokens',
      standard: 'Anti-Replay Security Defense',
      details: [
        'Single-use delivery tokens are generated with 64 cryptographically random hexadecimal bytes.',
        'Stored as one-way SHA-256 hashes in PostgreSQL to protect tokens against database inspection.',
        'Immediately marked as used upon access; replay attempts are rejected with HTTP 403 (TOKEN_ALREADY_USED).'
      ]
    },
    {
      icon: Terminal,
      title: 'Tamper-Evident PostgreSQL Audit Logging',
      standard: 'Zero-Trust Observability',
      details: [
        'Every login attempt, document composition, token access, and physical verification is logged.',
        'Audit records store user ID, action enum, detailed telemetry, client IPv4/IPv6 address, and UTC timestamp.',
        'Audit logs provide undeniable forensic trails for compliance and security review.'
      ]
    },
    {
      icon: EyeOff,
      title: 'Strict Backend Security Enforcement',
      standard: 'Defense-in-Depth Contract',
      details: [
        'Crucial Security Truth: UI animations, maps, and client scripts do NOT enforce security alone.',
        'All authorization gates, JWT token verifications, role checks, and geofence evaluations run on the backend.',
        'If a rogue client manipulates frontend state, the Vercel API rejects unauthorized requests with 401 or 403.'
      ]
    }
  ];

  return (
    <section id="security-architecture" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-slate-900">
      
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/70 border border-cyan-500/40 text-cyan-400 text-xs font-mono mb-4">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Section C • Threat Model & Verification</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Verified Security Architecture
        </h2>
        <p className="mt-3 text-sm sm:text-base text-slate-400">
          Backend-enforced security primitives combining modern cryptography, spatial mathematics, and serverless isolation.
        </p>
      </div>

      {/* Security Architecture Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pillars.map((p, idx) => {
          const Icon = p.icon;
          return (
            <div
              key={idx}
              className="bg-slate-900/50 border border-slate-800 hover:border-cyan-500/50 rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:shadow-cyan-950/30 backdrop-blur-sm group"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-2xl bg-cyan-950/80 border border-cyan-800/60 text-cyan-400 group-hover:scale-110 transition-transform">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono px-2.5 py-1 rounded-md bg-slate-950 border border-slate-800 text-slate-400">
                    {p.standard}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white mb-3 group-hover:text-cyan-300 transition-colors">
                  {p.title}
                </h3>

                <ul className="space-y-2.5 text-xs text-slate-300 font-mono">
                  {p.details.map((detail, dIdx) => (
                    <li key={dIdx} className="flex items-start gap-2">
                      <span className="text-cyan-400 mt-0.5">•</span>
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono text-slate-500">
                <span>Verified Primitive</span>
                <span className="text-cyan-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>Production Ready</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Backend Enforcement Warning Callout */}
      <div className="mt-12 p-5 rounded-2xl bg-cyan-950/40 border border-cyan-500/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono">
        <div className="flex items-center gap-3">
          <AlertOctagon className="w-6 h-6 text-cyan-400 flex-shrink-0" />
          <div className="text-slate-300">
            <b className="text-white block mb-0.5">Zero-Trust Architectural Guarantee:</b>
            Frontend graphics and animations provide human observability only. All access, key releases, and geofence evaluations are computed strictly on the backend.
          </div>
        </div>
        <span className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-cyan-300 text-[11px] whitespace-nowrap">
          API Enforced • No Client Trust
        </span>
      </div>

    </section>
  );
}
