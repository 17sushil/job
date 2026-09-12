import type { Metadata } from 'next';

import { RoleChooser } from '@/features/auth/components/role-chooser';

export const metadata: Metadata = { title: 'Welcome' };

export default function Home() {
  return <RoleChooser />;
}