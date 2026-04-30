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
        
        // Reset inicial seguro
        currentPos = { x: 50, y: 50 };
        currentSize = { width: 150, height: 150 };
        imageField.style.transform = `translate(50px, 50px)`;
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
    if (!pdfInput.files[0]) return alert("Selecione um PDF.");

    try {
        const { PDFDocument, rgb } = PDFLib;
        const fileBytes = await pdfInput.files[0].arrayBuffer();
        const pdfDoc = await PDFDocument.load(fileBytes);
        const page = pdfDoc.getPages()[0];
        const { width: pdfW, height: pdfH } = page.getSize();

        // SEGURANÇA CONTRA NaN:
        const rect = preview.getBoundingClientRect();
        if (!rect.width || rect.width === 0) {
            throw new Error("O preview do PDF ainda não carregou na tela.");
        }

        // Fórmulas de escala convertendo pixels para pontos PDF
        const scaleX = pdfW / rect.width;
        const scaleY = pdfH / rect.height;

        const finalX = Number(currentPos.x * scaleX) || 0;
        const finalWidth = Number(currentSize.width * scaleX) || 100;
        const finalHeight = Number(currentSize.height * scaleY) || 100;
        const finalY = Number(pdfH - (currentPos.y * scaleY) - finalHeight) || 0;

        const form = pdfDoc.getForm();
        const fieldName = `foto_${Date.now()}`;
        const photoField = form.createButton(fieldName);

        photoField.addToPage(page, {
            x: finalX,
            y: finalY,
            width: finalWidth,
            height: finalHeight,
            backgroundColor: rgb(0.9, 0.9, 0.9)
        });

        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = "pdf_preenchivel.pdf";
        link.click();

    } catch (err) {
        console.error(err);
        alert("Erro: " + err.message);
    }
});
