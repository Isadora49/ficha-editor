const pdfInput = document.getElementById('pdfInput');
const processBtn = document.getElementById('processBtn');
const preview = document.getElementById('pdfPreview');
const imageField = document.getElementById('image-field');
const wrapper = document.getElementById('canvas-wrapper');

let currentPos = { x: 50, y: 50 };
let currentSize = { width: 150, height: 150 };

pdfInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
        const url = URL.createObjectURL(file);
        preview.src = url;
        imageField.style.display = 'block';
        // Reset visual
        currentPos = { x: 50, y: 50 };
        currentSize = { width: 150, height: 150 };
        imageField.style.transform = `translate(50px, 50px)`;
        imageField.style.width = '150px';
        imageField.style.height = '150px';
    }
});

interact('.resize-drag').resizable({
    edges: { left: true, right: true, bottom: true, top: true },
    listeners: {
        move(event) {
            let x = (parseFloat(currentPos.x) || 0) + event.deltaRect.left;
            let y = (parseFloat(currentPos.y) || 0) + event.deltaRect.top;
            Object.assign(event.target.style, {
                width: `${event.rect.width}px`,
                height: `${event.rect.height}px`,
                transform: `translate(${x}px, ${y}px)`
            });
            currentPos = { x, y };
            currentSize = { width: event.rect.width, height: event.rect.height };
        }
    }
}).draggable({
    listeners: {
        move(event) {
            currentPos.x = (parseFloat(currentPos.x) || 0) + event.dx;
            currentPos.y = (parseFloat(currentPos.y) || 0) + event.dy;
            event.target.style.transform = `translate(${currentPos.x}px, ${currentPos.y}px)`;
        }
    }
});

processBtn.addEventListener('click', async () => {
    if (!pdfInput.files[0]) return alert("Por favor, carregue o PDF primeiro.");

    try {
        const { PDFDocument, rgb } = PDFLib;
        const fileBytes = await pdfInput.files[0].arrayBuffer();
        const pdfDoc = await PDFDocument.load(fileBytes);
        const page = pdfDoc.getPages()[0];
        const { width: pdfW, height: pdfH } = page.getSize();

        // SEGURANÇA: Usamos o tamanho do WRAPPER (container) para o cálculo
        // Isso evita o erro de NaN se o iframe estiver com erro ou carinha triste.
        const viewW = wrapper.offsetWidth;
        const viewH = wrapper.offsetHeight;

        const scaleX = pdfW / viewW;
        const scaleY = pdfH / viewH;

        // Limpeza de valores para garantir que sejam números puros (Float)
        const finalX = (parseFloat(currentPos.x) * scaleX) || 0;
        const finalWidth = (parseFloat(currentSize.width) * scaleX) || 100;
        const finalHeight = (parseFloat(currentSize.height) * scaleY) || 100;
        // No PDF a coordenada Y começa de baixo para cima
        const finalY = pdfH - (parseFloat(currentPos.y) * scaleY) - finalHeight;

        const form = pdfDoc.getForm();
        const fieldName = "foto_editavel_" + Math.random().toString(36).substring(7);
        const photoField = form.createButton(fieldName);

        photoField.addToPage(page, {
            x: finalX,
            y: finalY,
            width: finalWidth,
            height: finalHeight,
            backgroundColor: rgb(0.85, 0.85, 0.85)
        });

        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = "PDF_Editavel_Pronto.pdf";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

    } catch (err) {
        console.error(err);
        alert("Erro ao gerar PDF: " + err.message);
    }
});
