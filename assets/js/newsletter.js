// Formulário "Quer receber nossas novidades..." do rodapé da home.

function inicializarNewsletter() {
    const form = document.getElementById("formNewsletter");
    const feedback = document.getElementById("newsletterFeedback");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const input = document.getElementById("inputNewsletterEmail");
        const email = input.value.trim();
        feedback.innerHTML = "";

        try {
            const resp = await Api.inscreverNewsletter(email);
            feedback.innerHTML = `<div class="alert alert-success py-2 mt-2">
                Inscrição confirmada! Use o cupom <strong>${resp.cupom}</strong> para 10% OFF na primeira compra.
            </div>`;
            input.value = "";
        } catch (err) {
            feedback.innerHTML = `<div class="alert alert-danger py-2 mt-2">${err.message}</div>`;
        }
    });
}
