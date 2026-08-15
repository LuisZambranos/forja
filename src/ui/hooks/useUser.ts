import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUserProfile, updateUserProfile } from '@core/services/user.service';
import type { User } from '@core/models';

export function useUserProfile(uid?: string) {
  return useQuery({
    queryKey: ['profile', uid],
    queryFn: () => getUserProfile(uid!),
    enabled: !!uid,
    staleTime: 1000 * 60 * 30
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uid, data }: { uid: string, data: Partial<User> }) => updateUserProfile(uid, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['profile', variables.uid] });
    }
  });
}
