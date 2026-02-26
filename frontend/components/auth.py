"""
Componente de Autenticação — OdontoSystem
Chame require_login() no topo de cada página para protegê-la.
"""
import streamlit as st
import requests
from datetime import datetime, timezone

API_URL = "http://localhost:8000"

ROLE_LABELS = {
    "admin":        ("👑", "Administrador"),
    "dentista":     ("🦷", "Dentista"),
    "recepcionista":("📋", "Recepcionista"),
    "financeiro":   ("💼", "Financeiro"),
}

LOGIN_CSS = """
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
html,body,[class*="css"]{font-family:'Inter',sans-serif;}
[data-testid="stSidebarNav"]{display:none!important;}
[data-testid="stSidebar"]{display:none!important;}
.main .block-container{padding:0!important;max-width:100%!important;}
[data-testid="stAppViewContainer"]{
    background: linear-gradient(135deg,#0f172a 0%,#1e293b 50%,#0f172a 100%);
    min-height:100vh;
}

/* Login card */
.login-card{
    background:#fff;border-radius:20px;
    padding:2.5rem 2.5rem 2rem;
    box-shadow:0 25px 60px rgba(0,0,0,.4);
    max-width:420px;margin:0 auto;
}
.login-logo{
    text-align:center;margin-bottom:1.5rem;
}
.login-logo .logo-ico{
    display:inline-flex;align-items:center;justify-content:center;
    width:70px;height:70px;border-radius:18px;font-size:2rem;
    background:linear-gradient(135deg,#6366f1,#8b5cf6);
    box-shadow:0 8px 25px rgba(99,102,241,.4);
    margin-bottom:.75rem;
}
.login-logo h1{font-size:1.5rem;font-weight:800;color:#0f172a;margin:0;}
.login-logo p{font-size:.82rem;color:#64748b;margin:.25rem 0 0;}

/* Form fields */
div[data-baseweb="input"] input{
    border-radius:8px!important;border:1.5px solid #e2e8f0!important;
    font-size:.9rem!important;padding:.6rem .8rem!important;
}
div[data-baseweb="input"] input:focus{border-color:#6366f1!important;box-shadow:0 0 0 3px rgba(99,102,241,.15)!important;}

/* Login button */
div[data-testid="stButton"]>button[kind="primary"]{
    background:linear-gradient(135deg,#6366f1,#8b5cf6)!important;
    border:none!important;border-radius:10px!important;
    font-weight:700!important;font-size:.95rem!important;
    color:white!important;height:2.8rem!important;
    box-shadow:0 4px 15px rgba(99,102,241,.35)!important;
    transition:opacity .2s!important;
}
div[data-testid="stButton"]>button[kind="primary"]:hover{opacity:.88!important;}

/* Decorative bg dots */
.bg-dots{
    position:fixed;top:0;left:0;right:0;bottom:0;
    background-image:radial-gradient(circle,rgba(99,102,241,.12) 1px,transparent 1px);
    background-size:30px 30px;pointer-events:none;z-index:0;
}
</style>
"""


def _token_expired(token: str) -> bool:
    """Verifica localmente se o token já expirou (sem chamar API).
    Retorna False em caso de dúvida — o backend rejeitará se inválido.
    """
    if not token:
        return False
    try:
        from jose import jwt as _jwt
        payload = _jwt.decode(
            token,
            options={"verify_signature": False, "verify_exp": False},
            algorithms=["HS256"],
        )
        exp = payload.get("exp")
        if exp and datetime.fromtimestamp(exp, tz=timezone.utc) < datetime.now(tz=timezone.utc):
            return True
        return False
    except Exception:
        return False  # Em caso de erro, não assumir expirado


def logout():
    """Limpa a sessão e recarrega."""
    for k in ("authenticated", "user", "token"):
        st.session_state.pop(k, None)
    st.rerun()


def _do_login(email: str, senha: str) -> bool:
    """Tenta fazer login na API. Retorna True se sucesso."""
    try:
        r = requests.post(
            f"{API_URL}/auth/login",
            json={"email": email, "senha": senha},
            timeout=5,
        )
        if r.status_code == 200:
            data = r.json()
            st.session_state["authenticated"] = True
            st.session_state["token"]          = data["access_token"]
            st.session_state["user"]           = data["user"]
            return True
        elif r.status_code in (401, 403):
            st.error(f"❌ {r.json().get('detail','Credenciais inválidas')}")
        else:
            st.error("❌ Erro ao conectar com o servidor.")
    except requests.exceptions.ConnectionError:
        st.error("❌ Backend offline. Execute `python start_backend.py`")
    except Exception as e:
        st.error(f"❌ Erro inesperado: {e}")
    return False


def _show_login_page():
    """Renderiza a tela de login visualmente bonita."""
    st.markdown(LOGIN_CSS, unsafe_allow_html=True)
    st.markdown('<div class="bg-dots"></div>', unsafe_allow_html=True)

    # Centralizar o card com colunas
    _, col, _ = st.columns([1, 1.4, 1])
    with col:
        st.markdown("<div style='height:7vh'></div>", unsafe_allow_html=True)
        st.markdown("""
        <div class="login-card">
            <div class="login-logo">
                <div class="logo-ico">🦷</div>
                <h1>OdontoSystem</h1>
                <p>Gestão Odontológica Profissional</p>
            </div>
        </div>
        """, unsafe_allow_html=True)

        with st.form("login_form", clear_on_submit=False):
            st.markdown("<div style='height:.3rem'></div>", unsafe_allow_html=True)
            email = st.text_input(
                "E-mail",
                placeholder="seu@email.com",
                label_visibility="collapsed",
            )
            senha = st.text_input(
                "Senha",
                type="password",
                placeholder="Sua senha",
                label_visibility="collapsed",
            )
            st.markdown("<div style='height:.2rem'></div>", unsafe_allow_html=True)
            entrar = st.form_submit_button(
                "🔐  Entrar",
                type="primary",
                use_container_width=True,
            )

        if entrar:
            if not email or not senha:
                st.warning("⚠️ Preencha e-mail e senha.")
            else:
                with st.spinner("Verificando credenciais…"):
                    if _do_login(email.strip(), senha):
                        st.rerun()

        # Rodapé
        st.markdown("""
        <div style="text-align:center;margin-top:1rem;font-size:.72rem;color:#94a3b8;">
            🔒 Acesso restrito a usuários autorizados<br>
            <span style="color:#cbd5e1;">v1.0 · OdontoSystem</span>
        </div>
        """, unsafe_allow_html=True)


def require_login() -> dict:
    """
    Deve ser a PRIMEIRA chamada em cada página.
    - Se autenticado e token válido: retorna o dict do usuário.
    - Se token expirado: limpa sessão, mostra aviso e exibe tela de login.
    - Se não autenticado: exibe tela de login silenciosamente.
    """
    authenticated = st.session_state.get("authenticated", False)
    token = st.session_state.get("token", "")

    # Usuário estava logado mas token expirou
    if authenticated and token and _token_expired(token):
        for k in ("authenticated", "token", "user"):
            st.session_state.pop(k, None)
        st.warning("⚠️ Sua sessão expirou. Faça login novamente.")
        _show_login_page()
        st.stop()

    # Usuário autenticado e token válido
    if authenticated and token:
        user = st.session_state.get("user")
        if user:
            return user

    # Não autenticado — exibe login sem nenhum aviso
    _show_login_page()
    st.stop()
