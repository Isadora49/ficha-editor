const pdfInput = document.getElementById('pdfInput');
const imageInput = document.getElementById('imageInput');
const processBtn = document.getElementById('processBtn');
const preview = document.getElementById('pdfPreview');

// Mostrar preview básico quando subir o arquivo
pdfInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const blobUrl = URL.createObjectURL(file);
        preview.src = blobUrl;
    }
});

processBtn.addEventListener('click', async () => {
    const pdfFile = pdfInput.files[0];
    const imageFile = imageInput.files[0];

    if (!pdfFile || !imageFile) {
        alert("Por favor, selecione o PDF e a Imagem!");
        return;
    }

    try {
        // 1. Carregar os dados usando a API moderna nativa (arrayBuffer)
        const pdfBytes = await pdfFile.arrayBuffer();
        const imageBytes = await imageFile.arrayBuffer();

        // 2. Carregar o documento PDF
        const { PDFDocument } = PDFLib;
        const pdfDoc = await PDFDocument.load(pdfBytes);
        
        // Suporta PNG ou JPEG e valida o tipo para não quebrar
        const imgType = imageFile.type;
        let embeddedImage;

        if (imgType === 'image/png') {
            embeddedImage = await pdfDoc.embedPng(imageBytes);
        } else if (imgType === 'image/jpeg' || imgType === 'image/jpg') {
            embeddedImage = await pdfDoc.embedJpg(imageBytes);
        } else {
            alert("Formato de imagem não suportado! Por favor, utilize apenas PNG ou JPG.");
            return;
        }

        // 3. Pegar a primeira página e as dimensões da imagem
        const pages = pdfDoc.getPages();
        const firstPage = pages[0];
        const { width, height } = embeddedImage.scale(0.5); // Escala 50%

        // 4. Desenhar a imagem no PDF de fato
        firstPage.drawImage(embeddedImage, {
            x: 50,
            y: 50,
            width: width,
            height: height,
        });

        // 5. Salvar e Gerar Download Robusto
        const modifiedPdfBytes = await pdfDoc.save();
        const blob = new Blob([modifiedPdfBytes], { type: 'application/pdf' });
        
        // Criar a URL do Blob
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = "pdf_modificado.pdf";
        
        // Passo essencial para navegadores modernos: adicionar ao DOM antes de clicar
        document.body.appendChild(link);
        link.click();
        
        // Limpar o DOM e a memória para não quebrar nas próximas vezes
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);

        // Opcional: Atualizar o preview com o PDF já modificado para o usuário ver o resultado
        preview.src = URL.createObjectURL(blob);

    } catch (err) {
        console.error("Erro interno:", err);
        alert("Erro ao processar PDF: " + err.message);
    }
});
