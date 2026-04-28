const pdfInput = document.getElementById('pdfInput');
const processBtn = document.getElementById('processBtn');
const preview = document.getElementById('pdfPreview');

// Função para ler arquivo como ArrayBuffer (Mantida e correta)
const readFile = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
};

// Mostrar preview básico quando subir o arquivo
pdfInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const blobUrl = URL.createObjectURL(file);
        preview.src = blobUrl;
    }
});

processBtn.addEventListener('click', async () => {
    // Agora só verificamos se o PDF foi enviado
    if (!pdfInput.files[0]) {
        alert("Por favor, selecione o arquivo PDF primeiro!");
        return;
    }

    try {
        // 1. Carregar os dados do PDF
        const pdfBytes = await readFile(pdfInput.files[0]);
        const { PDFDocument } = PDFLib;
        const pdfDoc = await PDFDocument.load(pdfBytes);

        // 2. Acessar ou criar o Formulário do PDF
        const form = pdfDoc.getForm();

        // 3. Criar um Botão. No padrão PDF, botões podem ser usados como contêineres de imagem (ícones)
        const imageField = form.createButton('ImagemEditavel_1');

        // 4. Pegar a primeira página
        const pages = pdfDoc.getPages();
        const firstPage = pages[0];

        // 5. Desenhar o campo de formulário na página
        // Ajuste o x, y, width e height conforme o tamanho que desejar
        imageField.addToPage('CampoImagem', firstPage, {
            x: 50,
            y: firstPage.getHeight() - 250, // Posição calculada a partir de baixo (padrão PDF)
            width: 200,
            height: 200,
        });

        // 6. Salvar e Gerar Download de forma segura
        const modifiedPdfBytes = await pdfDoc.save();
        const blob = new Blob([modifiedPdfBytes], { type: 'application/pdf' });
        const blobUrl = URL.createObjectURL(blob);
        
        // Atualiza o visualizador no site para mostrar o PDF com o novo campo
        preview.src = blobUrl;

        // Cria o link de download e força o clique
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = "pdf_editavel.pdf";
        
        // Adicionar o link ao DOM é essencial no Firefox/Safari modernos para o clique funcionar
        document.body.appendChild(link); 
        link.click();
        document.body.removeChild(link);

    } catch (err) {
        console.error("Erro detalhado:", err);
        alert("Erro ao processar PDF. Verifique o console para mais detalhes: " + err.message);
    }
});
