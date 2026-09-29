# Meteora - Front-end integrado ao backend

Esta é a mesma loja (Bootstrap 5) que você já tinha, agora consumindo a API do
`meteora-backend` (Java/Spring Boot) em vez de ter tudo fixo no HTML.

## O que mudou

- `index.html`: a grade de produtos agora é preenchida dinamicamente (`#produtos-grid`),
  os cards de categoria filtram o catálogo, o campo de busca da navbar funciona, o
  formulário de newsletter envia para a API, e foram adicionados: modal de login/cadastro,
  carrinho (offcanvas), modal de checkout e modal de confirmação/histórico de pedidos.
- `assets/js/`: todo o JavaScript novo, organizado por responsabilidade:
  - `config.js` — endereço do backend
  - `api.js` — camada única de chamadas HTTP + token JWT
  - `products.js` — catálogo, busca, filtro por categoria, modal de produto
  - `auth.js` — login/cadastro e área "Minha conta" da navbar
  - `cart.js` — carrinho, checkout e histórico de pedidos
  - `newsletter.js` — formulário de inscrição
  - `main.js` — inicialização geral e toasts de feedback
- `estilos.css`: alguns ajustes visuais pequenos para os itens novos.

## Como rodar

1. **Suba o backend primeiro** (veja o README do `meteora-backend`):
   ```bash
   cd meteora-backend
   mvn spring-boot:run
   ```
   Ele sobe em `http://localhost:8080` e já vem com o catálogo populado.

2. **Sirva este front-end por HTTP** (não abra o `index.html` direto com duplo clique —
   use um servidor local, senão o navegador bloqueia algumas chamadas):
   ```bash
   cd meteora-site-integrado
   python3 -m http.server 5500
   ```
   Acesse `http://localhost:5500`.

3. Se o backend estiver em outro endereço/porta, ajuste `API_BASE_URL` em
   `assets/js/config.js`.

## Testando o fluxo completo

1. Abra o site, cadastre uma conta pelo botão "Entrar" → "Cadastre-se".
2. Busque um produto ou clique em uma categoria — a grade filtra via API.
3. Clique em "Ver mais" num produto, escolha a quantidade e "Adicionar ao carrinho".
4. Abra o carrinho (ícone no topo), ajuste quantidades e clique em "Finalizar compra".
5. Preencha o endereço, escolha a forma de pagamento (Pix aplica 5% OFF automaticamente)
   e confirme — o pedido é criado, o estoque é baixado no backend e você vê a confirmação.
6. No menu da conta, "Meus pedidos" mostra o histórico.

Um usuário admin já vem criado (`admin@meteora.com.br` / `admin123`) para testar os
endpoints administrativos (`/api/admin/...`) via Postman/Insomnia — este front-end não
inclui um painel administrativo visual, só a loja para o cliente final.

## Deploy no Vercel

1. Suba esta pasta (`frontend/`) para um repositório no GitHub.
2. No [Vercel](https://vercel.com), clique em **Add New → Project** e importe esse repositório.
   - Se o repositório tiver `backend/` e `frontend/` juntos (monorepo), defina **Root Directory** como `frontend`.
   - Não é preciso configurar build command nem output directory — é um site estático puro
     (`index.html` na raiz), o Vercel detecta e serve sem build.
3. Clique em Deploy. Em menos de um minuto o site fica em algo como
   `https://seu-projeto.vercel.app`.
4. Edite `assets/js/config.js` e troque `API_BASE_URL_PRODUCAO` pela URL real do backend
   (Render/Railway/Fly — veja o README do backend, seção "Deploy").
5. No backend, configure `CORS_ALLOWED_ORIGINS` incluindo o domínio do Vercel:
   - Produção: `https://seu-projeto.vercel.app`
   - Se quiser que os *preview deployments* (URLs geradas a cada push/PR) também funcionem,
     adicione um padrão com curinga: `https://seu-projeto-*.vercel.app`

`config.js` já detecta sozinho se está rodando em `localhost` (usa a API local) ou publicado
(usa a URL de produção), então não precisa alternar manualmente entre ambientes. Um `vercel.json`
já vem incluso só com regras de cache para os assets (imagens ficam em cache longo, os `.js`
sempre revalidam — assim uma atualização no código não fica presa em cache do navegador).

### Alternativa: GitHub Pages

Também funciona (e é gratuito) se preferir não usar o Vercel:

1. Vá em **Settings → Pages** no repositório, selecione a branch `main` e a pasta `/ (root)`.
2. O `.nojekyll` incluso evita que o GitHub Pages processe os arquivos com Jekyll.
3. Mesma ideia: ajuste `config.js` e `CORS_ALLOWED_ORIGINS` com o domínio
   `https://seu-usuario.github.io`.
