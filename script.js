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
        
        // Reset de posição
        currentPos = { x: 50, y: 50 };
        currentSize = { width: 150, height: 150 };
        imageField.style.transform = `translate(50px, 50px)`;
        imageField.style.width = '150px';
        imageField.style.height = '150px';
    }
});

// 2. Configuração do Arraste/Redimensionamento
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

// 3. Geração do PDF
processBtn.addEventListener('click', async () => {
    if (!pdfInput.files[0]) {
        alert("Selecione um PDF primeiro.");
        return;
    }

    try {
        const { PDFDocument, rgb } = window.PDFLib;
        const fileBytes = await pdfInput.files[0].arrayBuffer();
        const pdfDoc = await PDFDocument.load(fileBytes);
        
        const pages = pdfDoc.getPages();
        const firstPage = pages[0];
        const { width: pdfW, height: pdfH } = firstPage.getSize();

        const rect = preview.getBoundingClientRect();
        
        const scaleX = pdfW / rect.width;
        const scaleY = pdfH / rect.height;

        const finalX = currentPos.x * scaleX;
        const finalWidth = currentSize.width * scaleX;
        const finalHeight = currentSize.height * scaleY;
        const finalY = pdfH - (currentPos.y * scaleY) - finalHeight;

        const form = pdfDoc.getForm();
        const fieldID = `foto_${Math.random().toString(36).substr(2, 5)}`;
        const photoField = form.createButton(fieldID);

        // CORREÇÃO: A cor de fundo precisa ser passada como um parâmetro dentro do addToPage
        photoField.addToPage(firstPage, {
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
        link.download = "pdf_editavel_final.pdf";
        link.click();

    } catch (err) {
        console.error("Erro técnico no console:", err);
        alert("Erro ao processar PDF. Detalhes no console (F12).");
    }
});
