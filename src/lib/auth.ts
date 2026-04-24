import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { ExtendedSession } from '@/types';

export { getAdminEmail, isAdminEmail } from '@/lib/admin';

export async function getAppSession() {
  return (await getServerSession(authOptions)) as ExtendedSession | null;
}
