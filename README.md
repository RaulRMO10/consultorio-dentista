# 🦷 OdontoSystem — Gestão de Consultório Odontológico

Sistema **full-stack** completo para gestão de consultórios odontológicos: agenda, prontuário clínico, odontograma, controle protético e gestão financeira — com autenticação por perfis e API documentada.

![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?logo=supabase&logoColor=white)

> 🖼️ _Screenshots/GIF da aplicação aqui — dashboard, agenda e odontograma._
> _(Adicione imagens em `docs/` e referencie-as com `![alt](docs/dashboard.png)`)_

---

## ✨ Funcionalidades

### Clínico
- **Pacientes** — cadastro completo, ficha e histórico de atendimentos
- **Odontograma** — registro visual do estado de cada dente
- **Anamnese** — questionário de saúde do paciente
- **Tratamentos clínicos** — planos e acompanhamento
- **Agendamentos** — agenda com fluxo de status (agendado → concluído)
- **Procedimentos** — catálogo com valores e duração

### Controle Protético
- **Laboratórios** — cadastro e gestão de parceiros
- **Ordens protéticas** — ciclo de vida das próteses (envio, retorno, prazos)

### Financeiro
- **Faturamentos** — registro e detalhamento de receitas
- **Financeiro do consultório** — visão mensal e anual
- **Financeiro do paciente** — situação financeira individual
- **Financeiro pessoal** — controle separado por usuário
- **Configurações financeiras** — parâmetros e categorias

### Plataforma
- **Login seguro (JWT)** com perfis: Admin, Dentista, Recepcionista, Financeiro
- **Busca global** — localização rápida em todo o sistema
- **Gestão de usuários** — controle de acessos (somente Admin)

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| Backend | FastAPI + Uvicorn (Python 3.11+) |
| Frontend | React 18 + Vite + Tailwind CSS v4 |
| Banco de dados | PostgreSQL via Supabase (PostgREST) |
| Autenticação | JWT (`python-jose`) + bcrypt (custo 12) |
| Validação | Pydantic V2 |
| HTTP client | Axios com interceptors de JWT |

---

## 🏗️ Arquitetura

```
┌──────────────────────────┐      ┌──────────────────────────┐
│  Frontend (React + Vite) │ ───► │  Backend (FastAPI)       │
│  React Router · Axios    │ JWT  │  Routers por domínio     │
│  Tailwind CSS v4         │ ◄─── │  Pydantic · python-jose  │
└──────────────────────────┘      └────────────┬─────────────┘
                                                │ PostgREST
                                                ▼
                                   ┌──────────────────────────┐
                                   │  Supabase (PostgreSQL)   │
                                   └──────────────────────────┘
```

### Principais endpoints (API REST)

| Prefixo | Módulo |
|---|---|
| `POST /auth/login` · `GET /auth/me` | Autenticação |
| `/api/pacientes` | Pacientes |
| `/api/dentistas` | Dentistas |
| `/api/agendamentos` | Agendamentos |
| `/api/procedimentos` | Procedimentos |
| `/api/tratamentos` | Tratamentos clínicos |
| `/api/odontograma` | Odontograma |
| `/api/anamneses` | Anamneses |
| `/api/protetico/laboratorios` | Laboratórios |
| `/api/protetico/ordens` | Controle protético |
| `/api/faturamentos` | Faturamentos |
| `/api/financeiro/consultorio` | Financeiro consultório |
| `/api/financeiro/pessoal` | Financeiro pessoal |
| `/api/financeiro/settings` | Configurações financeiras |

> Documentação interativa (Swagger) em `http://localhost:8000/docs`.

---

## 📁 Estrutura do projeto

```
consultorio-dentista/
├── backend/
│   ├── api/
│   │   ├── main.py                 # App FastAPI + registro de routers
│   │   └── routes/                 # Um router por domínio
│   │       ├── auth.py             # Login / JWT / usuários
│   │       ├── pacientes.py
│   │       ├── dentistas.py
│   │       ├── agendamentos.py
│   │       ├── procedimentos.py
│   │       ├── clin_tratamentos.py
│   │       ├── odontograma.py
│   │       ├── anamneses.py
│   │       ├── laboratorios.py
│   │       ├── ordens_proteticas.py
│   │       ├── faturamentos.py
│   │       ├── financeiro_consultorio.py
│   │       ├── financeiro_pessoal.py
│   │       └── financeiro_settings.py
│   └── config/
│       ├── settings.py             # Pydantic Settings (lê .env)
│       └── supabase_client.py      # Cliente PostgREST
├── frontend-react/
│   ├── src/
│   │   ├── components/             # Componentes (Odontograma, Sidebar, modais, busca)
│   │   ├── pages/                  # Telas (Dashboard, Pacientes, Financeiro, etc.)
│   │   ├── services/api.js         # Axios + interceptors JWT
│   │   └── App.jsx                 # React Router
│   ├── package.json
│   └── vite.config.js
├── database/
│   ├── schema.sql                  # Tabelas principais
│   ├── schema_financeiro.sql       # Tabelas financeiras
│   └── schema_auth.sql             # Tabela de usuários + admin inicial
├── .env.example                    # Modelo de variáveis de ambiente
├── requirements.txt
├── criar_admin.py                  # CLI para criar usuário admin
├── start_backend.py · start_frontend.py · start.bat
└── README.md
```

---

## 🚀 Como rodar localmente

### Pré-requisitos
- Python **3.11+** e Node.js **18+**
- Um projeto no [Supabase](https://supabase.com) (plano gratuito)

### 1. Clonar e instalar o backend
```bash
git clone https://github.com/RaulRMO10/consultorio-dentista.git
cd consultorio-dentista

python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # Linux/macOS

pip install -r requirements.txt
```

### 2. Configurar variáveis de ambiente
```bash
copy .env.example .env           # Windows  (cp no Linux/macOS)
```
Edite o `.env` com suas credenciais do Supabase:
```env
SUPABASE_URL=https://<seu_project_id>.supabase.co
SUPABASE_KEY=<sua_service_role_key>
JWT_SECRET_KEY=<chave_forte>      # python -c "import secrets; print(secrets.token_hex(32))"
```
> 🔑 No Supabase: `Settings → API` (URL e keys) e `Settings → Database` (senha).

### 3. Criar as tabelas
No **SQL Editor** do Supabase, execute na ordem:
1. `database/schema.sql`
2. `database/schema_financeiro.sql`
3. `database/schema_auth.sql` (cria a tabela `usuarios` + admin inicial)

> O `schema_auth.sql` cria um **admin padrão** — **altere a senha no primeiro acesso.**

### 4. Iniciar
```bash
# Windows (tudo de uma vez)
start.bat

# ou manualmente, em dois terminais:
python start_backend.py     # API   → http://localhost:8000  (docs em /docs)
python start_frontend.py    # React → http://localhost:5173
```

Para criar usuários via CLI:
```bash
python criar_admin.py --email "dentista@clinica.com" --nome "Dr. Silva" --role dentista
```

---

## 🔒 Segurança

- Credenciais apenas em variáveis de ambiente (`.env` no `.gitignore`)
- Senhas com **bcrypt** (custo 12)
- **JWT** com expiração configurável (padrão 8h)
- Sem valores sensíveis hardcoded no código
- Controle de acesso por **perfil de usuário**

---

## 📦 Deploy sugerido

| Serviço | Uso |
|---|---|
| [Render](https://render.com) / [Railway](https://railway.app) | Backend FastAPI |
| [Vercel](https://vercel.com) / [Netlify](https://netlify.com) | Frontend React |
| [Supabase](https://supabase.com) | Banco PostgreSQL |

Em produção, no `.env`: `DEBUG=False` e um `JWT_SECRET_KEY` forte.

---

## 👤 Autor

**Raul Martins** · [GitHub @RaulRMO10](https://github.com/RaulRMO10) · [LinkedIn](https://www.linkedin.com/in/raulrmo/)

**Versão:** 2.0.0 — FastAPI + React + Vite + Tailwind CSS + Supabase
