# 🦷 Consultório Dentista - Guia Rápido

## 🚀 Quick Start (3 passos)

### 1️⃣ Instalar Dependências
```bash
pip install -r requirements.txt
```

### 2️⃣ Configurar Banco
```bash
python setup_database.py
```

### 3️⃣ Iniciar Sistema
```bash
start.bat
```

## 🌐 Acessos

- **Frontend:** http://localhost:8501
- **API:** http://localhost:8000
- **Docs:** http://localhost:8000/docs

## 📦 O que foi criado?

### Backend (FastAPI)
- ✅ API REST completa
- ✅ CRUD de Pacientes
- ✅ CRUD de Dentistas  
- ✅ CRUD de Agendamentos
- ✅ CRUD de Procedimentos
- ✅ Documentação Swagger automática
- ✅ Validação de dados com Pydantic
- ✅ Conexão com Supabase PostgreSQL

### Frontend (Streamlit)
- ✅ Dashboard principal
- ✅ Gestão de Pacientes
- ✅ Gestão de Dentistas
- ✅ Sistema de Agendamentos
- ✅ Catálogo de Procedimentos
- ✅ Interface responsiva e intuitiva

### Banco de Dados
- ✅ 8 tabelas relacionadas
- ✅ Triggers automáticos
- ✅ Índices otimizados
- ✅ Dados de exemplo
- ✅ Soft delete

## 🎯 Próximos Passos

1. **Testar o Sistema**
   - Cadastrar pacientes
   - Cadastrar dentistas
   - Criar agendamentos

2. **Personalizar**
   - Ajustar procedimentos
   - Modificar campos conforme necessidade
   - Adicionar logo/cores

3. **Expandir**
   - Implementar prontuário eletrônico
   - Adicionar controle financeiro
   - Criar relatórios

4. **Deploy**
   - Quando estiver pronto, podemos fazer deploy gratuito na cloud

## 🆘 Problemas Comuns

### API não inicia
```bash
# Verificar se a porta 8000 está livre
# Windows: netstat -ano | findstr :8000
# Se estiver em uso, matar o processo ou mudar a porta
```

### Erro de conexão com banco
```bash
# Verificar credenciais no arquivo .env
# Testar conexão: python setup_database.py
```

### Frontend não carrega dados
```bash
# Certificar que o backend está rodando
# Verificar em http://localhost:8000/health
```

## 📞 Comandos Úteis

```bash
# Instalar dependências
pip install -r requirements.txt

# Setup do banco
python setup_database.py

# Iniciar backend
python start_backend.py

# Iniciar frontend
python start_frontend.py

# Iniciar tudo (Windows)
start.bat
```

## 🎨 Personalização

### Mudar cores do Streamlit
Criar arquivo `.streamlit/config.toml`:
```toml
[theme]
primaryColor = "#1E90FF"
backgroundColor = "#FFFFFF"
secondaryBackgroundColor = "#F0F2F6"
```

### Adicionar logo
Colocar imagem em `frontend/assets/logo.png`

## 📊 Status do Projeto

- ✅ **Backend:** 100% funcional
- ✅ **Frontend:** 100% funcional  
- ✅ **Banco:** 100% configurado
- 🚧 **Prontuário:** Em desenvolvimento
- 🚧 **Financeiro:** Em desenvolvimento
- 🚧 **Relatórios:** Planejado

---

**Desenvolvido com ❤️ para consultório dentista**
