'use client';

import { ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { LayoutDashboard, Database, PenLine, FileBarChart, Clock, Home, BookOpen, Trophy, Settings, User, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const adminNav = [
  { icon: LayoutDashboard, label: 'Beranda', path: '/admin' },
  { icon: Database, label: 'Data', path: '/admin/data' },
  { icon: PenLine, label: 'Nilai', path: '/admin/penilaian' },
  { icon: Clock, label: 'Jam+', path: '/admin/jam-tambahan' },
  { icon: FileBarChart, label: 'Laporan', path: '/admin/laporan' },
];

const studentNav = [
  { icon: Home, label: 'Beranda', path: '/student' },
  { icon: BookOpen, label: 'Nilai', path: '/student/nilai' },
  { icon: Trophy, label: 'Prestasi', path: '/student/prestasi' },
  { icon: Clock, label: 'Jam+', path: '/student/jam-tambahan' },
];

export default function AppShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const navItems = user?.role === 'admin' ? adminNav : studentNav;

  const isActive = (path: string) => {
    if (path === '/admin' || path === '/student') return pathname === path;
    return pathname?.startsWith(path) ?? false;
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <div className="min-h-dvh bg-background pb-20">
      {children}
      
      {/* Bottom Navigation */}
      <nav className="app-bottomnav">
        {navItems.map(item => (
          <button
            key={item.path}
            className={cn('nav-item', isActive(item.path) && 'active')}
            onClick={() => router.push(item.path)}
          >
            <item.icon size={22} className="nav-icon" />
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="nav-item">
              <Settings size={22} className="nav-icon" />
              <span className="nav-label">Menu</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-56 mb-2">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.nama}</p>
                <p className="text-xs leading-none text-muted-foreground">{user?.code}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              <span>Profil</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </nav>
    </div>
  );
}
