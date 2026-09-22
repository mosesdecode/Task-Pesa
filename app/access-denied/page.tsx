import React from 'react';
import { ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export default function AccessDeniedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-900 p-4">
      <div className="max-w-md w-full glass-card p-8 text-center space-y-6">
        <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8 text-rose-500" />
        </div>
        
        <h1 className="text-2xl font-black text-white">Access Restricted</h1>
        
        <p className="text-gray-400 text-sm leading-relaxed">
          TaskMint is currently only available to users located in <strong>Kenya</strong>. 
          Our security systems have detected that you are accessing the platform from outside the supported region.
        </p>

        <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
          <p className="text-xs text-gray-500">
            If you believe this is an error, please ensure you are not using a VPN or proxy service that masks your true location.
          </p>
        </div>
      </div>
    </div>
  );
}
