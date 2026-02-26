import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';

export function useGameQueries() {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();

  const submitScore = useMutation({
    mutationFn: async ({ playerName, score, difficulty, level }: { playerName: string; score: bigint; difficulty: string; level: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      const success = await actor.addScore(playerName, score, difficulty, level);
      if (!success) {
        throw new Error('NAME_REJECTED');
      }
      return success;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['highScores'] });
      queryClient.invalidateQueries({ queryKey: ['topScores'] });
    },
  });

  return {
    submitScore,
  };
}

export function useGetHighScores() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['highScores'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllScores();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetTopScores(limit: number) {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['topScores', limit],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTopScores(BigInt(limit));
    },
    enabled: !!actor && !isFetching,
    staleTime: 30000,
  });
}

export function useInitializeAchievements() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (playerName: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.initializeAchievements(playerName);
    },
    onSuccess: (_, playerName) => {
      queryClient.invalidateQueries({ queryKey: ['achievements', playerName] });
    },
  });
}

export function useUpdateAchievement() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ playerName, achievementId, progress }: { playerName: string; achievementId: string; progress: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateAchievement(playerName, achievementId, progress);
    },
    onSuccess: (_, { playerName }) => {
      queryClient.invalidateQueries({ queryKey: ['achievements', playerName] });
    },
  });
}

export function useUpdateBossMasterAchievement() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ playerName, bossType }: { playerName: string; bossType: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateBossMasterAchievement(playerName, bossType);
    },
    onSuccess: (_, { playerName }) => {
      queryClient.invalidateQueries({ queryKey: ['achievements', playerName] });
    },
  });
}

export function useUpdateMagnetMasterAchievement() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ playerName, magnetCount }: { playerName: string; magnetCount: number }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateMagnetMasterAchievement(playerName, BigInt(magnetCount));
    },
    onSuccess: (_, { playerName }) => {
      queryClient.invalidateQueries({ queryKey: ['achievements', playerName] });
    },
  });
}

export function useGetAchievements(playerName: string) {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['achievements', playerName],
    queryFn: async () => {
      if (!actor) return null;
      const result = await actor.getAchievements(playerName);
      if (!result) {
        await actor.initializeAchievements(playerName);
        return actor.getAchievements(playerName);
      }
      return result;
    },
    enabled: !!actor && !isFetching && !!playerName,
    staleTime: 10000, // Reduced from 60000 to 10000 for more frequent updates
    refetchOnMount: 'always', // Always refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window regains focus
  });
}

export function useInitializeDesigns() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (playerName: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.initializeDesigns(playerName);
    },
    onSuccess: (_, playerName) => {
      queryClient.invalidateQueries({ queryKey: ['designs', playerName] });
    },
  });
}

export function useGetDesigns(playerName: string) {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['designs', playerName],
    queryFn: async () => {
      if (!actor) return null;
      const result = await actor.getDesigns(playerName);
      if (!result) {
        await actor.initializeDesigns(playerName);
        return actor.getDesigns(playerName);
      }
      return result;
    },
    enabled: !!actor && !isFetching && !!playerName,
    staleTime: 60000,
  });
}

export function useUnlockDesign() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ playerName, designId }: { playerName: string; designId: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.unlockDesign(playerName, designId);
    },
    onSuccess: (_, { playerName }) => {
      queryClient.invalidateQueries({ queryKey: ['designs', playerName] });
    },
  });
}

export function useSelectDesign() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ playerName, designId }: { playerName: string; designId: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.selectDesign(playerName, designId);
    },
    onSuccess: (_, { playerName }) => {
      queryClient.invalidateQueries({ queryKey: ['designs', playerName] });
    },
  });
}

export function useCheckAndUnlockDesigns() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (playerName: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.checkAndUnlockDesigns(playerName);
    },
    onSuccess: (_, playerName) => {
      queryClient.invalidateQueries({ queryKey: ['designs', playerName] });
    },
  });
}

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useRegisterUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      if (!actor) throw new Error('Actor not available');
      await actor.registerUser(name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useIsUserRegistered() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['isUserRegistered'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isUserRegistered();
    },
    enabled: !!actor && !isFetching,
  });
}
