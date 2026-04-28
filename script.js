const pdfInput = document.getElementById('pdfInput');
const processBtn = document.getElementById('processBtn');
const preview = document.getElementById('pdfPreview');
const imageField = document.getElementById('image-field');

let currentPos = { x: 50, y: 50 };
let currentSize = { width: 150, height: 150 };

// 1. Preview do PDF
pdfInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        preview.src = URL.createObjectURL(file);
    }
});

// 2. Interact.js para movimentação e redimensionamento
interact('.resize-drag')
    .resizable({
        edges: { left: true, right: true, bottom: true, top: true },
        listeners: {
            move(event) {
                let { x, y } = currentPos;
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
                currentPos.x += event.dx;
                currentPos.y += event.dy;
                event.target.style.transform = `translate(${currentPos.x}px, ${currentPos.y}px)`;
            }
        }
    });

// 3. Gerar PDF com campo de formulário editável
processBtn.addEventListener('click', async () => {
    if (!pdfInput.files[0]) {
        alert("Por favor, selecione o PDF base!");
        return;
    }

    try {
        const pdfBytes = await pdfInput.files[0].arrayBuffer();
        const { PDFDocument, rgb } = PDFLib;
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const form = pdfDoc.getForm();
        const pages = pdfDoc.getPages();
        const firstPage = pages[0];
        const { width, height } = firstPage.getSize();

        // Cálculo de Proporção Tela vs PDF
        const wrapper = document.getElementById('canvas-wrapper').getBoundingClientRect();
        const factorX = width / wrapper.width;
        const factorY = height / wrapper.height;

        // Criar o campo de botão (que funciona como campo de imagem no PDF)
        const imageButton = form.createButton('campo_imagem_editavel');
        
        // Definir localização e tamanho
        // O PDF conta o Y de baixo para cima
        const finalX = currentPos.x * factorX;
        const finalY = height - (currentPos.y * factorY) - (currentSize.height * factorY);
        const finalWidth = currentSize.width * factorX;
        const finalHeight = currentSize.height * factorY;

        imageButton.addToPage(firstPage, {
            x: finalX,
            y: finalY,
            width: finalWidth,
            height: finalHeight,
        });

        // Configurar para ser um campo de "Push Button" que aceita ícone (imagem)
        // Isso torna o campo clicável para inserção de imagem em leitores de PDF
        const buttonWidget = imageButton.acroField.getWidgets()[0];
        buttonWidget.setAppearanceState(rgb(0.9, 0.9, 0.9)); // Fundo cinza claro no campo

        const modifiedPdfBytes = await pdfDoc.save();
        const blob = new Blob([modifiedPdfBytes], { type: 'application/pdf' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = "pdf_com_campo_editavel.pdf";
        link.click();

    } catch (err) {
        console.error(err);
        alert("Erro ao processar PDF: " + err.message);
    }
});
