"""
Página de Agendamentos
"""
import streamlit as st
import requests
import pandas as pd
from datetime import datetime, timedelta

st.set_page_config(page_title="Agendamentos", page_icon="📅", layout="wide")

API_URL = "http://localhost:8000"

st.title("📅 Gerenciamento de Agendamentos")
st.markdown("---")

# Tabs
tab1, tab2 = st.tabs(["📋 Lista de Agendamentos", "➕ Novo Agendamento"])

# Tab 1: Lista
with tab1:
    st.subheader("Agendamentos")
    
    # Filtros
    col1, col2, col3 = st.columns(3)
    with col1:
        filtro_status = st.selectbox(
            "Filtrar por status",
            ["Todos", "agendado", "confirmado", "em_atendimento", "concluido", "cancelado", "falta"]
        )
    
    try:
        params = {} if filtro_status == "Todos" else {"status": filtro_status}
        response = requests.get(f"{API_URL}/api/agendamentos", params=params)
        
        if response.status_code == 200:
            agendamentos = response.json()
            
            if agendamentos:
                # Converter para DataFrame
                df = pd.DataFrame(agendamentos)
                df['data_hora'] = pd.to_datetime(df['data_hora'])
                df = df.sort_values('data_hora', ascending=False)
                
                # Exibir
                for _, ag in df.head(20).iterrows():
                    with st.expander(
                        f"🕐 {ag['data_hora'].strftime('%d/%m/%Y %H:%M')} - Status: {ag['status']}"
                    ):
                        col1, col2, col3 = st.columns(3)
                        with col1:
                            st.write(f"**Paciente ID:** {ag['paciente_id']}")
                        with col2:
                            st.write(f"**Dentista ID:** {ag['dentista_id']}")
                        with col3:
                            st.write(f"**Duração:** {ag['duracao_minutos']} min")
                        
                        if ag.get('observacoes'):
                            st.info(f"📝 {ag['observacoes']}")
                        
                        # Ações
                        col_btn1, col_btn2, col_btn3 = st.columns(3)
                        with col_btn1:
                            if st.button(f"✅ Confirmar", key=f"conf_{ag['id']}"):
                                st.success("Funcionalidade em desenvolvimento")
                        with col_btn2:
                            if st.button(f"✏️ Editar", key=f"edit_{ag['id']}"):
                                st.info("Funcionalidade em desenvolvimento")
                        with col_btn3:
                            if st.button(f"❌ Cancelar", key=f"canc_{ag['id']}"):
                                st.warning("Funcionalidade em desenvolvimento")
                
                st.info(f"📊 Total: {len(df)} agendamentos")
            else:
                st.info("Nenhum agendamento cadastrado.")
        else:
            st.error("Erro ao carregar agendamentos.")
    
    except Exception as e:
        st.error(f"Erro: {str(e)}")

# Tab 2: Novo
with tab2:
    st.subheader("Novo Agendamento")
    
    # Carregar dentistas e pacientes
    try:
        dentistas = requests.get(f"{API_URL}/api/dentistas", params={"ativo": True}).json()
        pacientes = requests.get(f"{API_URL}/api/pacientes", params={"ativo": True}).json()
        
        with st.form("form_agendamento"):
            # Selecionar paciente
            paciente_opcoes = {p['nome']: p['id'] for p in pacientes}
            paciente_selecionado = st.selectbox(
                "Paciente *",
                options=list(paciente_opcoes.keys()) if pacientes else []
            )
            
            # Selecionar dentista
            dentista_opcoes = {f"{d['nome']} - {d['especialidade']}": d['id'] for d in dentistas}
            dentista_selecionado = st.selectbox(
                "Dentista *",
                options=list(dentista_opcoes.keys()) if dentistas else []
            )
            
            # Data e hora
            col1, col2 = st.columns(2)
            with col1:
                data = st.date_input("Data *", min_value=datetime.now().date())
            with col2:
                hora = st.time_input("Horário *", value=datetime.now().time())
            
            duracao = st.slider("Duração (minutos)", 15, 180, 60, 15)
            observacoes = st.text_area("Observações")
            
            submitted = st.form_submit_button("📅 Agendar", use_container_width=True)
            
            if submitted:
                if not paciente_selecionado or not dentista_selecionado:
                    st.error("⚠️ Selecione paciente e dentista!")
                else:
                    try:
                        data_hora = datetime.combine(data, hora)
                        
                        data_agendamento = {
                            "paciente_id": paciente_opcoes[paciente_selecionado],
                            "dentista_id": dentista_opcoes[dentista_selecionado],
                            "data_hora": data_hora.isoformat(),
                            "duracao_minutos": duracao,
                            "status": "agendado",
                            "observacoes": observacoes if observacoes else None
                        }
                        
                        response = requests.post(f"{API_URL}/api/agendamentos", json=data_agendamento)
                        
                        if response.status_code == 201:
                            st.success("✅ Agendamento criado com sucesso!")
                            st.balloons()
                        elif response.status_code == 400:
                            st.error(f"❌ {response.json().get('detail', 'Erro no agendamento')}")
                        else:
                            st.error("❌ Erro ao criar agendamento.")
                    
                    except Exception as e:
                        st.error(f"Erro: {str(e)}")
    
    except Exception as e:
        st.error(f"Erro ao carregar dados: {str(e)}")
