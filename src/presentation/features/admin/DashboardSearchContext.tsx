"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

type DashboardSearchValue = {
  query: string;
  setQuery: (query: string) => void;
};

const DashboardSearchContext = createContext<DashboardSearchValue>({
  query: "",
  setQuery: () => {},
});

export function DashboardSearchProvider({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState("");
  const value = useMemo(() => ({ query, setQuery }), [query]);
  return <DashboardSearchContext.Provider value={value}>{children}</DashboardSearchContext.Provider>;
}

export function useDashboardSearch() {
  return useContext(DashboardSearchContext);
}
