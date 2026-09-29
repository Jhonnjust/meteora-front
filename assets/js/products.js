// Catálogo dinâmico: lista/busca/filtra produtos vindos da API e controla o modal de detalhe.

const Produtos = {
    filtroAtual: {}, // { busca: '...' } ou { categoria: 'slug' }

    formatarPreco(valor) {
        return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    },

    async carregar(filtro = {}) {
        this.filtroAtual = filtro;
        const grid = document.getElementById("produtos-grid");
        const statusFiltro = document.getElementById("statusFiltroProdutos");

        grid.innerHTML = `
            <div class="text-center w-100 py-5">
                <div class="spinner-border" role="status"><span class="visually-hidden">Carregando...</span></div>
            </div>`;

        if (filtro.busca) {
            statusFiltro.innerHTML = `Resultados para "<strong>${this.escapar(filtro.busca)}</strong>"
                <button class="btn btn-sm btn-link" id="btnLimparFiltro">Limpar</button>`;
            statusFiltro.classList.remove("d-none");
        } else if (filtro.categoria) {
            statusFiltro.innerHTML = `Categoria: <strong>${this.escapar(filtro.categoriaNome || filtro.categoria)}</strong>
                <button class="btn btn-sm btn-link" id="btnLimparFiltro">Limpar</button>`;
            statusFiltro.classList.remove("d-none");
        } else {
            statusFiltro.classList.add("d-none");
            statusFiltro.innerHTML = "";
        }

        try {
            const pagina = await Api.listarProdutos({
                busca: filtro.busca,
                categoria: filtro.categoria,
                size: 24
            });
            this.renderizar(pagina.content || []);
        } catch (err) {
            grid.innerHTML = `<p class="text-center w-100 text-danger py-5">
                Não foi possível carregar os produtos. ${err.message || ""}
            </p>`;
        }

        const btnLimpar = document.getElementById("btnLimparFiltro");
        if (btnLimpar) {
            btnLimpar.addEventListener("click", (e) => {
                e.preventDefault();
                document.getElementById("inputBusca").value = "";
                this.carregar({});
            });
        }
    },

    renderizar(produtos) {
        const grid = document.getElementById("produtos-grid");

        if (!produtos.length) {
            grid.innerHTML = `<p class="text-center w-100 py-5">Nenhum produto encontrado.</p>`;
            return;
        }

        grid.innerHTML = produtos.map(p => `
            <div class="col-12 col-md-6 col-xxl-4 pb-4">
                <div class="card h-100">
                    <img class="card-img-top" src="${p.imagemUrl || './assets/logo-meteora.png'}"
                        alt="${this.escapar(p.nome)}" style="object-fit: cover; max-height: 320px;">
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title fw-bold">${this.escapar(p.nome)}</h5>
                        <p class="card-text flex-grow-1">${this.escapar(p.descricao || "")}</p>
                        <p class="fw-bold">${this.formatarPreco(p.preco)}</p>
                        ${p.disponivel
                            ? `<button class="btn btn-primary botao-lilas rounded-0 border-0 btn-ver-produto" data-id="${p.id}">Ver mais</button>`
                            : `<button class="btn btn-secondary rounded-0 border-0" disabled>Esgotado</button>`
                        }
                    </div>
                </div>
            </div>
        `).join("");

        grid.querySelectorAll(".btn-ver-produto").forEach(btn => {
            btn.addEventListener("click", () => this.abrirDetalhe(btn.dataset.id));
        });
    },

    async abrirDetalhe(id) {
        const modalEl = document.getElementById("modalProduto");
        const corpo = document.getElementById("modalProdutoCorpo");
        corpo.innerHTML = `<div class="text-center py-5"><div class="spinner-border"></div></div>`;

        const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
        modal.show();

        try {
            const p = await Api.detalharProduto(id);
            corpo.innerHTML = `
                <div class="row g-3">
                    <div class="col-md-6">
                        <img src="${p.imagemUrl || './assets/logo-meteora.png'}" class="img-fluid" alt="${this.escapar(p.nome)}">
                    </div>
                    <div class="col-md-6">
                        <h4 class="fw-bold">${this.escapar(p.nome)}</h4>
                        <p class="text-muted">${this.escapar(p.categoria?.nome || "")}</p>
                        <p>${this.escapar(p.descricao || "")}</p>
                        <p class="fs-4 fw-bold">${this.formatarPreco(p.preco)}</p>
                        <p class="texto-menor">${p.estoque > 0 ? p.estoque + " em estoque" : "Sem estoque"}</p>
                        <div class="d-flex align-items-center gap-2 mb-3">
                            <label for="modalProdutoQtd" class="form-label mb-0">Quantidade:</label>
                            <input type="number" id="modalProdutoQtd" class="form-control" style="width: 80px;"
                                min="1" max="${p.estoque}" value="1" ${p.estoque === 0 ? "disabled" : ""}>
                        </div>
                        <button class="btn btn-primary botao-lilas rounded-0 border-0 w-100" id="btnAdicionarCarrinhoModal"
                            data-id="${p.id}" ${p.estoque === 0 ? "disabled" : ""}>
                            Adicionar ao carrinho
                        </button>
                        <div id="modalProdutoFeedback" class="mt-2"></div>
                    </div>
                </div>`;

            document.getElementById("btnAdicionarCarrinhoModal")?.addEventListener("click", async (e) => {
                const qtd = parseInt(document.getElementById("modalProdutoQtd").value, 10) || 1;
                await Carrinho.adicionar(p.id, qtd, document.getElementById("modalProdutoFeedback"));
            });
        } catch (err) {
            corpo.innerHTML = `<p class="text-danger">Não foi possível carregar o produto. ${err.message || ""}</p>`;
        }
    },

    escapar(texto) {
        const div = document.createElement("div");
        div.textContent = texto ?? "";
        return div.innerHTML;
    }
};

async function inicializarCategorias() {
    try {
        const categorias = await Api.listarCategorias();
        document.querySelectorAll(".categoria-card").forEach(card => {
            const slug = card.dataset.slug;
            const categoria = categorias.find(c => c.slug === slug);
            card.addEventListener("click", () => {
                Produtos.carregar({ categoria: slug, categoriaNome: categoria?.nome || slug });
                document.getElementById("produtos-grid").scrollIntoView({ behavior: "smooth" });
            });
        });
    } catch (err) {
        // categorias indisponíveis: os cliques nos cards simplesmente não filtrarão
        console.warn("Não foi possível carregar categorias:", err.message);
    }
}

function inicializarBusca() {
    const form = document.getElementById("formBusca");
    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const termo = document.getElementById("inputBusca").value.trim();
        if (termo) {
            Produtos.carregar({ busca: termo });
            document.getElementById("produtos-grid").scrollIntoView({ behavior: "smooth" });
        } else {
            Produtos.carregar({});
        }
    });
}
