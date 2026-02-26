"""
Página de Pacientes - Sistema Odontológico Profissional
"""
import streamlit as st
import requests
import pandas as pd
from datetime import date, datetime
import re
import io

st.set_page_config(page_title="Pacientes", page_icon="👥", layout="wide")

import sys as _sys, os as _os
_sys.path.insert(0, _os.path.join(_os.path.dirname(__file__), ".."))
from components.sidebar import render_sidebar
from components.auth import require_login


API_URL = "http://localhost:8000"

# ── Helpers ───────────────────────────────────────────────────────────────────

def calcular_idade(data_nascimento_str):
    if not data_nascimento_str:
        return None
    try:
        nascimento = datetime.strptime(str(data_nascimento_str)[:10], "%Y-%m-%d").date()
        hoje = date.today()
        return hoje.year - nascimento.year - ((hoje.month, hoje.day) < (nascimento.month, nascimento.day))
    except Exception:
        return None

def formatar_cpf(cpf: str) -> str:
    digits = re.sub(r"\D", "", cpf)
    if len(digits) == 11:
        return f"{digits[:3]}.{digits[3:6]}.{digits[6:9]}-{digits[9:]}"
    return cpf

def validar_cpf(cpf: str) -> bool:
    digits = re.sub(r"\D", "", cpf)
    if len(digits) != 11 or len(set(digits)) == 1:
        return False
    for pos in range(9, 11):
        soma = sum(int(digits[i]) * (pos + 1 - i) for i in range(pos))
        digito = (soma * 10 % 11) % 10
        if digito != int(digits[pos]):
            return False
    return True

def buscar_cep(cep: str):
    cep_digits = re.sub(r"\D", "", cep)
    if len(cep_digits) != 8:
        return None
    try:
        r = requests.get(f"https://viacep.com.br/ws/{cep_digits}/json/", timeout=5)
        data = r.json()
        if "erro" not in data:
            return data
    except Exception:
        pass
    return None

@st.cache_data(ttl=60)
def api_get_pacientes(ativo=None):
    params = {} if ativo is None else {"ativo": ativo}
    r = requests.get(f"{API_URL}/api/pacientes", params=params)
    r.raise_for_status()
    return r.json()

@st.cache_data(ttl=60)
def api_get_paciente(pid):
    r = requests.get(f"{API_URL}/api/pacientes/{pid}")
    r.raise_for_status()
    return r.json()

def api_criar_paciente(data: dict):
    return requests.post(f"{API_URL}/api/pacientes", json=data)

def api_atualizar_paciente(pid: str, data: dict):
    return requests.put(f"{API_URL}/api/pacientes/{pid}", json=data)

def api_deletar_paciente(pid: str):
    return requests.delete(f"{API_URL}/api/pacientes/{pid}")

@st.cache_data(ttl=60)
def api_get_agendamentos_paciente(pid: str):
    try:
        r = requests.get(f"{API_URL}/api/agendamentos", params={"paciente_id": pid})
        if r.status_code == 200:
            return r.json()
    except Exception:
        pass
    return []

# ── Estado de sessão ──────────────────────────────────────────────────────────
for _k, _v in [("paciente_selecionado_id", None), ("modo_edicao", False), ("confirmar_excl", False)]:
    if _k not in st.session_state:
        st.session_state[_k] = _v

# ── CSS ───────────────────────────────────────────────────────────────────────
require_login()
render_sidebar()

st.markdown("""
<style>
.section-title {
    font-size:0.85rem; font-weight:700; color:#7c3aed;
    text-transform:uppercase; letter-spacing:0.05em; margin-bottom:0.4rem;
}
div[data-testid="stMetric"] {
    background:#f5f3ff; border-radius:8px; padding:0.4rem 0.8rem;
}
</style>""", unsafe_allow_html=True)

# ── Cabeçalho ─────────────────────────────────────────────────────────────────
st.title("👥 Gerenciamento de Pacientes")
st.markdown("---")

tab_lista, tab_cadastrar, tab_ficha = st.tabs([
    "📋 Lista de Pacientes",
    "➕ Cadastrar Novo",
    "📄 Ficha do Paciente"
])

# ═══════════════════════════════════════════════════════════════════════════════
# TAB 1 – LISTA
# ═══════════════════════════════════════════════════════════════════════════════
with tab_lista:
    col_busca, col_cidade, col_status, col_export = st.columns([3, 2, 1, 1])
    with col_busca:
        busca = st.text_input("🔍 Buscar", placeholder="Nome, CPF, telefone, e-mail…", label_visibility="collapsed")
    with col_cidade:
        filtro_cidade = st.text_input("Cidade", placeholder="Filtrar por cidade…", label_visibility="collapsed")
    with col_status:
        mostrar_inativos = st.checkbox("Inativos")
    with col_export:
        exportar = st.button("📥 Exportar", use_container_width=True)

    try:
        ativo_param = None if mostrar_inativos else True
        pacientes = api_get_pacientes(ativo=ativo_param)

        if pacientes:
            df = pd.DataFrame(pacientes)
            if "data_nascimento" in df.columns:
                df["idade"] = df["data_nascimento"].apply(calcular_idade)
            else:
                df["idade"] = None

            # Filtros
            if busca:
                mask = pd.Series([False] * len(df), index=df.index)
                for col in ["nome", "cpf", "telefone", "celular", "email"]:
                    if col in df.columns:
                        mask |= df[col].astype(str).str.contains(busca, case=False, na=False)
                df = df[mask]
            if filtro_cidade and "cidade" in df.columns:
                df = df[df["cidade"].astype(str).str.contains(filtro_cidade, case=False, na=False)]

            # Métricas
            m1, m2, m3, m4 = st.columns(4)
            ativos_n = int(df["ativo"].sum()) if "ativo" in df.columns else len(df)
            media_id = df["idade"].dropna().mean() if "idade" in df.columns else None
            m1.metric("Total", len(df))
            m2.metric("Ativos", ativos_n)
            m3.metric("Inativos", len(df) - ativos_n)
            m4.metric("Idade média", f"{media_id:.0f} anos" if media_id and pd.notna(media_id) else "—")

            # Exportar
            if exportar:
                buf = io.StringIO()
                df.to_csv(buf, index=False, sep=";")
                st.download_button("⬇️ Baixar CSV", data=buf.getvalue().encode("utf-8-sig"),
                                   file_name=f"pacientes_{date.today()}.csv", mime="text/csv", key="dl_csv")

            # Tabela
            cols_show = [c for c in ["nome", "cpf", "telefone", "celular", "email",
                                     "cidade", "estado", "idade", "ativo"] if c in df.columns]
            df_show = df[cols_show].copy()
            df_show["ativo"] = df_show["ativo"].apply(lambda x: "✅ Ativo" if x else "❌ Inativo")
            if "idade" in df_show.columns:
                df_show["idade"] = df_show["idade"].apply(lambda x: f"{int(x)} anos" if pd.notna(x) else "—")

            event = st.dataframe(
                df_show, use_container_width=True, hide_index=True,
                column_config={
                    "nome":     st.column_config.TextColumn("Nome", width="large"),
                    "cpf":      st.column_config.TextColumn("CPF"),
                    "telefone": st.column_config.TextColumn("Telefone"),
                    "celular":  st.column_config.TextColumn("Celular"),
                    "email":    st.column_config.TextColumn("Email"),
                    "cidade":   st.column_config.TextColumn("Cidade"),
                    "estado":   st.column_config.TextColumn("UF", width="small"),
                    "idade":    st.column_config.TextColumn("Idade", width="small"),
                    "ativo":    st.column_config.TextColumn("Status"),
                },
                on_select="rerun",
                selection_mode="single-row",
            )

            sel = event.selection.rows if event and event.selection else []
            if sel:
                pid_click = df.iloc[sel[0]]["id"]
                st.session_state.paciente_selecionado_id = pid_click
                st.session_state.modo_edicao = False
                nome_click = df.iloc[sel[0]]["nome"]
                st.info(f"📄 **{nome_click}** selecionado — abra a aba **Ficha do Paciente** para ver detalhes ou editar.")
        else:
            st.info("Nenhum paciente encontrado.")

    except Exception as e:
        st.error(f"Erro ao carregar pacientes: {e}")

# ═══════════════════════════════════════════════════════════════════════════════
# TAB 2 – CADASTRAR NOVO
# ═══════════════════════════════════════════════════════════════════════════════
with tab_cadastrar:
    st.subheader("Cadastrar Novo Paciente")

    # Busca de CEP antes do form
    with st.expander("🔎 Consultar CEP para autopreenchimento"):
        cep_q = st.text_input("CEP", max_chars=9, placeholder="00000-000", key="cep_query")
        if st.button("Buscar CEP", key="btn_cep_query") and cep_q:
            res_cep = buscar_cep(cep_q)
            if res_cep:
                st.success("CEP encontrado! Copie os dados abaixo:")
                st.json({"Logradouro": res_cep.get("logradouro",""), "Bairro": res_cep.get("bairro",""),
                          "Cidade": res_cep.get("localidade",""), "UF": res_cep.get("uf","")})
                st.session_state["cep_data"] = res_cep
            else:
                st.error("CEP não encontrado ou inválido.")

    cep_auto = st.session_state.get("cep_data", {})

    with st.form("form_novo_paciente", clear_on_submit=True):
        st.markdown('<div class="section-title">📋 Dados Pessoais</div>', unsafe_allow_html=True)
        c1, c2, c3 = st.columns([3, 2, 1])
        with c1:
            nome = st.text_input("Nome Completo *", max_chars=200)
        with c2:
            cpf_raw = st.text_input("CPF", max_chars=14, placeholder="000.000.000-00")
        with c3:
            data_nasc = st.date_input("Nascimento", value=None, min_value=date(1900,1,1), max_value=date.today())

        c4, c5 = st.columns(2)
        with c4:
            profissao = st.text_input("Profissão", max_chars=100)
        with c5:
            estado_civil = st.selectbox("Estado Civil",
                ["Não informado","Solteiro(a)","Casado(a)","Divorciado(a)","Viúvo(a)","União Estável"])

        st.divider()
        st.markdown('<div class="section-title">📞 Contato</div>', unsafe_allow_html=True)
        c6, c7, c8 = st.columns(3)
        with c6:
            telefone = st.text_input("Telefone *", max_chars=20, placeholder="(00) 0000-0000")
        with c7:
            celular = st.text_input("Celular / WhatsApp", max_chars=20, placeholder="(00) 90000-0000")
        with c8:
            email = st.text_input("Email", max_chars=150)

        c9, c10 = st.columns(2)
        with c9:
            contato_emerg = st.text_input("Contato de Emergência", max_chars=200, placeholder="Nome – parentesco")
        with c10:
            tel_emerg = st.text_input("Telefone Emergência", max_chars=20)

        st.divider()
        st.markdown('<div class="section-title">📍 Endereço</div>', unsafe_allow_html=True)
        c11, c12 = st.columns([1, 3])
        with c11:
            cep_f = st.text_input("CEP", max_chars=10, placeholder="00000-000",
                                   value=cep_auto.get("cep",""))
        with c12:
            endereco = st.text_input("Logradouro / Endereço", max_chars=500,
                                     value=cep_auto.get("logradouro",""))
        c13, c14, c15 = st.columns([3, 3, 1])
        with c13:
            cidade = st.text_input("Cidade", max_chars=100, value=cep_auto.get("localidade",""))
        with c14:
            bairro = st.text_input("Bairro", max_chars=100, value=cep_auto.get("bairro",""))
        with c15:
            estado_uf = st.text_input("UF", max_chars=2, value=cep_auto.get("uf",""))

        st.divider()
        st.markdown('<div class="section-title">🦷 Informações Odontológicas</div>', unsafe_allow_html=True)
        c16, c17 = st.columns(2)
        with c16:
            convenio = st.text_input("Convênio / Plano", max_chars=150)
            num_convenio = st.text_input("Nº do Convênio", max_chars=100)
        with c17:
            tipo_sang = st.selectbox("Tipo Sanguíneo",
                ["Não informado","A+","A-","B+","B-","AB+","AB-","O+","O-"])
            alergias = st.text_input("Alergias / Contraindicações", max_chars=500,
                                     placeholder="Ex: Penicilina, Dipirona, látex…")

        observacoes = st.text_area("Observações / Anamnese", max_chars=2000,
                                   placeholder="Histórico médico relevante, medicamentos em uso…", height=100)

        submitted = st.form_submit_button("💾 Cadastrar Paciente", use_container_width=True, type="primary")

    if submitted:
        erros = []
        if not nome.strip():
            erros.append("Nome é obrigatório.")
        if not telefone.strip():
            erros.append("Telefone é obrigatório.")
        if cpf_raw.strip() and not validar_cpf(cpf_raw):
            erros.append("CPF inválido. Verifique os dígitos.")

        if erros:
            for e in erros:
                st.error(f"⚠️ {e}")
        else:
            obs_parts = []
            if profissao.strip():               obs_parts.append(f"Profissão: {profissao.strip()}")
            if estado_civil != "Não informado": obs_parts.append(f"Estado civil: {estado_civil}")
            if contato_emerg.strip():           obs_parts.append(f"Emergência: {contato_emerg.strip()} | Tel: {tel_emerg.strip()}")
            if convenio.strip():                obs_parts.append(f"Convênio: {convenio.strip()} – Nº {num_convenio.strip()}")
            if tipo_sang != "Não informado":    obs_parts.append(f"Tipo sanguíneo: {tipo_sang}")
            if alergias.strip():                obs_parts.append(f"Alergias: {alergias.strip()}")
            if observacoes.strip():             obs_parts.append(observacoes.strip())

            payload = {
                "nome": nome.strip(),
                "cpf": formatar_cpf(cpf_raw) if cpf_raw.strip() else None,
                "data_nascimento": str(data_nasc) if data_nasc else None,
                "telefone": telefone.strip(),
                "celular": celular.strip() or None,
                "email": email.strip() or None,
                "endereco": endereco.strip() or None,
                "cidade": cidade.strip() or None,
                "estado": estado_uf.strip().upper() or None,
                "cep": cep_f.strip() or None,
                "observacoes": "\n".join(obs_parts) or None,
                "ativo": True,
            }
            try:
                resp = api_criar_paciente(payload)
                if resp.status_code == 201:
                    st.success("✅ Paciente cadastrado com sucesso!")
                    st.balloons()
                    if "cep_data" in st.session_state:
                        del st.session_state["cep_data"]
                elif resp.status_code == 400:
                    detail = resp.json().get("detail", "")
                    st.error("❌ CPF já cadastrado." if "cpf" in detail.lower() else f"❌ {detail}")
                else:
                    st.error(f"❌ Erro {resp.status_code}: {resp.text}")
            except Exception as ex:
                st.error(f"Erro de conexão: {ex}")

# ═══════════════════════════════════════════════════════════════════════════════
# TAB 3 – FICHA DO PACIENTE
# ═══════════════════════════════════════════════════════════════════════════════
with tab_ficha:
    st.subheader("Ficha do Paciente")

    try:
        lista_pac = api_get_pacientes()
        opcoes_pac = {p["id"]: f"{p['nome']} — {p.get('cpf') or 'sem CPF'}" for p in lista_pac}
    except Exception:
        opcoes_pac = {}

    if not opcoes_pac:
        st.info("Nenhum paciente cadastrado.")
    else:
        ids_lst = list(opcoes_pac.keys())
        idx_default = 0
        if st.session_state.paciente_selecionado_id in ids_lst:
            idx_default = ids_lst.index(st.session_state.paciente_selecionado_id)

        col_sel, col_ed_btn = st.columns([5, 1])
        with col_sel:
            pid_sel = st.selectbox("Selecione o paciente", options=ids_lst,
                                   format_func=lambda x: opcoes_pac.get(x, x),
                                   index=idx_default, key="ficha_select")
            st.session_state.paciente_selecionado_id = pid_sel
        with col_ed_btn:
            st.markdown("<br>", unsafe_allow_html=True)
            if st.button("✏️ Editar", use_container_width=True, key="btn_editar"):
                st.session_state.modo_edicao = True

        try:
            pac = api_get_paciente(pid_sel)
        except Exception as e:
            st.error(f"Erro: {e}")
            pac = None

        if pac:
            idade = calcular_idade(pac.get("data_nascimento"))

            # ── Modo Visualização ──────────────────────────────────────────
            if not st.session_state.modo_edicao:
                hc1, hc2, hc3 = st.columns([3, 2, 1])
                with hc1:
                    st.markdown(f"### 👤 {pac['nome']}")
                    st.caption(f"ID: `{pac['id']}`")
                with hc2:
                    badge = "✅ Ativo" if pac.get("ativo") else "❌ Inativo"
                    st.markdown(f"**Status:** {badge}")
                    if idade is not None:
                        st.markdown(f"**Idade:** {idade} anos")
                with hc3:
                    lbl_toggle = "🔴 Inativar" if pac.get("ativo") else "🟢 Ativar"
                    if st.button(lbl_toggle, key="btn_toggle"):
                        r = api_atualizar_paciente(pid_sel, {"ativo": not pac.get("ativo")})
                        if r.status_code == 200:
                            st.success("Status atualizado!")
                            st.cache_data.clear()
                            st.rerun()
                        else:
                            st.error("Erro ao alterar status.")
                    if st.button("🗑️ Excluir", key="btn_del_pac"):
                        st.session_state["confirmar_excl"] = True

                if st.session_state.get("confirmar_excl"):
                    st.warning("⚠️ Confirma a inativação do paciente?")
                    cc1, cc2 = st.columns(2)
                    with cc1:
                        if st.button("✅ Confirmar", key="conf_sim"):
                            r = api_deletar_paciente(pid_sel)
                            if r.status_code in (200, 204):
                                st.success("Paciente inativado.")
                                st.session_state["confirmar_excl"] = False
                                st.session_state.paciente_selecionado_id = None
                                st.cache_data.clear()
                                st.rerun()
                    with cc2:
                        if st.button("❌ Cancelar", key="conf_nao"):
                            st.session_state["confirmar_excl"] = False
                            st.rerun()

                st.divider()
                f1, f2 = st.columns(2)

                with f1:
                    st.markdown('<div class="section-title">📋 Dados Pessoais</div>', unsafe_allow_html=True)
                    st.write(f"**CPF:** {pac.get('cpf') or '—'}")
                    nasc_raw = pac.get("data_nascimento")
                    nasc_fmt = datetime.strptime(nasc_raw[:10], "%Y-%m-%d").strftime("%d/%m/%Y") if nasc_raw else "—"
                    st.write(f"**Nascimento:** {nasc_fmt}" + (f" ({idade} anos)" if idade else ""))

                    st.markdown('<div class="section-title" style="margin-top:1rem">📞 Contato</div>', unsafe_allow_html=True)
                    st.write(f"**Telefone:** {pac.get('telefone') or '—'}")
                    st.write(f"**Celular:** {pac.get('celular') or '—'}")
                    st.write(f"**Email:** {pac.get('email') or '—'}")

                with f2:
                    st.markdown('<div class="section-title">📍 Endereço</div>', unsafe_allow_html=True)
                    partes = [
                        pac.get("endereco"),
                        (pac.get("cidade") or "") + ("/" + pac["estado"] if pac.get("estado") else ""),
                        ("CEP: " + pac["cep"]) if pac.get("cep") else ""
                    ]
                    for p in partes:
                        if p and p.strip("/"):
                            st.write(f"• {p}")

                    if pac.get("observacoes"):
                        st.markdown('<div class="section-title" style="margin-top:1rem">📝 Observações / Anamnese</div>', unsafe_allow_html=True)
                        st.text_area("", value=pac["observacoes"], height=160, disabled=True,
                                     key="obs_view", label_visibility="collapsed")

                # Histórico de agendamentos
                st.divider()
                st.markdown('<div class="section-title">📅 Histórico de Agendamentos</div>', unsafe_allow_html=True)
                ags = api_get_agendamentos_paciente(pid_sel)
                if ags:
                    df_ag = pd.DataFrame(ags)
                    STATUS_AG = {
                        "agendado": "🟡 Agendado", "confirmado": "🔵 Confirmado",
                        "em_atendimento": "🟠 Em atendimento", "concluido": "🟢 Concluído",
                        "cancelado": "🔴 Cancelado", "falta": "⚫ Falta"
                    }
                    if "data_hora" in df_ag.columns:
                        df_ag["data_hora"] = pd.to_datetime(df_ag["data_hora"]).dt.strftime("%d/%m/%Y %H:%M")
                    if "status" in df_ag.columns:
                        df_ag["status"] = df_ag["status"].map(STATUS_AG).fillna(df_ag["status"])
                    cols_ag = [c for c in ["data_hora", "status", "observacoes"] if c in df_ag.columns]
                    st.dataframe(df_ag[cols_ag], use_container_width=True, hide_index=True)
                    st.caption(f"Total: {len(df_ag)} agendamentos")
                else:
                    st.caption("Nenhum agendamento registrado.")

            # ── Modo Edição ────────────────────────────────────────────────
            else:
                st.info("✏️ Edição ativa — altere os campos e salve.")
                with st.form("form_editar_paciente"):
                    st.markdown('<div class="section-title">📋 Dados Pessoais</div>', unsafe_allow_html=True)
                    ec1, ec2, ec3 = st.columns([3, 2, 1])
                    with ec1:
                        e_nome = st.text_input("Nome *", value=pac.get("nome",""), max_chars=200)
                    with ec2:
                        e_cpf  = st.text_input("CPF", value=pac.get("cpf","") or "", max_chars=14)
                    with ec3:
                        nasc_v = None
                        if pac.get("data_nascimento"):
                            try:
                                nasc_v = datetime.strptime(pac["data_nascimento"][:10], "%Y-%m-%d").date()
                            except Exception:
                                pass
                        e_nasc = st.date_input("Nascimento", value=nasc_v,
                                               min_value=date(1900,1,1), max_value=date.today())

                    st.divider()
                    st.markdown('<div class="section-title">📞 Contato</div>', unsafe_allow_html=True)
                    ec4, ec5, ec6 = st.columns(3)
                    with ec4: e_tel   = st.text_input("Telefone *", value=pac.get("telefone",""), max_chars=20)
                    with ec5: e_cel   = st.text_input("Celular",    value=pac.get("celular","") or "", max_chars=20)
                    with ec6: e_email = st.text_input("Email",      value=pac.get("email","") or "", max_chars=150)

                    st.divider()
                    st.markdown('<div class="section-title">📍 Endereço</div>', unsafe_allow_html=True)
                    ec7, ec8 = st.columns([1, 3])
                    with ec7: e_cep = st.text_input("CEP",      value=pac.get("cep","") or "", max_chars=10)
                    with ec8: e_end = st.text_input("Endereço", value=pac.get("endereco","") or "", max_chars=500)
                    ec9, ec10, ec11 = st.columns([3, 3, 1])
                    with ec9:  e_cid = st.text_input("Cidade", value=pac.get("cidade","") or "", max_chars=100)
                    with ec10: e_bai = st.text_input("Bairro",  value="", max_chars=100)
                    with ec11: e_uf  = st.text_input("UF",     value=pac.get("estado","") or "", max_chars=2)

                    st.divider()
                    st.markdown('<div class="section-title">📝 Observações</div>', unsafe_allow_html=True)
                    e_obs = st.text_area("Observações / Anamnese", value=pac.get("observacoes","") or "",
                                         height=150, max_chars=2000)

                    cs, cc = st.columns(2)
                    with cs: salvar   = st.form_submit_button("💾 Salvar", use_container_width=True, type="primary")
                    with cc: cancelar = st.form_submit_button("✖️ Cancelar", use_container_width=True)

                if cancelar:
                    st.session_state.modo_edicao = False
                    st.rerun()

                if salvar:
                    erros_ed = []
                    if not e_nome.strip():  erros_ed.append("Nome obrigatório.")
                    if not e_tel.strip():   erros_ed.append("Telefone obrigatório.")
                    if e_cpf.strip() and not validar_cpf(e_cpf): erros_ed.append("CPF inválido.")
                    if erros_ed:
                        for er in erros_ed: st.error(f"⚠️ {er}")
                    else:
                        payload_ed = {
                            "nome":         e_nome.strip(),
                            "cpf":          formatar_cpf(e_cpf) if e_cpf.strip() else None,
                            "data_nascimento": str(e_nasc) if e_nasc else None,
                            "telefone":     e_tel.strip(),
                            "celular":      e_cel.strip() or None,
                            "email":        e_email.strip() or None,
                            "endereco":     e_end.strip() or None,
                            "cidade":       e_cid.strip() or None,
                            "estado":       e_uf.strip().upper() or None,
                            "cep":          e_cep.strip() or None,
                            "observacoes":  e_obs.strip() or None,
                        }
                        try:
                            r = api_atualizar_paciente(pid_sel, payload_ed)
                            if r.status_code == 200:
                                st.success("✅ Dados atualizados!")
                                st.session_state.modo_edicao = False
                                st.cache_data.clear()
                                st.rerun()
                            elif r.status_code == 400:
                                st.error(f"❌ {r.json().get('detail','Erro ao atualizar.')}")
                            else:
                                st.error(f"❌ Erro {r.status_code}")
                        except Exception as ex:
                            st.error(f"Erro de conexão: {ex}")
