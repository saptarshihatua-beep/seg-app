import React from 'react';
import { 
  FileText, Shield, MapPin, Key, Terminal, 
  Users, CheckCircle2, Globe, Database, Compass, Check
} from 'lucide-react';

export default function FeatureShowcase() {
  const features = [
    {
      icon: FileText,
      title: 'Secure Document Encryption & Delivery',
      description: 'End-to-end client-side AES-256-CBC encryption. Plaintext documents, research memos, and sensitive files never leave the browser in unencrypted form.',
      highlight: 'CryptoJS AES-256 + PBKDF2'
    },
    {
      icon: Users,
      title: 'Role-Based Recipient Authentication',
      description: 'Granular identity access management separating Senders (who define security boundaries and upload documents) from Receivers (who decrypt within boundaries).',
      highlight: 'JWT Authentication (HS256)'
    },
    {
      icon: MapPin,
      title: 'GIS-Based Interactive Map Visualization',
      description: 'Full-screen OpenStreetMap and Google Maps integration with custom Dark Cyber cartography, coordinate inspection, and live receiver GPS plotting.',
      highlight: 'Leaflet 1.9.4 & WGS-84'
    },
    {
      icon: Compass,
      title: 'Polygon Geographic Boundaries & KML Export',
      description: 'Draw flexible multi-vertex polygons with custom perimeter tolerances. Automatically generates and exports standardized OGC KML 2.2 boundary files.',
      highlight: 'OGC KML 2.2 Export'
    },
    {
      icon: Key,
      title: 'One-Time Ephemeral Access Tokens',
      description: '64-byte cryptographically secure single-use access links. Protected against replay attacks with serverless state tracking (TOKEN_ALREADY_USED).',
      highlight: 'SHA-256 Token Hashes'
    },
    {
      icon: Terminal,
      title: 'Tamper-Evident Audit History & Forensics',
      description: 'Persistent relational event logs tracking authentication outcomes, coordinate verifications, IP addresses, and document access timestamps.',
      highlight: 'Neon PostgreSQL Audit Trail'
    }
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-slate-900">
      
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/70 border border-cyan-500/40 text-cyan-400 text-xs font-mono mb-4">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Section E • Implemented Capabilities</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Real Application Capabilities
        </h2>
        <p className="mt-3 text-sm sm:text-base text-slate-400">
          Implemented, automated, and verified features running live on the production application.
        </p>
      </div>

      {/* 6-Card Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feat, idx) => {
          const Icon = feat.icon;
          return (
            <div
              key={idx}
              className="bg-slate-900/40 border border-slate-800 hover:border-cyan-500/40 rounded-3xl p-6 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-950/20 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-cyan-400 group-hover:border-cyan-500/60 group-hover:text-cyan-300 transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-800/60">
                    {feat.highlight}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors">
                  {feat.title}
                </h3>

                <p className="text-xs text-slate-400 leading-relaxed font-sans">
                  {feat.description}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-800/60 flex items-center gap-1.5 text-[11px] font-mono text-emerald-400">
                <Check className="w-3.5 h-3.5" />
                <span>Production Verified</span>
              </div>
            </div>
          );
        })}
      </div>

    </section>
  );
}
