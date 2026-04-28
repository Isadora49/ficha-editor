const pdfInput = document.getElementById('pdfInput');
const processBtn = document.getElementById('processBtn');
const preview = document.getElementById('pdfPreview');
const imageField = document.getElementById('image-field');

let currentPos = { x: 50, y: 50 };
let currentSize = { width: 150, height: 150 };

// 1. Mostrar Preview do PDF e habilitar o campo interativo
pdfInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
        const url = URL.createObjectURL(file);
        preview.src = url;
        imageField.style.display = 'block'; // Campo aparece ao subir o PDF
    }
});

// 2. Configuração do Interact.js (Movimentação e Redimensionamento)
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
        const { width, height } = firstPage.getSize();

        // Cálculo de Proporção
        const wrapper = document.getElementById('canvas-wrapper').getBoundingClientRect();
        const factorX = width / wrapper.width;
        const factorY = height / wrapper.height;

        // Dimensões calculadas para o PDF (Garantindo que não sejam NaN)
        const finalX = Number(currentPos.x * factorX) || 0;
        const finalWidth = Number(currentSize.width * factorX) || 100;
        const finalHeight = Number(currentSize.height * factorY) || 100;
        const finalY = height - (Number(currentPos.y * factorY) || 0) - finalHeight;

        // Criar o campo de botão que aceita imagem no PDF
        // Em PDFs editáveis, campos de imagem são tecnicamente botões com layout de ícone
        const imageButton = form.createButton('campo_imagem_editavel');
        imageButton.addToPage(firstPage, {
            x: finalX,
            y: finalY,
            width: finalWidth,
            height: finalHeight,
        });

        // Estilização básica do campo para o usuário ver onde clicar no PDF
        imageButton.setBackgroundColor(rgb(0.9, 0.9, 0.9));
        
        // Salvar e Download
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
