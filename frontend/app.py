"""
Frontend Streamlit - Consultório Dentista
Dashboard Principal
"""
import streamlit as st
import requests
from datetime import datetime

# Configuração da página
st.set_page_config(
    page_title="Consultório Dentista",
    page_icon="🦷",
    layout="wide",
    initial_sidebar_state="expanded"
)

# URL da API
API_URL = "http://localhost:8000"


def check_api_status():
    """Verifica se a API está online"""
    try:
        response = requests.get(f"{API_URL}/health", timeout=2)
        return response.status_code == 200
    except:
        return False


def main():
    # Sidebar
    with st.sidebar:
        st.title("🦷 Consultório Dentista")
        st.markdown("---")
        st.markdown("### Menu Principal")
        st.page_link("app.py", label="🏠 Dashboard")
        st.page_link("pages/1_Pacientes.py", label="👥 Pacientes")
        st.page_link("pages/2_Dentistas.py", label="👨‍⚕️ Dentistas")
        st.page_link("pages/3_Agendamentos.py", label="📅 Agendamentos")
        st.page_link("pages/4_Procedimentos.py", label="💉 Procedimentos")
        st.markdown("**💰 Financeiro**")
        st.page_link("pages/5_Fin_Consultorio.py", label="💼 Consultório")
        st.page_link("pages/6_Fin_Pessoal.py", label="👤 Pessoal")
        
        st.markdown("---")
        
        # Status da API
        api_status = check_api_status()
        if api_status:
            st.success("✅ API Online")
        else:
            st.error("❌ API Offline")
            st.info("Execute: `python backend/api/main.py`")
    
    # Conteúdo principal
    st.title("🏥 Dashboard - Consultório Dentista")
    st.markdown("---")
    
    if not check_api_status():
        st.error("⚠️ API não está rodando! Inicie o backend primeiro.")
        st.code("cd backend/api && python main.py", language="bash")
        return
    
    # Métricas resumidas
    col1, col2, col3, col4 = st.columns(4)
    
    try:
        # Buscar dados da API
        pacientes = requests.get(f"{API_URL}/api/pacientes", params={"ativo": True}).json()
        dentistas = requests.get(f"{API_URL}/api/dentistas", params={"ativo": True}).json()
        agendamentos = requests.get(f"{API_URL}/api/agendamentos").json()
        procedimentos = requests.get(f"{API_URL}/api/procedimentos", params={"ativo": True}).json()
        
        with col1:
            st.metric("👥 Pacientes Ativos", len(pacientes))
        
        with col2:
            st.metric("👨‍⚕️ Dentistas Ativos", len(dentistas))
        
        with col3:
            agendamentos_hoje = [a for a in agendamentos if a["status"] in ["agendado", "confirmado"]]
            st.metric("📅 Agendamentos Ativos", len(agendamentos_hoje))
        
        with col4:
            st.metric("💉 Procedimentos", len(procedimentos))
        
        st.markdown("---")
        
        # Seção de agendamentos recentes
        st.subheader("📅 Próximos Agendamentos")
        
        if agendamentos:
            # Filtrar agendamentos futuros
            agendamentos_futuros = [
                a for a in agendamentos 
                if a["status"] in ["agendado", "confirmado"]
            ]
            
            if agendamentos_futuros:
                for ag in agendamentos_futuros[:5]:  # Mostrar apenas os próximos 5
                    data_hora = datetime.fromisoformat(ag["data_hora"].replace("Z", "+00:00"))
                    
                    with st.expander(f"🕐 {data_hora.strftime('%d/%m/%Y %H:%M')} - {ag.get('status', 'N/A')}"):
                        col1, col2 = st.columns(2)
                        with col1:
                            st.write(f"**Paciente ID:** {ag['paciente_id']}")
                            st.write(f"**Dentista ID:** {ag['dentista_id']}")
                        with col2:
                            st.write(f"**Duração:** {ag['duracao_minutos']} min")
                            st.write(f"**Status:** {ag['status']}")
                        
                        if ag.get('observacoes'):
                            st.info(f"📝 {ag['observacoes']}")
            else:
                st.info("Nenhum agendamento futuro encontrado.")
        else:
            st.info("Nenhum agendamento cadastrado ainda.")
        
        st.markdown("---")
        
        # Informações rápidas
        col1, col2 = st.columns(2)
        
        with col1:
            st.subheader("ℹ️ Informações do Sistema")
            st.write("- **Versão:** 1.0.0")
            st.write("- **Backend:** FastAPI")
            st.write("- **Banco:** PostgreSQL (Supabase)")
            st.write(f"- **API:** {API_URL}")
        
        with col2:
            st.subheader("🚀 Acesso Rápido")
            if st.button("➕ Novo Paciente", use_container_width=True):
                st.switch_page("pages/1_Pacientes.py")
            
            if st.button("📅 Novo Agendamento", use_container_width=True):
                st.switch_page("pages/3_Agendamentos.py")
            
            if st.button("📊 Documentação da API", use_container_width=True):
                st.link_button("Abrir Swagger", f"{API_URL}/docs", use_container_width=True)
    
    except Exception as e:
        st.error(f"Erro ao carregar dados: {str(e)}")


if __name__ == "__main__":
    main()
