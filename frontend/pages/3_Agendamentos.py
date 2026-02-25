import streamlit as st
import requests
import pandas as pd
from datetime import datetime, timedelta

st.set_page_config(page_title="Agendamentos", page_icon="📅", layout="wide")

API_URL = "http://localhost:8000"

st.title("📅 Gerenciamento de Agendamentos")
st.markdown("---")

# Funções Auxiliares
def get_status_visual(status):
    status_map = {
        "agendado": {"cor": "blue", "icone": "🕒", "texto": "Agendado"},
        "confirmado": {"cor": "green", "icone": "✅", "texto": "Confirmado"},
        "em_atendimento": {"cor": "orange", "icone": "🏥", "texto": "Em Atendimento"},
        "concluido": {"cor": "gray", "icone": "🏁", "texto": "Concluído"},
        "cancelado": {"cor": "red", "icone": "❌", "texto": "Cancelado"},
        "falta": {"cor": "red", "icone": "⚠️", "texto": "Falta"}
    }
    return status_map.get(status, {"cor": "blue", "icone": "❓", "texto": status.capitalize()})

def atualizar_status(agendamento_id, novo_status):
    try:
        response = requests.put(f"{API_URL}/api/agendamentos/{agendamento_id}", json={"status": novo_status})
        if response.status_code == 200:
            st.success(f"Status atualizado para {novo_status}!")
            st.rerun()
        else:
            st.error(f"Erro ao atualizar status: {response.json().get('detail', 'Erro desconhecido')}")
    except Exception as e:
        st.error(f"Erro de conexão: {str(e)}")

@st.dialog("✏️ Editar Agendamento", width="large")
def modal_editar_agendamento(ag):
    st.write(f"Editando agendamento de **{ag['pacientes']['nome']}** com **{ag['dentistas']['nome']}**")
    
    # Pre-processar a data do agendamento
    data_hora_atual = pd.to_datetime(ag['data_hora'])
    
    col1, col2 = st.columns(2)
    with col1:
        nova_data = st.date_input("Data", value=data_hora_atual.date())
        # Converter para time() para o st.time_input
        nova_hora = st.time_input("Horário", value=data_hora_atual.time())
    with col2:
        nova_duracao = st.number_input("Duração (minutos)", value=ag['duracao_minutos'], min_value=15, step=15)
        novo_status = st.selectbox(
            "Status", 
            ["agendado", "confirmado", "em_atendimento", "concluido", "cancelado", "falta"],
            index=["agendado", "confirmado", "em_atendimento", "concluido", "cancelado", "falta"].index(ag['status'])
        )
    
    novas_observacoes = st.text_area("Observações", value=ag.get('observacoes', '') or '')
    
    if st.button("💾 Salvar Alterações", type="primary", use_container_width=True):
        nova_data_hora = datetime.combine(nova_data, nova_hora)
        dados_atualizados = {
            "data_hora": nova_data_hora.isoformat(),
            "duracao_minutos": nova_duracao,
            "status": novo_status,
            "observacoes": novas_observacoes if novas_observacoes else None
        }
        
        try:
            response = requests.put(f"{API_URL}/api/agendamentos/{ag['id']}", json=dados_atualizados)
            if response.status_code == 200:
                st.success("✅ Agendamento atualizado com sucesso!")
                # Em modais st.dialog o st.rerun() no Streamlit 1.41 recarrega a página fechando o modal
                st.rerun()
            else:
                st.error(f"Erro ao atualizar: {response.json().get('detail', 'Desconhecido')}")
        except Exception as e:
            st.error(f"Erro: {str(e)}")


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
                for _, ag in df.head(50).iterrows():
                    v_status = get_status_visual(ag['status'])
                    nome_paciente = ag['pacientes']['nome'] if isinstance(ag.get('pacientes'), dict) else "Paciente Desconhecido"
                    nome_dentista = ag['dentistas']['nome'] if isinstance(ag.get('dentistas'), dict) else "Dentista Desconhecido"
                    
                    titulo_expander = f"{v_status['icone']} **{ag['data_hora'].strftime('%d/%m/%Y %H:%M')}** | {nome_paciente} | :{v_status['cor']}[{v_status['texto']}]"
                    
                    with st.expander(titulo_expander):
                        col1, col2, col3 = st.columns(3)
                        with col1:
                            st.markdown(f"**👦 Paciente:** {nome_paciente}")
                        with col2:
                            st.markdown(f"**👨‍⚕️ Dentista:** {nome_dentista}")
                        with col3:
                            st.markdown(f"**⏱️ Duração:** {ag['duracao_minutos']} min")
                        
                        if ag.get('observacoes'):
                            st.info(f"📝 **Observações:** {ag['observacoes']}")
                        
                        # Ações
                        st.markdown("---")
                        col_auto = st.columns([1, 1, 1, 3])
                        with col_auto[0]:
                            if ag['status'] not in ['confirmado', 'concluido', 'cancelado', 'falta']:
                                if st.button("✅ Confirmar", key=f"conf_{ag['id']}", help="Confirmar presença"):
                                    atualizar_status(ag['id'], "confirmado")
                        with col_auto[1]:
                            if st.button("✏️ Editar", key=f"edit_{ag['id']}"):
                                modal_editar_agendamento(ag)
                        with col_auto[2]:
                            if ag['status'] not in ['cancelado', 'concluido']:
                                if st.button("❌ Cancelar", key=f"canc_{ag['id']}", help="Cancelar agendamento"):
                                    atualizar_status(ag['id'], "cancelado")
                
                st.info(f"📊 Mostrando {min(len(df), 50)} de {len(df)} agendamentos encontrados.")
            else:
                st.info("Nenhum agendamento cadastrado com os filtros selecionados.")
        else:
            st.error("Erro ao carregar agendamentos do servidor.")
    
    except Exception as e:
        st.error(f"Erro ao processar dados: {str(e)}")

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
            
            duracao = st.number_input("Duração (minutos)", min_value=15, max_value=180, value=60, step=15)
            observacoes = st.text_area("Observações")
            
            submitted = st.form_submit_button("📅 Agendar", type="primary", use_container_width=True)
            
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

