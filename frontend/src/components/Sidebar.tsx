'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, BookOpen, Settings, Mail } from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'API Docs', href: '/api-docs', icon: BookOpen },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <div className="w-64 flex-shrink-0 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0a0a0a] min-h-[calc(100vh-4rem)] hidden md:block">
      <div className="h-full px-3 py-6 overflow-y-auto">
        <nav className="space-y-1">
          <Link
            href="/"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              pathname === "/" 
                ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" 
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900/50 hover:text-gray-900 dark:hover:text-gray-100"
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </Link>
          <Link
            href="/temp-mail"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              pathname === "/temp-mail" 
                ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" 
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900/50 hover:text-gray-900 dark:hover:text-gray-100"
            }`}
          >
            <Mail className="w-5 h-5" />
            Temp Mail
          </Link>
          <Link
            href="/api-docs"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              pathname === "/api-docs" 
                ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" 
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900/50 hover:text-gray-900 dark:hover:text-gray-100"
            }`}
          >
            <BookOpen className="w-5 h-5" />
            API Docs
          </Link>
          <Link
            href="/settings"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              pathname === "/settings" 
                ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" 
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900/50 hover:text-gray-900 dark:hover:text-gray-100"
            }`}
          >
            <Settings className="w-5 h-5" />
            Settings
          </Link>
        </nav>
      </div>
    </div>
  );
}
