const pdfInput = document.getElementById('pdfInput');
const processBtn = document.getElementById('processBtn');
const preview = document.getElementById('pdfPreview');
const imageField = document.getElementById('image-field');
const wrapper = document.getElementById('canvas-wrapper');

// Estado inicial seguro para evitar NaN
let currentPos = { x: 50, y: 50 };
let currentSize = { width: 150, height: 150 };

// 1. Mostrar Preview do PDF
pdfInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const url = URL.createObjectURL(file);
        preview.src = url;
        imageField.style.display = 'block';
        
        // Resetar posição visual para o padrão ao carregar novo PDF
        currentPos = { x: 50, y: 50 };
        currentSize = { width: 150, height: 150 };
        imageField.style.transform = `translate(50px, 50px)`;
        imageField.style.width = '150px';
        imageField.style.height = '150px';
    }
});

// 2. Configuração do Interact.js
interact('.resize-drag')
    .resizable({
        edges: { left: true, right: true, bottom: true, top: true },
        listeners: {
            move(event) {
                let x = (currentPos.x || 0) + event.deltaRect.left;
                let y = (currentPos.y || 0) + event.deltaRect.top;

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
                currentPos.x = (currentPos.x || 0) + event.dx;
                currentPos.y = (currentPos.y || 0) + event.dy;
                event.target.style.transform = `translate(${currentPos.x}px, ${currentPos.y}px)`;
            }
        }
    });

// 3. Processar e Criar Campo Editável
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
        const { width: pdfWidth, height: pdfHeight } = firstPage.getSize();

        // Captura dimensões do contêiner no momento do clique (evita NaN)
        const rect = wrapper.getBoundingClientRect();
        const containerW = rect.width || 1;
        const containerH = rect.height || 1;

        // Fatores de conversão
        const factorX = pdfWidth / containerW;
        const factorY = pdfHeight / containerH;

        // Cálculos protegidos contra NaN
        const finalX = Math.max(0, Number(currentPos.x * factorX) || 0);
        const finalW = Math.max(10, Number(currentSize.width * factorX) || 100);
        const finalH = Math.max(10, Number(currentSize.height * factorY) || 100);
        // Inversão do eixo Y (PDF começa de baixo)
        const finalY = Math.max(0, pdfHeight - (Number(currentPos.y * factorY) || 0) - finalH);

        // Criar campo de botão para imagem
        // Usamos um nome único baseado no timestamp para evitar conflitos
        const fieldName = `img_field_${Date.now()}`;
        const imageButton = form.createButton(fieldName);
        
        imageButton.addToPage(firstPage, {
            x: finalX,
            y: finalY,
            width: finalW,
            height: finalH,
        });

        // Configura o campo para parecer um placeholder de imagem
        imageButton.setBackgroundColor(rgb(0.95, 0.95, 0.95));
        
        // Adiciona script interno ao PDF para abrir seletor de imagem ao clicar
        // Nota: Isso funciona em leitores profissionais (Adobe, Foxit, etc)
        pdfDoc.getForm().getFields().forEach(field => {
            if (field.getName() === fieldName) {
                field.acroField.getWidgets().forEach(widget => {
                    widget.setCaption('Clique para inserir foto');
                });
            }
        });

        const modifiedPdfBytes = await pdfDoc.save();
        const blob = new Blob([modifiedPdfBytes], { type: 'application/pdf' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = "pdf_editavel_com_foto.pdf";
        link.click();

    } catch (err) {
        console.error("Erro detalhado:", err);
        alert("Erro ao processar: Verifique se o arquivo é um PDF válido.");
    }
});
