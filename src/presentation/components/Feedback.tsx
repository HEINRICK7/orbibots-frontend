import { DomainError } from "../../domain/shared/domain-error";

export function errorText(error: unknown): string {
  if (error instanceof DomainError || error instanceof Error) {
    return error.message;
  }
  return "Não foi possível concluir esta ação.";
}

export function ErrorNote({ message }: { message: string | null }) {
  if (!message) {
    return null;
  }
  return (
    <p className="error" role="alert">
      {message}
    </p>
  );
}
