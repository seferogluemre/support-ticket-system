import { authClient } from '#lib/auth';
import { getAvatarInitials } from '#/features/company-members/utils/avatar-helpers';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import { useSession } from './use-session';

interface UseNavUserResult {
  userName: string;
  userEmail: string;
  userAvatar?: string | null;
  userInitials: string;
  handleLogout: () => Promise<void>;
  session: ReturnType<typeof useSession>['session'];
}

interface UseNavUserOptions {
  defaultName?: string;
  defaultEmail?: string;
}

export function useNavUser(options: UseNavUserOptions = {}): UseNavUserResult {
  const { defaultName = 'User', defaultEmail = 'user@example.com' } = options;
  
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { session } = useSession();

  async function handleLogout() {
    const response = await authClient.signOut();
    if (response.error) {
      toast.error(response.error.message);
    }

    if (response.data?.success) {
      queryClient.removeQueries({ queryKey: ['session'] });
      navigate({ to: '/sign-in', replace: true });
    }
  }

  const userName = session?.name || defaultName;
  const userEmail = session?.email || defaultEmail;
  const userAvatar = session?.image;
  const userInitials = getAvatarInitials(userName, 'U');

  return {
    userName,
    userEmail,
    userAvatar,
    userInitials,
    handleLogout,
    session,
  };
}

