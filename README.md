# 🦷 Sistema de Consultório Dentista

Sistema completo de gestão para consultórios odontológicos desenvolvido com FastAPI, Streamlit e PostgreSQL (Supabase).

## 🚀 Tecnologias

- **Backend:** FastAPI (Python 3.11+)
- **Frontend:** Streamlit
- **Banco de Dados:** PostgreSQL (Supabase)
- **ORM:** SQLAlchemy 2.0
- **Validação:** Pydantic V2

## 📋 Funcionalidades

### ✅ Implementadas
- ✔️ Cadastro de Pacientes
- ✔️ Cadastro de Dentistas
- ✔️ Cadastro de Procedimentos
- ✔️ Sistema de Agendamentos
- ✔️ API REST completa
- ✔️ Interface web intuitiva

### 🚧 Em Desenvolvimento
- ⏳ Prontuário Eletrônico
- ⏳ Controle Financeiro
- ⏳ Relatórios e Dashboards
- ⏳ Sistema de Notificações
- ⏳ Upload de Documentos/Raio-X

## 📁 Estrutura do Projeto

```
Consultorio Dentista/
├── backend/
│   ├── api/              # Rotas da API
│   │   ├── main.py       # Aplicação FastAPI
│   │   └── routes/       # Endpoints por módulo
│   ├── models/           # Modelos SQLAlchemy
│   ├── services/         # Serviços (Database, etc)
│   └── config/           # Configurações
├── frontend/
│   ├── app.py            # Dashboard principal
│   └── pages/            # Páginas do Streamlit
├── database/
│   └── schema.sql        # Schema do banco
├── .env.example          # Exemplo de variáveis de ambiente
├── requirements.txt      # Dependências Python
├── setup_database.py     # Script de setup do DB
├── start_backend.py      # Iniciar API
├── start_frontend.py     # Iniciar interface
└── start.bat             # Iniciar tudo (Windows)
```

## 🔧 Instalação e Configuração

### 1. Pré-requisitos
- Python 3.11 ou superior
- PostgreSQL (ou conta no Supabase)
- Git (opcional)

### 2. Clonar o Projeto

```bash
# Se estiver usando Git
git clone <url-do-repositorio>
cd "Consultorio Dentista"

# Ou simplesmente navegue até a pasta do projeto
```

### 3. Criar Ambiente Virtual

```bash
# Windows
python -m venv .venv
.venv\Scripts\activate

# Linux/Mac
python3 -m venv .venv
source .venv/bin/activate
```

### 4. Instalar Dependências

```bash
pip install -r requirements.txt
```

### 5. Configurar Variáveis de Ambiente

Copie o arquivo `.env.example` para `.env` e configure:

```bash
copy .env.example .env   # Windows
# ou
cp .env.example .env     # Linux/Mac
```

Edite o arquivo `.env` com suas credenciais do banco:

```env
DB_HOST=seu_host.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=sua_senha
```

### 6. Configurar Banco de Dados

Execute o script de setup para criar as tabelas:

```bash
python setup_database.py
```

Isso irá criar todas as tabelas necessárias e inserir dados iniciais.

## 🎮 Como Usar

### Opção 1: Iniciar Tudo de Uma Vez (Windows)

```bash
start.bat
```

Isso iniciará automaticamente:
- Backend API na porta 8000
- Frontend Streamlit na porta 8501

### Opção 2: Iniciar Manualmente

#### Iniciar Backend (Terminal 1)

```bash
python start_backend.py
```

API disponível em:
- **URL:** http://localhost:8000
- **Documentação:** http://localhost:8000/docs (Swagger UI)
- **Health Check:** http://localhost:8000/health

#### Iniciar Frontend (Terminal 2)

```bash
python start_frontend.py
```

Interface disponível em:
- **URL:** http://localhost:8501

## 📚 Documentação da API

Acesse a documentação interativa (Swagger) em: http://localhost:8000/docs

### Endpoints Principais

#### Pacientes
- `GET /api/pacientes` - Listar pacientes
- `GET /api/pacientes/{id}` - Obter paciente específico
- `POST /api/pacientes` - Criar paciente
- `PUT /api/pacientes/{id}` - Atualizar paciente
- `DELETE /api/pacientes/{id}` - Desativar paciente

#### Dentistas
- `GET /api/dentistas` - Listar dentistas
- `POST /api/dentistas` - Criar dentista
- (... demais endpoints similares)

#### Agendamentos
- `GET /api/agendamentos` - Listar agendamentos
- `POST /api/agendamentos` - Criar agendamento
- (... demais endpoints similares)

#### Procedimentos
- `GET /api/procedimentos` - Listar procedimentos
- `POST /api/procedimentos` - Criar procedimento
- (... demais endpoints similares)

## 🗄️ Estrutura do Banco de Dados

### Tabelas Principais

1. **dentistas** - Cadastro de profissionais
2. **pacientes** - Cadastro de pacientes
3. **procedimentos** - Catálogo de procedimentos
4. **agendamentos** - Agenda de consultas
5. **atendimentos** - Registro de atendimentos
6. **atendimentos_procedimentos** - Procedimentos realizados
7. **financeiro** - Controle financeiro
8. **historico_odontologico** - Histórico dos pacientes

### Relacionamentos

- Um **paciente** pode ter vários **agendamentos**
- Um **dentista** pode ter vários **agendamentos**
- Um **agendamento** pode gerar um **atendimento**
- Um **atendimento** pode ter vários **procedimentos**
- Um **atendimento** tem um registro **financeiro**

## 🔐 Segurança

- ✅ Variáveis de ambiente para credenciais
- ✅ Validação com Pydantic
- ✅ Soft delete (não remove dados, apenas desativa)
- ✅ CORS configurado
- ⏳ Autenticação JWT (em desenvolvimento)

## 🚀 Deploy

### Preparar para Deploy

1. **Criar arquivo .env de produção**
2. **Configurar variável DEBUG=False**
3. **Usar servidor WSGI (ex: Gunicorn)**

### Opções de Hospedagem Gratuita

#### Backend (FastAPI)
- Railway.app
- Render.com
- Fly.io

#### Frontend (Streamlit)
- Streamlit Cloud
- Railway.app

#### Banco de Dados
- Supabase (já configurado)
- Neon.tech
- ElephantSQL

## 🛠️ Desenvolvimento

### Adicionar Nova Funcionalidade

1. Criar modelo em `backend/models/models.py`
2. Criar rota em `backend/api/routes/`
3. Criar página em `frontend/pages/`
4. Documentar no README

### Executar com Live Reload

O FastAPI já está configurado com reload automático:

```bash
python start_backend.py
```

O Streamlit também recarrega automaticamente ao salvar arquivos.

## 📝 Logs

- Logs da aplicação: console
- Logs de erros: verificar terminal

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT.

## 👥 Autor

Desenvolvido para consultório odontológico.

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique a documentação
2. Consulte os logs
3. Abra uma issue no GitHub

---

**Versão:** 1.0.0  
**Data:** Fevereiro 2026  
**Status:** ✅ Em Produção Local
