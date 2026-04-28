const pdfInput = document.getElementById('pdfInput');
const processBtn = document.getElementById('processBtn');
const widthInput = document.getElementById('fieldWidth');
const heightInput = document.getElementById('fieldHeight');

// Função utilitária para ler o arquivo
const readFile = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
};

processBtn.addEventListener('click', async () => {
    if (!pdfInput.files[0]) {
        alert("Por favor, selecione um arquivo PDF primeiro!");
        return;
    }

    try {
        // Desativa o botão para evitar múltiplos cliques
        processBtn.disabled = true;
        processBtn.innerText = "Processando...";

        const pdfBytes = await readFile(pdfInput.files[0]);
        const { PDFDocument, PDFName } = PDFLib;
        
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const form = pdfDoc.getForm(); // Cria ou pega o formulário do PDF

        // Pega as dimensões digitadas pelo usuário
        const fieldWidth = parseFloat(widthInput.value) || 200;
        const fieldHeight = parseFloat(heightInput.value) || 200;

        const pages = pdfDoc.getPages();
        const firstPage = pages[0];

        // 1. Cria um botão vazio no PDF
        const fieldName = 'ImagemPerfil_' + Date.now();
        const button = form.createButton(fieldName);

        // 2. Posiciona o botão (está no topo esquerdo por padrão)
        button.addToPage(fieldName, firstPage, {
            x: 50,
            y: firstPage.getHeight() - fieldHeight - 50,
            width: fieldWidth,
            height: fieldHeight,
        });

        // 3. O SEGREDO: Injeta o JavaScript do Acrobat para transformar o botão num uploader
        const widget = button.acroField.getWidgets()[0];
        const actionDict = pdfDoc.context.obj({
            Type: 'Action',
            S: 'JavaScript',
            JS: 'event.target.buttonImportIcon();'
        });
        widget.dict.set(PDFName.of('A'), actionDict);

        // 4. Salva o PDF modificado
        const modifiedPdfBytes = await pdfDoc.save();

        // 5. Gera o Download de forma segura sem quebrar
        const blob = new Blob([modifiedPdfBytes], { type: 'application/pdf' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = "pdf_editavel.pdf";
        
        // Adiciona ao DOM, clica e remove (garante que funciona em todos os navegadores)
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Limpa a memória
        URL.revokeObjectURL(link.href);

    } catch (err) {
        console.error(err);
        alert("Ocorreu um erro ao processar o PDF: " + err.message);
    } finally {
        // Restaura o botão independente de dar certo ou erro
        processBtn.disabled = false;
        processBtn.innerText = "Criar Campo e Baixar PDF";
    }
});
