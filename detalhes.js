// Lógica visual do logo
const logoImg = document.getElementById('empresa-logo-img');
const logoContainer = document.getElementById('logo-container');
const observer = new MutationObserver(() => {
    if (!logoImg.classList.contains('hidden')) logoContainer.classList.add('has-logo');
});
observer.observe(logoImg, { attributes: true });

// Função corrigida para não cortar o PDF
function baixarPDF() {
    const element = document.getElementById('documento-pdf');

    // Opções para preencher toda a folha A4 com margem mínima
    const opt = {
        margin: [2, 3, 2, 3], // Margem mínima (Topo, Dir, Baixo, Esq)
        filename: `Orcamento.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
            scale: 2, // Boa qualidade sem estourar memória
            useCORS: true,
            scrollX: 0,
            scrollY: 0
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // Gera o PDF
    html2pdf().set(opt).from(element).save();
}

function enviarWhatsApp() {
    const tel = document.getElementById('cli-tel')?.innerText.replace(/\D/g, '') || '';
    const msg = encodeURIComponent(`Olá! Segue o link do seu orçamento.`);
    window.open(`https://wa.me/${tel}?text=${msg}`, '_blank');
}
