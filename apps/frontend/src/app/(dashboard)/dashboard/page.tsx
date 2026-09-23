'use client';

import dynamic from 'next/dynamic';

import { useAuthStore } from '@/store/auth';

/**
 * Performance: each role dashboard is its own lazy-loaded chunk, so a
 * candidate never downloads recruiter code (and vice versa). Both stay
 * client-only because they rely on browser APIs and the auth store.
 */
const CandidateDashboard = dynamic(
  () =>
    import('@/features/dashboard/candidate-dashboard').then(
      (module) => module.CandidateDashboard,
    ),
  { ssr: false },
);

const RecruiterDashboard = dynamic(
  () =>
    import('@/features/dashboard/recruiter-dashboard').then(
      (module) => module.RecruiterDashboard,
    ),
  { ssr: false },
);

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);

  // The parent layout hydrates the session from the httpOnly cookie and
  // redirects to /login when there is none; render nothing until then.
  if (!user) {
    return null;
  }

  return user.role === 'recruiter' ? (
    <RecruiterDashboard />
  ) : (
    <CandidateDashboard />
  );
}
