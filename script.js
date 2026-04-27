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
pdfInput.addEventListener('change', async (e) => {
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
        // 1. Carregar os dados
        const pdfBytes = await readFile(pdfInput.files[0]);
        const imageBytes = await readFile(imageInput.files[0]);

        // 2. Carregar o documento PDF e a Imagem
        const { PDFDocument } = PDFLib;
        const pdfDoc = await PDFDocument.load(pdfBytes);
        
        // Suporta PNG ou JPEG
        const imgType = imageInput.files[0].type;
        let embeddedImage;
        if (imgType === 'image/png') {
            embeddedImage = await pdfDoc.embedPng(imageBytes);
        } else {
            embeddedImage = await pdfDoc.embedJpg(imageBytes);
        }

        // 3. Pegar a primeira página e as dimensões da imagem
        const pages = pdfDoc.getPages();
        const firstPage = pages[0];
        const { width, height } = embeddedImage.scale(0.5); // Escala 50%

        // 4. Desenhar a imagem no PDF
        // Aqui você define as coordenadas (x, y)
        firstPage.drawImage(embeddedImage, {
            x: 50,
            y: 50,
            width: width,
            height: height,
        });

        // 5. Salvar e Gerar Download
        const modifiedPdfBytes = await pdfDoc.save();
        const blob = new Blob([modifiedPdfBytes], { type: 'application/pdf' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = "pdf_modificado.pdf";
        link.click();

    } catch (err) {
        console.error(err);
        alert("Erro ao processar PDF: " + err.message);
    }
});
