'use client';

import React, { useState, useEffect } from 'react';
import { MessageSquare, Facebook, Send, Instagram, Share2, Twitter, Youtube, Mail, Phone, Video } from 'lucide-react';

interface SocialLinkItem {
  id: string;
  platform: string;
  label: string;
  url: string;
  icon_key?: string | null;
  placement?: string[];
}

interface SocialLinksProps {
  placement?: string;
  className?: string;
}

export default function SocialLinks({ placement = 'community_row', className }: SocialLinksProps) {
  const [links, setLinks] = useState<SocialLinkItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/social-links?placement=${encodeURIComponent(placement)}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data.links && Array.isArray(data.links)) {
          setLinks(data.links);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [placement]);

  if (loading) return null;
  if (!links || links.length === 0) return null;

  const getPlatformIcon = (platform: string, iconKey?: string | null) => {
    const key = (iconKey || platform).toLowerCase();
    switch (key) {
      case 'whatsapp':
        return MessageSquare;
      case 'facebook':
        return Facebook;
      case 'telegram':
        return Send;
      case 'instagram':
        return Instagram;
      case 'x':
      case 'twitter':
        return Twitter;
      case 'youtube':
        return Youtube;
      case 'tiktok':
        return Video;
      case 'email':
        return Mail;
      case 'phone':
        return Phone;
      default:
        return Share2;
    }
  };

  return (
    <div className={className || 'flex flex-wrap items-center justify-center gap-3'}>
      {links.map((link) => {
        const Icon = getPlatformIcon(link.platform, link.icon_key);
        return (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900/90 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 text-slate-800 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white text-xs font-bold transition-all flex items-center gap-2 hover:scale-105 shadow-sm dark:shadow-md"
          >
            <Icon className="w-4 h-4 text-emerald-600 dark:text-brand-400" />
            <span>{link.label}</span>
          </a>
        );
      })}
    </div>
  );
}
