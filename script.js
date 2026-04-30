const pdfInput = document.getElementById('pdfInput');
const processBtn = document.getElementById('processBtn');
const preview = document.getElementById('pdfPreview');
const imageField = document.getElementById('image-field');

// Estado global das posições
let currentPos = { x: 50, y: 50 };
let currentSize = { width: 150, height: 150 };

// 1. Carregamento do PDF
pdfInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
        const url = URL.createObjectURL(file);
        preview.src = url;
        imageField.style.display = 'block';
        
        // Resetar posição visual
        currentPos = { x: 50, y: 50 };
        currentSize = { width: 150, height: 150 };
        imageField.style.transform = `translate(50px, 50px)`;
        imageField.style.width = '150px';
        imageField.style.height = '150px';
    }
});

// 2. Configuração do InteractJS
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
                currentPos.x += event.dx;
                currentPos.y += event.dy;
                event.target.style.transform = `translate(${currentPos.x}px, ${currentPos.y}px)`;
            }
        }
    });

// 3. Processamento Final
processBtn.addEventListener('click', async () => {
    if (!pdfInput.files[0]) {
        alert("Por favor, selecione o PDF primeiro!");
        return;
    }

    try {
        // Acessando a biblioteca de forma robusta para 2026
        const { PDFDocument, rgb } = window.PDFLib;
        
        const file = pdfInput.files[0];
        const pdfBytes = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const form = pdfDoc.getForm();
        const pages = pdfDoc.getPages();
        const firstPage = pages[0];
        const { width: pdfW, height: pdfH } = firstPage.getSize();

        // Cálculo de escala (Proteção contra divisões por zero)
        const rect = preview.getBoundingClientRect();
        const viewW = rect.width || 1; 
        const viewH = rect.height || 1;

        const scaleX = pdfW / viewW;
        const scaleY = pdfH / viewH;

        // Converter coordenadas do navegador para coordenadas do PDF
        const finalX = currentPos.x * scaleX;
        const finalW = currentSize.width * scaleX;
        const finalH = currentSize.height * scaleY;
        
        // Inversão do eixo Y (O PDF começa de baixo para cima)
        const finalY = pdfH - (currentPos.y * scaleY) - finalH;

        // Criar o campo de botão (que funciona como campo de imagem)
        const fieldName = "foto_" + Math.random().toString(36).substring(7);
        const photoField = form.createButton(fieldName);
        
        photoField.addToPage(firstPage, {
            x: finalX,
            y: finalY,
            width: finalW,
            height: finalH,
        });

        // Estilização do campo editável
        photoField.setBackgroundColor(rgb(0.9, 0.9, 0.9));

        const modifiedBytes = await pdfDoc.save();
        
        // Download do arquivo
        const blob = new Blob([modifiedBytes], { type: 'application/pdf' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = "pdf_editavel_foto_2026.pdf";
        link.click();

    } catch (err) {
        console.error("Erro técnico:", err);
        alert("Erro ao processar PDF. Detalhes no console (F12).");
    }
});
