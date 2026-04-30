const pdfInput = document.getElementById('pdfInput');
const processBtn = document.getElementById('processBtn');
const preview = document.getElementById('pdfPreview');
const imageField = document.getElementById('image-field');

let currentPos = { x: 20, y: 20 };
let currentSize = { width: 150, height: 150 };

pdfInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
        const url = URL.createObjectURL(file);
        preview.data = url; // Para elemento <object>, usamos .data
        imageField.style.display = 'block';
        
        // Reset visual
        currentPos = { x: 20, y: 20 };
        imageField.style.transform = `translate(20px, 20px)`;
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
    if (!pdfInput.files[0]) return alert("Selecione um PDF.");

    try {
        const { PDFDocument, rgb } = PDFLib;
        const fileBytes = await pdfInput.files[0].arrayBuffer();
        const pdfDoc = await PDFDocument.load(fileBytes);
        const page = pdfDoc.getPages()[0];
        const { width: pdfW, height: pdfH } = page.getSize();

        const rect = preview.getBoundingClientRect();
        
        // CORREÇÃO PARA A IMAGEM DA CARINHA TRISTE (Evita NaN)
        // Se a largura for 0 (bloqueado), usa o tamanho do container pai
        const viewW = rect.width || document.getElementById('canvas-wrapper').offsetWidth || 800;
        const viewH = rect.height || document.getElementById('canvas-wrapper').offsetHeight || 700;

        const scaleX = pdfW / viewW;
        const scaleY = pdfH / viewH;

        // Garantir que todos os valores sejam números reais (trava anti-NaN)
        const check = (val) => isNaN(val) ? 0 : val;

        const fX = check(currentPos.x * scaleX);
        const fW = check(currentSize.width * scaleX);
        const fH = check(currentSize.height * scaleY);
        const fY = check(pdfH - (currentPos.y * scaleY) - fH);

        const form = pdfDoc.getForm();
        const fieldID = "foto_campo_" + Math.floor(Math.random() * 1000).toString();
        const photoField = form.createButton(fieldID);

        photoField.addToPage(page, {
            x: fX,
            y: fY,
            width: fW,
            height: fH,
            backgroundColor: rgb(0.95, 0.95, 0.95)
        });

        const pdfModified = await pdfDoc.save();
        const blob = new Blob([pdfModified], { type: 'application/pdf' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = "pdf_editavel.pdf";
        link.click();

    } catch (err) {
        alert("Erro ao processar: " + err.message);
    }
});
