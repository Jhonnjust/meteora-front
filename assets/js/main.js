// Toast simples (reaproveita o container fixo do index.html) + boot geral da página.

function mostrarToast(mensagem, erro = false) {
    const container = document.getElementById("toastContainer");
    const toastEl = document.createElement("div");
    toastEl.className = `toast align-items-center text-bg-${erro ? "danger" : "dark"} border-0`;
    toastEl.setAttribute("role", "alert");
    toastEl.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">${mensagem}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>`;
    container.appendChild(toastEl);
    const toast = new bootstrap.Toast(toastEl, { delay: 4000 });
    toast.show();
    toastEl.addEventListener("hidden.bs.toast", () => toastEl.remove());
}

document.addEventListener("DOMContentLoaded", () => {
    inicializarAuth();
    inicializarBusca();
    inicializarCategorias();
    inicializarCarrinho();
    inicializarNewsletter();
    Produtos.carregar({});
});
