export type CompanyAccess = {
  companyId: string;
  companyName: string;
  role: "COMPANY_ADMIN" | "AGENT_EDITOR";
  scope: "COMPANY" | "ASSIGNED_AGENTS" | null;
};

export type Session =
  | {
      kind: "super-admin";
      userId: string;
      name: string;
      email: string;
      accessToken: string;
      tokenType: string;
      expiresIn: number;
      expiresAt: number;
      companyAccesses: CompanyAccess[];
    }
  | {
      kind: "company-admin";
      userId: string;
      name: string;
      email: string;
      companyId: string;
      companyName: string;
      role: "COMPANY_ADMIN";
      accessToken?: string;
      tokenType?: string;
      expiresIn?: number;
      expiresAt?: number;
    };

export interface SessionStore {
  read(): Session | null;
  write(session: Session): void;
  clear(): void;
}

