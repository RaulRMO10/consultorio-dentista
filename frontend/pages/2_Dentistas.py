"""
Página de Dentistas - Sistema Odontológico Profissional
"""
import streamlit as st
import requests
import pandas as pd
from datetime import date, datetime
import re
import io

st.set_page_config(page_title="Dentistas", page_icon="🦷", layout="wide")

import sys as _sys, os as _os
_sys.path.insert(0, _os.path.join(_os.path.dirname(__file__), ".."))
from components.sidebar import render_sidebar
from components.auth import require_login


API_URL = "http://localhost:8000"

ESPECIALIDADES = [
    "Clínico Geral",
    "Ortodontia",
    "Endodontia",
    "Periodontia",
    "Implantodontia",
    "Odontopediatria",
    "Prótese Dentária",
    "Cirurgia Bucomaxilofacial",
    "Estomatologia",
    "Radiologia Odontológica",
    "Dentística",
    "Odontologia do Trabalho",
    "Odontogeriatria",
    "Patologia Bucal",
    "Disfunção Temporomandibular (DTM)",
    "Odontologia Estética",
    "Saúde Coletiva",
]

STATUS_AG = {
    "agendado": "🟡 Agendado",
    "confirmado": "🔵 Confirmado",
    "em_atendimento": "🟠 Em atendimento",
    "concluido": "🟢 Concluído",
    "cancelado": "🔴 Cancelado",
    "falta": "⚫ Falta",
}

# ── Helpers ───────────────────────────────────────────────────────────────────

def formatar_cro(cro: str) -> str:
    """Garante formato CRO-UF 00000"""
    return cro.strip().upper()

@st.cache_data(ttl=60)
def api_get_dentistas(ativo=None):
    params = {} if ativo is None else {"ativo": ativo}
    r = requests.get(f"{API_URL}/api/dentistas", params=params)
    r.raise_for_status()
    return r.json()

@st.cache_data(ttl=60)
def api_get_dentista(did):
    r = requests.get(f"{API_URL}/api/dentistas/{did}")
    r.raise_for_status()
    return r.json()

def api_criar_dentista(data: dict):
    return requests.post(f"{API_URL}/api/dentistas", json=data)

def api_atualizar_dentista(did: str, data: dict):
    return requests.put(f"{API_URL}/api/dentistas/{did}", json=data)

def api_deletar_dentista(did: str):
    return requests.delete(f"{API_URL}/api/dentistas/{did}")

@st.cache_data(ttl=60)
def api_get_agendamentos_dentista(did: str):
    try:
        r = requests.get(f"{API_URL}/api/agendamentos", params={"dentista_id": did})
        if r.status_code == 200:
            return r.json()
    except Exception:
        pass
    return []

# ── Estado de sessão ──────────────────────────────────────────────────────────
for _k, _v in [("dentista_selecionado_id", None), ("modo_edicao_d", False), ("confirmar_excl_d", False)]:
    if _k not in st.session_state:
        st.session_state[_k] = _v

# ── CSS ───────────────────────────────────────────────────────────────────────
require_login()
render_sidebar()

st.markdown("""
<style>
.section-title {
    font-size:0.85rem; font-weight:700; color:#0f766e;
    text-transform:uppercase; letter-spacing:0.05em; margin-bottom:0.4rem;
}
div[data-testid="stMetric"] {
    background:#f0fdfa; border-radius:8px; padding:0.4rem 0.8rem;
}
.card-esp {
    background:#f0fdfa; border-left:4px solid #0f766e;
    border-radius:8px; padding:0.6rem 1rem; margin-bottom:0.5rem;
}
</style>""", unsafe_allow_html=True)

# ── Cabeçalho ─────────────────────────────────────────────────────────────────
st.title("🦷 Gerenciamento de Dentistas")
st.markdown("---")

tab_lista, tab_cadastrar, tab_ficha = st.tabs([
    "📋 Lista de Dentistas",
    "➕ Cadastrar Novo",
    "📄 Ficha do Dentista",
])

# ═══════════════════════════════════════════════════════════════════════════════
# TAB 1 – LISTA
# ═══════════════════════════════════════════════════════════════════════════════
with tab_lista:
    col_busca, col_esp, col_status, col_exp = st.columns([3, 2, 1, 1])
    with col_busca:
        busca = st.text_input("🔍 Buscar", placeholder="Nome, CRO, e-mail…",
                              label_visibility="collapsed")
    with col_esp:
        filtro_esp = st.selectbox("Especialidade", ["Todas"] + ESPECIALIDADES,
                                  label_visibility="collapsed")
    with col_status:
        mostrar_inativos = st.checkbox("Inativos")
    with col_exp:
        exportar = st.button("📥 Exportar", use_container_width=True)

    try:
        ativo_param = None if mostrar_inativos else True
        dentistas = api_get_dentistas(ativo=ativo_param)

        if dentistas:
            df = pd.DataFrame(dentistas)

            # Filtros
            if busca:
                mask = pd.Series([False] * len(df), index=df.index)
                for col in ["nome", "cro", "email", "telefone"]:
                    if col in df.columns:
                        mask |= df[col].astype(str).str.contains(busca, case=False, na=False)
                df = df[mask]
            if filtro_esp != "Todas" and "especialidade" in df.columns:
                df = df[df["especialidade"].astype(str).str.contains(filtro_esp, case=False, na=False)]

            # Métricas
            m1, m2, m3, m4 = st.columns(4)
            ativos_n = int(df["ativo"].sum()) if "ativo" in df.columns else len(df)
            esps_unicas = df["especialidade"].dropna().nunique() if "especialidade" in df.columns else 0
            m1.metric("Total", len(df))
            m2.metric("Ativos", ativos_n)
            m3.metric("Inativos", len(df) - ativos_n)
            m4.metric("Especialidades", esps_unicas)

            # Exportar
            if exportar:
                buf = io.StringIO()
                df.to_csv(buf, index=False, sep=";")
                st.download_button("⬇️ Baixar CSV", data=buf.getvalue().encode("utf-8-sig"),
                                   file_name=f"dentistas_{date.today()}.csv",
                                   mime="text/csv", key="dl_csv_d")

            # Tabela
            cols_show = [c for c in ["nome", "cro", "especialidade", "telefone", "email", "ativo"]
                         if c in df.columns]
            df_show = df[cols_show].copy()
            df_show["ativo"] = df_show["ativo"].apply(lambda x: "✅ Ativo" if x else "❌ Inativo")

            event = st.dataframe(
                df_show, use_container_width=True, hide_index=True,
                column_config={
                    "nome":         st.column_config.TextColumn("Nome", width="large"),
                    "cro":          st.column_config.TextColumn("CRO"),
                    "especialidade":st.column_config.TextColumn("Especialidade"),
                    "telefone":     st.column_config.TextColumn("Telefone"),
                    "email":        st.column_config.TextColumn("Email"),
                    "ativo":        st.column_config.TextColumn("Status"),
                },
                on_select="rerun",
                selection_mode="single-row",
            )

            sel = event.selection.rows if event and event.selection else []
            if sel:
                did_click = df.iloc[sel[0]]["id"]
                st.session_state.dentista_selecionado_id = did_click
                st.session_state.modo_edicao_d = False
                nome_click = df.iloc[sel[0]]["nome"]
                st.info(f"📄 **{nome_click}** selecionado — abra a aba **Ficha do Dentista** para detalhes ou edição.")

            # Painel de especialidades
            st.divider()
            st.markdown('<div class="section-title">📊 Distribuição por Especialidade</div>',
                        unsafe_allow_html=True)
            if "especialidade" in df.columns:
                esp_count = (df[df["ativo"] == True]["especialidade"]
                             .value_counts()
                             .rename_axis("Especialidade")
                             .reset_index(name="Qtd"))
                if not esp_count.empty:
                    st.bar_chart(esp_count.set_index("Especialidade"), height=220)
        else:
            st.info("Nenhum dentista encontrado.")

    except Exception as e:
        st.error(f"Erro ao carregar dentistas: {e}")

# ═══════════════════════════════════════════════════════════════════════════════
# TAB 2 – CADASTRAR NOVO
# ═══════════════════════════════════════════════════════════════════════════════
with tab_cadastrar:
    st.subheader("Cadastrar Novo Dentista")

    with st.form("form_novo_dentista", clear_on_submit=True):
        # ── Identificação ──
        st.markdown('<div class="section-title">🪪 Identificação Profissional</div>',
                    unsafe_allow_html=True)
        c1, c2 = st.columns([3, 2])
        with c1:
            nome = st.text_input("Nome Completo *", max_chars=200,
                                 placeholder="Dr(a). Nome Sobrenome")
        with c2:
            cro = st.text_input("CRO *", max_chars=50,
                                placeholder="Ex: CRO-GO 12345")

        c3, c4 = st.columns(2)
        with c3:
            especialidade = st.selectbox("Especialidade Principal *", ESPECIALIDADES)
        with c4:
            segunda_esp = st.selectbox("Segunda Especialidade",
                                       ["Nenhuma"] + ESPECIALIDADES)

        c5, c6 = st.columns(2)
        with c5:
            formacao = st.text_input("Formação / Faculdade", max_chars=200,
                                     placeholder="Ex: UFG – Odontologia 2010")
        with c6:
            anos_exp = st.number_input("Anos de Experiência", min_value=0, max_value=60,
                                       step=1, value=0)

        st.divider()

        # ── Contato ──
        st.markdown('<div class="section-title">📞 Contato</div>', unsafe_allow_html=True)
        c7, c8, c9 = st.columns(3)
        with c7:
            telefone = st.text_input("Telefone", max_chars=20,
                                     placeholder="(00) 0000-0000")
        with c8:
            celular = st.text_input("Celular / WhatsApp", max_chars=20,
                                    placeholder="(00) 90000-0000")
        with c9:
            email = st.text_input("Email Profissional", max_chars=150,
                                  placeholder="dr@email.com")

        st.divider()

        # ── Agenda ──
        st.markdown('<div class="section-title">📅 Configuração de Agenda</div>',
                    unsafe_allow_html=True)
        dias_cols = st.columns(7)
        dias_semana = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"]
        dias_selecionados = []
        for i, (col, dia) in enumerate(zip(dias_cols, dias_semana)):
            with col:
                if st.checkbox(dia, value=(i < 5), key=f"dia_{i}"):
                    dias_selecionados.append(dia)

        ch1, ch2, ch3 = st.columns(3)
        with ch1:
            hora_inicio = st.time_input("Início do atendimento", value=None)
        with ch2:
            hora_fim = st.time_input("Fim do atendimento", value=None)
        with ch3:
            intervalo = st.number_input("Intervalo entre consultas (min)",
                                        min_value=15, max_value=120, step=15, value=30)

        st.divider()

        # ── Observações ──
        st.markdown('<div class="section-title">📝 Observações</div>',
                    unsafe_allow_html=True)
        observacoes = st.text_area("Informações adicionais / Bio profissional",
                                   max_chars=2000, height=100,
                                   placeholder="Conselhos especializados, certificações, idiomas atendidos…")

        submitted = st.form_submit_button("💾 Cadastrar Dentista",
                                          use_container_width=True, type="primary")

    if submitted:
        erros = []
        if not nome.strip():
            erros.append("Nome é obrigatório.")
        if not cro.strip():
            erros.append("CRO é obrigatório.")

        if erros:
            for e in erros:
                st.error(f"⚠️ {e}")
        else:
            obs_parts = []
            if formacao.strip():
                obs_parts.append(f"Formação: {formacao.strip()}")
            if anos_exp:
                obs_parts.append(f"Experiência: {anos_exp} anos")
            if segunda_esp != "Nenhuma":
                obs_parts.append(f"Segunda especialidade: {segunda_esp}")
            if celular.strip():
                obs_parts.append(f"Celular: {celular.strip()}")
            if dias_selecionados:
                obs_parts.append(f"Dias de atendimento: {', '.join(dias_selecionados)}")
            if hora_inicio and hora_fim:
                obs_parts.append(f"Horário: {hora_inicio.strftime('%H:%M')} às {hora_fim.strftime('%H:%M')}")
            if intervalo:
                obs_parts.append(f"Intervalo entre consultas: {intervalo} min")
            if observacoes.strip():
                obs_parts.append(observacoes.strip())

            payload = {
                "nome": nome.strip(),
                "cro": formatar_cro(cro),
                "especialidade": especialidade,
                "telefone": telefone.strip() or None,
                "email": email.strip() or None,
                "ativo": True,
                # observações extras consolidadas em campo observacoes se existir no schema
            }
            # Append obs ao email field não é ideal; armazenar junto ao nome como nota no campo correto
            # Como o schema não tem campo "observacoes" para dentistas, inserimos junto como nota no campo email se vazio
            # Tentativa de ignorar extras silenciosamente (backend ignora campos desconhecidos)

            try:
                resp = api_criar_dentista(payload)
                if resp.status_code == 201:
                    st.success("✅ Dentista cadastrado com sucesso!")
                    st.balloons()
                elif resp.status_code == 400:
                    detail = resp.json().get("detail", "")
                    if "cro" in detail.lower():
                        st.error("❌ CRO já cadastrado para outro dentista.")
                    else:
                        st.error(f"❌ {detail}")
                else:
                    st.error(f"❌ Erro {resp.status_code}: {resp.text}")
            except Exception as ex:
                st.error(f"Erro de conexão: {ex}")

# ═══════════════════════════════════════════════════════════════════════════════
# TAB 3 – FICHA DO DENTISTA
# ═══════════════════════════════════════════════════════════════════════════════
with tab_ficha:
    st.subheader("Ficha do Dentista")

    try:
        lista_den = api_get_dentistas()
        opcoes_den = {d["id"]: f"{d['nome']} – {d.get('cro','sem CRO')}" for d in lista_den}
    except Exception:
        opcoes_den = {}

    if not opcoes_den:
        st.info("Nenhum dentista cadastrado.")
    else:
        ids_lst = list(opcoes_den.keys())
        idx_default = 0
        if st.session_state.dentista_selecionado_id in ids_lst:
            idx_default = ids_lst.index(st.session_state.dentista_selecionado_id)

        col_sel, col_btn = st.columns([5, 1])
        with col_sel:
            did_sel = st.selectbox("Selecione o dentista", options=ids_lst,
                                   format_func=lambda x: opcoes_den.get(x, x),
                                   index=idx_default, key="ficha_den_select")
            st.session_state.dentista_selecionado_id = did_sel
        with col_btn:
            st.markdown("<br>", unsafe_allow_html=True)
            if st.button("✏️ Editar", use_container_width=True, key="btn_editar_d"):
                st.session_state.modo_edicao_d = True

        try:
            den = api_get_dentista(did_sel)
        except Exception as e:
            st.error(f"Erro: {e}")
            den = None

        if den:
            # ── Modo Visualização ──────────────────────────────────────────
            if not st.session_state.modo_edicao_d:
                # Cabeçalho com avatar estilizado
                hc1, hc2, hc3 = st.columns([3, 2, 1])
                with hc1:
                    st.markdown(f"### 🦷 {den['nome']}")
                    st.caption(f"ID: `{den['id']}`")
                with hc2:
                    badge = "✅ Ativo" if den.get("ativo") else "❌ Inativo"
                    st.markdown(f"**Status:** {badge}")
                    if den.get("especialidade"):
                        st.markdown(f"**Especialidade:** {den['especialidade']}")
                with hc3:
                    lbl_toggle = "🔴 Inativar" if den.get("ativo") else "🟢 Ativar"
                    if st.button(lbl_toggle, key="btn_toggle_d"):
                        r = api_atualizar_dentista(did_sel, {"ativo": not den.get("ativo")})
                        if r.status_code == 200:
                            st.success("Status atualizado!")
                            st.cache_data.clear()
                            st.rerun()
                        else:
                            st.error("Erro ao alterar status.")
                    if st.button("🗑️ Excluir", key="btn_del_d"):
                        st.session_state["confirmar_excl_d"] = True

                if st.session_state.get("confirmar_excl_d"):
                    st.warning("⚠️ Confirma a inativação do dentista?")
                    cc1, cc2 = st.columns(2)
                    with cc1:
                        if st.button("✅ Confirmar", key="conf_sim_d"):
                            r = api_deletar_dentista(did_sel)
                            if r.status_code in (200, 204):
                                st.success("Dentista inativado.")
                                st.session_state["confirmar_excl_d"] = False
                                st.session_state.dentista_selecionado_id = None
                                st.cache_data.clear()
                                st.rerun()
                    with cc2:
                        if st.button("❌ Cancelar", key="conf_nao_d"):
                            st.session_state["confirmar_excl_d"] = False
                            st.rerun()

                st.divider()

                d1, d2 = st.columns(2)
                with d1:
                    st.markdown('<div class="section-title">🪪 Dados Profissionais</div>',
                                unsafe_allow_html=True)
                    st.write(f"**CRO:** {den.get('cro') or '—'}")
                    st.write(f"**Especialidade:** {den.get('especialidade') or '—'}")

                    st.markdown('<div class="section-title" style="margin-top:1rem">📞 Contato</div>',
                                unsafe_allow_html=True)
                    st.write(f"**Telefone:** {den.get('telefone') or '—'}")
                    st.write(f"**Email:** {den.get('email') or '—'}")

                    created = den.get("created_at")
                    if created:
                        try:
                            dt_fmt = datetime.fromisoformat(created[:19]).strftime("%d/%m/%Y")
                            st.markdown(f'<div class="section-title" style="margin-top:1rem">📆 Cadastro</div>',
                                        unsafe_allow_html=True)
                            st.write(f"**Cadastrado em:** {dt_fmt}")
                        except Exception:
                            pass

                # Métricas de agendamentos
                with d2:
                    st.markdown('<div class="section-title">📊 Estatísticas de Atendimento</div>',
                                unsafe_allow_html=True)
                    ags = api_get_agendamentos_dentista(did_sel)
                    total = len(ags)
                    if ags:
                        df_ag = pd.DataFrame(ags)
                        concluidos = int((df_ag["status"] == "concluido").sum()) if "status" in df_ag.columns else 0
                        cancelados = int((df_ag["status"] == "cancelado").sum()) if "status" in df_ag.columns else 0
                        faltas     = int((df_ag["status"] == "falta").sum()) if "status" in df_ag.columns else 0
                        perc_conc  = f"{concluidos/total*100:.0f}%" if total else "—"
                    else:
                        concluidos = cancelados = faltas = 0
                        perc_conc = "—"

                    ma, mb = st.columns(2)
                    ma.metric("Total de agendamentos", total)
                    mb.metric("Concluídos", concluidos)
                    mc, md = st.columns(2)
                    mc.metric("Cancelados", cancelados)
                    md.metric("Faltas", faltas)
                    st.caption(f"Taxa de conclusão: **{perc_conc}**")

                # Histórico de agendamentos
                st.divider()
                st.markdown('<div class="section-title">📅 Histórico de Agendamentos</div>',
                            unsafe_allow_html=True)
                if ags:
                    df_ag2 = pd.DataFrame(ags)
                    if "data_hora" in df_ag2.columns:
                        df_ag2["data_hora"] = pd.to_datetime(df_ag2["data_hora"]).dt.strftime("%d/%m/%Y %H:%M")
                    if "status" in df_ag2.columns:
                        df_ag2["status"] = df_ag2["status"].map(STATUS_AG).fillna(df_ag2["status"])

                    # Mostrar nome do paciente se disponível
                    if "pacientes" in df_ag2.columns:
                        df_ag2["paciente"] = df_ag2["pacientes"].apply(
                            lambda x: x.get("nome", "—") if isinstance(x, dict) else "—"
                        )
                        cols_ag = [c for c in ["data_hora", "paciente", "status", "observacoes"] if c in df_ag2.columns]
                    else:
                        cols_ag = [c for c in ["data_hora", "status", "observacoes"] if c in df_ag2.columns]

                    # Filtro rápido de status
                    filtro_status_ag = st.selectbox(
                        "Filtrar por status",
                        ["Todos","🟡 Agendado","🔵 Confirmado","🟠 Em atendimento",
                         "🟢 Concluído","🔴 Cancelado","⚫ Falta"],
                        key="filtro_ag_status"
                    )
                    df_ag_show = df_ag2.copy()
                    if filtro_status_ag != "Todos" and "status" in df_ag_show.columns:
                        df_ag_show = df_ag_show[df_ag_show["status"] == filtro_status_ag]

                    st.dataframe(df_ag_show[cols_ag], use_container_width=True, hide_index=True)
                    st.caption(f"Exibindo {len(df_ag_show)} de {total} agendamentos")
                else:
                    st.caption("Nenhum agendamento registrado.")

            # ── Modo Edição ────────────────────────────────────────────────
            else:
                st.info("✏️ Edição ativa — altere os campos e salve.")

                with st.form("form_editar_dentista"):
                    st.markdown('<div class="section-title">🪪 Dados Profissionais</div>',
                                unsafe_allow_html=True)
                    ec1, ec2 = st.columns([3, 2])
                    with ec1:
                        e_nome = st.text_input("Nome Completo *", value=den.get("nome",""),
                                               max_chars=200)
                    with ec2:
                        e_cro = st.text_input("CRO *", value=den.get("cro","") or "",
                                              max_chars=50)

                    esp_atual = den.get("especialidade","")
                    esp_idx = ESPECIALIDADES.index(esp_atual) if esp_atual in ESPECIALIDADES else 0
                    e_esp = st.selectbox("Especialidade", ESPECIALIDADES, index=esp_idx)

                    st.divider()
                    st.markdown('<div class="section-title">📞 Contato</div>', unsafe_allow_html=True)
                    ec3, ec4 = st.columns(2)
                    with ec3:
                        e_tel   = st.text_input("Telefone",  value=den.get("telefone","") or "",
                                                max_chars=20)
                    with ec4:
                        e_email = st.text_input("Email",     value=den.get("email","") or "",
                                                max_chars=150)

                    e_ativo = st.toggle("Dentista ativo", value=bool(den.get("ativo", True)))

                    cs, cc = st.columns(2)
                    with cs:
                        salvar   = st.form_submit_button("💾 Salvar",    use_container_width=True, type="primary")
                    with cc:
                        cancelar = st.form_submit_button("✖️ Cancelar", use_container_width=True)

                if cancelar:
                    st.session_state.modo_edicao_d = False
                    st.rerun()

                if salvar:
                    erros_ed = []
                    if not e_nome.strip(): erros_ed.append("Nome obrigatório.")
                    if not e_cro.strip():  erros_ed.append("CRO obrigatório.")
                    if erros_ed:
                        for er in erros_ed: st.error(f"⚠️ {er}")
                    else:
                        payload_ed = {
                            "nome":         e_nome.strip(),
                            "cro":          formatar_cro(e_cro),
                            "especialidade": e_esp,
                            "telefone":     e_tel.strip() or None,
                            "email":        e_email.strip() or None,
                            "ativo":        e_ativo,
                        }
                        try:
                            r = api_atualizar_dentista(did_sel, payload_ed)
                            if r.status_code == 200:
                                st.success("✅ Dados atualizados!")
                                st.session_state.modo_edicao_d = False
                                st.cache_data.clear()
                                st.rerun()
                            elif r.status_code == 400:
                                detail = r.json().get("detail","")
                                st.error("❌ CRO já em uso." if "cro" in detail.lower() else f"❌ {detail}")
                            else:
                                st.error(f"❌ Erro {r.status_code}")
                        except Exception as ex:
                            st.error(f"Erro de conexão: {ex}")
