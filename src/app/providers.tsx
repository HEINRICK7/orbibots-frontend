"use client";

import { useState, type ReactNode } from "react";
import { createPlatform } from "@/composition/container";
import { PlatformProvider } from "@/presentation/hooks/platform";

export function Providers({ apiUrl, children }: { apiUrl: string; children: ReactNode }) {
  const [platform] = useState(() => createPlatform(apiUrl));
  return <PlatformProvider platform={platform}>{children}</PlatformProvider>;
}
