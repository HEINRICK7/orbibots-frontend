export type Session =
  | {
      kind: "super-admin";
      userId: string;
      name: string;
      email: string;
      accessToken: string;
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

export const platformOperator = {
  name: "Bruno Ribeiro",
  email: "bruno@orbibots.com.br",
};
