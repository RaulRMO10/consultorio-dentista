"""
Financeiro do Consultório – Sistema Odontológico Profissional
"""
import streamlit as st
import requests
import pandas as pd
import io
from datetime import date, datetime

st.set_page_config(page_title="Financeiro Consultório", page_icon="💼", layout="wide")

import sys as _sys, os as _os
_sys.path.insert(0, _os.path.join(_os.path.dirname(__file__), ".."))
from components.sidebar import render_sidebar
from components.auth import require_login


API_URL = "http://localhost:8000"
MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho",
         "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"]

# ── Helpers ───────────────────────────────────────────────────────────────────
@st.cache_data(ttl=60)
def api_get(endpoint, params=None):
    try:
        r = requests.get(f"{API_URL}{endpoint}", params=params, timeout=6)
        return r.json() if r.ok else ([] if r.status_code != 200 else {})
    except Exception:
        return []

def api_post(endpoint, payload):
    try:
        r = requests.post(f"{API_URL}{endpoint}", json=payload, timeout=6)
        return r
    except Exception as e:
        return None

def api_put(endpoint, payload):
    try:
        r = requests.put(f"{API_URL}{endpoint}", json=payload, timeout=6)
        return r
    except Exception:
        return None

def api_delete(endpoint):
    try:
        r = requests.delete(f"{API_URL}{endpoint}", timeout=6)
        return r.status_code in (200, 204)
    except Exception:
        return False

def fmt_brl(v):
    return f"R$ {v:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")

# ── Estado ────────────────────────────────────────────────────────────────────
for k, v in [("edit_lanc_c", None), ("confirmar_del_c", None)]:
    if k not in st.session_state:
        st.session_state[k] = v

# ── CSS ───────────────────────────────────────────────────────────────────────
require_login()
render_sidebar()

st.markdown("""
<style>
.sec-title { font-size:.82rem; font-weight:700; color:#1d4ed8;
             text-transform:uppercase; letter-spacing:.05em; margin-bottom:.35rem; }
.badge-rec { background:#dcfce7; color:#166534; padding:2px 10px;
             border-radius:12px; font-size:.75rem; font-weight:600; }
.badge-des { background:#fee2e2; color:#991b1b; padding:2px 10px;
             border-radius:12px; font-size:.75rem; font-weight:600; }
div[data-testid="stMetric"] { background:#eff6ff; border-radius:8px; padding:.4rem .8rem; }
</style>""", unsafe_allow_html=True)

# ── Cabeçalho + seletor de período ───────────────────────────────────────────
st.title("💼 Financeiro do Consultório")
st.markdown("---")

cp1, cp2, cp3 = st.columns([2, 2, 6])
with cp1:
    mes_sel = st.selectbox("Mês", range(1, 13), index=date.today().month - 1,
                           format_func=lambda x: MESES[x - 1], key="mes_c")
with cp2:
    ano_sel = st.selectbox("Ano", range(date.today().year - 3, date.today().year + 2),
                           index=3, key="ano_c")

# ── DASHBOARD ─────────────────────────────────────────────────────────────────
resumo = api_get("/api/financeiro/consultorio/resumo", {"mes": mes_sel, "ano": ano_sel})
categorias_api = api_get("/api/financeiro/consultorio/categorias")
todos_lanc = api_get("/api/financeiro/consultorio/", {"mes": mes_sel, "ano": ano_sel})

receitas_val  = resumo.get("receitas", 0)  if isinstance(resumo, dict) else 0
despesas_val  = resumo.get("despesas", 0)  if isinstance(resumo, dict) else 0
saldo_val     = resumo.get("saldo", 0)     if isinstance(resumo, dict) else 0

# KPIs
k1, k2, k3, k4 = st.columns(4)
k1.metric("💚 Receitas",  fmt_brl(receitas_val))
k2.metric("🔴 Despesas",  fmt_brl(despesas_val))
delta_cor = "normal" if saldo_val >= 0 else "inverse"
k3.metric("💰 Saldo",     fmt_brl(saldo_val),
          delta=("▲ positivo" if saldo_val >= 0 else "▼ negativo"),
          delta_color=delta_cor)
n_lanc = len(todos_lanc) if isinstance(todos_lanc, list) else 0
k4.metric("📄 Lançamentos", n_lanc)

# Gráficos
if isinstance(todos_lanc, list) and todos_lanc:
    df_all = pd.DataFrame(todos_lanc)
else:
    df_all = pd.DataFrame()

col_g1, col_g2 = st.columns(2)

with col_g1:
    st.markdown('<div class="sec-title">📊 Receitas vs Despesas por Categoria</div>',
                unsafe_allow_html=True)
    if not df_all.empty and "categoria" in df_all.columns and "valor" in df_all.columns:
        df_cat = df_all.groupby(["tipo","categoria"])["valor"].sum().reset_index()
        df_rec_cat = df_cat[df_cat["tipo"]=="receita"].set_index("categoria")["valor"].rename("Receitas")
        df_des_cat = df_cat[df_cat["tipo"]=="despesa"].set_index("categoria")["valor"].rename("Despesas")
        df_chart = pd.concat([df_rec_cat, df_des_cat], axis=1).fillna(0)
        if not df_chart.empty:
            st.bar_chart(df_chart, height=230)
    else:
        st.caption("Sem dados para o período.")

with col_g2:
    st.markdown('<div class="sec-title">📈 Evolução Diária (Saldo Acumulado)</div>',
                unsafe_allow_html=True)
    if not df_all.empty and "data" in df_all.columns:
        df_day = df_all.copy()
        df_day["data"] = pd.to_datetime(df_day["data"])
        df_day["val_signed"] = df_day.apply(
            lambda r: r["valor"] if r["tipo"] == "receita" else -r["valor"], axis=1)
        df_evo = (df_day.groupby("data")["val_signed"].sum()
                  .sort_index().cumsum().reset_index()
                  .rename(columns={"val_signed": "Saldo acumulado"}))
        st.line_chart(df_evo.set_index("data"), height=230)
    else:
        st.caption("Sem dados para o período.")

st.markdown("---")

# ── TABS ──────────────────────────────────────────────────────────────────────
tab_lista, tab_novo, tab_anual = st.tabs([
    "📋 Lançamentos", "➕ Novo Lançamento", "📅 Visão Anual"
])

# ── ABA: LISTA ────────────────────────────────────────────────────────────────
with tab_lista:
    fl1, fl2, fl3, fl4 = st.columns([2, 2, 2, 1])
    with fl1:
        f_tipo = st.selectbox("Tipo", ["Todos","receita","despesa"], key="f_tipo_c")
    with fl2:
        cats_todas = (categorias_api.get("receita",[]) + categorias_api.get("despesa",[])
                      if isinstance(categorias_api, dict) else [])
        f_cat = st.selectbox("Categoria", ["Todas"] + cats_todas, key="f_cat_c")
    with fl3:
        f_mes_only = st.checkbox("Apenas este mês", value=True, key="f_mes_c")
    with fl4:
        exportar = st.button("📥 CSV", use_container_width=True, key="exp_c")

    params_l: dict = {}
    if f_mes_only:
        params_l.update({"mes": mes_sel, "ano": ano_sel})
    if f_tipo != "Todos":
        params_l["tipo"] = f_tipo

    lancamentos = api_get("/api/financeiro/consultorio/", params_l)
    if not isinstance(lancamentos, list):
        lancamentos = []

    # filtro categoria (client-side)
    if f_cat != "Todas" and lancamentos:
        lancamentos = [l for l in lancamentos if l.get("categoria") == f_cat]

    if exportar and lancamentos:
        buf = io.StringIO()
        pd.DataFrame(lancamentos).to_csv(buf, index=False, sep=";")
        st.download_button("⬇️ Baixar", data=buf.getvalue().encode("utf-8-sig"),
                           file_name=f"consultorio_{mes_sel:02d}_{ano_sel}.csv",
                           mime="text/csv", key="dl_c")

    if not lancamentos:
        st.info("Nenhum lançamento encontrado para os filtros aplicados.")
    else:
        # Resumo filtrado
        df_l = pd.DataFrame(lancamentos)
        tot_rec = df_l[df_l["tipo"]=="receita"]["valor"].sum() if "valor" in df_l.columns else 0
        tot_des = df_l[df_l["tipo"]=="despesa"]["valor"].sum() if "valor" in df_l.columns else 0
        sa, sb_col, sc = st.columns(3)
        sa.metric("Receitas filtradas",  fmt_brl(tot_rec))
        sb_col.metric("Despesas filtradas", fmt_brl(tot_des))
        sc.metric("Saldo filtrado",      fmt_brl(tot_rec - tot_des))
        st.markdown("")

        for lanc in lancamentos:
            tipo_l = lanc.get("tipo","")
            badge = f'<span class="badge-rec">RECEITA</span>' if tipo_l=="receita" else f'<span class="badge-des">DESPESA</span>'
            data_fmt = ""
            if lanc.get("data"):
                try:
                    data_fmt = datetime.strptime(str(lanc["data"])[:10], "%Y-%m-%d").strftime("%d/%m/%Y")
                except Exception:
                    data_fmt = lanc["data"]

            with st.container(border=True):
                cc1, cc2, cc3, cc4, cc5 = st.columns([4, 2, 2, 1, 1])
                with cc1:
                    st.markdown(f"**{lanc.get('descricao','')}**  {badge}", unsafe_allow_html=True)
                    st.caption(f"📂 {lanc.get('categoria','')}  •  📅 {data_fmt}"
                               + (f"  •  📝 {lanc.get('observacoes','')}" if lanc.get('observacoes') else ""))
                with cc2:
                    cor_val = "green" if tipo_l=="receita" else "red"
                    st.markdown(f"<span style='font-size:1.1rem;font-weight:700;color:{cor_val}'>"
                                f"{fmt_brl(lanc.get('valor',0))}</span>", unsafe_allow_html=True)
                with cc3:
                    st.caption(f"ID: {str(lanc.get('id',''))[:8]}…")
                with cc4:
                    if st.button("✏️", key=f"ed_c_{lanc['id']}",
                                 help="Editar lançamento"):
                        st.session_state.edit_lanc_c = lanc
                with cc5:
                    if st.button("🗑️", key=f"del_c_{lanc['id']}",
                                 help="Excluir lançamento"):
                        st.session_state.confirmar_del_c = lanc["id"]

            # Confirmação de exclusão inline
            if st.session_state.confirmar_del_c == lanc["id"]:
                st.warning(f"⚠️ Confirma exclusão de **{lanc.get('descricao','')}**?")
                cx1, cx2 = st.columns(2)
                with cx1:
                    if st.button("✅ Confirmar", key=f"conf_c_{lanc['id']}"):
                        if api_delete(f"/api/financeiro/consultorio/{lanc['id']}"):
                            st.success("Removido!")
                            st.session_state.confirmar_del_c = None
                            st.cache_data.clear()
                            st.rerun()
                        else:
                            st.error("Erro ao remover.")
                with cx2:
                    if st.button("❌ Cancelar", key=f"canc_c_{lanc['id']}"):
                        st.session_state.confirmar_del_c = None
                        st.rerun()

    # Painel de edição
    if st.session_state.edit_lanc_c:
        ed = st.session_state.edit_lanc_c
        st.markdown("---")
        st.markdown("#### ✏️ Editar Lançamento")
        with st.form("form_edit_c"):
            ec1, ec2 = st.columns(2)
            with ec1:
                e_tipo = st.selectbox("Tipo", ["receita","despesa"],
                                      index=0 if ed.get("tipo")=="receita" else 1)
            with ec2:
                e_valor = st.number_input("Valor (R$)", value=float(ed.get("valor",0)),
                                          min_value=0.01, step=0.01)
            e_desc = st.text_input("Descrição", value=ed.get("descricao",""))
            ec3, ec4 = st.columns(2)
            with ec3:
                cats_ed = (categorias_api.get(e_tipo, []) if isinstance(categorias_api, dict) else [])
                idx_cat = cats_ed.index(ed.get("categoria","")) if ed.get("categoria") in cats_ed else 0
                e_cat = st.selectbox("Categoria", cats_ed, index=idx_cat) if cats_ed else st.text_input("Categoria", value=ed.get("categoria",""))
            with ec4:
                try:
                    e_data = st.date_input("Data", value=datetime.strptime(str(ed.get("data",""))[:10],"%Y-%m-%d").date())
                except Exception:
                    e_data = st.date_input("Data", value=date.today())
            e_obs = st.text_area("Observações", value=ed.get("observacoes","") or "", height=70)
            cs, cc = st.columns(2)
            with cs: salvar_ed = st.form_submit_button("💾 Salvar", type="primary", use_container_width=True)
            with cc: cancelar_ed = st.form_submit_button("✖️ Cancelar", use_container_width=True)

        if cancelar_ed:
            st.session_state.edit_lanc_c = None
            st.rerun()
        if salvar_ed:
            if not e_desc.strip():
                st.error("Descrição obrigatória.")
            else:
                r = api_put(f"/api/financeiro/consultorio/{ed['id']}", {
                    "tipo": e_tipo, "descricao": e_desc.strip(),
                    "valor": e_valor, "data": str(e_data),
                    "categoria": e_cat, "observacoes": e_obs.strip() or None
                })
                if r and r.ok:
                    st.success("✅ Lançamento atualizado!")
                    st.session_state.edit_lanc_c = None
                    st.cache_data.clear()
                    st.rerun()
                else:
                    st.error("Erro ao atualizar.")

# ── ABA: NOVO LANÇAMENTO ──────────────────────────────────────────────────────
with tab_novo:
    st.subheader("Registrar Novo Lançamento")

    with st.form("form_novo_c", clear_on_submit=True):
        st.markdown('<div class="sec-title">📋 Dados do Lançamento</div>', unsafe_allow_html=True)
        n1, n2, n3 = st.columns([2, 2, 2])
        with n1:
            n_tipo = st.selectbox("Tipo *", ["receita","despesa"])
        with n2:
            n_valor = st.number_input("Valor (R$) *", min_value=0.01, step=0.01, format="%.2f")
        with n3:
            n_data = st.date_input("Data *", value=date.today())

        n_desc = st.text_input("Descrição *", placeholder="Ex: Tratamento canal, Compra resina…")

        n4, n5 = st.columns(2)
        with n4:
            cats_disp = (categorias_api.get(n_tipo, []) if isinstance(categorias_api, dict) else [])
            n_cat = st.selectbox("Categoria *", cats_disp) if cats_disp else st.text_input("Categoria *")
        with n5:
            n_recorrente = st.selectbox("Recorrência",
                                        ["Único","Mensal","Trimestral","Semestral","Anual"])

        n_obs = st.text_area("Observações", height=75,
                             placeholder="Notas adicionais, número da nota fiscal, paciente…")

        salvar_n = st.form_submit_button("💾 Registrar Lançamento",
                                         use_container_width=True, type="primary")

    if salvar_n:
        if not n_desc.strip():
            st.error("⚠️ Descrição é obrigatória.")
        else:
            payload = {
                "tipo": n_tipo, "descricao": n_desc.strip(),
                "valor": n_valor, "data": str(n_data),
                "categoria": n_cat,
                "observacoes": (f"Recorrência: {n_recorrente}. " if n_recorrente != "Único" else "")
                               + (n_obs.strip() or "")
            }
            resp = api_post("/api/financeiro/consultorio/", payload)
            if resp and resp.status_code == 201:
                st.success("✅ Lançamento registrado!")
                st.cache_data.clear()
                st.rerun()
            else:
                st.error(f"❌ Erro ao registrar: {resp.text if resp else 'sem resposta'}")

# ── ABA: VISÃO ANUAL ──────────────────────────────────────────────────────────
with tab_anual:
    st.subheader(f"Visão Anual – {ano_sel}")
    st.caption("Evolução mês a mês de receitas, despesas e saldo.")

    meses_data = []
    with st.spinner("Carregando dados anuais…"):
        for m in range(1, 13):
            r = api_get("/api/financeiro/consultorio/resumo", {"mes": m, "ano": ano_sel})
            if isinstance(r, dict):
                meses_data.append({
                    "Mês": MESES[m-1][:3],
                    "Receitas": r.get("receitas", 0),
                    "Despesas": r.get("despesas", 0),
                    "Saldo":    r.get("saldo", 0),
                })

    if meses_data:
        df_anual = pd.DataFrame(meses_data).set_index("Mês")

        an1, an2 = st.columns(2)
        with an1:
            st.markdown('<div class="sec-title">📊 Receitas vs Despesas Mensais</div>',
                        unsafe_allow_html=True)
            st.bar_chart(df_anual[["Receitas","Despesas"]], height=260)
        with an2:
            st.markdown('<div class="sec-title">📈 Saldo Mensal</div>',
                        unsafe_allow_html=True)
            st.line_chart(df_anual[["Saldo"]], height=260)

        # Tabela resumo anual
        st.markdown('<div class="sec-title" style="margin-top:1rem">📋 Tabela Resumo</div>',
                    unsafe_allow_html=True)
        df_anual_fmt = df_anual.copy()
        for col in ["Receitas","Despesas","Saldo"]:
            df_anual_fmt[col] = df_anual_fmt[col].apply(fmt_brl)
        st.dataframe(df_anual_fmt, use_container_width=True)

        # Totais anuais
        ta1, ta2, ta3 = st.columns(3)
        ta1.metric("Total Receitas", fmt_brl(df_anual["Receitas"].sum()))
        ta2.metric("Total Despesas", fmt_brl(df_anual["Despesas"].sum()))
        ta3.metric("Saldo Anual",    fmt_brl(df_anual["Saldo"].sum()))
    else:
        st.info("Sem dados para o ano selecionado.")
