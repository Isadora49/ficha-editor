const { PDFDocument, rgb } = PDFLib;

const pdfInput = document.getElementById('pdfInput');
const processBtn = document.getElementById('processBtn');
const preview = document.getElementById('pdfPreview');

// Inputs de dimensão
const inW = document.getElementById('imgW');
const inH = document.getElementById('imgH');
const inX = document.getElementById('posX');
const inY = document.getElementById('posY');

// Atualiza a visualização do PDF original
pdfInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
            preview.src = URL.createObjectURL(new Blob([ev.target.result], {type: 'application/pdf'}));
        };
        reader.readAsArrayBuffer(file);
    }
});

processBtn.addEventListener('click', async () => {
    if (!pdfInput.files[0]) {
        alert("Por favor, selecione um arquivo PDF!");
        return;
    }

    try {
        const arrayBuffer = await pdfInput.files[0].arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        
        // 1. Acessar o formulário do PDF (ou criar um novo)
        const form = pdfDoc.getForm();
        const pages = pdfDoc.getPages();
        const firstPage = pages[0];

        // 2. Criar um "Button" que funciona como campo de imagem em PDFs inteligentes
        // Nome do campo deve ser único
        const fieldName = `image_field_${Date.now()}`;
        const imageButton = form.createButton(fieldName);
        
        // 3. Definir o local e tamanho baseado nos inputs do site
        imageButton.addToPage(firstPage, {
            x: parseFloat(inX.value),
            y: parseFloat(inY.value),
            width: parseFloat(inW.value),
            height: parseFloat(inH.value),
        });

        // Opcional: Estilizar o campo para o usuário saber onde clicar no PDF
        firstPage.drawRectangle({
            x: parseFloat(inX.value),
            y: parseFloat(inY.value),
            width: parseFloat(inW.value),
            height: parseFloat(inH.value),
            borderColor: rgb(0.7, 0.7, 0.7),
            borderWidth: 1,
        });

        // 4. Finalizar e salvar
        const pdfBytes = await pdfDoc.save();
        
        // CORREÇÃO DO DOWNLOAD: Usar download direto via Blob
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const downloadUrl = URL.createObjectURL(blob);
        
        // Atualizar preview com o novo PDF
        preview.src = downloadUrl;

        // Criar link temporário para download
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = "pdf_com_campo_editavel.pdf";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

    } catch (err) {
        console.error(err);
        alert("Erro técnico: " + err.message);
    }
});
