const pdfInput = document.getElementById('pdfInput');
const processBtn = document.getElementById('processBtn');
const preview = document.getElementById('pdfPreview');
const imageField = document.getElementById('image-field');

let currentPos = { x: 50, y: 50 };
let currentSize = { width: 150, height: 150 };

// 1. Carregar Preview
pdfInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
        const url = URL.createObjectURL(file);
        preview.src = url;
        imageField.style.display = 'block';
        
        currentPos = { x: 50, y: 50 };
        currentSize = { width: 150, height: 150 };
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

// 3. Geração do PDF (Corrigido para atualizações 2026)
processBtn.addEventListener('click', async () => {
    if (!pdfInput.files[0]) {
        alert("Selecione um PDF primeiro.");
        return;
    }

    try {
        // Verificação robusta da biblioteca
        const lib = window.PDFLib || PDFLib;
        if (!lib) throw new Error("Biblioteca PDF-Lib não carregada.");

        const { PDFDocument, rgb } = lib;
        const fileBytes = await pdfInput.files[0].arrayBuffer();
        const pdfDoc = await PDFDocument.load(fileBytes);
        
        const pages = pdfDoc.getPages();
        if (pages.length === 0) throw new Error("O PDF não possui páginas.");
        
        const firstPage = pages[0];
        const { width: pdfW, height: pdfH } = firstPage.getSize();

        // Cálculo de escala baseado no container real
        const rect = preview.getBoundingClientRect();
        if (rect.width === 0) throw new Error("Erro na renderização do preview.");

        const scaleX = pdfW / rect.width;
        const scaleY = pdfH / rect.height;

        const finalX = (parseFloat(currentPos.x) || 0) * scaleX;
        const finalWidth = (parseFloat(currentSize.width) || 0) * scaleX;
        const finalHeight = (parseFloat(currentSize.height) || 0) * scaleY;
        
        // Inversão correta do eixo Y
        const finalY = pdfH - ((parseFloat(currentPos.y) || 0) * scaleY) - finalHeight;

        const form = pdfDoc.getForm();
        const fieldID = `foto_${Math.floor(Math.random() * 10000)}`;
        const photoField = form.createButton(fieldID);

        photoField.addToPage(firstPage, {
            x: finalX,
            y: finalY,
            width: finalWidth,
            height: finalHeight
        });

        photoField.setBackgroundColor(rgb(0.9, 0.9, 0.9));

        const pdfModified = await pdfDoc.save();
        const blob = new Blob([pdfModified], { type: 'application/pdf' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = "documento_editavel_pro.pdf";
        link.click();

    } catch (err) {
        console.error("Erro interno:", err);
        alert("Erro ao processar PDF: " + err.message);
    }
});
