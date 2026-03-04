# 🦷 OdontoSystem — Gestão de Consultório Odontológico

Sistema completo de gestão para consultórios odontológicos, com arquitetura dividida em moderno **Backend FastAPI**, **Frontend em React + Vite + Tailwind CSS v4** e hospedagem no **Supabase (PostgreSQL)**.

---

## 🚀 Tecnologias

| Camada | Tecnologia |
|---|---|
| Backend | FastAPI + Uvicorn (Python 3.11+) |
| Frontend | React + Vite + Tailwind CSS v4 |
| Banco de Dados | PostgreSQL via Supabase (PostgREST) |
| Autenticação | JWT (`python-jose`) + bcrypt |
| Validação | Pydantic V2 |

---

## âœ… Funcionalidades

- **Login seguro** com JWT â€” perfis: Admin, Dentista, Recepcionista, Financeiro  
- **Pacientes** â€” cadastro completo, ficha, histÃ³rico de agendamentos  
- **Dentistas** â€” cadastro, especialidades, estatÃ­sticas de atendimento  
- **Agendamentos** â€” agenda visual, fluxo de status (agendado â†’ concluÃ­do)  
- **Procedimentos** â€” catÃ¡logo com valores e duraÃ§Ã£o  
- **Financeiro ConsultÃ³rio** â€” lanÃ§amentos, visÃ£o mensal e anual  
- **Financeiro Pessoal** â€” controle separado por usuÃ¡rio  
- **UsuÃ¡rios** â€” gerenciamento de acessos (somente Admin)  

---

## 📁 Estrutura do Projeto

```
odontosystem/
├── backend/
│   ├── api/
│   │   ├── main.py              # App FastAPI + routers
│   │   └── routes/
│   │       ├── auth.py          # Login / JWT / usuários
│   │       ├── pacientes.py
│   │       ├── dentistas.py
│   │       ├── agendamentos.py
│   │       ├── procedimentos.py
│   │       ├── financeiro_consultorio.py
│   │       └── financeiro_pessoal.py
│   └── config/
│       ├── settings.py          # Pydantic Settings (lê .env)
│       └── supabase_client.py   # Cliente PostgREST
├── frontend-react/              # NOVO FRONTEND EM REACT
│   ├── src/
│   │   ├── components/ui        # Componentes genéricos (Buttons, Cards)
│   │   ├── pages/               # Views (Dashboard, Pacientes, Finanças, etc.)
│   │   ├── services/api.js      # Instância Axios com Interceptors JWT
│   │   ├── App.jsx              # React Router
│   │   └── index.css            # Tailwind CSS v4
│   ├── package.json             # Dependências Node.js
│   └── vite.config.js           # Configurações do Vite
├── database/
│   ├── schema.sql               # Tabelas principais
│   ├── schema_financeiro.sql    # Tabelas financeiras
│   └── schema_auth.sql          # Tabela de usuários + admin inicial
├── .env.example                 # Modelo de variáveis de ambiente
├── requirements.txt
├── criar_admin.py               # CLI para criar usuário admin
├── start_backend.py             # Script para rodar API REST
├── start_frontend.py            # Script adaptado para npm run dev
└── start.bat                    # Inicia tudo (Windows)
```
â”œâ”€â”€ database/
â”‚   â”œâ”€â”€ schema.sql               # Tabelas principais
â”‚   â”œâ”€â”€ schema_financeiro.sql    # Tabelas financeiras
â”‚   â””â”€â”€ schema_auth.sql          # Tabela de usuÃ¡rios + admin inicial
â”œâ”€â”€ .env.example                 # Modelo de variÃ¡veis de ambiente
â”œâ”€â”€ requirements.txt
â”œâ”€â”€ criar_admin.py               # CLI para criar usuÃ¡rio admin
â”œâ”€â”€ start_backend.py
â”œâ”€â”€ start_frontend.py
â””â”€â”€ start.bat                    # Inicia tudo (Windows)
```

---

## ðŸ”§ InstalaÃ§Ã£o

### 1. PrÃ©-requisitos
- Python **3.11** ou superior
- Projeto no [Supabase](https://supabase.com) (gratuito)

### 2. Clonar e criar ambiente virtual

```bash
git clone <url-do-repositorio>
cd odontosystem

python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # Linux/Mac

pip install -r requirements.txt
```

### 3. Configurar variÃ¡veis de ambiente

```bash
copy .env.example .env          # Windows
# cp .env.example .env          # Linux/Mac
```

Edite `.env` com suas credenciais do Supabase:

```env
SUPABASE_URL=https://<seu_project_id>.supabase.co
SUPABASE_KEY=<sua_anon_key>
DB_PASSWORD=<sua_db_password>
JWT_SECRET_KEY=<chave_secreta_forte>   # python -c "import secrets; print(secrets.token_hex(32))"
```

> ðŸ”‘ **Onde encontrar as chaves do Supabase:**  
> `Settings â†’ API` â†’ Project URL + anon/public key  
> `Settings â†’ Database` â†’ senha do banco

### 4. Criar as tabelas no Supabase

Acesse o **SQL Editor** do seu projeto no Supabase e execute os arquivos na ordem:

1. `database/schema.sql`
2. `database/schema_financeiro.sql`
3. `database/schema_auth.sql` â† cria tabela `usuarios` + usuÃ¡rio admin inicial

> O arquivo `schema_auth.sql` jÃ¡ insere o **admin padrÃ£o** com:  
> **E-mail:** `admin@odontosystem.com` | **Senha:** `Admin@2025`  
> Altere a senha apÃ³s o primeiro acesso.

---

## â–¶ï¸ Rodando o sistema

### Windows â€” tudo de uma vez

```bat
start.bat
```

### Ou manualmente (dois terminais)

```bash
# Terminal 1 — Backend (FastAPI Python)
python start_backend.py
# API em http://localhost:8000
# Docs em http://localhost:8000/docs

# Terminal 2 — Frontend (React Vite)
python start_frontend.py
# (que chama internamente 'npm run dev' na pasta frontend-react)
# Interface em http://localhost:5173
```

---

## ðŸ” AutenticaÃ§Ã£o

- Todas as pÃ¡ginas exigem login
- Perfis disponÃ­veis: `admin`, `dentista`, `recepcionista`, `financeiro`
- Tokens JWT com expiraÃ§Ã£o de 8 horas
- Gerenciar usuÃ¡rios pela pÃ¡gina **ðŸ” UsuÃ¡rios** (somente Admin)

Para criar usuÃ¡rios extras via CLI:

```bash
python criar_admin.py --email "dentista@clinica.com" --nome "Dr. Silva" --role dentista
```

---

## ðŸ“š API

DocumentaÃ§Ã£o Swagger interativa em: `http://localhost:8000/docs`

| Prefixo | MÃ³dulo |
|---|---|
| `POST /auth/login` | AutenticaÃ§Ã£o |
| `GET /auth/me` | UsuÃ¡rio atual |
| `/api/pacientes` | Pacientes |
| `/api/dentistas` | Dentistas |
| `/api/agendamentos` | Agendamentos |
| `/api/procedimentos` | Procedimentos |
| `/api/financeiro/consultorio` | Financeiro consultÃ³rio |
| `/api/financeiro/pessoal` | Financeiro pessoal |

---

## ðŸ”’ SeguranÃ§a

- Credenciais em variÃ¡veis de ambiente (`.env` estÃ¡ no `.gitignore`)
- Senhas armazenadas com **bcrypt** (custo 12)
- AutenticaÃ§Ã£o **JWT** com expiraÃ§Ã£o configurÃ¡vel
- Sem valores sensÃ­veis hardcoded no cÃ³digo

---

## ðŸš€ Deploy

Para produÃ§Ã£o, configure no `.env`:

```env
DEBUG=False
JWT_SECRET_KEY=<chave_muito_forte_aqui>
```

SugestÃµes de hospedagem gratuita:

| [Railway](https://railway.app) | Backend + Banco de dados |
| [Render](https://render.com) | Backend |
| [Vercel / Netlify](https://vercel.com) | Frontend React |
| [Supabase](https://supabase.com) | Banco de dados PostgreSQL |

---

**Versão:** 2.0.0 · **Stack Atual:** FastAPI + React + Vite + Tailwind CSS + Supabase
