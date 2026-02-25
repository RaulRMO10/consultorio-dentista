"""
Página de Procedimentos
"""
import streamlit as st
import requests
import pandas as pd

st.set_page_config(page_title="Procedimentos", page_icon="💉", layout="wide")

API_URL = "http://localhost:8000"


def carregar_procedimentos():
    r = requests.get(f"{API_URL}/api/procedimentos")
    if r.status_code == 200:
        return r.json()
    return []


st.title("💉 Gerenciamento de Procedimentos")
st.markdown("---")

tab1, tab2 = st.tabs(["📋 Gerenciar", "➕ Cadastrar Novo"])

# ── Tab 1: Edição inline + exclusão múltipla ─────────────────────────────────
with tab1:
    try:
        procedimentos = carregar_procedimentos()

        if procedimentos:
            df_orig = pd.DataFrame(procedimentos)

            df_edit = df_orig[["id", "nome", "descricao", "valor_padrao", "duracao_minutos", "ativo"]].copy()
            df_edit.insert(0, "excluir", False)
            df_edit["valor_padrao"]    = df_edit["valor_padrao"].astype(float)
            df_edit["duracao_minutos"] = df_edit["duracao_minutos"].astype(int)

            st.caption("✏️ Edite direto nas células · ☑️ Marque a coluna Excluir para deletar uma ou mais linhas")

            edited = st.data_editor(
                df_edit,
                use_container_width=True,
                hide_index=True,
                column_config={
                    "excluir":         st.column_config.CheckboxColumn("🗑️ Excluir", width="small"),
                    "id":              None,
                    "nome":            st.column_config.TextColumn("Procedimento", width="large", required=True),
                    "descricao":       st.column_config.TextColumn("Descrição", width="large"),
                    "valor_padrao":    st.column_config.NumberColumn(
                                           "Valor (R$)", min_value=0.01, step=10.0,
                                           format="R$ %.2f", width="medium", required=True),
                    "duracao_minutos": st.column_config.NumberColumn(
                                           "Duração (min)", min_value=5, max_value=480,
                                           step=5, width="small", required=True),
                    "ativo":           st.column_config.CheckboxColumn("Ativo", width="small"),
                },
                key="editor_proc",
            )

            n_excluir = int(edited["excluir"].sum())

            col1, col2, col3 = st.columns([1.6, 1.8, 5])
            with col1:
                salvar = st.button("💾 Salvar Alterações", type="primary", use_container_width=True)
            with col2:
                label_del = f"🗑️ Excluir Selecionados ({n_excluir})" if n_excluir else "🗑️ Excluir Selecionados"
                excluir_btn = st.button(label_del, use_container_width=True, disabled=(n_excluir == 0))

            # ── Salvar edições ────────────────────────────────────────────────
            if salvar:
                alteracoes = erros = 0
                for i, row in edited.iterrows():
                    orig = df_edit.iloc[i]
                    if (row["nome"]            != orig["nome"] or
                        float(row["valor_padrao"])    != float(orig["valor_padrao"]) or
                        int(row["duracao_minutos"])   != int(orig["duracao_minutos"]) or
                        row["ativo"]           != orig["ativo"] or
                        str(row.get("descricao") or "") != str(orig.get("descricao") or "")):
                        r = requests.put(f"{API_URL}/api/procedimentos/{row['id']}", json={
                            "nome":             row["nome"],
                            "descricao":        row.get("descricao") or None,
                            "valor_padrao":     float(row["valor_padrao"]),
                            "duracao_minutos":  int(row["duracao_minutos"]),
                            "ativo":            bool(row["ativo"]),
                        })
                        if r.status_code == 200:
                            alteracoes += 1
                        else:
                            erros += 1
                            st.error(f"❌ Erro ao salvar '{row['nome']}'")
                if alteracoes:
                    st.success(f"✅ {alteracoes} procedimento(s) atualizado(s)!")
                    st.rerun()
                elif not erros:
                    st.info("Nenhuma alteração detectada.")

            # ── Excluir selecionados ──────────────────────────────────────────
            if excluir_btn and n_excluir:
                ids_del   = edited.loc[edited["excluir"] == True, "id"].tolist()
                nomes_del = edited.loc[edited["excluir"] == True, "nome"].tolist()
                erros = 0
                for pid in ids_del:
                    r = requests.delete(f"{API_URL}/api/procedimentos/{pid}")
                    if r.status_code != 204:
                        erros += 1
                if erros == 0:
                    st.success(f"✅ {len(ids_del)} procedimento(s) excluído(s): {', '.join(nomes_del)}")
                    st.rerun()
                else:
                    st.error(f"❌ {erros} erro(s) ao excluir.")

            # Estatísticas
            st.markdown("---")
            c1, c2, c3 = st.columns(3)
            with c1:
                st.metric("Total", len(df_orig))
            with c2:
                st.metric("Valor Médio", f"R$ {df_orig['valor_padrao'].astype(float).mean():.2f}")
            with c3:
                st.metric("Duração Média", f"{df_orig['duracao_minutos'].mean():.0f} min")

        else:
            st.info("Nenhum procedimento cadastrado ainda.")

    except Exception as e:
        st.error(f"Erro: {str(e)}")

# ── Tab 2: Cadastrar ──────────────────────────────────────────────────────────
with tab2:
    st.subheader("Cadastrar Novo Procedimento")
    with st.form("form_procedimento"):
        nome = st.text_input("Nome do Procedimento *", max_chars=200)
        descricao = st.text_area("Descrição", max_chars=500)
        col1, col2 = st.columns(2)
        with col1:
            valor = st.number_input("Valor Padrão (R$) *", min_value=0.0, step=10.0, format="%.2f")
        with col2:
            duracao = st.slider("Duração (minutos)", 15, 240, 60, 15)
        submitted = st.form_submit_button("💾 Cadastrar Procedimento", use_container_width=True)
        if submitted:
            if not nome or valor <= 0:
                st.error("⚠️ Nome e Valor são obrigatórios!")
            else:
                try:
                    r = requests.post(f"{API_URL}/api/procedimentos", json={
                        "nome": nome, "descricao": descricao or None,
                        "valor_padrao": valor, "duracao_minutos": duracao, "ativo": True,
                    })
                    if r.status_code == 201:
                        st.success("✅ Procedimento cadastrado com sucesso!")
                        st.balloons()
                    else:
                        st.error("❌ Erro ao cadastrar procedimento.")
                except Exception as e:
                    st.error(f"Erro: {str(e)}")
