"""
Financeiro Pessoal – Sistema Odontológico Profissional
"""
import streamlit as st
import requests
import pandas as pd
import io
from datetime import date, datetime

st.set_page_config(page_title="Financeiro Pessoal", page_icon="👤", layout="wide")

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
        return requests.post(f"{API_URL}{endpoint}", json=payload, timeout=6)
    except Exception:
        return None

def api_put(endpoint, payload):
    try:
        return requests.put(f"{API_URL}{endpoint}", json=payload, timeout=6)
    except Exception:
        return None

def api_delete(endpoint):
    try:
        r = requests.delete(f"{API_URL}{endpoint}", timeout=6)
        return r.status_code in (200, 204)
    except Exception:
        return False

def fmt_brl(v):
    return f"R$ {v:,.2f}".replace(",","X").replace(".",",").replace("X",".")

# ── Estado ────────────────────────────────────────────────────────────────────
for k, v in [("edit_lanc_p", None), ("confirmar_del_p", None)]:
    if k not in st.session_state:
        st.session_state[k] = v

# ── CSS ───────────────────────────────────────────────────────────────────────
require_login()
render_sidebar()

st.markdown("""
<style>
.sec-title { font-size:.82rem; font-weight:700; color:#7c3aed;
             text-transform:uppercase; letter-spacing:.05em; margin-bottom:.35rem; }
.badge-rec { background:#dcfce7; color:#166534; padding:2px 10px;
             border-radius:12px; font-size:.75rem; font-weight:600; }
.badge-des { background:#fee2e2; color:#991b1b; padding:2px 10px;
             border-radius:12px; font-size:.75rem; font-weight:600; }
div[data-testid="stMetric"] { background:#f5f3ff; border-radius:8px; padding:.4rem .8rem; }
</style>""", unsafe_allow_html=True)

# ── Cabeçalho ─────────────────────────────────────────────────────────────────
st.title("👤 Financeiro Pessoal")
st.markdown("---")

cp1, cp2, cp3 = st.columns([2, 2, 6])
with cp1:
    mes_sel = st.selectbox("Mês", range(1, 13), index=date.today().month - 1,
                           format_func=lambda x: MESES[x-1], key="mes_p")
with cp2:
    ano_sel = st.selectbox("Ano", range(date.today().year - 3, date.today().year + 2),
                           index=3, key="ano_p")

# ── DADOS ─────────────────────────────────────────────────────────────────────
resumo      = api_get("/api/financeiro/pessoal/resumo", {"mes": mes_sel, "ano": ano_sel})
categorias_api = api_get("/api/financeiro/pessoal/categorias")
todos_lanc  = api_get("/api/financeiro/pessoal/", {"mes": mes_sel, "ano": ano_sel})

receitas_val = resumo.get("receitas",0) if isinstance(resumo,dict) else 0
despesas_val = resumo.get("despesas",0) if isinstance(resumo,dict) else 0
saldo_val    = resumo.get("saldo",0)    if isinstance(resumo,dict) else 0
por_cat      = resumo.get("por_categoria",{}) if isinstance(resumo,dict) else {}

# ── KPIs ──────────────────────────────────────────────────────────────────────
k1, k2, k3, k4 = st.columns(4)
k1.metric("💚 Receitas",  fmt_brl(receitas_val))
k2.metric("🔴 Despesas",  fmt_brl(despesas_val))
k3.metric("💰 Saldo",     fmt_brl(saldo_val),
          delta="▲ positivo" if saldo_val >= 0 else "▼ negativo",
          delta_color="normal" if saldo_val >= 0 else "inverse")
taxa_comp = f"{despesas_val/receitas_val*100:.0f}%" if receitas_val else "—"
k4.metric("📊 Compr. Renda", taxa_comp,
          help="% da renda comprometida com despesas")

# ── Gráficos do dashboard ─────────────────────────────────────────────────────
col_g1, col_g2 = st.columns(2)

with col_g1:
    st.markdown('<div class="sec-title">🍩 Despesas por Categoria</div>', unsafe_allow_html=True)
    if por_cat:
        df_cat_p = pd.DataFrame(list(por_cat.items()), columns=["Categoria","Valor"])
        df_cat_p = df_cat_p.sort_values("Valor", ascending=False)
        st.bar_chart(df_cat_p.set_index("Categoria"), height=230)
    else:
        st.caption("Sem despesas no período.")

with col_g2:
    st.markdown('<div class="sec-title">� Top Despesas por Categoria</div>', unsafe_allow_html=True)
    if por_cat:
        df_top = (pd.DataFrame(list(por_cat.items()), columns=["Categoria","Valor"])
                  .sort_values("Valor", ascending=False).head(5))
        total_desp = df_top["Valor"].sum() or 1
        for _, row in df_top.iterrows():
            pct_cat = row["Valor"] / despesas_val if despesas_val else 0
            st.markdown(f"**{row['Categoria']}** — {fmt_brl(row['Valor'])}")
            st.progress(pct_cat)
            st.caption(f"{pct_cat*100:.1f}% das despesas do mês")
    else:
        st.caption("Sem despesas no período.")

# ── Evolução Diária ───────────────────────────────────────────────────────────
if isinstance(todos_lanc, list) and todos_lanc:
    df_all_p = pd.DataFrame(todos_lanc)
    df_all_p["data"] = pd.to_datetime(df_all_p["data"])
    df_all_p["val_signed"] = df_all_p.apply(
        lambda r: r["valor"] if r["tipo"]=="receita" else -r["valor"], axis=1)
    df_evo_p = (df_all_p.groupby("data")["val_signed"].sum()
                .sort_index().cumsum().reset_index()
                .rename(columns={"val_signed":"Saldo acumulado"}))
    st.markdown('<div class="sec-title" style="margin-top:.5rem">📈 Saldo Acumulado no Mês</div>',
                unsafe_allow_html=True)
    st.line_chart(df_evo_p.set_index("data"), height=160)

st.markdown("---")

# ── TABS ──────────────────────────────────────────────────────────────────────
tab_lista, tab_novo, tab_anual = st.tabs([
    "📋 Lançamentos", "➕ Novo Lançamento", "📅 Visão Anual"
])

# ── ABA: LISTA ────────────────────────────────────────────────────────────────
with tab_lista:
    fl1, fl2, fl3, fl4 = st.columns([2, 2, 2, 1])
    with fl1:
        f_tipo = st.selectbox("Tipo", ["Todos","receita","despesa"], key="f_tipo_p")
    with fl2:
        cats_todas_p = (categorias_api.get("receita",[]) + categorias_api.get("despesa",[])
                        if isinstance(categorias_api, dict) else [])
        f_cat = st.selectbox("Categoria", ["Todas"] + cats_todas_p, key="f_cat_p")
    with fl3:
        f_mes_only = st.checkbox("Apenas este mês", value=True, key="f_mes_p")
    with fl4:
        exportar_p = st.button("📥 CSV", use_container_width=True, key="exp_p")

    params_lp: dict = {}
    if f_mes_only:
        params_lp.update({"mes": mes_sel, "ano": ano_sel})
    if f_tipo != "Todos":
        params_lp["tipo"] = f_tipo

    lancamentos_p = api_get("/api/financeiro/pessoal/", params_lp)
    if not isinstance(lancamentos_p, list):
        lancamentos_p = []
    if f_cat != "Todas":
        lancamentos_p = [l for l in lancamentos_p if l.get("categoria") == f_cat]

    if exportar_p and lancamentos_p:
        buf = io.StringIO()
        pd.DataFrame(lancamentos_p).to_csv(buf, index=False, sep=";")
        st.download_button("⬇️ Baixar", data=buf.getvalue().encode("utf-8-sig"),
                           file_name=f"pessoal_{mes_sel:02d}_{ano_sel}.csv",
                           mime="text/csv", key="dl_p")

    if not lancamentos_p:
        st.info("Nenhum lançamento encontrado.")
    else:
        df_lp = pd.DataFrame(lancamentos_p)
        tot_rec_p = df_lp[df_lp["tipo"]=="receita"]["valor"].sum() if "valor" in df_lp.columns else 0
        tot_des_p = df_lp[df_lp["tipo"]=="despesa"]["valor"].sum() if "valor" in df_lp.columns else 0
        sa, sb_p, sc = st.columns(3)
        sa.metric("Receitas filtradas",  fmt_brl(tot_rec_p))
        sb_p.metric("Despesas filtradas", fmt_brl(tot_des_p))
        sc.metric("Saldo filtrado",      fmt_brl(tot_rec_p - tot_des_p))
        st.markdown("")

        for lanc in lancamentos_p:
            tipo_l = lanc.get("tipo","")
            badge = '<span class="badge-rec">RECEITA</span>' if tipo_l=="receita" \
                    else '<span class="badge-des">DESPESA</span>'
            data_fmt = ""
            if lanc.get("data"):
                try:
                    data_fmt = datetime.strptime(str(lanc["data"])[:10],"%Y-%m-%d").strftime("%d/%m/%Y")
                except Exception:
                    data_fmt = str(lanc["data"])

            with st.container(border=True):
                pc1, pc2, pc3, pc4, pc5 = st.columns([4,2,2,1,1])
                with pc1:
                    st.markdown(f"**{lanc.get('descricao','')}**  {badge}", unsafe_allow_html=True)
                    st.caption(f"📂 {lanc.get('categoria','')}  •  📅 {data_fmt}"
                               + (f"  •  {lanc.get('observacoes','')}" if lanc.get('observacoes') else ""))
                with pc2:
                    cor_v = "green" if tipo_l=="receita" else "red"
                    st.markdown(f"<span style='font-size:1.1rem;font-weight:700;color:{cor_v}'>"
                                f"{fmt_brl(lanc.get('valor',0))}</span>", unsafe_allow_html=True)
                with pc3:
                    st.caption(f"ID: {str(lanc.get('id',''))[:8]}…")
                with pc4:
                    if st.button("✏️", key=f"ed_p_{lanc['id']}"):
                        st.session_state.edit_lanc_p = lanc
                with pc5:
                    if st.button("🗑️", key=f"del_p_{lanc['id']}"):
                        st.session_state.confirmar_del_p = lanc["id"]

            if st.session_state.confirmar_del_p == lanc["id"]:
                st.warning(f"⚠️ Confirma exclusão de **{lanc.get('descricao','')}**?")
                cx1, cx2 = st.columns(2)
                with cx1:
                    if st.button("✅ Confirmar", key=f"conf_p_{lanc['id']}"):
                        if api_delete(f"/api/financeiro/pessoal/{lanc['id']}"):
                            st.success("Removido!")
                            st.session_state.confirmar_del_p = None
                            st.cache_data.clear()
                            st.rerun()
                with cx2:
                    if st.button("❌ Cancelar", key=f"canc_p_{lanc['id']}"):
                        st.session_state.confirmar_del_p = None
                        st.rerun()

    # Painel de edição
    if st.session_state.edit_lanc_p:
        edp = st.session_state.edit_lanc_p
        st.markdown("---")
        st.markdown("#### ✏️ Editar Lançamento")
        with st.form("form_edit_p"):
            ep1, ep2 = st.columns(2)
            with ep1:
                ep_tipo = st.selectbox("Tipo", ["receita","despesa"],
                                       index=0 if edp.get("tipo")=="receita" else 1)
            with ep2:
                ep_valor = st.number_input("Valor (R$)", value=float(edp.get("valor",0)),
                                           min_value=0.01, step=0.01)
            ep_desc = st.text_input("Descrição", value=edp.get("descricao",""))
            ep3, ep4 = st.columns(2)
            with ep3:
                cats_edp = (categorias_api.get(ep_tipo,[]) if isinstance(categorias_api,dict) else [])
                idx_cap = cats_edp.index(edp.get("categoria","")) if edp.get("categoria") in cats_edp else 0
                ep_cat = st.selectbox("Categoria", cats_edp, index=idx_cap) if cats_edp else \
                         st.text_input("Categoria", value=edp.get("categoria",""))
            with ep4:
                try:
                    ep_data = st.date_input("Data",
                                            value=datetime.strptime(str(edp.get("data",""))[:10],"%Y-%m-%d").date())
                except Exception:
                    ep_data = st.date_input("Data", value=date.today())
            ep_obs = st.text_area("Observações", value=edp.get("observacoes","") or "", height=70)
            eps, epc = st.columns(2)
            with eps: salvar_ep  = st.form_submit_button("💾 Salvar",    type="primary", use_container_width=True)
            with epc: cancelar_ep= st.form_submit_button("✖️ Cancelar", use_container_width=True)

        if cancelar_ep:
            st.session_state.edit_lanc_p = None
            st.rerun()
        if salvar_ep:
            if not ep_desc.strip():
                st.error("Descrição obrigatória.")
            else:
                r = api_put(f"/api/financeiro/pessoal/{edp['id']}", {
                    "tipo": ep_tipo, "descricao": ep_desc.strip(),
                    "valor": ep_valor, "data": str(ep_data),
                    "categoria": ep_cat, "observacoes": ep_obs.strip() or None
                })
                if r and r.ok:
                    st.success("✅ Lançamento atualizado!")
                    st.session_state.edit_lanc_p = None
                    st.cache_data.clear()
                    st.rerun()
                else:
                    st.error("Erro ao atualizar.")

# ── ABA: NOVO LANÇAMENTO ──────────────────────────────────────────────────────
with tab_novo:
    st.subheader("Registrar Novo Lançamento")

    with st.form("form_novo_p", clear_on_submit=True):
        st.markdown('<div class="sec-title">📋 Dados do Lançamento</div>', unsafe_allow_html=True)
        np1, np2, np3 = st.columns([2, 2, 2])
        with np1:
            np_tipo = st.selectbox("Tipo *", ["receita","despesa"])
        with np2:
            np_valor = st.number_input("Valor (R$) *", min_value=0.01, step=0.01, format="%.2f")
        with np3:
            np_data = st.date_input("Data *", value=date.today())

        np_desc = st.text_input("Descrição *",
                                placeholder="Ex: Salário, Supermercado, Combustível…")
        np4, np5 = st.columns(2)
        with np4:
            cats_np = (categorias_api.get(np_tipo,[]) if isinstance(categorias_api,dict) else [])
            np_cat = st.selectbox("Categoria *", cats_np) if cats_np else \
                     st.text_input("Categoria *")
        with np5:
            np_rec = st.selectbox("Recorrência",
                                  ["Único","Mensal","Trimestral","Semestral","Anual"])

        np_obs = st.text_area("Observações", height=75)

        salvar_np = st.form_submit_button("💾 Registrar", use_container_width=True, type="primary")

    if salvar_np:
        if not np_desc.strip():
            st.error("⚠️ Descrição obrigatória.")
        else:
            obs_final = (f"Recorrência: {np_rec}. " if np_rec != "Único" else "") + (np_obs.strip() or "")
            resp = api_post("/api/financeiro/pessoal/", {
                "tipo": np_tipo, "descricao": np_desc.strip(),
                "valor": np_valor, "data": str(np_data),
                "categoria": np_cat, "observacoes": obs_final or None
            })
            if resp and resp.status_code == 201:
                st.success("✅ Lançamento registrado!")
                st.cache_data.clear()
                st.rerun()
            else:
                st.error(f"❌ Erro: {resp.text if resp else 'sem resposta'}")

# ── ABA: VISÃO ANUAL ──────────────────────────────────────────────────────────
with tab_anual:
    st.subheader(f"Visão Anual – {ano_sel}")

    meses_data_p = []
    with st.spinner("Carregando dados anuais…"):
        for m in range(1, 13):
            r = api_get("/api/financeiro/pessoal/resumo", {"mes": m, "ano": ano_sel})
            if isinstance(r, dict):
                meses_data_p.append({
                    "Mês":      MESES[m-1][:3],
                    "Receitas": r.get("receitas",0),
                    "Despesas": r.get("despesas",0),
                    "Saldo":    r.get("saldo",0),
                })

    if meses_data_p:
        df_ap = pd.DataFrame(meses_data_p).set_index("Mês")

        an1, an2 = st.columns(2)
        with an1:
            st.markdown('<div class="sec-title">📊 Receitas vs Despesas</div>', unsafe_allow_html=True)
            st.bar_chart(df_ap[["Receitas","Despesas"]], height=260)
        with an2:
            st.markdown('<div class="sec-title">📈 Saldo Mensal</div>', unsafe_allow_html=True)
            st.line_chart(df_ap[["Saldo"]], height=260)

        st.markdown('<div class="sec-title" style="margin-top:1rem">📋 Tabela Resumo</div>',
                    unsafe_allow_html=True)
        df_ap_fmt = df_ap.copy()
        for col in ["Receitas","Despesas","Saldo"]:
            df_ap_fmt[col] = df_ap_fmt[col].apply(fmt_brl)
        st.dataframe(df_ap_fmt, use_container_width=True)

        ta1, ta2, ta3 = st.columns(3)
        ta1.metric("Total Receitas", fmt_brl(df_ap["Receitas"].sum()))
        ta2.metric("Total Despesas", fmt_brl(df_ap["Despesas"].sum()))
        ta3.metric("Saldo Anual",    fmt_brl(df_ap["Saldo"].sum()))
    else:
        st.info("Sem dados para o ano selecionado.")
