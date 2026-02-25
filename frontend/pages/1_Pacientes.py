"""
Página de Pacientes
"""
import streamlit as st
import requests
import pandas as pd
from datetime import date

st.set_page_config(page_title="Pacientes", page_icon="👥", layout="wide")

API_URL = "http://localhost:8000"

st.title("👥 Gerenciamento de Pacientes")
st.markdown("---")

# Tabs
tab1, tab2 = st.tabs(["📋 Lista de Pacientes", "➕ Cadastrar Novo"])

# Tab 1: Lista
with tab1:
    st.subheader("Lista de Pacientes")
    
    # Filtros
    col1, col2 = st.columns([3, 1])
    with col1:
        busca = st.text_input("🔍 Buscar paciente", placeholder="Nome, CPF...")
    with col2:
        mostrar_inativos = st.checkbox("Mostrar inativos")
    
    try:
        # Buscar pacientes
        params = {} if mostrar_inativos else {"ativo": True}
        response = requests.get(f"{API_URL}/api/pacientes", params=params)
        
        if response.status_code == 200:
            pacientes = response.json()
            
            if pacientes:
                df = pd.DataFrame(pacientes)
                
                # Aplicar busca
                if busca:
                    df = df[
                        df['nome'].str.contains(busca, case=False, na=False) |
                        df['cpf'].str.contains(busca, case=False, na=False)
                    ]
                
                # Formatar dados
                df_display = df[[
                    'nome', 'cpf', 'telefone', 'email', 'cidade', 'ativo'
                ]].copy()
                
                df_display['ativo'] = df_display['ativo'].map({True: '✅', False: '❌'})
                
                st.dataframe(
                    df_display,
                    use_container_width=True,
                    hide_index=True,
                    column_config={
                        "nome": "Nome",
                        "cpf": "CPF",
                        "telefone": "Telefone",
                        "email": "Email",
                        "cidade": "Cidade",
                        "ativo": st.column_config.TextColumn("Status", width="small")
                    }
                )
                
                st.info(f"📊 Total: {len(df)} pacientes")
            else:
                st.info("Nenhum paciente cadastrado ainda.")
        else:
            st.error("Erro ao carregar pacientes.")
    
    except Exception as e:
        st.error(f"Erro: {str(e)}")

# Tab 2: Cadastrar
with tab2:
    st.subheader("Cadastrar Novo Paciente")
    
    with st.form("form_paciente"):
        col1, col2 = st.columns(2)
        
        with col1:
            nome = st.text_input("Nome Completo *", max_chars=200)
            cpf = st.text_input("CPF", max_chars=14, placeholder="000.000.000-00")
            data_nascimento = st.date_input("Data de Nascimento", min_value=date(1900, 1, 1))
            telefone = st.text_input("Telefone *", max_chars=20, placeholder="(00) 0000-0000")
            celular = st.text_input("Celular", max_chars=20, placeholder="(00) 00000-0000")
        
        with col2:
            email = st.text_input("Email", max_chars=150)
            endereco = st.text_area("Endereço", max_chars=500)
            col_cidade, col_estado = st.columns([3, 1])
            with col_cidade:
                cidade = st.text_input("Cidade", max_chars=100)
            with col_estado:
                estado = st.text_input("UF", max_chars=2)
            cep = st.text_input("CEP", max_chars=10, placeholder="00000-000")
        
        observacoes = st.text_area("Observações", max_chars=1000)
        
        submitted = st.form_submit_button("💾 Cadastrar Paciente", use_container_width=True)
        
        if submitted:
            if not nome or not telefone:
                st.error("⚠️ Nome e Telefone são obrigatórios!")
            else:
                try:
                    data = {
                        "nome": nome,
                        "cpf": cpf if cpf else None,
                        "data_nascimento": str(data_nascimento) if data_nascimento else None,
                        "telefone": telefone,
                        "celular": celular if celular else None,
                        "email": email if email else None,
                        "endereco": endereco if endereco else None,
                        "cidade": cidade if cidade else None,
                        "estado": estado if estado else None,
                        "cep": cep if cep else None,
                        "observacoes": observacoes if observacoes else None,
                        "ativo": True
                    }
                    
                    response = requests.post(f"{API_URL}/api/pacientes", json=data)
                    
                    if response.status_code == 201:
                        st.success("✅ Paciente cadastrado com sucesso!")
                        st.balloons()
                    elif response.status_code == 400:
                        st.error(f"❌ {response.json().get('detail', 'Erro no cadastro')}")
                    else:
                        st.error("❌ Erro ao cadastrar paciente.")
                
                except Exception as e:
                    st.error(f"Erro: {str(e)}")
