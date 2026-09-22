'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink, Megaphone } from 'lucide-react';

interface BannerItem {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl?: string | null;
}

export default function TopBannerCarousel() {
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetch('/api/banners')
      .then((res) => res.json())
      .then((data) => {
        if (data.banners && data.banners.length > 0) {
          setBanners(data.banners);
        } else {
          // Fallback default promotional banner if none configured yet
          setBanners([
            {
              id: 'def-1',
              title: '🔥 Welcome to TaskMint: Earn up to KES 500 Daily completing simple verified digital tasks!',
              imageUrl: '',
              linkUrl: '/tasks',
            },
            {
              id: 'def-2',
              title: '💰 Invite Friends & Get Instant Referral Rewards direct to your wallet!',
              imageUrl: '',
              linkUrl: '/referrals',
            },
          ]);
        }
      })
      .catch(() => {});
  }, []);

  // 5-second automatic slideshow rotation
  useEffect(() => {
    if (banners.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [banners]);

  if (banners.length === 0) return null;

  const currentBanner = banners[currentIndex];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-900 via-slate-900 to-emerald-950 border border-brand-500/30 p-4 sm:p-5 shadow-2xl transition-all duration-700 flex items-center justify-between">
        {currentBanner.imageUrl ? (
          <div className="absolute inset-0 z-0 opacity-25">
            <img
              src={currentBanner.imageUrl}
              alt={currentBanner.title}
              className="w-full h-full object-cover"
            />
          </div>
        ) : null}

        <div className="relative z-10 flex items-center gap-3 w-full sm:w-auto">
          <div className="w-9 h-9 rounded-xl bg-brand-500/20 border border-brand-500/40 text-brand-400 flex items-center justify-center shrink-0">
            <Megaphone className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-brand-400 block">
              Announcement & Sponsor Banner ({currentIndex + 1}/{banners.length})
            </span>
            <p className="text-xs sm:text-sm font-bold text-white leading-tight">
              {currentBanner.title}
            </p>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-3 shrink-0">
          {currentBanner.linkUrl ? (
            <a
              href={currentBanner.linkUrl}
              className="px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-all flex items-center gap-1 shadow-md hover:scale-105"
            >
              <span>Learn More</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          ) : null}

          {banners.length > 1 && (
            <div className="hidden sm:flex items-center gap-1 pl-2">
              <button
                onClick={() => setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length)}
                className="w-7 h-7 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-gray-300 flex items-center justify-center transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentIndex((prev) => (prev + 1) % banners.length)}
                className="w-7 h-7 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-gray-300 flex items-center justify-center transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
