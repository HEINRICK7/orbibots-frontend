# OrbiBots

Frontend OrbiBots com a tela de login e a estrutura visual do dashboard em modo noturno.

## Camadas

- `src/app`: rotas do Next.js. Login e convite, operação do Super Admin e painel da empresa.
- `src/domain`: empresa, convite e acesso.
- `src/application`: regras de cadastro e convite usadas nos testes de domínio.
- `src/infrastructure`: adaptadores e integrações da aplicação.
- `src/test-support`: armazenamento em memória usado apenas nos testes de domínio.
- `src/presentation`: componentes, features e hooks.

Este projeto não contém conexão com provedor de autenticação nem API de produção. Os dados de demonstração, a sessão local e as ações simuladas foram removidos. Login, cadastro, convites, auditoria e publicação ficam indisponíveis até que um serviço real seja conectado; nenhuma alteração é salva localmente.

## Uso

```bash
npm install
npm test
npm run dev
```

Abra `/login`. A tela informa que a autenticação não está configurada. As rotas do dashboard não aceitam uma sessão criada no navegador.
