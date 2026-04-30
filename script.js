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
                let x = (parseFloat(currentPos.x) || 0);
                let y = (parseFloat(currentPos.y) || 0);

                x += event.deltaRect.left;
                y += event.deltaRect.top;

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
        alert("Por favor, selecione o PDF primeiro!");
        return;
    }

    try {
        const file = pdfInput.files[0];
        const pdfBytes = await file.arrayBuffer();
        
        // Acesso direto e seguro à biblioteca
        const pdfDoc = await PDFLib.PDFDocument.load(pdfBytes);
        const form = pdfDoc.getForm();
        const pages = pdfDoc.getPages();
        const firstPage = pages[0];
        const { width: pdfW, height: pdfH } = firstPage.getSize();

        // Pega o tamanho real do preview na tela
        const rect = preview.getBoundingClientRect();
        const viewW = rect.width;
        const viewH = rect.height;

        // Fatores de escala baseados no visual real
        const scaleX = pdfW / viewW;
        const scaleY = pdfH / viewH;

        const finalX = currentPos.x * scaleX;
        const finalW = currentSize.width * scaleX;
        const finalH = currentSize.height * scaleY;
        
        // Ajuste do eixo Y (PDF é invertido: de baixo para cima)
        const finalY = pdfH - (currentPos.y * scaleY) - finalH;

        const fieldName = "foto_field_" + Date.now();
        const photoButton = form.createButton(fieldName);
        
        photoButton.addToPage(firstPage, {
            x: finalX,
            y: finalY,
            width: finalW,
            height: finalH,
        });

        // Define a aparência do campo
        photoButton.setBackgroundColor(PDFLib.rgb(0.95, 0.95, 0.95));

        const modifiedBytes = await pdfDoc.save();
        const blob = new Blob([modifiedBytes], { type: 'application/pdf' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = "pdf_com_campo_foto_2026.pdf";
        link.click();

    } catch (err) {
        console.error("Erro detalhado:", err);
        alert("Erro ao processar PDF. Verifique se o arquivo não está protegido por senha.");
    }
});
