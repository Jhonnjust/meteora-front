// Login, registro e controle do que aparece na navbar (Entrar / nome do cliente + Sair).

const AuthUI = {
    renderizarAreaConta() {
        const area = document.getElementById("areaConta");
        const usuario = Auth.getUsuario();

        if (usuario) {
            area.innerHTML = `
                <div class="dropdown">
                    <button class="btn btn-outline-light rounded-0 dropdown-toggle" type="button"
                        data-bs-toggle="dropdown" aria-expanded="false">
                        <i class="bi bi-person-circle"></i> ${Produtos.escapar(usuario.nome.split(" ")[0])}
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end">
                        <li><button class="dropdown-item" id="btnMeusPedidos" type="button">Meus pedidos</button></li>
                        <li><hr class="dropdown-divider"></li>
                        <li><button class="dropdown-item" id="btnSair" type="button">Sair</button></li>
                    </ul>
                </div>`;

            document.getElementById("btnSair").addEventListener("click", () => {
                Auth.logout();
                this.renderizarAreaConta();
                Carrinho.atualizarBadge(0);
                mostrarToast("Você saiu da sua conta.");
            });

            document.getElementById("btnMeusPedidos").addEventListener("click", () => Pedidos.abrirHistorico());
        } else {
            area.innerHTML = `
                <button class="btn btn-outline-light rounded-0" type="button" data-bs-toggle="modal" data-bs-target="#modalLogin">
                    Entrar
                </button>`;
        }
    },

    abrirLoginEDepois(callback) {
        const modalEl = document.getElementById("modalLogin");
        const modal = bootstrap.Modal.getOrCreateInstance(modalEl);

        if (callback) {
            const handler = () => {
                if (Auth.estaLogado()) {
                    callback();
                    modalEl.removeEventListener("hidden.bs.modal", handler);
                }
            };
            modalEl.addEventListener("hidden.bs.modal", handler);
        }
        modal.show();
    }
};

function inicializarAuth() {
    AuthUI.renderizarAreaConta();

    const formLogin = document.getElementById("formLogin");
    const feedbackLogin = document.getElementById("feedbackLogin");

    formLogin.addEventListener("submit", async (e) => {
        e.preventDefault();
        feedbackLogin.innerHTML = "";
        const email = document.getElementById("loginEmail").value.trim();
        const senha = document.getElementById("loginSenha").value;

        try {
            const resp = await Api.login({ email, senha });
            Auth.salvarSessao(resp);
            AuthUI.renderizarAreaConta();
            bootstrap.Modal.getOrCreateInstance(document.getElementById("modalLogin")).hide();
            formLogin.reset();
            await Carrinho.sincronizar();
            mostrarToast(`Bem-vindo(a) de volta, ${resp.nome.split(" ")[0]}!`);
        } catch (err) {
            feedbackLogin.innerHTML = `<div class="alert alert-danger py-2">${err.message}</div>`;
        }
    });

    const formRegistro = document.getElementById("formRegistro");
    const feedbackRegistro = document.getElementById("feedbackRegistro");

    formRegistro.addEventListener("submit", async (e) => {
        e.preventDefault();
        feedbackRegistro.innerHTML = "";
        const nome = document.getElementById("registroNome").value.trim();
        const email = document.getElementById("registroEmail").value.trim();
        const senha = document.getElementById("registroSenha").value;

        try {
            const resp = await Api.registrar({ nome, email, senha });
            Auth.salvarSessao(resp);
            AuthUI.renderizarAreaConta();
            bootstrap.Modal.getOrCreateInstance(document.getElementById("modalRegistro")).hide();
            formRegistro.reset();
            mostrarToast(`Conta criada com sucesso! Bem-vindo(a), ${resp.nome.split(" ")[0]}.`);
        } catch (err) {
            const detalhes = err.payload?.detalhes?.join(" ") || "";
            feedbackRegistro.innerHTML = `<div class="alert alert-danger py-2">${err.message} ${detalhes}</div>`;
        }
    });

    // alterna entre os modais de login e registro
    document.getElementById("linkIrParaRegistro").addEventListener("click", (e) => {
        e.preventDefault();
        bootstrap.Modal.getOrCreateInstance(document.getElementById("modalLogin")).hide();
        bootstrap.Modal.getOrCreateInstance(document.getElementById("modalRegistro")).show();
    });
    document.getElementById("linkIrParaLogin").addEventListener("click", (e) => {
        e.preventDefault();
        bootstrap.Modal.getOrCreateInstance(document.getElementById("modalRegistro")).hide();
        bootstrap.Modal.getOrCreateInstance(document.getElementById("modalLogin")).show();
    });
}
