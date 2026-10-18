import type { Membership, User } from "../domain/access/access";
import type { Company } from "../domain/company/company";
import type { Invitation } from "../domain/invitation/invitation";

export interface CompanyRepository {
  save(company: Company): Promise<void>;
  findById(id: string): Promise<Company | null>;
  list(): Promise<Company[]>;
}

export interface InvitationRepository {
  save(invitation: Invitation): Promise<void>;
  findById(id: string): Promise<Invitation | null>;
  findByTokenHash(tokenHash: string): Promise<Invitation | null>;
  list(): Promise<Invitation[]>;
}

export interface AccessRepository {
  saveUser(user: User): Promise<void>;
  findUserByEmail(email: string): Promise<User | null>;
  findUserById(id: string): Promise<User | null>;
  saveMembership(membership: Membership): Promise<void>;
  findActiveMembership(userId: string, companyId: string): Promise<Membership | null>;
  listMembershipsByCompany(companyId: string): Promise<Membership[]>;
}

export interface IdGenerator {
  next(prefix: string): string;
}

export interface Clock {
  nowIso(): string;
}

export interface TokenIssuer {
  issue(): { raw: string; hash: string };
  hash(raw: string): string;
}

export type AppDeps = {
  companies: CompanyRepository;
  invitations: InvitationRepository;
  access: AccessRepository;
  ids: IdGenerator;
  clock: Clock;
  tokens: TokenIssuer;
};
