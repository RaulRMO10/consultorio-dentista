"""
Componente de Sidebar compartilhado — OdontoSystem
Importar em todas as páginas:
    from components.sidebar import render_sidebar
    render_sidebar()
"""
import streamlit as st
import requests
from datetime import datetime
from components.auth import logout, ROLE_LABELS

API_URL = "http://localhost:8000"

# CSS do sidebar (injetado uma vez por página)
SIDEBAR_CSS = """
<style>
/* ── Oculta nav automática do Streamlit ─────────────────────────────── */
[data-testid="stSidebarNav"] { display: none !important; }

/* ── Sidebar background ─────────────────────────────────────────────── */
[data-testid="stSidebar"] {
    background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%) !important;
    border-right: 1px solid #334155;
}
[data-testid="stSidebar"] * { color: #e2e8f0 !important; }

/* ── Brand box ───────────────────────────────────────────────────────── */
.brand-box {
    display: flex; align-items: center; gap: 10px;
    padding: .25rem .25rem .25rem;
}
.brand-icon {
    font-size: 1.7rem; line-height: 1;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    border-radius: 10px; padding: 5px 9px; display: inline-block;
    flex-shrink: 0;
}
.brand-name { font-size: 1rem; font-weight: 700; color: #f8fafc !important; }
.brand-sub  { font-size: .68rem; color: #94a3b8 !important; font-weight: 400; }

/* ── Link do brand (Home) ────────────────────────────────────────────── */
[data-testid="stSidebar"] [data-testid="stPageLink-NavLink"].brand-link {
    padding: .4rem .5rem !important;
    border-radius: 10px !important;
    margin: 0 0 .1rem !important;
    transition: background .2s !important;
}
[data-testid="stSidebar"] [data-testid="stPageLink-NavLink"].brand-link:hover {
    background: rgba(99,102,241,.15) !important;
}

/* ── Separador colorido ──────────────────────────────────────────────── */
.nav-divider {
    height: 3px;
    background: linear-gradient(90deg, #6366f1, #8b5cf6, #ec4899);
    border-radius: 2px;
    margin: .3rem .5rem .6rem;
}

/* ── Seção de nav ────────────────────────────────────────────────────── */
.nav-section {
    font-size: .62rem; font-weight: 700; color: #64748b !important;
    text-transform: uppercase; letter-spacing: .1em;
    padding: .6rem .75rem .2rem;
}

/* ── Links de navegação ──────────────────────────────────────────────── */
[data-testid="stSidebar"] [data-testid="stPageLink-NavLink"] {
    border-radius: 8px !important;
    margin: 1px 8px !important;
    padding: 8px 12px !important;
    transition: all .2s ease !important;
    color: #cbd5e1 !important;
    font-size: .86rem !important;
    font-weight: 500 !important;
}
[data-testid="stSidebar"] [data-testid="stPageLink-NavLink"]:hover {
    background: rgba(99,102,241,.2) !important;
    color: #a5b4fc !important;
}
[data-testid="stSidebar"] [data-testid="stPageLink-NavLink"][aria-current="page"] {
    background: linear-gradient(90deg,rgba(99,102,241,.35),rgba(139,92,246,.2)) !important;
    color: #c7d2fe !important;
    border-left: 3px solid #6366f1 !important;
}

/* ── Status badge ────────────────────────────────────────────────────── */
.status-dot-on  { display:inline-block; width:8px; height:8px; border-radius:50%;
                  background:#22c55e; margin-right:6px; animation:pulse 2s infinite; }
.status-dot-off { display:inline-block; width:8px; height:8px; border-radius:50%;
                  background:#ef4444; margin-right:6px; }
@keyframes pulse {
    0%,100% { opacity:1; box-shadow:0 0 0 0 rgba(34,197,94,.4); }
    50%      { opacity:.8; box-shadow:0 0 0 4px rgba(34,197,94,0); }
}
.sb-status {
    display:flex; align-items:center; font-size:.76rem;
    padding:.45rem .75rem; margin:.1rem .5rem;
    border-radius:8px; background:rgba(255,255,255,.05);
}
.sb-footer {
    font-size:.64rem; color:#475569 !important;
    padding:.35rem .75rem 1rem;
}
/* ── User card ────────────────────────────────────────────── */
.user-card {
    background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.08);
    border-radius: 10px; padding: .6rem .75rem; margin: .1rem .5rem .1rem;
    display: flex; align-items: center; gap: 10px;
}
.user-avatar {
    width: 34px; height: 34px; border-radius: 50%; flex-shrink: 0;
    background: linear-gradient(135deg,#6366f1,#8b5cf6);
    display: flex; align-items: center; justify-content: center;
    font-size: 1rem;
}
.user-name  { font-size:.82rem; font-weight:600; color:#f1f5f9 !important;
              white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.user-role  { font-size:.68rem; color:#94a3b8 !important; margin-top:1px; }

/* ── Logout button ───────────────────────────────────────── */
[data-testid="stSidebar"] div[data-testid="stButton"] > button {
    background: rgba(239,68,68,.15) !important;
    border: 1px solid rgba(239,68,68,.3) !important;
    color: #fca5a5 !important; border-radius: 8px !important;
    font-size: .8rem !important; font-weight: 600 !important;
    transition: all .2s !important;
}
[data-testid="stSidebar"] div[data-testid="stButton"] > button:hover {
    background: rgba(239,68,68,.3) !important; color: #fff !important;
}
/* ── Scrollbar ───────────────────────────────────────────────────────── */
[data-testid="stSidebar"]::-webkit-scrollbar { width:4px; }
[data-testid="stSidebar"]::-webkit-scrollbar-thumb { background:#334155; border-radius:2px; }
</style>
"""


def _check_api() -> bool:
    try:
        r = requests.get(f"{API_URL}/health", timeout=2)
        return r.status_code == 200
    except Exception:
        return False


def render_sidebar() -> None:
    """Renderiza o sidebar completo com navegação e status da API."""
    st.markdown(SIDEBAR_CSS, unsafe_allow_html=True)

    with st.sidebar:
        # ── Logo / Brand ───────────────────────────────────────────────────
        st.markdown("""
        <div style="padding:.6rem .25rem .3rem;">
            <div class="brand-box">
                <div class="brand-icon">🦷</div>
                <div>
                    <div class="brand-name">OdontoSystem</div>
                    <div class="brand-sub">Gestão Odontológica</div>
                </div>
            </div>
        </div>
        """, unsafe_allow_html=True)

        st.markdown('<div class="nav-divider"></div>', unsafe_allow_html=True)

        # ── Seção Principal (com Dashboard/Home como 1º item) ─────────────
        st.markdown('<div class="nav-section">Principal</div>', unsafe_allow_html=True)
        st.page_link("app.py",                   label="🏠  Dashboard")
        st.page_link("pages/1_Pacientes.py",     label="👥  Pacientes")
        st.page_link("pages/2_Dentistas.py",     label="🦷  Dentistas")
        st.page_link("pages/3_Agendamentos.py",  label="📅  Agendamentos")
        st.page_link("pages/4_Procedimentos.py", label="💉  Procedimentos")

        # ── Seção Financeiro ───────────────────────────────────────────────
        st.markdown('<div class="nav-section">Financeiro</div>', unsafe_allow_html=True)
        st.page_link("pages/5_Fin_Consultorio.py", label="💼  Consultório")
        st.page_link("pages/6_Fin_Pessoal.py",     label="👤  Pessoal")

        # ── Configurações (admin) ──────────────────────────────────────────
        user_sess = st.session_state.get("user", {})
        if user_sess.get("role") == "admin":
            st.markdown('<div class="nav-section">Configurações</div>', unsafe_allow_html=True)
            st.page_link("pages/7_Usuarios.py", label="🔐  Usuários")

        # ── User card + Logout ─────────────────────────────────────────────
        st.markdown("---")
        user = st.session_state.get("user", {})
        role_key = user.get("role", "recepcionista")
        role_ico, role_lbl = ROLE_LABELS.get(role_key, ("👤", role_key.capitalize()))
        nome = user.get("nome", "Usuário")
        iniciais = "".join(p[0].upper() for p in nome.split()[:2]) if nome else "U"

        st.markdown(f"""
        <div class="user-card">
            <div class="user-avatar">{iniciais}</div>
            <div style="min-width:0;flex:1;">
                <div class="user-name">{nome}</div>
                <div class="user-role">{role_ico} {role_lbl}</div>
            </div>
        </div>
        """, unsafe_allow_html=True)

        if st.button("🚭  Sair", use_container_width=True, key="sidebar_logout"):
            logout()

        # ── Status API ────────────────────────────────────────
        api_on  = _check_api()
        dot_cls = "status-dot-on" if api_on else "status-dot-off"
        api_txt = "API Online" if api_on else "API Offline"
        api_cor = "#86efac" if api_on else "#fca5a5"

        st.markdown(f"""
        <div class="sb-status">
            <span class="{dot_cls}"></span>
            <span style="color:{api_cor} !important; font-size:.76rem;">{api_txt}</span>
        </div>
        <div class="sb-footer">
            v1.0 &nbsp;·&nbsp; {datetime.now().strftime("%d/%m/%Y %H:%M")}
        </div>
        """, unsafe_allow_html=True)
