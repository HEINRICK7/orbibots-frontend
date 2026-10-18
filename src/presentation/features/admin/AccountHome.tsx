"use client";

import { usePlatform } from "../../hooks/platform";

export function AccountHome() {
  const platform = usePlatform();
  const session = platform.authentication.current();
  if (!session || session.kind !== "super-admin") {
    return null;
  }

  const fields = [
    { label: "Nome", value: session.name },
    { label: "E-mail", value: session.email },
    { label: "Papel", value: "Administrador global" },
    { label: "Identificador", value: session.userId },
  ];

  return (
    <div className="account-page">
      <div className="page-head">
        <div>
          <h1>{session.name}</h1>
          <p className="lede">Super Admin da plataforma.</p>
        </div>
      </div>
      <dl className="account-card">
        {fields.map((field) => (
          <div key={field.label}>
            <dt>{field.label}</dt>
            <dd>{field.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
