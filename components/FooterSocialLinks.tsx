'use client';

import React, { useState, useEffect } from 'react';
import { MessageSquare, Facebook, Send, Instagram, Share2, Twitter, Youtube, Mail, Phone, Video } from 'lucide-react';

interface SocialLinkItem {
  id: string;
  platform: string;
  label: string;
  url: string;
  icon_key?: string | null;
}

export default function FooterSocialLinks() {
  const [links, setLinks] = useState<SocialLinkItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/social-links?placement=footer', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data.links && Array.isArray(data.links)) {
          setLinks(data.links);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || !links || links.length === 0) return null;

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
    <div>
      <h3 className="text-white text-sm font-semibold mb-4 tracking-wider uppercase">Connect With Us</h3>
      <div className="flex flex-col gap-2.5">
        {links.map((link) => {
          const Icon = getPlatformIcon(link.platform, link.icon_key);
          return (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-brand-400 text-sm transition-colors flex items-center gap-2"
            >
              <Icon className="w-4 h-4 text-brand-400" />
              <span>{link.label}</span>
            </a>
          );
        })}
      </div>
    </div>
  );
}
