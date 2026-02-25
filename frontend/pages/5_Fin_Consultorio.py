"""
Página - Financeiro do Consultório
"""
import streamlit as st
import requests
from datetime import date, datetime

st.set_page_config(page_title="Financeiro Consultório", page_icon="💼", layout="wide")

API_URL = "http://localhost:8000"
MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho",
         "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"]


def get(endpoint, params=None):
    try:
        r = requests.get(f"{API_URL}{endpoint}", params=params, timeout=5)
        return r.json() if r.ok else []
    except:
        return []


def post(endpoint, payload):
    try:
        r = requests.post(f"{API_URL}{endpoint}", json=payload, timeout=5)
        return r.json() if r.ok else None
    except:
        return None


def delete(endpoint):
    try:
        r = requests.delete(f"{API_URL}{endpoint}", timeout=5)
        return r.status_code == 204
    except:
        return False


st.title("💼 Financeiro do Consultório")
st.markdown("---")

# Seletor de período
col_mes, col_ano, _ = st.columns([2, 2, 6])
with col_mes:
    mes_sel = st.selectbox("Mês", range(1, 13), index=date.today().month - 1,
                           format_func=lambda x: MESES[x - 1])
with col_ano:
    ano_sel = st.selectbox("Ano", range(date.today().year - 2, date.today().year + 2),
                           index=2)

# Resumo do mês
resumo = get(f"/api/financeiro/consultorio/resumo", {"mes": mes_sel, "ano": ano_sel})

if resumo:
    st.markdown(f"### {MESES[mes_sel-1]} {ano_sel}")
    c1, c2, c3 = st.columns(3)
    c1.metric("💚 Receitas", f"R$ {resumo.get('receitas', 0):,.2f}")
    c2.metric("🔴 Despesas", f"R$ {resumo.get('despesas', 0):,.2f}")
    saldo = resumo.get('saldo', 0)
    c3.metric("💰 Saldo", f"R$ {saldo:,.2f}", delta=f"R$ {saldo:,.2f}")

st.markdown("---")

tab_lista, tab_novo = st.tabs(["📋 Lançamentos", "➕ Novo Lançamento"])

# ── ABA: LISTA ──────────────────────────────────────────────
with tab_lista:
    col_f1, col_f2 = st.columns(2)
    with col_f1:
        filtro_tipo = st.selectbox("Filtrar por tipo", ["Todos", "receita", "despesa"])
    with col_f2:
        filtro_mes = st.checkbox("Apenas este mês", value=True)

    params = {"mes": mes_sel, "ano": ano_sel} if filtro_mes else {}
    if filtro_tipo != "Todos":
        params["tipo"] = filtro_tipo

    lancamentos = get("/api/financeiro/consultorio/", params)

    if not lancamentos:
        st.info("Nenhum lançamento encontrado.")
    else:
        for lanc in lancamentos:
            tipo = lanc.get("tipo", "")
            cor = "🟢" if tipo == "receita" else "🔴"
            valor = lanc.get("valor", 0)
            with st.container(border=True):
                col1, col2, col3, col4 = st.columns([3, 2, 2, 1])
                col1.write(f"{cor} **{lanc.get('descricao', '')}**")
                col1.caption(f"{lanc.get('categoria', '')} • {lanc.get('data', '')}")
                col2.write(f"**R$ {valor:,.2f}**")
                col3.write(tipo.upper())
                if col4.button("🗑️", key=f"del_c_{lanc['id']}"):
                    if delete(f"/api/financeiro/consultorio/{lanc['id']}"):
                        st.success("Removido!")
                        st.rerun()

# ── ABA: NOVO LANÇAMENTO ────────────────────────────────────
with tab_novo:
    categorias = get("/api/financeiro/consultorio/categorias")

    with st.form("form_lancamento_consultorio"):
        col1, col2 = st.columns(2)
        with col1:
            tipo = st.selectbox("Tipo *", ["receita", "despesa"])
        with col2:
            valor = st.number_input("Valor (R$) *", min_value=0.01, step=0.01)

        descricao = st.text_input("Descrição *")

        col3, col4 = st.columns(2)
        with col3:
            cats = categorias.get(tipo, []) if categorias else []
            categoria = st.selectbox("Categoria *", cats)
        with col4:
            data = st.date_input("Data *", value=date.today())

        observacoes = st.text_area("Observações", height=80)

        if st.form_submit_button("💾 Salvar Lançamento", type="primary"):
            if not descricao:
                st.error("Descrição é obrigatória.")
            else:
                payload = {
                    "tipo": tipo,
                    "descricao": descricao,
                    "valor": valor,
                    "data": str(data),
                    "categoria": categoria,
                    "observacoes": observacoes or None
                }
                result = post("/api/financeiro/consultorio/", payload)
                if result:
                    st.success("✅ Lançamento salvo!")
                    st.rerun()
                else:
                    st.error("Erro ao salvar.")
