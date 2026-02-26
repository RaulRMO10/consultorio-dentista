"""
Frontend Streamlit - Consultório Dentista
Dashboard Principal
"""
import streamlit as st
import requests
from datetime import datetime, date
from components.sidebar import render_sidebar
from components.auth import require_login


st.set_page_config(
    page_title="OdontoSystem",
    page_icon="🦷",
    layout="wide",
    initial_sidebar_state="expanded",
)

require_login()


API_URL = "http://localhost:8000"

# ══════════════════════════════════════════════════════════════════════════════
# CSS GLOBAL
# ══════════════════════════════════════════════════════════════════════════════
st.markdown("""
<style>
/* ── Fonte & base ─────────────────────────────────────────────────────────── */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
html, body, [class*="css"] { font-family: 'Inter', sans-serif; }

/* ── Oculta nav automática do Streamlit ──────────────────────────────────── */
[data-testid="stSidebarNav"] { display: none !important; }

/* ── Sidebar ─────────────────────────────────────────────────────────────── */
[data-testid="stSidebar"] {
    background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%) !important;
    border-right: 1px solid #334155;
}
[data-testid="stSidebar"] * { color: #e2e8f0 !important; }

/* ── Logo / Brand ────────────────────────────────────────────────────────── */
.brand-box {
    display: flex; align-items: center; gap: 10px;
    padding: 1rem 0.5rem 0.5rem; margin-bottom: .25rem;
}
.brand-icon {
    font-size: 2rem; line-height: 1;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    border-radius: 12px; padding: 6px 10px; display: inline-block;
}
.brand-name { font-size: 1.1rem; font-weight: 700; color: #f8fafc !important; }
.brand-sub  { font-size: 0.7rem; color: #94a3b8 !important; font-weight: 400; }

/* ── Separador de seção ──────────────────────────────────────────────────── */
.nav-section {
    font-size: .65rem; font-weight: 700; color: #64748b !important;
    text-transform: uppercase; letter-spacing: .1em;
    padding: .75rem .75rem .25rem; margin-top: .25rem;
}

/* ── Links de navegação ──────────────────────────────────────────────────── */
[data-testid="stSidebar"] [data-testid="stPageLink-NavLink"] {
    border-radius: 8px !important;
    margin: 1px 8px !important;
    padding: 8px 12px !important;
    transition: all .2s ease !important;
    color: #cbd5e1 !important;
    text-decoration: none !important;
    font-size: .88rem !important;
    font-weight: 500 !important;
}
[data-testid="stSidebar"] [data-testid="stPageLink-NavLink"]:hover {
    background: rgba(99,102,241,.2) !important;
    color: #a5b4fc !important;
}
[data-testid="stSidebar"] [data-testid="stPageLink-NavLink"][aria-current="page"] {
    background: linear-gradient(90deg, rgba(99,102,241,.35), rgba(139,92,246,.2)) !important;
    color: #c7d2fe !important;
    border-left: 3px solid #6366f1 !important;
}

/* ── Status badge ────────────────────────────────────────────────────────── */
.status-dot-on  { display:inline-block; width:8px; height:8px;
                  border-radius:50%; background:#22c55e;
                  margin-right:6px; animation: pulse 2s infinite; }
.status-dot-off { display:inline-block; width:8px; height:8px;
                  border-radius:50%; background:#ef4444; margin-right:6px; }
@keyframes pulse {
    0%,100% { opacity:1; box-shadow:0 0 0 0 rgba(34,197,94,.4); }
    50%      { opacity:.8; box-shadow:0 0 0 4px rgba(34,197,94,0); }
}
.status-bar {
    display:flex; align-items:center; font-size:.78rem;
    padding:.5rem .75rem; margin:0 .5rem;
    border-radius:8px; background:rgba(255,255,255,.05);
}

/* ── Métricas do dashboard ───────────────────────────────────────────────── */
div[data-testid="stMetric"] {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: .75rem 1rem !important;
    box-shadow: 0 1px 3px rgba(0,0,0,.06);
    transition: box-shadow .2s;
}
div[data-testid="stMetric"]:hover { box-shadow: 0 4px 12px rgba(0,0,0,.10); }
div[data-testid="stMetric"] [data-testid="stMetricLabel"] {
    font-size: .78rem !important; color: #64748b !important; font-weight: 600;
    text-transform: uppercase; letter-spacing: .04em;
}
div[data-testid="stMetric"] [data-testid="stMetricValue"] {
    font-size: 1.6rem !important; font-weight: 700 !important; color: #0f172a !important;
}

/* ── Cards ───────────────────────────────────────────────────────────────── */
.kpi-card {
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    border-radius: 14px; padding: 1.2rem 1.4rem; color: white;
    box-shadow: 0 4px 15px rgba(99,102,241,.35);
}
.kpi-card.green { background: linear-gradient(135deg, #059669, #10b981); box-shadow: 0 4px 15px rgba(5,150,105,.3); }
.kpi-card.blue  { background: linear-gradient(135deg, #0284c7, #0ea5e9); box-shadow: 0 4px 15px rgba(2,132,199,.3); }
.kpi-card.amber { background: linear-gradient(135deg, #d97706, #f59e0b); box-shadow: 0 4px 15px rgba(217,119,6,.3); }
.kpi-card .kpi-val { font-size: 2rem; font-weight: 700; line-height: 1; }
.kpi-card .kpi-lbl { font-size: .78rem; opacity: .85; margin-top: .25rem; font-weight: 500; text-transform: uppercase; letter-spacing: .06em; }
.kpi-card .kpi-ico { font-size: 1.6rem; float: right; opacity: .7; }

/* ── Títulos de seção ────────────────────────────────────────────────────── */
.sec-header {
    display: flex; align-items: center; gap: 8px;
    font-size: .82rem; font-weight: 700; color: #475569;
    text-transform: uppercase; letter-spacing: .07em;
    margin: 1.2rem 0 .6rem; padding-bottom: .4rem;
    border-bottom: 2px solid #e2e8f0;
}

/* ── Agendamentos ────────────────────────────────────────────────────────── */
.ag-card {
    background:#fff; border:1px solid #e2e8f0; border-radius:10px;
    padding:.7rem 1rem; margin-bottom:.5rem;
    display:flex; align-items:center; gap:12px;
    transition: box-shadow .15s;
}
.ag-card:hover { box-shadow: 0 2px 8px rgba(0,0,0,.08); }
.ag-time { background:#f1f5f9; border-radius:8px; padding:.3rem .6rem;
           font-size:.8rem; font-weight:700; color:#1e293b; white-space:nowrap; }
.status-pill {
    padding:2px 10px; border-radius:12px; font-size:.72rem; font-weight:600;
}
.pill-agendado   { background:#fef3c7; color:#92400e; }
.pill-confirmado { background:#d1fae5; color:#065f46; }
.pill-concluido  { background:#dbeafe; color:#1e40af; }
.pill-cancelado  { background:#fee2e2; color:#991b1b; }
.pill-falta      { background:#f1f5f9; color:#475569; }

/* ── Botões ──────────────────────────────────────────────────────────────── */
div[data-testid="stButton"] > button[kind="primary"] {
    background: linear-gradient(135deg, #6366f1, #8b5cf6) !important;
    border: none !important; border-radius: 8px !important;
    font-weight: 600 !important; color: white !important;
    transition: opacity .2s !important;
}
div[data-testid="stButton"] > button[kind="primary"]:hover { opacity: .88 !important; }

/* ── Tabs ────────────────────────────────────────────────────────────────── */
[data-testid="stTabs"] [data-baseweb="tab-list"] {
    gap: 4px; background: #f8fafc; border-radius: 10px;
    padding: 4px; border: 1px solid #e2e8f0;
}
[data-testid="stTabs"] [data-baseweb="tab"] {
    border-radius: 7px !important; font-weight: 500 !important;
    color: #64748b !important; padding: 6px 16px !important;
}
[data-testid="stTabs"] [aria-selected="true"] {
    background: #fff !important; color: #6366f1 !important;
    box-shadow: 0 1px 4px rgba(0,0,0,.08) !important; font-weight: 600 !important;
}

/* ── Inputs ──────────────────────────────────────────────────────────────── */
[data-baseweb="input"] input, [data-baseweb="textarea"] textarea,
[data-baseweb="select"] { border-radius: 8px !important; }

/* ── Scrollbar sidebar ───────────────────────────────────────────────────── */
[data-testid="stSidebar"]::-webkit-scrollbar { width: 4px; }
[data-testid="stSidebar"]::-webkit-scrollbar-thumb { background: #334155; border-radius: 2px; }

/* ── Main content padding ────────────────────────────────────────────────── */
.main .block-container { padding-top: 1.5rem !important; max-width: 1400px; }
</style>
""", unsafe_allow_html=True)


# ══════════════════════════════════════════════════════════════════════════════
# HELPERS
# ══════════════════════════════════════════════════════════════════════════════
def check_api():
    try:
        r = requests.get(f"{API_URL}/health", timeout=2)
        return r.status_code == 200
    except Exception:
        return False

def safe_get(path, params=None):
    try:
        r = requests.get(f"{API_URL}{path}", params=params, timeout=4)
        return r.json() if r.ok else []
    except Exception:
        return []

STATUS_LABELS = {
    "agendado":       ("pill-agendado",   "Agendado"),
    "confirmado":     ("pill-confirmado", "Confirmado"),
    "em_atendimento": ("pill-confirmado", "Em atendimento"),
    "concluido":      ("pill-concluido",  "Concluído"),
    "cancelado":      ("pill-cancelado",  "Cancelado"),
    "falta":          ("pill-falta",      "Falta"),
}


# ══════════════════════════════════════════════════════════════════════════════
# DASHBOARD
# ══════════════════════════════════════════════════════════════════════════════
def render_dashboard():
    # Cabeçalho
    st.markdown(f"""
    <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:1rem;">
        <div>
            <h2 style="margin:0; color:#0f172a; font-weight:700;">Dashboard</h2>
            <p style="margin:0; color:#64748b; font-size:.88rem;">
                {datetime.now().strftime("%A, %d de %B de %Y").capitalize()}
            </p>
        </div>
        <div style="background:#eff6ff; border:1px solid #bfdbfe; border-radius:8px;
                    padding:.35rem .8rem; font-size:.8rem; color:#1d4ed8; font-weight:600;">
            🔴 Ao vivo
        </div>
    </div>
    """, unsafe_allow_html=True)

    if not check_api():
        st.error("⚠️ Backend offline. Execute `python start_backend.py`")
        return

    # Carregar dados
    pacientes    = safe_get("/api/pacientes",    {"ativo": True})
    dentistas    = safe_get("/api/dentistas",    {"ativo": True})
    agendamentos = safe_get("/api/agendamentos")
    procedimentos= safe_get("/api/procedimentos",{"ativo": True})

    ag_ativos  = [a for a in agendamentos if a.get("status") in ("agendado","confirmado","em_atendimento")]
    ag_hoje    = [a for a in ag_ativos if str(a.get("data_hora",""))[:10] == str(date.today())]
    ag_concl   = [a for a in agendamentos if a.get("status") == "concluido"]

    # ── KPI cards ─────────────────────────────────────────────────────────────
    k1, k2, k3, k4 = st.columns(4)
    cards = [
        (k1, "green", "👥", len(pacientes),     "Pacientes Ativos"),
        (k2, "blue",  "🦷", len(dentistas),     "Dentistas Ativos"),
        (k3, "",      "📅", len(ag_hoje),        "Consultas Hoje"),
        (k4, "amber", "💉", len(procedimentos), "Procedimentos"),
    ]
    for col, cls, ico, val, lbl in cards:
        with col:
            st.markdown(f"""
            <div class="kpi-card {cls}">
                <span class="kpi-ico">{ico}</span>
                <div class="kpi-val">{val}</div>
                <div class="kpi-lbl">{lbl}</div>
            </div>
            """, unsafe_allow_html=True)

    st.markdown("<div style='height:1.2rem'></div>", unsafe_allow_html=True)

    # ── Segunda linha: agenda  +  acesso rápido ───────────────────────────────
    col_ag, col_quick = st.columns([3, 1])

    with col_ag:
        st.markdown('<div class="sec-header">📅 Próximas Consultas</div>', unsafe_allow_html=True)

        ag_pendentes = sorted(
            [a for a in ag_ativos],
            key=lambda x: x.get("data_hora","")
        )[:8]

        if ag_pendentes:
            for ag in ag_pendentes:
                try:
                    dh = datetime.fromisoformat(ag["data_hora"].replace("Z",""))
                    data_fmt = dh.strftime("%d/%m/%Y")
                    hora_fmt = dh.strftime("%H:%M")
                except Exception:
                    data_fmt = hora_fmt = "—"

                pac_nome = "—"
                if isinstance(ag.get("pacientes"), dict):
                    pac_nome = ag["pacientes"].get("nome","—")

                den_nome = "—"
                if isinstance(ag.get("dentistas"), dict):
                    den_nome = ag["dentistas"].get("nome","—")

                status   = ag.get("status","agendado")
                cls_pill, lbl_pill = STATUS_LABELS.get(status, ("pill-agendado","Agendado"))

                st.markdown(f"""
                <div class="ag-card">
                    <div>
                        <div style="font-size:.65rem; color:#94a3b8; font-weight:600;">{data_fmt}</div>
                        <div class="ag-time">⏰ {hora_fmt}</div>
                    </div>
                    <div style="flex:1; min-width:0;">
                        <div style="font-weight:600; font-size:.88rem; color:#1e293b;
                                    white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                            👤 {pac_nome}
                        </div>
                        <div style="font-size:.78rem; color:#64748b;">🦷 Dr(a). {den_nome}</div>
                    </div>
                    <span class="status-pill {cls_pill}">{lbl_pill}</span>
                </div>
                """, unsafe_allow_html=True)
        else:
            st.markdown("""
            <div style="background:#f8fafc; border:1px dashed #cbd5e1; border-radius:10px;
                        padding:2rem; text-align:center; color:#94a3b8;">
                📭 Nenhuma consulta pendente
            </div>
            """, unsafe_allow_html=True)

    with col_quick:
        st.markdown('<div class="sec-header">⚡ Acesso Rápido</div>', unsafe_allow_html=True)

        links = [
            ("pages/1_Pacientes.py",     "➕ Novo Paciente"),
            ("pages/3_Agendamentos.py",  "📅 Novo Agendamento"),
            ("pages/4_Procedimentos.py", "💉 Procedimentos"),
            ("pages/5_Fin_Consultorio.py","💼 Financeiro"),
        ]
        for page, label in links:
            st.page_link(page, label=label, use_container_width=True)

        st.markdown('<div class="sec-header" style="margin-top:1.5rem;">📊 Resumo</div>',
                    unsafe_allow_html=True)

        total  = len(agendamentos)
        concl  = len(ag_concl)
        canc   = len([a for a in agendamentos if a.get("status") == "cancelado"])
        taxa   = f"{concl/total*100:.0f}%" if total else "—"

        for lbl, val in [("Total agendamentos", total),
                         ("Concluídos", concl),
                         ("Cancelados", canc),
                         ("Taxa conclusão", taxa)]:
            st.markdown(f"""
            <div style="display:flex; justify-content:space-between; align-items:center;
                        padding:.35rem 0; border-bottom:1px solid #f1f5f9; font-size:.82rem;">
                <span style="color:#64748b;">{lbl}</span>
                <span style="font-weight:700; color:#0f172a;">{val}</span>
            </div>""", unsafe_allow_html=True)

    # ── Terceira linha: dentistas + info sistema ──────────────────────────────
    st.markdown("<div style='height:.8rem'></div>", unsafe_allow_html=True)
    col_den, col_sys = st.columns([2, 1])

    with col_den:
        st.markdown('<div class="sec-header">🦷 Equipe Clínica</div>', unsafe_allow_html=True)
        if dentistas:
            cols_d = st.columns(min(len(dentistas), 3))
            for i, d in enumerate(dentistas[:3]):
                with cols_d[i]:
                    st.markdown(f"""
                    <div style="background:#fff; border:1px solid #e2e8f0; border-radius:12px;
                                padding:.8rem 1rem; text-align:center;
                                box-shadow:0 1px 3px rgba(0,0,0,.05);">
                        <div style="font-size:1.8rem;">👨‍⚕️</div>
                        <div style="font-weight:600; font-size:.85rem; color:#1e293b;
                                    margin-top:.25rem; white-space:nowrap; overflow:hidden;
                                    text-overflow:ellipsis;">{d.get('nome','—')}</div>
                        <div style="font-size:.72rem; color:#6366f1; font-weight:500;
                                    margin-top:.15rem;">{d.get('especialidade','—')}</div>
                        <div style="font-size:.7rem; color:#94a3b8; margin-top:.1rem;">
                            {d.get('cro','')}</div>
                    </div>
                    """, unsafe_allow_html=True)
        else:
            st.caption("Nenhum dentista cadastrado.")

    with col_sys:
        st.markdown('<div class="sec-header">ℹ️ Sistema</div>', unsafe_allow_html=True)
        infos = [
            ("Versão",   "1.0.0"),
            ("Backend",  "FastAPI"),
            ("Banco",    "Supabase"),
            ("Frontend", "Streamlit"),
            ("API URL",  API_URL),
        ]
        for k, v in infos:
            st.markdown(f"""
            <div style="display:flex; justify-content:space-between;
                        padding:.3rem 0; border-bottom:1px solid #f1f5f9; font-size:.8rem;">
                <span style="color:#94a3b8; font-weight:500;">{k}</span>
                <span style="color:#1e293b; font-weight:600;">{v}</span>
            </div>""", unsafe_allow_html=True)


# ══════════════════════════════════════════════════════════════════════════════
# MAIN
# ══════════════════════════════════════════════════════════════════════════════
def main():
    render_sidebar()
    render_dashboard()


if __name__ == "__main__":
    main()
