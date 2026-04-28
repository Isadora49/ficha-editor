const pdfInput = document.getElementById('pdfInput');
const imageInput = document.getElementById('imageInput');
const processBtn = document.getElementById('processBtn');
const preview = document.getElementById('pdfPreview');
const imageField = document.getElementById('image-field');

let currentPos = { x: 50, y: 50 };
let currentSize = { width: 150, height: 150 };

// 1. Mostrar Preview do PDF
pdfInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
        const url = URL.createObjectURL(file);
        preview.src = url;
    }
});

// 2. Carregar Imagem no Campo Editável
imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const url = URL.createObjectURL(file);
        const content = imageField.querySelector('.image-content');
        content.style.backgroundImage = `url(${url})`;
        content.textContent = ""; // Remove o texto
        imageField.style.display = 'block';
    }
});

// 3. Tornar o campo MÓVEL e REDIMENSIONÁVEL (Interact.js)
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
        },
        modifiers: [
            interact.modifiers.restrictSize({ min: { width: 30, height: 30 } })
        ]
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

// 4. Processar e Baixar
processBtn.addEventListener('click', async () => {
    if (!pdfInput.files[0] || !imageInput.files[0]) {
        alert("Por favor, selecione o PDF e a Imagem primeiro!");
        return;
    }

    try {
        const pdfBytes = await pdfInput.files[0].arrayBuffer();
        const imageBytes = await imageInput.files[0].arrayBuffer();

        const { PDFDocument } = PDFLib;
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const pages = pdfDoc.getPages();
        const firstPage = pages[0];
        
        // Dimensões reais da página PDF
        const { width, height } = firstPage.getSize();

        // Incorporar imagem
        const imgType = imageInput.files[0].type;
        const embeddedImage = imgType === 'image/png' ? 
            await pdfDoc.embedPng(imageBytes) : await pdfDoc.embedJpg(imageBytes);

        // Cálculo de Proporção (Tela vs PDF)
        const wrapper = document.getElementById('canvas-wrapper').getBoundingClientRect();
        const factorX = width / wrapper.width;
        const factorY = height / wrapper.height;

        // Desenhar a imagem usando as coordenadas capturadas
        // Nota: O PDF conta o Y de baixo para cima, o navegador de cima para baixo.
        firstPage.drawImage(embeddedImage, {
            x: currentPos.x * factorX,
            y: height - (currentPos.y * factorY) - (currentSize.height * factorY),
            width: currentSize.width * factorX,
            height: currentSize.height * factorY,
        });

        const modifiedPdfBytes = await pdfDoc.save();
        const blob = new Blob([modifiedPdfBytes], { type: 'application/pdf' });
        
        // Download direto
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = "documento_editado_2026.pdf";
        link.click();

    } catch (err) {
        console.error(err);
        alert("Erro ao salvar PDF: " + err.message);
    }
});
