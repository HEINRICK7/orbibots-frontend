import type { ReactNode, SVGProps } from "react";

export type IconName =
  | "overview"
  | "companies"
  | "invitations"
  | "arrow-right"
  | "plus"
  | "search"
  | "bell"
  | "users"
  | "chevron-down"
  | "shield"
  | "check"
  | "clock"
  | "spark"
  | "home"
  | "lock"
  | "eye"
  | "eye-off"
  | "info"
  | "document"
  | "settings"
  | "headphones"
  | "crown"
  | "bolt"
  | "more"
  | "cupcake"
  | "cross"
  | "leaf"
  | "flower";

const iconPaths: Record<IconName, ReactNode> = {
  home: <><path d="m3 10 9-8 9 8v11h-6v-7H9v7H3Z" /></>,
  lock: <><rect x="4" y="10" width="16" height="12" rx="2" /><path d="M7 10V6a5 5 0 0 1 10 0v4M12 15v3" /></>,
  eye: <><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>,
  "eye-off": <><path d="m3 3 18 18M10.5 5.1c.5-.1 1-.1 1.5-.1 7 0 10 7 10 7a19 19 0 0 1-3.1 4M6 6.2A21 21 0 0 0 2 12s3 7 10 7a11 11 0 0 0 5-1.1" /></>,
  info: <><circle cx="12" cy="12" r="10" /><path d="M12 11v6M12 7h.01" /></>,
  document: <><path d="M14 2H5v20h15V8Zm0 0v6h6M8 12h9M8 16h7" /></>,
  settings: <><path d="m10 2-1 3-3-1-2 3 2 3-3 1v4l3 1-1 3 3 2 3-2 1 3h4l1-3 3 1 2-3-2-3 2-1v-4l-3-1 1-3-3-2-3 2-1-3Z" transform="translate(-1 -1) scale(.95)" /><circle cx="12" cy="12" r="3" /></>,
  headphones: <><path d="M3 15v-4a9 9 0 0 1 18 0v7a3 3 0 0 1-3 3h-3" /><rect x="2" y="11" width="5" height="8" rx="2" /><rect x="17" y="11" width="5" height="8" rx="2" /></>,
  crown: <><path d="m2 7 5 4 5-8 5 8 5-4-3 13H5Zm3 9h14" /></>,
  bolt: <path d="m13 2-9 12h7l-1 8 10-13h-7Z" />,
  more: <><circle cx="5" cy="12" r=".8" fill="currentColor" /><circle cx="12" cy="12" r=".8" fill="currentColor" /><circle cx="19" cy="12" r=".8" fill="currentColor" /></>,
  cupcake: <><path d="M5 11h14l-2 10H7ZM5 11a4 4 0 0 1 2-7 5 5 0 0 1 10 0 4 4 0 0 1 2 7M9 14l1 4m5-4-1 4" /></>,
  cross: <path d="M9 2h6v7h7v6h-7v7H9v-7H2V9h7Z" />,
  leaf: <><path d="M5 20c-4-7 0-14 14-17 3 15-3 20-12 16M5 22 17 7M7 17l-1-6m5 1 5 1" /></>,
  flower: <><path d="M12 8C3-3-1 9 8 12c-11 9 1 13 4 4 9 11 13-1 4-4 11-9-1-13-4-4Z" fill="currentColor" opacity=".65" /><circle cx="12" cy="12" r="3" /></>,
  overview: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </>
  ),
  companies: (
    <>
      <rect x="4" y="3" width="12" height="18" rx="2" />
      <path d="M16 8h4v13h-4M8 7h4M8 11h4M8 15h4M8 19h.01M18 12h.01M18 16h.01" />
    </>
  ),
  invitations: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </>
  ),
  "arrow-right": <path d="M4 12h16m-7-7 7 7-7 7" />,
  plus: <path d="M12 5v14m-7-7h14" />,
  search: (
    <>
      <circle cx="10.8" cy="10.8" r="6.8" />
      <path d="m16 16 4.5 4.5" />
    </>
  ),
  bell: (
    <>
      <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M10 21h4" />
    </>
  ),
  users: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
      <circle cx="9.5" cy="7" r="4" />
      <path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  "chevron-down": <path d="m6 9 6 6 6-6" />,
  shield: <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" />,
  check: <path d="m5 12 4 4L19 6" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  spark: (
    <>
      <path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-2-5.8L4 11l6-2.2L12 3Z" />
      <path d="m19 14 .9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14Z" />
    </>
  ),
};

export function Icon({
  name,
  size = 18,
  ...props
}: SVGProps<SVGSVGElement> & { name: IconName; size?: number }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
      {...props}
    >
      {iconPaths[name]}
    </svg>
  );
}

export function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <svg viewBox="0 0 48 48" fill="currentColor">
        <path d="M18 1.8A23 23 0 0 1 31 46l-9-10a12 12 0 0 0 0-24ZM14 3.4l9 10a12 12 0 0 0-1 21l-9 10A23 23 0 0 1 14 3.4Z" />
      </svg>
    </span>
  );
}
