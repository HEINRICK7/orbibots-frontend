"use client";

import { useState, type ReactNode } from "react";
import { createPlatform } from "@/composition/container";
import { PlatformProvider } from "@/presentation/hooks/platform";

export function Providers({ children }: { children: ReactNode }) {
  const [platform] = useState(createPlatform);
  return <PlatformProvider platform={platform}>{children}</PlatformProvider>;
}
