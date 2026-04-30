const pdfInput = document.getElementById('pdfInput');
const canvas = document.getElementById('pdf-canvas');
const imageField = document.getElementById('image-field');
const ctx = canvas.getContext('2d');

let pdfDocLib = null;
let pdfBytes = null;
let currentPos = { x: 20, y: 20 };
let currentSize = { width: 120, height: 120 };

// 1. Carregar e Renderizar PDF no Canvas (Mais compatível que iframe)
pdfInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    pdfBytes = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({data: pdfBytes});
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);
    
    const viewport = page.getViewport({scale: 1.5});
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({canvasContext: ctx, viewport: viewport}).promise;
    imageField.style.display = 'flex';
});

// 2. Movimentação (Interact.js)
interact('.resize-drag').draggable({
    listeners: {
        move(event) {
            currentPos.x += event.dx;
            currentPos.y += event.dy;
            event.target.style.transform = `translate(${currentPos.x}px, ${currentPos.y}px)`;
        }
    }
}).resizable({
    edges: { left: true, right: true, bottom: true, top: true },
    listeners: {
        move(event) {
            currentSize.width = event.rect.width;
            currentSize.height = event.rect.height;
            currentPos.x += event.deltaRect.left;
            currentPos.y += event.deltaRect.top;

            Object.assign(event.target.style, {
                width: `${currentSize.width}px`,
                height: `${currentSize.height}px`,
                transform: `translate(${currentPos.x}px, ${currentPos.y}px)`
            });
        }
    }
});

// 3. Geração do PDF (Conversão de Coordenadas Canvas -> PDF)
document.getElementById('processBtn').addEventListener('click', async () => {
    if (!pdfBytes) return alert("Selecione um PDF");

    const { PDFDocument, rgb } = PDFLib;
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const page = pdfDoc.getPages()[0];
    const { width, height } = page.getSize();

    // Cálculo de proporção entre o que vemos na tela (canvas) e o PDF real
    const scaleX = width / canvas.width;
    const scaleY = height / canvas.height;

    const finalX = currentPos.x * scaleX;
    const finalW = currentSize.width * scaleX;
    const finalH = currentSize.height * scaleY;
    const finalY = height - (currentPos.y * scaleY) - finalH;

    const form = pdfDoc.getForm();
    const btn = form.createButton(`foto_${Date.now()}`);
    
    btn.addToPage(page, {
        x: isNaN(finalX) ? 0 : finalX,
        y: isNaN(finalY) ? 0 : finalY,
        width: isNaN(finalW) ? 50 : finalW,
        height: isNaN(finalH) ? 50 : finalH,
        backgroundColor: rgb(0.9, 0.9, 0.9)
    });

    const savedBytes = await pdfDoc.save();
    const blob = new Blob([savedBytes], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = "pdf_editavel.pdf";
    link.click();
});
