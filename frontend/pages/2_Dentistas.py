"""
Página de Dentistas
"""
import streamlit as st
import requests
import pandas as pd

st.set_page_config(page_title="Dentistas", page_icon="👨‍⚕️", layout="wide")

API_URL = "http://localhost:8000"

st.title("👨‍⚕️ Gerenciamento de Dentistas")
st.markdown("---")

# Tabs
tab1, tab2 = st.tabs(["📋 Lista de Dentistas", "➕ Cadastrar Novo"])

# Tab 1: Lista
with tab1:
    st.subheader("Lista de Dentistas")
    
    try:
        response = requests.get(f"{API_URL}/api/dentistas")
        
        if response.status_code == 200:
            dentistas = response.json()
            
            if dentistas:
                df = pd.DataFrame(dentistas)
                df_display = df[['nome', 'cro', 'especialidade', 'telefone', 'email', 'ativo']].copy()
                df_display['ativo'] = df_display['ativo'].map({True: '✅', False: '❌'})
                
                st.dataframe(
                    df_display,
                    use_container_width=True,
                    hide_index=True,
                    column_config={
                        "nome": "Nome",
                        "cro": "CRO",
                        "especialidade": "Especialidade",
                        "telefone": "Telefone",
                        "email": "Email",
                        "ativo": "Status"
                    }
                )
                st.info(f"📊 Total: {len(df)} dentistas")
            else:
                st.info("Nenhum dentista cadastrado ainda.")
        else:
            st.error("Erro ao carregar dentistas.")
    
    except Exception as e:
        st.error(f"Erro: {str(e)}")

# Tab 2: Cadastrar
with tab2:
    st.subheader("Cadastrar Novo Dentista")
    
    with st.form("form_dentista"):
        nome = st.text_input("Nome Completo *", max_chars=200)
        cro = st.text_input("CRO *", max_chars=50, placeholder="CRO-UF 00000")
        especialidade = st.selectbox(
            "Especialidade",
            [
                "Clínico Geral",
                "Ortodontia",
                "Endodontia",
                "Periodontia",
                "Implantodontia",
                "Odontopediatria",
                "Prótese Dentária",
                "Cirurgia Bucomaxilofacial",
                "Estomatologia",
                "Radiologia"
            ]
        )
        telefone = st.text_input("Telefone", max_chars=20)
        email = st.text_input("Email", max_chars=150)
        
        submitted = st.form_submit_button("💾 Cadastrar Dentista", use_container_width=True)
        
        if submitted:
            if not nome or not cro:
                st.error("⚠️ Nome e CRO são obrigatórios!")
            else:
                try:
                    data = {
                        "nome": nome,
                        "cro": cro,
                        "especialidade": especialidade if especialidade else None,
                        "telefone": telefone if telefone else None,
                        "email": email if email else None,
                        "ativo": True
                    }
                    
                    response = requests.post(f"{API_URL}/api/dentistas", json=data)
                    
                    if response.status_code == 201:
                        st.success("✅ Dentista cadastrado com sucesso!")
                        st.balloons()
                    elif response.status_code == 400:
                        st.error(f"❌ {response.json().get('detail', 'Erro no cadastro')}")
                    else:
                        st.error("❌ Erro ao cadastrar dentista.")
                
                except Exception as e:
                    st.error(f"Erro: {str(e)}")
