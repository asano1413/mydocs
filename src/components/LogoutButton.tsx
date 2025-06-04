import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/router';

export default function LogoutButton() {
     const router = useRouter();

     const handleLogout = async () => {
          await supabase.auth.signOut();
          router.push('/');
     };

     return <button onClick={handleLogout}>ログアウト</button>;
}
