const pdfInput = document.getElementById('pdfInput');
const processBtn = document.getElementById('processBtn');
const preview = document.getElementById('pdfPreview');
const imageField = document.getElementById('image-field');

let currentPos = { x: 50, y: 50 };
let currentSize = { width: 150, height: 150 };

pdfInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
        const url = URL.createObjectURL(file);
        preview.src = url;
        imageField.style.display = 'block';
        
        // Reset de posição para evitar cálculos baseados em lixo de memória
        currentPos = { x: 50, y: 50 };
        currentSize = { width: 150, height: 150 };
        imageField.style.transform = `translate(50px, 50px)`;
        imageField.style.width = '150px';
        imageField.style.height = '150px';
    }
});

interact('.resize-drag')
    .resizable({
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
    })
    .draggable({
        listeners: {
            move(event) {
                currentPos.x = (parseFloat(currentPos.x) || 0) + event.dx;
                currentPos.y = (parseFloat(currentPos.y) || 0) + event.dy;
                event.target.style.transform = `translate(${currentPos.x}px, ${currentPos.y}px)`;
            }
        }
    });

processBtn.addEventListener('click', async () => {
    if (!pdfInput.files[0]) {
        alert("Selecione um PDF primeiro.");
        return;
    }

    try {
        const { PDFDocument, rgb } = window.PDFLib;
        const fileBytes = await pdfInput.files[0].arrayBuffer();
        const pdfDoc = await PDFDocument.load(fileBytes);
        const page = pdfDoc.getPages()[0];
        const { width: pdfW, height: pdfH } = page.getSize();

        // CAPTURA DE MEDIDAS DA TELA
        const rect = preview.getBoundingClientRect();
        
        // Proteção contra NaN: se o rect for 0, usamos a largura do wrapper
        const viewW = rect.width || document.getElementById('canvas-wrapper').clientWidth;
        const viewH = rect.height || document.getElementById('canvas-wrapper').clientHeight;

        const scaleX = pdfW / viewW;
        const scaleY = pdfH / viewH;

        // Converter para números seguros e evitar NaN
        const finalX = Number(currentPos.x * scaleX) || 0;
        const finalWidth = Number(currentSize.width * scaleX) || 50;
        const finalHeight = Number(currentSize.height * scaleY) || 50;
        const finalY = Number(pdfH - (currentPos.y * scaleY) - finalHeight) || 0;

        const form = pdfDoc.getForm();
        // ID precisa ser string para não dar erro
        const fieldID = "foto_" + Math.floor(Math.random() * 10000).toString();
        const photoField = form.createButton(fieldID);

        photoField.addToPage(page, {
            x: finalX,
            y: finalY,
            width: finalWidth,
            height: finalHeight,
            backgroundColor: rgb(0.9, 0.9, 0.9) 
        });

        const pdfModified = await pdfDoc.save();
        const blob = new Blob([pdfModified], { type: 'application/pdf' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = "pdf_final_2026.pdf";
        link.click();

    } catch (err) {
        console.error(err);
        alert("Erro ao processar PDF: " + err.message);
    }
});
