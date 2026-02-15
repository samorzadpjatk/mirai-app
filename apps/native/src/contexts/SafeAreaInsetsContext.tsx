import React, { createContext, useContext } from 'react';
import type { EdgeInsets } from 'react-native-safe-area-context';

const defaultInsets: EdgeInsets = { top: 0, bottom: 0, left: 0, right: 0 };

export const SafeAreaInsetsContext = createContext<EdgeInsets>(defaultInsets);

export function SafeAreaInsetsProvider({ children, value }: { children: React.ReactNode; value: EdgeInsets }) {
  return (
    <SafeAreaInsetsContext.Provider value={value}>
      {children}
    </SafeAreaInsetsContext.Provider>
  );
}

export function useAppSafeAreaInsets(): EdgeInsets {
  return useContext(SafeAreaInsetsContext);
}
