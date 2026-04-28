const pdfInput = document.getElementById('pdfInput');
const processBtn = document.getElementById('processBtn');
const preview = document.getElementById('pdfPreview');
const imageField = document.getElementById('image-field');

// Inicialização segura das variáveis
let currentPos = { x: 0, y: 0 };
let currentSize = { width: 150, height: 150 };

// 1. Mostrar Preview do PDF
pdfInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
        const url = URL.createObjectURL(file);
        preview.src = url;
        imageField.style.display = 'block';
        
        // Resetar posição visual para o início do wrapper ao carregar novo PDF
        currentPos = { x: 0, y: 0 };
        imageField.style.transform = `translate(0px, 0px)`;
    }
});

// 2. Configuração do Interact.js (Movimentação e Redimensionamento)
interact('.resize-drag')
    .resizable({
        edges: { left: true, right: true, bottom: true, top: true },
        listeners: {
            move(event) {
                // Garantir que os valores iniciais não sejam NaN
                let x = Number(currentPos.x) || 0;
                let y = Number(currentPos.y) || 0;

                x += event.deltaRect.left;
                y += event.deltaRect.top;

                Object.assign(event.target.style, {
                    width: `${event.rect.width}px`,
                    height: `${event.rect.height}px`,
                    transform: `translate(${x}px, ${y}px)`
                });

                currentPos = { x, y };
                currentSize = { width: event.rect.width, height: event.rect.height };
            }
        }
    })
    .draggable({
        listeners: {
            move(event) {
                currentPos.x = (Number(currentPos.x) || 0) + event.dx;
                currentPos.y = (Number(currentPos.y) || 0) + event.dy;
                event.target.style.transform = `translate(${currentPos.x}px, ${currentPos.y}px)`;
            }
        }
    });

// 3. Processar e Criar Campo Editável
processBtn.addEventListener('click', async () => {
    if (!pdfInput.files[0]) {
        alert("Por favor, selecione o PDF primeiro!");
        return;
    }

    try {
        const pdfBytes = await pdfInput.files[0].arrayBuffer();
        const { PDFDocument, rgb } = PDFLib;
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const form = pdfDoc.getForm();
        const pages = pdfDoc.getPages();
        const firstPage = pages[0];
        const { width: pdfWidth, height: pdfHeight } = firstPage.getSize();

        // Captura o retângulo do wrapper no momento exato do processamento
        const wrapper = document.getElementById('canvas-wrapper');
        const wrapperRect = wrapper.getBoundingClientRect();
        
        // Fatores de conversão (Pontos do PDF / Pixels da Tela)
        // Usamos Math.max para evitar divisão por zero
        const factorX = pdfWidth / Math.max(wrapperRect.width, 1);
        const factorY = pdfHeight / Math.max(wrapperRect.height, 1);

        // Cálculos blindados contra NaN com Number() e fallback para 0
        const finalX = Number(currentPos.x * factorX) || 0;
        const finalWidth = Number(currentSize.width * factorX) || 100;
        const finalHeight = Number(currentSize.height * factorY) || 100;
        
        // No PDF, a coordenada Y começa de baixo para cima
        const finalY = pdfHeight - (Number(currentPos.y * factorY) || 0) - finalHeight;

        // Criar o campo de botão
        const imageButton = form.createButton('campo_imagem_editavel_' + Date.now());
        
        imageButton.addToPage(firstPage, {
            x: finalX,
            y: finalY,
            width: finalWidth,
            height: finalHeight,
        });

        // Estilização básica (Cinza claro)
        imageButton.setBackgroundColor(rgb(0.9, 0.9, 0.9));

        // Salvar e Download
        const modifiedPdfBytes = await pdfDoc.save();
        const blob = new Blob([modifiedPdfBytes], { type: 'application/pdf' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = "pdf_com_campo_editavel.pdf";
        link.click();

    } catch (err) {
        console.error("Erro detalhado:", err);
        alert("Erro ao processar PDF: " + err.message);
    }
});
