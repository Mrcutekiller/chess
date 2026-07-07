import { useState, useEffect, useCallback } from 'react';
import { useGetPlayer, getGetPlayerQueryKey } from '@workspace/api-client-react';

export interface AdwaPlayerState {
  walletAddress: string;
  displayName: string;
  house: 'shewa' | 'tigray' | 'gojjam' | 'wollo' | 'harar';
}

export function usePlayer() {
  const [localPlayer, setLocalPlayer] = useState<AdwaPlayerState | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('adwa_player');
    if (stored) {
      try {
        setLocalPlayer(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse local player', e);
      }
    }
  }, []);

  const login = useCallback((address: string, displayName: string, house: AdwaPlayerState['house']) => {
    const player = { walletAddress: address, displayName, house };
    localStorage.setItem('adwa_player', JSON.stringify(player));
    setLocalPlayer(player);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('adwa_player');
    setLocalPlayer(null);
  }, []);

  const address = localPlayer?.walletAddress || '';
  const { data: serverPlayer, isLoading } = useGetPlayer(
    address,
    {
      query: {
        enabled: !!localPlayer?.walletAddress,
        queryKey: getGetPlayerQueryKey(address),
      }
    }
  );

  return {
    player: serverPlayer,
    localPlayer,
    isLoading,
    login,
    logout,
    isAuthenticated: !!localPlayer
  };
}
