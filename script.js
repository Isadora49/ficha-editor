const pdfInput = document.getElementById('pdfInput');
const imageInput = document.getElementById('imageInput');
const downloadBtn = document.getElementById('downloadBtn');
const resizableImg = document.getElementById('resizable-image');
const innerImg = document.getElementById('inner-img');
const pdfPreview = document.getElementById('pdfPreview');

let imgX = 50, imgY = 50;
let imgW = 150, imgH = 100;

// 1. Visualizar PDF
pdfInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
        const url = URL.createObjectURL(file);
        pdfPreview.src = url;
    }
});

// 2. Carregar e mostrar imagem no overlay
imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const url = URL.createObjectURL(file);
        innerImg.src = url;
        innerImg.style.display = 'block';
        resizableImg.style.display = 'block';
    }
});

// 3. Tornar o campo de imagem Arrastável e Redimensionável (Interact.js)
interact('#resizable-image')
    .draggable({
        listeners: {
            move(event) {
                imgX += event.dx;
                imgY += event.dy;
                event.target.style.transform = `translate(${imgX}px, ${imgY}px)`;
            }
        }
    })
    .resizable({
        edges: { right: true, bottom: true },
        listeners: {
            move(event) {
                imgW = event.rect.width;
                imgH = event.rect.height;
                Object.assign(event.target.style, {
                    width: `${imgW}px`,
                    height: `${imgH}px`
                });
            }
        }
    });

// 4. Processar e Gerar PDF Editável
downloadBtn.addEventListener('click', async () => {
    if (!pdfInput.files[0] || !imageInput.files[0]) {
        return alert("Selecione o PDF e a Imagem primeiro!");
    }

    try {
        const pdfBytes = await pdfInput.files[0].arrayBuffer();
        const imageBytes = await imageInput.files[0].arrayBuffer();

        const { PDFDocument } = PDFLib;
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const pages = pdfDoc.getPages();
        const firstPage = pages[0];
        const { height } = firstPage.getSize();

        // Incorporar imagem
        const imgType = imageInput.files[0].type;
        const embeddedImg = imgType === 'image/png' ? 
            await pdfDoc.embedPng(imageBytes) : await pdfDoc.embedJpg(imageBytes);

        /**
         * CONVERSÃO DE COORDENADAS:
         * No navegador, Y aumenta para baixo. No PDF, Y aumenta para cima.
         * PDF_Y = Altura_Total - Mouse_Y - Altura_Imagem
         */
        firstPage.drawImage(embeddedImg, {
            x: imgX,
            y: height - imgY - imgH, 
            width: imgW,
            height: imgH,
        });

        const modifiedPdf = await pdfDoc.save();
        const blob = new Blob([modifiedPdf], { type: 'application/pdf' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = "pdf_editado_2026.pdf";
        link.click();
    } catch (err) {
        console.error(err);
        alert("Erro ao gerar PDF: " + err.message);
    }
});
