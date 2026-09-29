// Endereço do backend Java (meteora-backend).
// Detecta automaticamente se está rodando local (servidor estático na sua máquina)
// ou publicado (ex.: GitHub Pages) e escolhe a URL correspondente.
//
// AJUSTE a linha abaixo com o endereço real do seu backend depois do deploy
// (ex.: no Render, algo como "https://meteora-backend.onrender.com/api").
const API_BASE_URL_PRODUCAO = "https://SEU-BACKEND-AQUI.onrender.com/api";
const API_BASE_URL_LOCAL = "http://localhost:8080/api";

const API_BASE_URL = ["localhost", "127.0.0.1"].includes(window.location.hostname)
    ? API_BASE_URL_LOCAL
    : API_BASE_URL_PRODUCAO;
