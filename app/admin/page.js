import { isAdminAuthed } from '@/lib/admin-auth';
import AdminLogin from './AdminLogin';
import AdminPanel from './AdminPanel';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Admin — Supervint',
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const configured = Boolean(process.env.ADMIN_PASSWORD);

  if (!(await isAdminAuthed())) {
    return <AdminLogin configured={configured} />;
  }

  return <AdminPanel />;
}
