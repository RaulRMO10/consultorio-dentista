"""
Página de Procedimentos — OdontoSystem
"""
import streamlit as st
import requests
import pandas as pd

st.set_page_config(page_title="Procedimentos · OdontoSystem", page_icon="💉", layout="wide")

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

/* KPI */
.kpi{background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:.9rem 1.1rem;
     box-shadow:0 1px 3px rgba(0,0,0,.06);position:relative;overflow:hidden;}
.kpi::before{content:'';position:absolute;top:0;left:0;width:4px;height:100%;border-radius:2px 0 0 2px;}
.kpi.emerald::before{background:#10b981;} .kpi.indigo::before{background:#6366f1;}
.kpi.amber::before{background:#f59e0b;}   .kpi.sky::before{background:#0ea5e9;}
.kpi-val{font-size:1.8rem;font-weight:700;color:#0f172a;line-height:1;}
.kpi-lbl{font-size:.72rem;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:.05em;margin-top:.2rem;}
.kpi-ico{position:absolute;right:.9rem;top:.9rem;font-size:1.4rem;opacity:.15;}

/* Proc card */
.proc-card{background:#fff;border:1px solid #e2e8f0;border-radius:10px;
           padding:.75rem 1rem;margin-bottom:.4rem;display:flex;align-items:center;
           gap:12px;transition:box-shadow .15s;}
.proc-card:hover{box-shadow:0 3px 10px rgba(0,0,0,.09);}
.proc-icon{width:42px;height:42px;border-radius:10px;display:flex;align-items:center;
           justify-content:center;font-size:1.2rem;flex-shrink:0;
           background:linear-gradient(135deg,#ecfdf5,#d1fae5);}
.badge-ativo{background:#d1fae5;color:#065f46;padding:2px 10px;border-radius:12px;
             font-size:.7rem;font-weight:700;}
.badge-inativo{background:#fee2e2;color:#991b1b;padding:2px 10px;border-radius:12px;
               font-size:.7rem;font-weight:700;}

/* Section header */
.sec-hdr{display:flex;align-items:center;gap:8px;font-size:.78rem;font-weight:700;
          color:#475569;text-transform:uppercase;letter-spacing:.07em;
          margin:1rem 0 .5rem;padding-bottom:.4rem;border-bottom:2px solid #e2e8f0;}

/* Tabs */
[data-testid="stTabs"] [data-baseweb="tab-list"]{gap:4px;background:#f8fafc;
 border-radius:10px;padding:4px;border:1px solid #e2e8f0;}
[data-testid="stTabs"] [data-baseweb="tab"]{border-radius:7px!important;
 font-weight:500!important;color:#64748b!important;padding:6px 16px!important;}
[data-testid="stTabs"] [aria-selected="true"]{background:#fff!important;
 color:#10b981!important;box-shadow:0 1px 4px rgba(0,0,0,.08)!important;font-weight:600!important;}

div[data-testid="stButton"]>button[kind="primary"]{
  background:linear-gradient(135deg,#059669,#10b981)!important;border:none!important;
  border-radius:8px!important;font-weight:600!important;color:white!important;}
.main .block-container{padding-top:1.5rem!important;max-width:1400px;}
</style>
""", unsafe_allow_html=True)


# ══════════════════════════════════════════════════════════════════════════════
# HELPERS
# ══════════════════════════════════════════════════════════════════════════════
@st.cache_data(ttl=120)
def safe_get(path, params=None):
    try:
        r = requests.get(f"{API_URL}{path}", params=params, timeout=5)
        return r.json() if r.ok else []
    except Exception:
        return []


# ══════════════════════════════════════════════════════════════════════════════
# CABEÇALHO + KPIs
# ══════════════════════════════════════════════════════════════════════════════
st.markdown("""
<div style="display:flex;align-items:center;gap:10px;margin-bottom:.25rem;">
    <div style="background:linear-gradient(135deg,#059669,#10b981);
                border-radius:10px;padding:6px 10px;font-size:1.3rem;">💉</div>
    <div>
        <h2 style="margin:0;color:#0f172a;font-weight:700;">Procedimentos</h2>
        <p style="margin:0;color:#64748b;font-size:.82rem;">Catálogo de procedimentos odontológicos</p>
    </div>
</div>
""", unsafe_allow_html=True)

procs_all = safe_get("/api/procedimentos")
ativos    = [p for p in procs_all if p.get("ativo", True)]
inativos  = [p for p in procs_all if not p.get("ativo", True)]
vals      = [float(p.get("valor_padrao", 0)) for p in ativos]
durs      = [int(p.get("duracao_minutos", 0)) for p in ativos]

k1,k2,k3,k4 = st.columns(4)
kpis = [
    (k1,"emerald","💉", len(procs_all),                          "Total Procedimentos"),
    (k2,"indigo", "✅", len(ativos),                             "Ativos"),
    (k3,"amber",  "💰", f"R$ {sum(vals)/len(vals):.0f}" if vals else "—", "Valor Médio"),
    (k4,"sky",    "⏱️", f"{sum(durs)/len(durs):.0f} min" if durs else "—","Duração Média"),
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
tab_lista, tab_editar, tab_novo = st.tabs(["📋 Catálogo", "✏️ Gerenciar / Editar", "➕ Novo Procedimento"])


# ──────────────────────────────────────────────────── TAB 1: CATÁLOGO ───────
with tab_lista:
    fa, fb, fc = st.columns([2, 1.5, 1])
    with fa:
        busca = st.text_input("🔍 Buscar procedimento", placeholder="nome ou descrição...")
    with fb:
        filtro_ativo = st.selectbox("Situação", ["Ativos", "Todos", "Inativos"])
    with fc:
        ordenar = st.selectbox("Ordenar por", ["Nome", "Valor (crescente)", "Valor (decrescente)", "Duração"])

    pool = procs_all if filtro_ativo == "Todos" else (ativos if filtro_ativo == "Ativos" else inativos)
    if busca:
        busca_l = busca.lower()
        pool = [p for p in pool
                if busca_l in p.get("nome","").lower() or busca_l in (p.get("descricao") or "").lower()]

    key_ord = {"Nome": lambda x: x.get("nome",""),
               "Valor (crescente)": lambda x: float(x.get("valor_padrao",0)),
               "Valor (decrescente)": lambda x: -float(x.get("valor_padrao",0)),
               "Duração": lambda x: int(x.get("duracao_minutos",0))}
    pool = sorted(pool, key=key_ord[ordenar])

    st.markdown(f'<div style="font-size:.78rem;color:#64748b;margin:.25rem 0 .5rem;">'
                f'<b>{len(pool)}</b> procedimento(s)</div>', unsafe_allow_html=True)

    if pool:
        # Calcular valor máximo para barra de proporcionalidade
        max_val = max(float(p.get("valor_padrao",0)) for p in pool) or 1

        for p in pool:
            nome     = p.get("nome","—")
            desc     = p.get("descricao") or ""
            valor    = float(p.get("valor_padrao", 0))
            duracao  = int(p.get("duracao_minutos", 0))
            ativo    = p.get("ativo", True)
            pct      = valor / max_val * 100

            badge = '<span class="badge-ativo">Ativo</span>' if ativo else '<span class="badge-inativo">Inativo</span>'
            desc_html = f'<div style="font-size:.75rem;color:#64748b;margin-top:1px;">{desc[:80]}{"…" if len(desc)>80 else ""}</div>' if desc else ""

            st.markdown(f"""
            <div class="proc-card">
                <div class="proc-icon">💉</div>
                <div style="flex:1;min-width:0;">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span style="font-weight:600;font-size:.9rem;color:#1e293b;">{nome}</span>
                        {badge}
                    </div>
                    {desc_html}
                    <div style="margin-top:.4rem;background:#f1f5f9;border-radius:4px;height:4px;overflow:hidden;">
                        <div style="width:{pct:.0f}%;height:100%;background:linear-gradient(90deg,#10b981,#059669);
                                    border-radius:4px;"></div>
                    </div>
                </div>
                <div style="text-align:right;min-width:100px;flex-shrink:0;">
                    <div style="font-weight:700;font-size:1rem;color:#059669;">R$ {valor:,.2f}</div>
                    <div style="font-size:.72rem;color:#94a3b8;">⏱️ {duracao} min</div>
                </div>
            </div>""", unsafe_allow_html=True)
    else:
        st.markdown("""
        <div style="background:#f8fafc;border:1px dashed #cbd5e1;border-radius:10px;
                    padding:2rem;text-align:center;color:#94a3b8;">
            📭 Nenhum procedimento encontrado
        </div>""", unsafe_allow_html=True)


# ──────────────────────────────────────────────── TAB 2: GERENCIAR ──────────
with tab_editar:
    try:
        procs_edit = safe_get("/api/procedimentos")

        if procs_edit:
            df_orig = pd.DataFrame(procs_edit)
            df_edit = df_orig[["id","nome","descricao","valor_padrao","duracao_minutos","ativo"]].copy()
            df_edit.insert(0, "excluir", False)
            df_edit["valor_padrao"]    = df_edit["valor_padrao"].astype(float)
            df_edit["duracao_minutos"] = df_edit["duracao_minutos"].astype(int)

            st.caption("✏️ Edite diretamente nas células · ☑️ Marque Excluir para remover linha(s)")

            edited = st.data_editor(
                df_edit,
                use_container_width=True,
                hide_index=True,
                column_config={
                    "excluir":         st.column_config.CheckboxColumn("🗑️ Excluir", width="small"),
                    "id":              None,
                    "nome":            st.column_config.TextColumn("Procedimento", width="large", required=True),
                    "descricao":       st.column_config.TextColumn("Descrição",    width="large"),
                    "valor_padrao":    st.column_config.NumberColumn("Valor (R$)", min_value=0.01,
                                            step=10.0, format="R$ %.2f", width="medium", required=True),
                    "duracao_minutos": st.column_config.NumberColumn("Duração (min)", min_value=5,
                                            max_value=480, step=5, width="small", required=True),
                    "ativo":           st.column_config.CheckboxColumn("Ativo", width="small"),
                },
                key="editor_proc",
            )

            n_del = int(edited["excluir"].sum())
            ca, cb, _ = st.columns([1.6, 1.8, 4])
            with ca:
                salvar = st.button("💾 Salvar Alterações", type="primary", use_container_width=True)
            with cb:
                excluir_btn = st.button(
                    f"🗑️ Excluir Selecionados ({n_del})" if n_del else "🗑️ Excluir Selecionados",
                    use_container_width=True, disabled=(n_del == 0))

            # Salvar
            if salvar:
                alteracoes = erros = 0
                for i, row in edited.iterrows():
                    orig = df_edit.iloc[i]
                    if (row["nome"] != orig["nome"] or
                        float(row["valor_padrao"]) != float(orig["valor_padrao"]) or
                        int(row["duracao_minutos"]) != int(orig["duracao_minutos"]) or
                        row["ativo"] != orig["ativo"] or
                        str(row.get("descricao") or "") != str(orig.get("descricao") or "")):
                        r = requests.put(f"{API_URL}/api/procedimentos/{row['id']}", json={
                            "nome":            row["nome"],
                            "descricao":       row.get("descricao") or None,
                            "valor_padrao":    float(row["valor_padrao"]),
                            "duracao_minutos": int(row["duracao_minutos"]),
                            "ativo":           bool(row["ativo"]),
                        })
                        if r.status_code == 200: alteracoes += 1
                        else:
                            erros += 1
                            st.error(f"❌ Erro ao salvar '{row['nome']}'")
                if alteracoes:
                    st.success(f"✅ {alteracoes} procedimento(s) atualizado(s)!")
                    st.cache_data.clear()
                    st.rerun()
                elif not erros:
                    st.info("Nenhuma alteração detectada.")

            # Excluir
            if excluir_btn and n_del:
                ids_del   = edited.loc[edited["excluir"], "id"].tolist()
                nomes_del = edited.loc[edited["excluir"], "nome"].tolist()
                erros = 0
                for pid in ids_del:
                    r = requests.delete(f"{API_URL}/api/procedimentos/{pid}")
                    if r.status_code != 204: erros += 1
                if not erros:
                    st.success(f"✅ Excluído(s): {', '.join(nomes_del)}")
                    st.cache_data.clear()
                    st.rerun()
                else:
                    st.error(f"❌ {erros} erro(s) ao excluir.")

            # Estatísticas rápidas
            st.markdown("---")
            sc1, sc2, sc3, sc4 = st.columns(4)
            vals_f = df_orig["valor_padrao"].astype(float)
            sc1.metric("Total", len(df_orig))
            sc2.metric("Valor Mínimo",  f"R$ {vals_f.min():,.2f}")
            sc3.metric("Valor Máximo",  f"R$ {vals_f.max():,.2f}")
            sc4.metric("Valor Total Tabela", f"R$ {vals_f.sum():,.2f}")

        else:
            st.info("Nenhum procedimento cadastrado.")
    except Exception as e:
        st.error(f"Erro: {e}")


# ──────────────────────────────────────────────────── TAB 3: NOVO ───────────
with tab_novo:
    st.markdown('<div class="sec-hdr">➕ Cadastrar Novo Procedimento</div>', unsafe_allow_html=True)

    with st.form("form_proc", clear_on_submit=True):
        nome = st.text_input("💉 Nome do Procedimento *", max_chars=200,
                             placeholder="Ex: Limpeza / Clareamento / Extração...")
        descricao = st.text_area("📝 Descrição",
                                 placeholder="Detalhes sobre o procedimento, indicações, etc.",
                                 max_chars=500)
        c1, c2 = st.columns(2)
        with c1:
            valor   = st.number_input("💰 Valor Padrão (R$) *", min_value=0.0, step=10.0, format="%.2f")
        with c2:
            duracao = st.slider("⏱️ Duração (minutos)", 15, 240, 60, 15)

        ativo = st.checkbox("Procedimento ativo", value=True)

        submitted = st.form_submit_button("💾 Cadastrar Procedimento", type="primary", use_container_width=True)
        if submitted:
            if not nome.strip() or valor <= 0:
                st.error("⚠️ Nome e Valor são obrigatórios e o valor deve ser maior que zero.")
            else:
                try:
                    r = requests.post(f"{API_URL}/api/procedimentos", json={
                        "nome":            nome.strip(),
                        "descricao":       descricao.strip() or None,
                        "valor_padrao":    valor,
                        "duracao_minutos": duracao,
                        "ativo":           ativo,
                    })
                    if r.status_code == 201:
                        st.success(f"✅ Procedimento **{nome}** cadastrado com sucesso!")
                        st.balloons()
                    else:
                        st.error(f"❌ Erro: {r.json().get('detail','Falha ao cadastrar')}")
                except Exception as e:
                    st.error(f"Erro de conexão: {e}")
