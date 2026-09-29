// Camada única de comunicação com a API do backend (meteora-backend).
// Guarda o token JWT no localStorage e injeta o header Authorization automaticamente.

const TOKEN_KEY = "meteora_token";
const USER_KEY = "meteora_usuario";

const Auth = {
    getToken() {
        return localStorage.getItem(TOKEN_KEY);
    },
    getUsuario() {
        const raw = localStorage.getItem(USER_KEY);
        return raw ? JSON.parse(raw) : null;
    },
    salvarSessao(authResponse) {
        localStorage.setItem(TOKEN_KEY, authResponse.token);
        localStorage.setItem(USER_KEY, JSON.stringify({
            id: authResponse.usuarioId,
            nome: authResponse.nome,
            email: authResponse.email,
            role: authResponse.role
        }));
    },
    logout() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
    },
    estaLogado() {
        return !!this.getToken();
    }
};

class ApiError extends Error {
    constructor(status, payload) {
        super(payload?.mensagem || "Erro ao comunicar com o servidor");
        this.status = status;
        this.payload = payload;
    }
}

async function apiRequest(path, { method = "GET", body, autenticado = false, params } = {}) {
    let url = `${API_BASE_URL}${path}`;

    if (params) {
        const query = new URLSearchParams(
            Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "")
        ).toString();
        if (query) url += `?${query}`;
    }

    const headers = { "Content-Type": "application/json" };

    if (autenticado) {
        const token = Auth.getToken();
        if (!token) {
            throw new ApiError(401, { mensagem: "É preciso estar logado para continuar." });
        }
        headers["Authorization"] = `Bearer ${token}`;
    }

    let response;
    try {
        response = await fetch(url, {
            method,
            headers,
            body: body !== undefined ? JSON.stringify(body) : undefined
        });
    } catch (networkError) {
        throw new ApiError(0, {
            mensagem: "Não foi possível conectar ao servidor. Verifique se o backend está rodando em " + API_BASE_URL
        });
    }

    if (response.status === 204) return null;

    let payload = null;
    try {
        payload = await response.json();
    } catch (_) {
        // resposta sem corpo
    }

    if (!response.ok) {
        throw new ApiError(response.status, payload);
    }

    return payload;
}

const Api = {
    // ---- catálogo (público) ----
    listarProdutos: (params) => apiRequest("/products", { params }),
    detalharProduto: (id) => apiRequest(`/products/${id}`),
    listarCategorias: () => apiRequest("/categories"),

    // ---- autenticação ----
    registrar: (dados) => apiRequest("/auth/registrar", { method: "POST", body: dados }),
    login: (dados) => apiRequest("/auth/login", { method: "POST", body: dados }),

    // ---- newsletter ----
    inscreverNewsletter: (email) => apiRequest("/newsletter/subscribe", { method: "POST", body: { email } }),

    // ---- carrinho (autenticado) ----
    obterCarrinho: () => apiRequest("/cart", { autenticado: true }),
    adicionarAoCarrinho: (produtoId, quantidade) =>
        apiRequest("/cart/itens", { method: "POST", autenticado: true, body: { produtoId, quantidade } }),
    atualizarQuantidadeCarrinho: (produtoId, quantidade) =>
        apiRequest(`/cart/itens/${produtoId}?quantidade=${quantidade}`, { method: "PUT", autenticado: true }),
    removerDoCarrinho: (produtoId) =>
        apiRequest(`/cart/itens/${produtoId}`, { method: "DELETE", autenticado: true }),

    // ---- checkout e pedidos (autenticado) ----
    finalizarCompra: (dados) => apiRequest("/checkout", { method: "POST", autenticado: true, body: dados }),
    listarMeusPedidos: () => apiRequest("/orders", { autenticado: true }),
};
