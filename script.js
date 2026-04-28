const pdfInput = document.getElementById('pdfInput');
const imageInput = document.getElementById('imageInput');
const processBtn = document.getElementById('processBtn');
const preview = document.getElementById('pdfPreview');
const visualImg = document.getElementById('resizable-image');

let posX = 50, posY = 50;
let widthImg = 150, heightImg = 150;

// 1. Preview do PDF
pdfInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) preview.src = URL.createObjectURL(file);
});

// 2. Preview da Imagem no Editor
imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const url = URL.createObjectURL(file);
        visualImg.style.backgroundImage = `url(${url})`;
        visualImg.style.display = 'block';
    }
});

// 3. Lógica de Arrastar e Redimensionar (Interact.js)
interact('.draggable-resizable')
    .draggable({
        listeners: {
            move(event) {
                posX += event.dx;
                posY += event.dy;
                event.target.style.transform = `translate(${posX}px, ${posY}px)`;
            }
        }
    })
    .resizable({
        edges: { right: true, bottom: true },
        listeners: {
            move(event) {
                widthImg = event.rect.width;
                heightImg = event.rect.height;
                Object.assign(event.target.style, {
                    width: `${widthImg}px`,
                    height: `${heightImg}px`
                });
            }
        }
    });

// 4. Processamento Final
processBtn.addEventListener('click', async () => {
    if (!pdfInput.files[0] || !imageInput.files[0]) {
        alert("Selecione os arquivos primeiro!");
        return;
    }

    try {
        const pdfBytes = await pdfInput.files[0].arrayBuffer();
        const imageBytes = await imageInput.files[0].arrayBuffer();

        const { PDFDocument } = PDFLib;
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const pages = pdfDoc.getPages();
        const firstPage = pages[0];
        const { width, height } = firstPage.getSize();

        // Incorporar imagem
        const imgType = imageInput.files[0].type;
        const embeddedImage = imgType === 'image/png' ? 
            await pdfDoc.embedPng(imageBytes) : await pdfDoc.embedJpg(imageBytes);

        /**
         * AJUSTE DE COORDENADAS:
         * O HTML mede de cima para baixo. O PDF mede de baixo para cima.
         * Precisamos converter a posição Y do navegador para a do PDF.
         */
        const containerRect = document.getElementById('editor-container').getBoundingClientRect();
        const scaleX = width / containerRect.width;
        const scaleY = height / containerRect.height;

        firstPage.drawImage(embeddedImage, {
            x: posX * scaleX,
            y: height - (posY * scaleY) - (heightImg * scaleY), // Inversão do eixo Y
            width: widthImg * scaleX,
            height: heightImg * scaleY,
        });

        const modifiedPdfBytes = await pdfDoc.save();
        const blob = new Blob([modifiedPdfBytes], { type: 'application/pdf' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = "pdf_editado_final.pdf";
        link.click();

    } catch (err) {
        console.error(err);
        alert("Erro técnico: " + err.message);
    }
});
