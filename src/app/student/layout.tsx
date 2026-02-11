'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import AppShell from '@/components/AppShell';

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute role="siswa">
      <AppShell>{children}</AppShell>
    </ProtectedRoute>
  );
}
