import React from 'react';
import {
  ClipboardList,
  Folder,
  Inbox,
  Wallet,
  Video,
  Users,
  FileText,
  LucideIcon,
} from 'lucide-react';

const ICONS: Record<string, LucideIcon> = {
  clipboard: ClipboardList,
  folder: Folder,
  inbox: Inbox,
  wallet: Wallet,
  video: Video,
  users: Users,
  file: FileText,
};

interface EmptyStateProps {
  /** A string key from the built-in icon map, or omit for no icon */
  icon?: 'clipboard' | 'folder' | 'inbox' | 'wallet' | 'video' | 'users' | 'file';
  title: string;
  /** alias for subtitle */
  description?: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, subtitle, action, className }: EmptyStateProps) {
  const Icon = icon ? ICONS[icon] : undefined;
  const body = description ?? subtitle;

  const containerClasses =
    'p-12 text-center rounded-3xl bg-dark-900/80 border border-dark-800 space-y-3 flex flex-col items-center justify-center';
  const combinedClasses = className ? `${containerClasses} ${className}` : containerClasses;

  return (
    <div className={combinedClasses}>
      {Icon && (
        <div className="w-12 h-12 rounded-2xl bg-dark-800 flex items-center justify-center text-slate-500 mx-auto mb-2">
          <Icon className="w-6 h-6" />
        </div>
      )}
      <h3 className="text-base font-bold text-white">{title}</h3>
      {body && (
        <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">{body}</p>
      )}
      {action && <div className="pt-3">{action}</div>}
    </div>
  );
}
