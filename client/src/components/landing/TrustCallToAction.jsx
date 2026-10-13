import React from 'react';
import { Shield, ArrowRight, Lock, CheckCircle2, Terminal } from 'lucide-react';

export default function TrustCallToAction({ onLaunchApp, onOpenDeliverables }) {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
      
      <div className="bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-cyan-900/50 rounded-3xl p-8 sm:p-14 backdrop-blur-xl shadow-2xl relative overflow-hidden">
        
        {/* Glow Element */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl mx-auto space-y-6">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-cyan-950 border border-cyan-500/50 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/20">
            <Shield className="w-7 h-7" />
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Controlled Document Access with Mathematical Boundaries
          </h2>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Secure Enhanced Geolocking enforces zero-trust data sovereignty. When confidentiality depends on physical presence, geographical coordinate policies ensure that only authorized recipients situated within verified perimeters can decrypt sensitive assets.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <button
              onClick={onLaunchApp}
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-slate-950 font-bold text-xs uppercase tracking-wider font-mono shadow-xl shadow-cyan-500/25 hover:scale-[1.02] active:scale-[0.98] transition flex items-center gap-2"
            >
              <span>Launch Live Application</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenDeliverables}
              className="px-5 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-mono transition"
            >
              Review Academic Deliverables
            </button>
          </div>

          <div className="pt-6 border-t border-slate-800/80 flex flex-wrap items-center justify-center gap-6 text-[11px] font-mono text-slate-500">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>NIST AES-256 Client-Side</span>
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Jordan Curve Ray-Casting PIP</span>
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Neon PostgreSQL 17 Persistent</span>
            </span>
          </div>
        </div>

      </div>

    </section>
  );
}
