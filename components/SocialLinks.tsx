'use client';

import React, { useState, useEffect } from 'react';
import { MessageSquare, Facebook, Send, Instagram, Share2 } from 'lucide-react';

interface SocialLinkItem {
  id: string;
  platform: string;
  label: string;
  url: string;
}

export default function SocialLinks() {
  const [links, setLinks] = useState<SocialLinkItem[]>([]);

  useEffect(() => {
    fetch('/api/social-links')
      .then((res) => res.json())
      .then((data) => {
        if (data.links && data.links.length > 0) {
          setLinks(data.links);
        } else {
          // Default default social links
          setLinks([
            { id: 'def-wa', platform: 'whatsapp', label: 'WhatsApp Community', url: 'https://whatsapp.com' },
            { id: 'def-fb', platform: 'facebook', label: 'Facebook Page', url: 'https://facebook.com' },
            { id: 'def-tg', platform: 'telegram', label: 'Telegram Channel', url: 'https://telegram.org' },
            { id: 'def-ig', platform: 'instagram', label: 'Instagram', url: 'https://instagram.com' },
          ]);
        }
      })
      .catch(() => {});
  }, []);

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'whatsapp':
        return MessageSquare;
      case 'facebook':
        return Facebook;
      case 'telegram':
        return Send;
      case 'instagram':
        return Instagram;
      default:
        return Share2;
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      {links.map((link) => {
        const Icon = getPlatformIcon(link.platform);
        return (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-gray-300 hover:text-white text-xs font-bold transition-all flex items-center gap-2 hover:scale-105 shadow-md"
          >
            <Icon className="w-4 h-4 text-brand-400" />
            <span>{link.label}</span>
          </a>
        );
      })}
    </div>
  );
}
