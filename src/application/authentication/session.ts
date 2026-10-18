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
    }
  | {
      kind: "company-admin";
      userId: string;
      name: string;
      email: string;
      companyId: string;
      companyName: string;
      role: "COMPANY_ADMIN";
    };

export interface SessionStore {
  read(): Session | null;
  write(session: Session): void;
  clear(): void;
}

