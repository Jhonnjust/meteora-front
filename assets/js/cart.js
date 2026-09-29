// Carrinho de compras (offcanvas), fluxo de checkout e confirmação do pedido.

const Carrinho = {
    async adicionar(produtoId, quantidade, elementoFeedback) {
        if (!Auth.estaLogado()) {
            if (elementoFeedback) elementoFeedback.innerHTML = "";
            AuthUI.abrirLoginEDepois(() => this.adicionar(produtoId, quantidade, elementoFeedback));
            return;
        }
        try {
            const carrinho = await Api.adicionarAoCarrinho(produtoId, quantidade);
            this.atualizarBadge(carrinho.quantidadeItens);
            if (elementoFeedback) {
                elementoFeedback.innerHTML = `<div class="alert alert-success py-2 mb-0">Adicionado ao carrinho!</div>`;
            } else {
                mostrarToast("Produto adicionado ao carrinho!");
            }
        } catch (err) {
            const msg = `<div class="alert alert-danger py-2 mb-0">${err.message}</div>`;
            if (elementoFeedback) elementoFeedback.innerHTML = msg;
            else mostrarToast(err.message, true);
        }
    },

    atualizarBadge(quantidade) {
        const badge = document.getElementById("badgeCarrinho");
        badge.textContent = quantidade;
        badge.style.display = quantidade > 0 ? "inline-block" : "none";
    },

    async sincronizar() {
        if (!Auth.estaLogado()) {
            this.atualizarBadge(0);
            return;
        }
        try {
            const carrinho = await Api.obterCarrinho();
            this.atualizarBadge(carrinho.quantidadeItens);
        } catch (_) {
            this.atualizarBadge(0);
        }
    },

    async renderizarOffcanvas() {
        const corpo = document.getElementById("corpoCarrinho");
        const rodape = document.getElementById("rodapeCarrinho");

        if (!Auth.estaLogado()) {
            corpo.innerHTML = `<p class="text-center py-4">Entre na sua conta para ver o carrinho.</p>`;
            rodape.innerHTML = "";
            return;
        }

        corpo.innerHTML = `<div class="text-center py-4"><div class="spinner-border"></div></div>`;

        try {
            const carrinho = await Api.obterCarrinho();
            this.atualizarBadge(carrinho.quantidadeItens);

            if (!carrinho.itens.length) {
                corpo.innerHTML = `<p class="text-center py-4">Seu carrinho está vazio.</p>`;
                rodape.innerHTML = "";
                return;
            }

            corpo.innerHTML = carrinho.itens.map(item => `
                <div class="d-flex gap-2 border-bottom pb-2 mb-2" data-produto-id="${item.produtoId}">
                    <img src="${item.imagemUrl || './assets/logo-meteora.png'}" alt="${Produtos.escapar(item.nomeProduto)}"
                        style="width: 64px; height: 64px; object-fit: cover;">
                    <div class="flex-grow-1">
                        <div class="fw-bold">${Produtos.escapar(item.nomeProduto)}</div>
                        <div class="texto-menor">${Produtos.formatarPreco(item.precoUnitario)} un.</div>
                        <div class="d-flex align-items-center gap-2 mt-1">
                            <input type="number" class="form-control form-control-sm input-qtd-carrinho"
                                style="width: 64px;" min="1" max="${item.estoqueDisponivel}" value="${item.quantidade}">
                            <button class="btn btn-sm btn-outline-danger btn-remover-item">Remover</button>
                        </div>
                    </div>
                    <div class="fw-bold">${Produtos.formatarPreco(item.subtotal)}</div>
                </div>
            `).join("");

            rodape.innerHTML = `
                <div class="d-flex justify-content-between fw-bold fs-5 mb-3">
                    <span>Total</span>
                    <span>${Produtos.formatarPreco(carrinho.total)}</span>
                </div>
                <button class="btn btn-primary botao-lilas rounded-0 border-0 w-100" id="btnIrParaCheckout">
                    Finalizar compra
                </button>`;

            corpo.querySelectorAll(".input-qtd-carrinho").forEach(input => {
                input.addEventListener("change", async (e) => {
                    const produtoId = e.target.closest("[data-produto-id]").dataset.produtoId;
                    const novaQtd = parseInt(e.target.value, 10) || 1;
                    try {
                        await Api.atualizarQuantidadeCarrinho(produtoId, novaQtd);
                        await this.renderizarOffcanvas();
                    } catch (err) {
                        mostrarToast(err.message, true);
                        await this.renderizarOffcanvas();
                    }
                });
            });

            corpo.querySelectorAll(".btn-remover-item").forEach(btn => {
                btn.addEventListener("click", async (e) => {
                    const produtoId = e.target.closest("[data-produto-id]").dataset.produtoId;
                    await Api.removerDoCarrinho(produtoId);
                    await this.renderizarOffcanvas();
                });
            });

            document.getElementById("btnIrParaCheckout").addEventListener("click", () => {
                bootstrap.Offcanvas.getOrCreateInstance(document.getElementById("offcanvasCarrinho")).hide();
                Checkout.abrir(carrinho);
            });

        } catch (err) {
            corpo.innerHTML = `<p class="text-danger text-center py-4">${err.message}</p>`;
            rodape.innerHTML = "";
        }
    }
};

const Checkout = {
    abrir(carrinho) {
        document.getElementById("checkoutResumoTotal").textContent = Produtos.formatarPreco(carrinho.total);
        document.getElementById("feedbackCheckout").innerHTML = "";
        document.getElementById("formCheckout").reset();
        bootstrap.Modal.getOrCreateInstance(document.getElementById("modalCheckout")).show();
    },

    async finalizar(e) {
        e.preventDefault();
        const feedback = document.getElementById("feedbackCheckout");
        feedback.innerHTML = `<div class="text-center"><div class="spinner-border spinner-border-sm"></div> Processando pagamento...</div>`;

        const dados = {
            endereco: {
                cep: document.getElementById("checkoutCep").value.trim(),
                logradouro: document.getElementById("checkoutLogradouro").value.trim(),
                numero: document.getElementById("checkoutNumero").value.trim(),
                complemento: document.getElementById("checkoutComplemento").value.trim(),
                bairro: document.getElementById("checkoutBairro").value.trim(),
                cidade: document.getElementById("checkoutCidade").value.trim(),
                estado: document.getElementById("checkoutEstado").value.trim()
            },
            formaPagamento: document.getElementById("checkoutFormaPagamento").value
        };

        try {
            const pedido = await Api.finalizarCompra(dados);
            bootstrap.Modal.getOrCreateInstance(document.getElementById("modalCheckout")).hide();
            Carrinho.atualizarBadge(0);
            Pedidos.mostrarConfirmacao(pedido);
        } catch (err) {
            const detalhes = err.payload?.detalhes?.join(" ") || "";
            feedback.innerHTML = `<div class="alert alert-danger py-2">${err.message} ${detalhes}</div>`;
        }
    }
};

const Pedidos = {
    mostrarConfirmacao(pedido) {
        const corpo = document.getElementById("modalPedidoConfirmadoCorpo");
        corpo.innerHTML = `
            <p class="fs-5">Pedido <strong>#${pedido.id}</strong> registrado com sucesso!</p>
            <p>Status: <strong>${this.traduzirStatus(pedido.status)}</strong></p>
            <p>Forma de pagamento: <strong>${this.traduzirPagamento(pedido.formaPagamento)}</strong></p>
            ${pedido.detalhesPagamento ? `<p class="texto-menor">${Produtos.escapar(pedido.detalhesPagamento)}</p>` : ""}
            <hr>
            <p class="d-flex justify-content-between mb-1"><span>Subtotal</span><span>${Produtos.formatarPreco(pedido.subtotal)}</span></p>
            <p class="d-flex justify-content-between mb-1"><span>Desconto</span><span>-${Produtos.formatarPreco(pedido.desconto)}</span></p>
            <p class="d-flex justify-content-between mb-1"><span>Frete</span><span>${Produtos.formatarPreco(pedido.frete)}</span></p>
            <p class="d-flex justify-content-between fw-bold fs-5"><span>Total</span><span>${Produtos.formatarPreco(pedido.total)}</span></p>
        `;
        bootstrap.Modal.getOrCreateInstance(document.getElementById("modalPedidoConfirmado")).show();
    },

    async abrirHistorico() {
        const corpo = document.getElementById("modalPedidosCorpo");
        corpo.innerHTML = `<div class="text-center py-4"><div class="spinner-border"></div></div>`;
        bootstrap.Modal.getOrCreateInstance(document.getElementById("modalPedidos")).show();

        try {
            const pagina = await Api.listarMeusPedidos();
            const pedidos = pagina.content || [];
            if (!pedidos.length) {
                corpo.innerHTML = `<p class="text-center py-4">Você ainda não fez nenhum pedido.</p>`;
                return;
            }
            corpo.innerHTML = pedidos.map(p => `
                <div class="border-bottom pb-2 mb-2">
                    <div class="d-flex justify-content-between">
                        <strong>Pedido #${p.id}</strong>
                        <span>${this.traduzirStatus(p.status)}</span>
                    </div>
                    <div class="texto-menor">${new Date(p.criadoEm).toLocaleString("pt-BR")} • ${this.traduzirPagamento(p.formaPagamento)}</div>
                    <div class="fw-bold">${Produtos.formatarPreco(p.total)}</div>
                </div>
            `).join("");
        } catch (err) {
            corpo.innerHTML = `<p class="text-danger text-center py-4">${err.message}</p>`;
        }
    },

    traduzirStatus(status) {
        const mapa = {
            AGUARDANDO_PAGAMENTO: "Aguardando pagamento",
            PAGO: "Pago",
            CANCELADO: "Cancelado",
            ENVIADO: "Enviado",
            ENTREGUE: "Entregue"
        };
        return mapa[status] || status;
    },

    traduzirPagamento(forma) {
        const mapa = { PIX: "Pix", CARTAO: "Cartão", BOLETO: "Boleto" };
        return mapa[forma] || forma;
    }
};

function inicializarCarrinho() {
    document.getElementById("offcanvasCarrinho").addEventListener("show.bs.offcanvas", () => {
        Carrinho.renderizarOffcanvas();
    });
    document.getElementById("formCheckout").addEventListener("submit", (e) => Checkout.finalizar(e));
    Carrinho.sincronizar();
}
