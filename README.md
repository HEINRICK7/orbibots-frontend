# OrbiBots Frontend

Frontend Next.js do OrbiBots. O login, as áreas protegidas por papel e o fluxo de cadastro de empresa com Magic Link usam a API do backend.

## Configuração

Defina `API_URL` no ambiente do servidor com a URL base do backend:

```bash
API_URL=http://localhost:8000 npm run dev
```

O login usa `POST /auth/login` e confirma o usuário em `GET /auth/me`. O fluxo de company onboarding usa:

- `GET` e `POST /company-onboarding/companies` para consultar e cadastrar empresas;
- `POST /company-onboarding/public/invitations/validate` e `/accept` para o destinatário validar e aceitar o convite;
- `POST /company-onboarding/invitations/{id}/resend` e `/revoke` para operações do SUPER_ADMIN.

O backend deve permitir as origens do frontend na configuração de CORS. Sem `API_URL`, as chamadas exibem o estado de API não configurada.

## Sessão e convite

SUPER_ADMIN acessa `/admin`; COMPANY_ADMIN acessa somente `/app` da empresa validada em `/auth/me`. Rotas protegidas aguardam a validação do backend antes de renderizar seu conteúdo. A sessão com o bearer fica em `sessionStorage` e é removida quando expira ou perde autorização.

O token do convite é enviado no corpo das chamadas públicas de validação e aceite. A interface não o mostra, não o grava em armazenamento, não o inclui em mensagens nem o envia como parte da URL da API. Depois do aceite, a rota do convite é removida do histórico antes da navegação para `/app`.

Cadastro, consulta, reenvio e revogação usam os dados canônicos da API; a interface não cria empresas simuladas no navegador. O cadastro não pede senha. O aceite inicia a sessão COMPANY_ADMIN apenas depois que `/auth/me` confirma o papel e a empresa retornados pela API.

## Estrutura

- `src/app`: rotas do Next.js.
- `src/domain`: tipos de empresa, convite e acesso.
- `src/application`: regras de domínio, autenticação e contratos de company onboarding.
- `src/infrastructure`: sessão do navegador e adaptadores HTTP; o armazenamento em memória é usado apenas nos testes.
- `src/test-support`: plataforma compartilhada pelos testes.
- `src/presentation`: telas, componentes e controle de acesso.

## Desenvolvimento

```bash
npm install
npm test
npx tsc --noEmit
npm run dev
```

Para gerar uma build de produção, use `npm run build` com `API_URL` configurada.
