const pdfInput = document.getElementById('pdfInput');
const imageInput = document.getElementById('imageInput');
const processBtn = document.getElementById('processBtn');
const preview = document.getElementById('pdfPreview');

// Função para ler arquivo como ArrayBuffer
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
    if (!pdfInput.files[0] || !imageInput.files[0]) {
        alert("Por favor, selecione o PDF e a Imagem!");
        return;
    }

    try {
        // Desabilita o botão para evitar múltiplos cliques
        processBtn.disabled = true;
        processBtn.textContent = "Processando...";

        // 1. Carregar os dados
        const pdfBytes = await readFile(pdfInput.files[0]);
        const imageBytes = await readFile(imageInput.files[0]);

        // 2. Carregar o documento PDF e a biblioteca
        const { PDFDocument } = PDFLib;
        const pdfDoc = await PDFDocument.load(pdfBytes);
        
        // Suporta PNG, JPEG ou JPG corretamente
        const imgType = imageInput.files[0].type;
        let embeddedImage;
        
        if (imgType === 'image/png') {
            embeddedImage = await pdfDoc.embedPng(imageBytes);
        } else if (imgType === 'image/jpeg' || imgType === 'image/jpg') {
            embeddedImage = await pdfDoc.embedJpg(imageBytes);
        } else {
            throw new Error("Formato de imagem não suportado. Por favor, use apenas PNG ou JPG.");
        }

        // 3. Pegar a primeira página e as dimensões da imagem
        const pages = pdfDoc.getPages();
        if (pages.length === 0) throw new Error("O PDF não possui páginas.");
        
        const firstPage = pages[0];
        const { width, height } = embeddedImage.scale(0.5); // Escala 50%

        // 4. Desenhar a imagem no PDF (coordenadas x, y do canto inferior esquerdo)
        firstPage.drawImage(embeddedImage, {
            x: 50,
            y: 50,
            width: width,
            height: height,
        });

        // 5. Salvar e Gerar Download de forma segura para todos os navegadores
        const modifiedPdfBytes = await pdfDoc.save();
        const blob = new Blob([modifiedPdfBytes], { type: 'application/pdf' });
        const blobUrl = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = "pdf_modificado.pdf";
        
        // Adiciona ao DOM, clica e remove (Necessário para não quebrar no Firefox/Edge)
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Libera a memória do navegador
        URL.revokeObjectURL(blobUrl);

    } catch (err) {
        console.error(err);
        alert("Erro ao processar PDF: " + err.message);
    } finally {
        // Restaura o botão
        processBtn.disabled = false;
        processBtn.textContent = "Processar e Baixar PDF";
    }
});
