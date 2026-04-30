const pdfInput = document.getElementById('pdfInput');
const processBtn = document.getElementById('processBtn');
const preview = document.getElementById('pdfPreview');
const imageField = document.getElementById('image-field');

// Valores iniciais garantidos como números
let currentPos = { x: 50, y: 50 };
let currentSize = { width: 150, height: 150 };

// 1. Mostrar Preview do PDF
pdfInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
        const url = URL.createObjectURL(file);
        preview.src = url;
        imageField.style.display = 'block';
        
        // Reset visual seguro
        currentPos = { x: 50, y: 50 };
        currentSize = { width: 150, height: 150 };
        imageField.style.transform = `translate(50px, 50px)`;
        imageField.style.width = '150px';
        imageField.style.height = '150px';
    }
});

// 2. Configuração do Interact.js (Blindada contra valores nulos)
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
        const pages = pdfDoc.getPages();
        
        if (pages.length === 0) throw new Error("PDF sem páginas.");
        
        const firstPage = pages[0];
        const { width: pdfW, height: pdfH } = firstPage.getSize();

        // Dimensões do container (wrapper)
        const wrapper = document.getElementById('canvas-wrapper');
        const wWidth = wrapper.offsetWidth || 800;
        const wHeight = wrapper.offsetHeight || 650;

        // Fatores de escala
        const fX = pdfW / wWidth;
        const fY = pdfH / wHeight;

        const safeX = Number(parseFloat(currentPos.x) * fX) || 0;
        const safeW = Number(parseFloat(currentSize.width) * fX) || 100;
        const safeH = Number(parseFloat(currentSize.height) * fY) || 100;
        
        // No PDF o Y é de baixo para cima
        const safeY = Number(pdfH - (parseFloat(currentPos.y) * fY) - safeH) || 0;

        // Atualização 2026: Usando substring em vez de substr (depreciado)
        const fieldID = "img_edit_" + Math.random().toString(36).substring(2, 11);
        
        const button = form.createButton(fieldID);
        
        // CORREÇÃO: A cor de fundo vai DENTRO das opções do addToPage
        button.addToPage(firstPage, {
            x: safeX,
            y: safeY,
            width: safeW,
            height: safeH,
            backgroundColor: rgb(0.9, 0.9, 0.9) // <--- Cor de fundo definida aqui
        });

        // Gerar e baixar
        const modifiedBytes = await pdfDoc.save();
        const blob = new Blob([modifiedBytes], { type: 'application/pdf' });
        const link = document.createElement('a');
        
        const fileUrl = URL.createObjectURL(blob);
        link.href = fileUrl;
        link.download = "documento_editavel_2026.pdf";
        link.click();
        
        // Limpa a memória após o download
        setTimeout(() => URL.revokeObjectURL(fileUrl), 100);

    } catch (err) {
        // Exibimos o erro no console para caso de outras falhas não ficarmos às cegas
        console.error("Erro no processamento:", err);
        alert("Erro ao processar PDF: Certifique-se de que o arquivo é um PDF válido.");
    }
});
