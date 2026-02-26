"""
Página de Gerenciamento de Usuários — OdontoSystem (admin only)
"""
import streamlit as st
import requests
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from components.auth import require_login, ROLE_LABELS, logout
from components.sidebar import render_sidebar

st.set_page_config(page_title="Usuários · OdontoSystem", page_icon="🔐", layout="wide")

API_URL = "http://localhost:8000"

# ── Auth guard ────────────────────────────────────────────────────────────────
user = require_login()
render_sidebar()

if user.get("role") != "admin":
    st.error("🔒 Acesso restrito a administradores.")
    st.stop()

# ── CSS ───────────────────────────────────────────────────────────────────────
st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
html,body,[class*="css"]{font-family:'Inter',sans-serif;}
[data-testid="stSidebarNav"]{display:none!important;}

.kpi{background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:.9rem 1.1rem;
     box-shadow:0 1px 3px rgba(0,0,0,.06);position:relative;overflow:hidden;}
.kpi::before{content:'';position:absolute;top:0;left:0;width:4px;height:100%;border-radius:2px 0 0 2px;}
.kpi.indigo::before{background:#6366f1;} .kpi.green::before{background:#10b981;}
.kpi.amber::before{background:#f59e0b;}  .kpi.rose::before{background:#ef4444;}
.kpi-val{font-size:1.8rem;font-weight:700;color:#0f172a;line-height:1;}
.kpi-lbl{font-size:.72rem;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:.05em;margin-top:.2rem;}
.kpi-ico{position:absolute;right:.9rem;top:.9rem;font-size:1.4rem;opacity:.15;}

.role-badge{padding:3px 10px;border-radius:12px;font-size:.72rem;font-weight:700;display:inline-block;}
.rb-admin        {background:#ede9fe;color:#6d28d9;}
.rb-dentista     {background:#d1fae5;color:#065f46;}
.rb-recepcionista{background:#dbeafe;color:#1e40af;}
.rb-financeiro   {background:#fef3c7;color:#92400e;}

.sec-hdr{display:flex;align-items:center;gap:8px;font-size:.78rem;font-weight:700;
          color:#475569;text-transform:uppercase;letter-spacing:.07em;
          margin:1rem 0 .5rem;padding-bottom:.4rem;border-bottom:2px solid #e2e8f0;}
[data-testid="stTabs"] [data-baseweb="tab-list"]{gap:4px;background:#f8fafc;
 border-radius:10px;padding:4px;border:1px solid #e2e8f0;}
[data-testid="stTabs"] [data-baseweb="tab"]{border-radius:7px!important;
 font-weight:500!important;color:#64748b!important;padding:6px 16px!important;}
[data-testid="stTabs"] [aria-selected="true"]{background:#fff!important;
 color:#6366f1!important;box-shadow:0 1px 4px rgba(0,0,0,.08)!important;font-weight:600!important;}
div[data-testid="stButton"]>button[kind="primary"]{
  background:linear-gradient(135deg,#6366f1,#8b5cf6)!important;border:none!important;
  border-radius:8px!important;font-weight:600!important;color:white!important;}
.main .block-container{padding-top:1.5rem!important;max-width:1200px;}
</style>
""", unsafe_allow_html=True)


# ── Helpers ───────────────────────────────────────────────────────────────────
def auth_headers():
    token = st.session_state.get("token", "")
    return {"Authorization": f"Bearer {token}"}

def safe_get(path):
    try:
        r = requests.get(f"{API_URL}{path}", headers=auth_headers(), timeout=5)
        return r.json() if r.ok else []
    except Exception:
        return []


# ── Cabeçalho ─────────────────────────────────────────────────────────────────
st.markdown("""
<div style="display:flex;align-items:center;gap:10px;margin-bottom:.25rem;">
    <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);
                border-radius:10px;padding:6px 10px;font-size:1.3rem;">🔐</div>
    <div>
        <h2 style="margin:0;color:#0f172a;font-weight:700;">Gerenciamento de Usuários</h2>
        <p style="margin:0;color:#64748b;font-size:.82rem;">Controle de acesso ao sistema</p>
    </div>
</div>
""", unsafe_allow_html=True)

usuarios = safe_get("/auth/usuarios")
ativos   = [u for u in usuarios if u.get("ativo")]
inativos = [u for u in usuarios if not u.get("ativo")]

# KPIs
k1,k2,k3,k4 = st.columns(4)
roles_count  = {}
for u in ativos:
    roles_count[u.get("role","?")] = roles_count.get(u.get("role","?"), 0) + 1

kpis = [
    (k1,"indigo","👥", len(usuarios),       "Total de Usuários"),
    (k2,"green", "✅", len(ativos),          "Usuários Ativos"),
    (k3,"rose",  "🔒", len(inativos),        "Inativos"),
    (k4,"amber", "👑", roles_count.get("admin",0), "Administradores"),
]
for col,cls,ico,val,lbl in kpis:
    with col:
        st.markdown(f"""<div class="kpi {cls}"><span class="kpi-ico">{ico}</span>
        <div class="kpi-val">{val}</div><div class="kpi-lbl">{lbl}</div></div>""",
        unsafe_allow_html=True)

st.markdown("<div style='height:.6rem'></div>", unsafe_allow_html=True)

# ── Tabs ──────────────────────────────────────────────────────────────────────
tab_lista, tab_novo, tab_senha = st.tabs(["👥 Usuários do Sistema", "➕ Novo Usuário", "🔑 Alterar Senha"])

ROLE_OPTS = ["recepcionista","dentista","financeiro","admin"]

# ────────────────────────────────────────────────────── TAB 1: Lista ─────────
with tab_lista:
    if usuarios:
        for u in usuarios:
            ativo    = u.get("ativo", True)
            role_key = u.get("role","recepcionista")
            ico_r, lbl_r = ROLE_LABELS.get(role_key,("👤", role_key))
            rb_cls   = f"rb-{role_key}"
            last     = u.get("ultimo_acesso")
            last_fmt = last[:10] if last else "Nunca"
            is_me    = u.get("id") == user.get("id")

            with st.expander(
                f"{'🟢' if ativo else '🔴'}  **{u['nome']}**   ·   {u['email']}",
                expanded=False,
            ):
                c1, c2, c3 = st.columns(3)
                c1.markdown(f"**Role:** <span class='role-badge {rb_cls}'>{ico_r} {lbl_r}</span>",
                            unsafe_allow_html=True)
                c2.markdown(f"**Último acesso:** {last_fmt}")
                c3.markdown(f"**Status:** {'Ativo ✅' if ativo else 'Inativo ❌'}")

                st.markdown("---")
                ea, eb, ec = st.columns([1.5, 1.5, 4])

                # Editar role
                with ea:
                    novo_role = st.selectbox(
                        "Mudar role",
                        ROLE_OPTS,
                        index=ROLE_OPTS.index(role_key) if role_key in ROLE_OPTS else 0,
                        key=f"role_{u['id']}",
                    )
                    if st.button("💾 Salvar role", key=f"sv_{u['id']}", type="primary"):
                        r = requests.put(f"{API_URL}/auth/usuarios/{u['id']}",
                                         json={"role": novo_role}, headers=auth_headers())
                        if r.ok:
                            st.success("Role atualizado!")
                            st.rerun()
                        else:
                            st.error(r.json().get("detail","Erro"))

                # Ativar/Desativar
                with eb:
                    st.markdown("<div style='height:1.6rem'></div>", unsafe_allow_html=True)
                    if ativo and not is_me:
                        if st.button("🚫 Desativar", key=f"deact_{u['id']}"):
                            r = requests.delete(f"{API_URL}/auth/usuarios/{u['id']}",
                                                headers=auth_headers())
                            if r.status_code == 204:
                                st.success("Usuário desativado.")
                                st.rerun()
                            else:
                                st.error(r.json().get("detail","Erro"))
                    elif not ativo:
                        if st.button("✅ Reativar", key=f"react_{u['id']}"):
                            r = requests.put(f"{API_URL}/auth/usuarios/{u['id']}",
                                             json={"ativo": True}, headers=auth_headers())
                            if r.ok:
                                st.success("Usuário reativado.")
                                st.rerun()
                            else:
                                st.error(r.json().get("detail","Erro"))
                    else:
                        st.caption("(sua conta)")
    else:
        st.info("Nenhum usuário cadastrado.")

# ────────────────────────────────────────────────────── TAB 2: Novo ──────────
with tab_novo:
    st.markdown('<div class="sec-hdr">➕ Criar Novo Usuário</div>', unsafe_allow_html=True)

    with st.form("form_novo_user", clear_on_submit=True):
        c1, c2 = st.columns(2)
        with c1:
            novo_nome  = st.text_input("Nome completo *")
            novo_email = st.text_input("E-mail *")
        with c2:
            novo_role  = st.selectbox("Perfil de acesso *", ROLE_OPTS,
                                      format_func=lambda r: f"{ROLE_LABELS.get(r,('👤',r))[0]} {ROLE_LABELS.get(r,('👤',r))[1]}")
            nova_senha = st.text_input("Senha inicial *", type="password",
                                       help="Mínimo 6 caracteres. O usuário poderá alterar depois.")
        conf_senha = st.text_input("Confirmar senha *", type="password")

        submitted = st.form_submit_button("➕ Criar Usuário", type="primary", use_container_width=True)
        if submitted:
            if not all([novo_nome, novo_email, nova_senha, conf_senha]):
                st.error("⚠️ Preencha todos os campos obrigatórios.")
            elif nova_senha != conf_senha:
                st.error("❌ As senhas não coincidem.")
            elif len(nova_senha) < 6:
                st.error("❌ Senha deve ter pelo menos 6 caracteres.")
            else:
                try:
                    r = requests.post(f"{API_URL}/auth/usuarios",
                                      json={"nome": novo_nome, "email": novo_email,
                                            "senha": nova_senha, "role": novo_role},
                                      headers=auth_headers(), timeout=5)
                    if r.status_code == 201:
                        st.success(f"✅ Usuário **{novo_nome}** criado com sucesso!")
                        st.balloons()
                    else:
                        st.error(f"❌ {r.json().get('detail','Erro ao criar')}")
                except Exception as e:
                    st.error(f"Erro: {e}")

# ────────────────────────────────────────────────── TAB 3: Mudar senha ───────
with tab_senha:
    st.markdown('<div class="sec-hdr">🔑 Alterar Minha Senha</div>', unsafe_allow_html=True)
    st.info(f"Alterando senha para a conta **{user.get('email','')}**")

    with st.form("form_change_pw", clear_on_submit=True):
        senha_atual = st.text_input("Senha atual *",   type="password")
        nova_pw     = st.text_input("Nova senha *",    type="password",
                                    help="Mínimo 6 caracteres")
        conf_pw     = st.text_input("Confirmar nova senha *", type="password")
        salvar_pw   = st.form_submit_button("🔐 Salvar Nova Senha", type="primary")

        if salvar_pw:
            if not all([senha_atual, nova_pw, conf_pw]):
                st.error("⚠️ Preencha todos os campos.")
            elif nova_pw != conf_pw:
                st.error("❌ As novas senhas não coincidem.")
            elif len(nova_pw) < 6:
                st.error("❌ Nova senha deve ter pelo menos 6 caracteres.")
            else:
                try:
                    r = requests.post(f"{API_URL}/auth/change-password",
                                      json={"senha_atual": senha_atual, "nova_senha": nova_pw},
                                      headers=auth_headers(), timeout=5)
                    if r.ok:
                        st.success("✅ Senha alterada com sucesso!")
                    else:
                        st.error(f"❌ {r.json().get('detail','Erro')}")
                except Exception as e:
                    st.error(f"Erro: {e}")
