const pdfInput = document.getElementById('pdfInput');
const processBtn = document.getElementById('processBtn');
const preview = document.getElementById('pdfPreview');

const readFile = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
};

// Preview do PDF original
pdfInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
        const blobUrl = URL.createObjectURL(file);
        preview.src = blobUrl;
    }
});

processBtn.addEventListener('click', async () => {
    if (!pdfInput.files[0]) {
        alert("Por favor, selecione um arquivo PDF!");
        return;
    }

    try {
        const pdfBytes = await readFile(pdfInput.files[0]);
        const { PDFDocument, rgb } = PDFLib;
        
        // Carrega o PDF
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const form = pdfDoc.getForm();
        const pages = pdfDoc.getPages();
        const firstPage = pages[0];

        // CRIANDO O CAMPO DE IMAGEM EDITÁVEL (AcroForm Button)
        // No padrão PDF, campos de imagem interativos são 'PushButtons' 
        // que aceitam ícones.
        const imageField = form.createButton('campo.imagem.editavel');
        
        // Define a posição e tamanho (X, Y, Largura, Altura)
        // Você pode ajustar esses valores para onde deseja que o campo apareça
        imageField.addToPage(firstPage, {
            x: 100,
            y: 400,
            width: 200,
            height: 150,
            textColor: rgb(0, 0, 0),
            backgroundColor: rgb(0.9, 0.9, 0.9),
        });

        // Legenda que aparece no campo antes de inserir a imagem
        imageField.setLabel('Clique para inserir imagem');

        // Salva as alterações no formulário
        const modifiedPdfBytes = await pdfDoc.save();

        // Download Seguro
        const blob = new Blob([modifiedPdfBytes], { type: 'application/pdf' });
        const downloadUrl = URL.createObjectURL(blob);
        
        // Atualiza o preview com o novo PDF (contendo o campo)
        preview.src = downloadUrl;

        // Gatilho de download
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = "pdf_com_campo_editavel.pdf";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

    } catch (err) {
        console.error("Erro no processamento:", err);
        alert("Falha ao gerar PDF: " + err.message);
    }
});
