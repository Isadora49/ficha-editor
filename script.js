const pdfInput = document.getElementById('pdfInput');
const processBtn = document.getElementById('processBtn');
const preview = document.getElementById('pdfPreview');
const imageField = document.getElementById('image-field');

// Valores iniciais fixos para evitar undefined
let currentPos = { x: 50, y: 50 };
let currentSize = { width: 150, height: 150 };

// 1. Mostrar Preview do PDF
pdfInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
        const url = URL.createObjectURL(file);
        preview.src = url;
        imageField.style.display = 'block';
        
        // Reset visual
        currentPos = { x: 50, y: 50 };
        imageField.style.transform = `translate(50px, 50px)`;
    }
});

// 2. Configuração do Interact.js
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

// 3. Processar e Gerar Download
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
        const firstPage = pdfDoc.getPages()[0];
        const { width: pdfW, height: pdfH } = firstPage.getSize();

        // Pegar dimensões reais do container no site
        const wrapper = document.getElementById('canvas-wrapper');
        const wWidth = wrapper.clientWidth || 800;
        const wHeight = wrapper.clientHeight || 650;

        const fX = pdfW / wWidth;
        const fY = pdfH / wHeight;

        // Limpeza absoluta de dados (Garante que são números)
        const x = Math.max(0, parseFloat(currentPos.x) * fX) || 0;
        const w = Math.max(20, parseFloat(currentSize.width) * fX) || 100;
        const h = Math.max(20, parseFloat(currentSize.height) * fY) || 100;
        const y = Math.max(0, pdfH - (parseFloat(currentPos.y) * fY) - h) || 0;

        // Criar o campo com ID único em string
        const fieldName = "campo_" + Math.floor(Math.random() * 10000).toString();
        const button = form.createButton(fieldName);
        
        button.addToPage(firstPage, {
            x: x,
            y: y,
            width: w,
            height: h,
        });

        button.setBackgroundColor(rgb(0.9, 0.9, 0.9));

        const modifiedBytes = await pdfDoc.save();
        const blob = new Blob([modifiedBytes], { type: 'application/pdf' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = "pdf_editavel_2026.pdf";
        link.click();

    } catch (err) {
        console.error(err);
        alert("Erro técnico: " + err.message);
    }
});
