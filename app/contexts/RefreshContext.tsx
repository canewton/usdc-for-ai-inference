"use client";

import React, { createContext, useState, useContext } from "react";

type RefreshContextType = {
  refreshTrigger: number;
  refreshComponents: () => void;
};

const RefreshContext = createContext<RefreshContextType>({
  refreshTrigger: 0,
  refreshComponents: () => {},
});

export const RefreshProvider = ({ children }: { children: React.ReactNode }) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const refreshComponents = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <RefreshContext.Provider value={{ refreshTrigger, refreshComponents }}>
      {children}
    </RefreshContext.Provider>
  );
};

export const useRefreshContext = () => useContext(RefreshContext);