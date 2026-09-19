'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { CandidateDashboard } from '@/features/dashboard/candidate-dashboard';
import { RecruiterDashboard } from '@/features/dashboard/recruiter-dashboard';
import { useAuthStore } from '@/store/auth';

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !user) {
      router.replace('/login');
    }
  }, [mounted, user, router]);

  // Avoid a hydration mismatch: the persisted user is only available client-side.
  if (!mounted) {
    return null;
  }

  if (!user) {
    return null;
  }

  return user.role === 'recruiter' ? (
    <RecruiterDashboard />
  ) : (
    <CandidateDashboard />
  );
}