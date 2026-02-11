'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import AppShell from '@/components/AppShell';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute role="admin">
      <AppShell>{children}</AppShell>
    </ProtectedRoute>
  );
}
