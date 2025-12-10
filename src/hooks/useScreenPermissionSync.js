import { useAuth } from '../store/auth';
import { useFocusEffect } from '@react-navigation/native';
import React from 'react';

export const useScreenPermissionSync = (screenName) => {
  const { syncPermissions } = useAuth();
  
  useFocusEffect(
    React.useCallback(() => {
      // console.log(`[PermissionSync] Syncing for ${screenName}`);
      syncPermissions();
    }, [syncPermissions, screenName])
  );
};
