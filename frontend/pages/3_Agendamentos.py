"""
Página de Agendamentos — OdontoSystem
"""
import streamlit as st
import requests
import pandas as pd
from datetime import datetime, date, timedelta

st.set_page_config(page_title="Agendamentos · OdontoSystem", page_icon="📅", layout="wide")

import sys as _sys, os as _os
_sys.path.insert(0, _os.path.join(_os.path.dirname(__file__), ".."))
from components.sidebar import render_sidebar
from components.auth import require_login


API_URL = "http://localhost:8000"

# ══════════════════════════════════════════════════════════════════════════════
# CSS
# ══════════════════════════════════════════════════════════════════════════════
require_login()
render_sidebar()

st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
html,body,[class*="css"]{font-family:'Inter',sans-serif;}
[data-testid="stSidebarNav"]{display:none!important;}

/* KPI cards */
.kpi{background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:.9rem 1.1rem;
     box-shadow:0 1px 3px rgba(0,0,0,.06);position:relative;overflow:hidden;}
.kpi::before{content:'';position:absolute;top:0;left:0;width:4px;height:100%;border-radius:2px 0 0 2px;}
.kpi.indigo::before{background:#6366f1;} .kpi.green::before{background:#10b981;}
.kpi.amber::before{background:#f59e0b;} .kpi.sky::before{background:#0ea5e9;}
.kpi.rose::before{background:#ef4444;}
.kpi-val{font-size:1.8rem;font-weight:700;color:#0f172a;line-height:1;}
.kpi-lbl{font-size:.72rem;color:#64748b;font-weight:600;text-transform:uppercase;
          letter-spacing:.05em;margin-top:.2rem;}
.kpi-ico{position:absolute;right:.9rem;top:.9rem;font-size:1.4rem;opacity:.15;}

/* Ag card */
.ag-row{background:#fff;border:1px solid #e2e8f0;border-radius:10px;
        padding:.7rem 1rem;margin-bottom:.4rem;display:flex;align-items:center;
        gap:12px;transition:box-shadow .15s;}
.ag-row:hover{box-shadow:0 3px 10px rgba(0,0,0,.09);}
.ag-time-box{min-width:68px;background:#f1f5f9;border-radius:8px;padding:.3rem .5rem;
             text-align:center;}
.ag-time-date{font-size:.6rem;color:#94a3b8;font-weight:600;text-transform:uppercase;}
.ag-time-hour{font-size:.9rem;font-weight:700;color:#1e293b;}

/* Status pills */
.pill{padding:3px 10px;border-radius:12px;font-size:.7rem;font-weight:700;white-space:nowrap;}
.p-agendado{background:#fef3c7;color:#92400e;}
.p-confirmado{background:#d1fae5;color:#065f46;}
.p-atendimento{background:#dbeafe;color:#1e40af;}
.p-concluido{background:#f0fdf4;color:#166534;border:1px solid #bbf7d0;}
.p-cancelado{background:#fee2e2;color:#991b1b;}
.p-falta{background:#f1f5f9;color:#475569;}

/* Section header */
.sec-hdr{display:flex;align-items:center;gap:8px;font-size:.78rem;font-weight:700;
          color:#475569;text-transform:uppercase;letter-spacing:.07em;
          margin:1rem 0 .5rem;padding-bottom:.4rem;border-bottom:2px solid #e2e8f0;}

/* Day header on agenda */
.day-hdr{background:linear-gradient(90deg,#6366f1,#8b5cf6);color:#fff;
          border-radius:8px;padding:.4rem .9rem;font-size:.82rem;font-weight:700;
          margin:.6rem 0 .3rem;}

/* Tabs */
[data-testid="stTabs"] [data-baseweb="tab-list"]{gap:4px;background:#f8fafc;
 border-radius:10px;padding:4px;border:1px solid #e2e8f0;}
[data-testid="stTabs"] [data-baseweb="tab"]{border-radius:7px!important;
 font-weight:500!important;color:#64748b!important;padding:6px 16px!important;}
[data-testid="stTabs"] [aria-selected="true"]{background:#fff!important;
 color:#6366f1!important;box-shadow:0 1px 4px rgba(0,0,0,.08)!important;font-weight:600!important;}

/* Buttons */
div[data-testid="stButton"]>button[kind="primary"]{
  background:linear-gradient(135deg,#6366f1,#8b5cf6)!important;border:none!important;
  border-radius:8px!important;font-weight:600!important;color:white!important;}
.main .block-container{padding-top:1.5rem!important;max-width:1400px;}
</style>
""", unsafe_allow_html=True)

# ══════════════════════════════════════════════════════════════════════════════
# HELPERS
# ══════════════════════════════════════════════════════════════════════════════
PILL = {
    "agendado":       ("p-agendado",    "⏳ Agendado"),
    "confirmado":     ("p-confirmado",  "✅ Confirmado"),
    "em_atendimento": ("p-atendimento", "🏥 Em Atend."),
    "concluido":      ("p-concluido",   "🏁 Concluído"),
    "cancelado":      ("p-cancelado",   "❌ Cancelado"),
    "falta":          ("p-falta",       "⚠️ Falta"),
}
STATUSES = ["agendado","confirmado","em_atendimento","concluido","cancelado","falta"]

@st.cache_data(ttl=30)
def safe_get(path, params=None):
    try:
        r = requests.get(f"{API_URL}{path}", params=params, timeout=5)
        return r.json() if r.ok else []
    except Exception:
        return []

def safe_put(path, payload):
    try:
        r = requests.put(f"{API_URL}{path}", json=payload, timeout=5)
        return r.ok, r
    except Exception as e:
        return False, str(e)

def fmt_dh(iso_str):
    try:
        dh = datetime.fromisoformat(str(iso_str).replace("Z",""))
        return dh.strftime("%d/%m/%Y"), dh.strftime("%H:%M"), dh
    except Exception:
        return "—","—", None

def pac_nome(ag):
    return ag["pacientes"]["nome"] if isinstance(ag.get("pacientes"), dict) else "—"

def den_nome(ag):
    return ag["dentistas"]["nome"] if isinstance(ag.get("dentistas"), dict) else "—"


# ══════════════════════════════════════════════════════════════════════════════
# MODAL EDIÇÃO
# ══════════════════════════════════════════════════════════════════════════════
@st.dialog("✏️ Editar Agendamento", width="large")
def modal_editar(ag):
    data_str, hora_str, dh_obj = fmt_dh(ag["data_hora"])
    st.markdown(f"**Paciente:** {pac_nome(ag)} &nbsp;·&nbsp; **Dentista:** Dr(a). {den_nome(ag)}")
    st.markdown("---")
    c1, c2 = st.columns(2)
    with c1:
        nova_data = st.date_input("Data", value=dh_obj.date() if dh_obj else date.today())
        nova_hora = st.time_input("Horário", value=dh_obj.time() if dh_obj else datetime.now().time())
    with c2:
        nova_dur  = st.number_input("Duração (min)", value=int(ag.get("duracao_minutos", 60)),
                                    min_value=15, max_value=300, step=15)
        novo_st   = st.selectbox("Status", STATUSES,
                                  index=STATUSES.index(ag["status"]) if ag["status"] in STATUSES else 0)
    nova_obs = st.text_area("Observações", value=ag.get("observacoes") or "")
    if st.button("💾 Salvar Alterações", type="primary", use_container_width=True):
        ok, _ = safe_put(f"/api/agendamentos/{ag['id']}", {
            "data_hora":        datetime.combine(nova_data, nova_hora).isoformat(),
            "duracao_minutos":  nova_dur,
            "status":           novo_st,
            "observacoes":      nova_obs or None,
        })
        if ok:
            st.success("Agendamento atualizado!")
            st.cache_data.clear()
            st.rerun()
        else:
            st.error("Erro ao salvar.")


# ══════════════════════════════════════════════════════════════════════════════
# DASHBOARD
# ══════════════════════════════════════════════════════════════════════════════
st.markdown("""
<div style="display:flex;align-items:center;gap:10px;margin-bottom:.25rem;">
    <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);
                border-radius:10px;padding:6px 10px;font-size:1.3rem;">📅</div>
    <div>
        <h2 style="margin:0;color:#0f172a;font-weight:700;">Agendamentos</h2>
        <p style="margin:0;color:#64748b;font-size:.82rem;">Gestão completa da agenda clínica</p>
    </div>
</div>
""", unsafe_allow_html=True)

ags_all = safe_get("/api/agendamentos")
today   = date.today()
ags_hoje = [a for a in ags_all if str(a.get("data_hora",""))[:10] == str(today)]

k1,k2,k3,k4,k5 = st.columns(5)
kpis = [
    (k1,"indigo","📅", len(ags_hoje),                                   "Consultas Hoje"),
    (k2,"green", "✅", sum(1 for a in ags_hoje if a["status"]=="confirmado"), "Confirmadas Hoje"),
    (k3,"amber", "⏳", sum(1 for a in ags_all  if a["status"]=="agendado"),   "Pendentes"),
    (k4,"sky",   "🏁", sum(1 for a in ags_all  if a["status"]=="concluido"),  "Concluídos"),
    (k5,"rose",  "❌", sum(1 for a in ags_all  if a["status"]=="cancelado"),  "Cancelados"),
]
for col,cls,ico,val,lbl in kpis:
    with col:
        st.markdown(f"""
        <div class="kpi {cls}">
            <span class="kpi-ico">{ico}</span>
            <div class="kpi-val">{val}</div>
            <div class="kpi-lbl">{lbl}</div>
        </div>""", unsafe_allow_html=True)

st.markdown("<div style='height:.6rem'></div>", unsafe_allow_html=True)

# ══════════════════════════════════════════════════════════════════════════════
# TABS
# ══════════════════════════════════════════════════════════════════════════════
tab_lista, tab_agenda, tab_novo = st.tabs(["📋 Lista", "🗓️ Agenda do Dia", "➕ Novo Agendamento"])

# ─────────────────────────────────────────────────────── TAB 1: LISTA ───────
with tab_lista:
    # Filtros
    fc1, fc2, fc3, fc4 = st.columns([1.5, 1.5, 1.5, 1])
    with fc1:
        periodo = st.selectbox("Período", ["Hoje","Amanhã","Esta semana","Este mês","Todos"], index=0)
    with fc2:
        filtro_st = st.selectbox("Status", ["Todos"] + STATUSES)
    with fc3:
        dentistas_all = safe_get("/api/dentistas", {"ativo": True})
        opts_den = {"Todos": None}
        opts_den.update({d["nome"]: d["id"] for d in dentistas_all})
        filtro_den = st.selectbox("Dentista", list(opts_den.keys()))
    with fc4:
        st.markdown("<div style='height:1.6rem'></div>", unsafe_allow_html=True)
        buscar = st.button("🔍 Filtrar", use_container_width=True, type="primary")

    # Montar params
    params = {}
    if filtro_st != "Todos":  params["status_filtro"] = filtro_st
    if opts_den[filtro_den]:  params["dentista_id"]   = opts_den[filtro_den]
    ags = safe_get("/api/agendamentos", params)

    # Filtro de período (client-side)
    hoje = date.today()
    def in_period(ag):
        try:
            d = datetime.fromisoformat(str(ag["data_hora"]).replace("Z","")).date()
        except Exception:
            return True
        if periodo == "Hoje":         return d == hoje
        if periodo == "Amanhã":       return d == hoje + timedelta(days=1)
        if periodo == "Esta semana":  return hoje <= d <= hoje + timedelta(days=6)
        if periodo == "Este mês":     return d.month == hoje.month and d.year == hoje.year
        return True

    ags_f = sorted([a for a in ags if in_period(a)],
                   key=lambda x: x.get("data_hora",""))

    st.markdown(f'<div style="font-size:.78rem;color:#64748b;margin:.3rem 0 .6rem;">'
                f'<b>{len(ags_f)}</b> agendamento(s) encontrado(s)</div>',
                unsafe_allow_html=True)

    if ags_f:
        # Agrupar por data
        grupos: dict = {}
        for ag in ags_f:
            d_str, h_str, dh_obj = fmt_dh(ag["data_hora"])
            grupos.setdefault(d_str, []).append((ag, h_str, dh_obj))

        for d_str, items in grupos.items():
            # Determina label do dia
            try:
                dia = datetime.strptime(d_str, "%d/%m/%Y").date()
                if   dia == hoje:           label = f"📅 Hoje — {d_str}"
                elif dia == hoje + timedelta(days=1): label = f"📅 Amanhã — {d_str}"
                else: label = f"📅 {dia.strftime('%A').capitalize()}, {d_str}"
            except Exception:
                label = f"📅 {d_str}"

            st.markdown(f'<div class="day-hdr">{label} <span style="opacity:.7;font-size:.75rem;">({len(items)} consultas)</span></div>',
                        unsafe_allow_html=True)

            for ag, h_str, dh_obj in items:
                pil_cls, pil_txt = PILL.get(ag["status"], ("p-agendado","Agendado"))
                obs = ag.get("observacoes") or ""

                col_card, col_acts = st.columns([5, 1])
                with col_card:
                    st.markdown(f"""
                    <div class="ag-row">
                        <div class="ag-time-box">
                            <div class="ag-time-date">{dh_obj.strftime('%a') if dh_obj else ''}</div>
                            <div class="ag-time-hour">{h_str}</div>
                        </div>
                        <div style="flex:1;min-width:0;">
                            <div style="font-weight:600;font-size:.9rem;color:#1e293b;">
                                👤 {pac_nome(ag)}
                            </div>
                            <div style="font-size:.78rem;color:#64748b;margin-top:1px;">
                                🦷 Dr(a). {den_nome(ag)} &nbsp;·&nbsp; ⏱️ {ag.get('duracao_minutos','-')} min
                                {'&nbsp;·&nbsp; 📝 ' + obs[:40] + ('…' if len(obs)>40 else '') if obs else ''}
                            </div>
                        </div>
                        <span class="pill {pil_cls}">{pil_txt}</span>
                    </div>""", unsafe_allow_html=True)

                with col_acts:
                    st.markdown("<div style='height:.15rem'></div>", unsafe_allow_html=True)
                    ca, cb, cc = st.columns(3)
                    with ca:
                        if st.button("✏️", key=f"ed_{ag['id']}", help="Editar"):
                            modal_editar(ag)
                    with cb:
                        if ag["status"] == "agendado":
                            if st.button("✅", key=f"cf_{ag['id']}", help="Confirmar"):
                                ok, _ = safe_put(f"/api/agendamentos/{ag['id']}", {"status":"confirmado"})
                                if ok:
                                    st.cache_data.clear()
                                    st.rerun()
                        elif ag["status"] == "confirmado":
                            if st.button("🏥", key=f"at_{ag['id']}", help="Em atendimento"):
                                ok, _ = safe_put(f"/api/agendamentos/{ag['id']}", {"status":"em_atendimento"})
                                if ok:
                                    st.cache_data.clear()
                                    st.rerun()
                        elif ag["status"] == "em_atendimento":
                            if st.button("🏁", key=f"cn_{ag['id']}", help="Concluir"):
                                ok, _ = safe_put(f"/api/agendamentos/{ag['id']}", {"status":"concluido"})
                                if ok:
                                    st.cache_data.clear()
                                    st.rerun()
                    with cc:
                        if ag["status"] not in ("cancelado","concluido","falta"):
                            if st.button("❌", key=f"cx_{ag['id']}", help="Cancelar"):
                                ok, _ = safe_put(f"/api/agendamentos/{ag['id']}", {"status":"cancelado"})
                                if ok:
                                    st.cache_data.clear()
                                    st.rerun()
    else:
        st.markdown("""
        <div style="background:#f8fafc;border:1px dashed #cbd5e1;border-radius:10px;
                    padding:2rem;text-align:center;color:#94a3b8;">
            📭 Nenhum agendamento encontrado para os filtros selecionados
        </div>""", unsafe_allow_html=True)


# ────────────────────────────────────────────────── TAB 2: AGENDA DO DIA ────
with tab_agenda:
    st.markdown('<div class="sec-hdr">🗓️ Agenda de Hoje e Amanhã</div>', unsafe_allow_html=True)

    ags_2d = [a for a in ags_all
              if str(a.get("data_hora",""))[:10] in (str(hoje), str(hoje + timedelta(days=1)))]
    ags_2d_sorted = sorted(ags_2d, key=lambda x: x.get("data_hora",""))

    if ags_2d_sorted:
        cols_dia = st.columns(2)
        for idx_dia, dia_ref in enumerate([hoje, hoje + timedelta(days=1)]):
            label = "📅 Hoje" if idx_dia == 0 else "📅 Amanhã"
            ags_dia = [a for a in ags_2d_sorted
                       if str(a.get("data_hora",""))[:10] == str(dia_ref)]
            with cols_dia[idx_dia]:
                st.markdown(f'<div class="day-hdr">{label} — {dia_ref.strftime("%d/%m/%Y")} ({len(ags_dia)})</div>',
                            unsafe_allow_html=True)
                if ags_dia:
                    for ag in ags_dia:
                        _, h_str, _ = fmt_dh(ag["data_hora"])
                        pil_cls, pil_txt = PILL.get(ag["status"], ("p-agendado","Agendado"))
                        st.markdown(f"""
                        <div class="ag-row" style="margin-bottom:.3rem;">
                            <div class="ag-time-box">
                                <div class="ag-time-hour">{h_str}</div>
                            </div>
                            <div style="flex:1;min-width:0;">
                                <div style="font-weight:600;font-size:.85rem;color:#1e293b;">
                                    {pac_nome(ag)}
                                </div>
                                <div style="font-size:.74rem;color:#64748b;">
                                    Dr(a). {den_nome(ag)} · {ag.get('duracao_minutos','-')} min
                                </div>
                            </div>
                            <span class="pill {pil_cls}">{pil_txt}</span>
                        </div>""", unsafe_allow_html=True)
                else:
                    st.markdown('<div style="color:#94a3b8;font-size:.82rem;padding:.5rem;">Sem consultas.</div>',
                                unsafe_allow_html=True)
    else:
        st.info("Nenhuma consulta nos próximos 2 dias.")

    # Resumo por dentista
    st.markdown('<div class="sec-hdr" style="margin-top:1.5rem;">📊 Distribuição por Dentista (Hoje)</div>',
                unsafe_allow_html=True)
    if ags_hoje:
        cnt: dict = {}
        for ag in ags_hoje:
            n = den_nome(ag)
            cnt[n] = cnt.get(n, 0) + 1
        df_cnt = pd.DataFrame(list(cnt.items()), columns=["Dentista","Consultas"]).sort_values("Consultas",ascending=False)
        st.bar_chart(df_cnt.set_index("Dentista"), use_container_width=True, height=220)
    else:
        st.caption("Sem dados de hoje.")


# ────────────────────────────────────────────────── TAB 3: NOVO ─────────────
with tab_novo:
    st.markdown('<div class="sec-hdr">➕ Novo Agendamento</div>', unsafe_allow_html=True)

    pacientes_all  = safe_get("/api/pacientes",  {"ativo": True})
    procedimentos  = safe_get("/api/procedimentos", {"ativo": True})

    if not pacientes_all or not dentistas_all:
        st.warning("Cadastre pacientes e dentistas antes de criar agendamentos.")
    else:
        with st.form("form_novo_ag", clear_on_submit=True):
            c1, c2 = st.columns(2)
            with c1:
                pac_opts = {p["nome"]: p["id"] for p in pacientes_all}
                pac_sel  = st.selectbox("👤 Paciente *", list(pac_opts.keys()))
            with c2:
                den_opts = {f"{d['nome']} — {d.get('especialidade','')}": d["id"] for d in dentistas_all}
                den_sel  = st.selectbox("🦷 Dentista *", list(den_opts.keys()))

            c3, c4 = st.columns(2)
            with c3:
                nova_data = st.date_input("📅 Data *", min_value=date.today())
            with c4:
                nova_hora = st.time_input("⏰ Horário *",
                                          value=datetime.now().replace(minute=0,second=0,microsecond=0).time())

            c5, c6 = st.columns(2)
            with c5:
                if procedimentos:
                    proc_opts = {"(nenhum)": None}
                    proc_opts.update({p["nome"]: p["id"] for p in procedimentos})
                    proc_sel = st.selectbox("💉 Procedimento", list(proc_opts.keys()))
                    # pré-preenche duração se procedimento escolhido
                    dur_default = 60
                    if proc_sel != "(nenhum)":
                        match = next((p for p in procedimentos if p["nome"]==proc_sel), None)
                        if match:
                            dur_default = int(match.get("duracao_minutos", 60))
                else:
                    proc_sel = None
                    dur_default = 60
            with c6:
                duracao = st.number_input("⏱️ Duração (min)", min_value=15, max_value=300,
                                          value=dur_default, step=15)

            observacoes = st.text_area("📝 Observações", placeholder="Informações adicionais...")

            submitted = st.form_submit_button("📅 Agendar", type="primary", use_container_width=True)
            if submitted:
                data_hora = datetime.combine(nova_data, nova_hora)
                payload = {
                    "paciente_id":     pac_opts[pac_sel],
                    "dentista_id":     den_opts[den_sel],
                    "data_hora":       data_hora.isoformat(),
                    "duracao_minutos": int(duracao),
                    "status":          "agendado",
                    "observacoes":     observacoes or None,
                }
                try:
                    r = requests.post(f"{API_URL}/api/agendamentos", json=payload, timeout=5)
                    if r.status_code == 201:
                        st.success(f"✅ Agendamento criado! {pac_sel} com {den_sel} em {data_hora.strftime('%d/%m/%Y %H:%M')}")
                        st.balloons()
                    else:
                        st.error(f"❌ Erro: {r.json().get('detail','Falha ao criar')}")
                except Exception as e:
                    st.error(f"Erro de conexão: {e}")
