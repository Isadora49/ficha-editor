const pdfInput = document.getElementById('pdfInput');
const imageInput = document.getElementById('imageInput');
const processBtn = document.getElementById('processBtn');
const resizableImage = document.getElementById('resizableImage');
const pdfCanvasContainer = document.getElementById('pdfCanvasContainer');
const canvas = document.getElementById('pdfRenderCanvas');

let pdfDocLib = null;
let pdfBytes = null;
let scaleRatio = 1; // Proporção entre o PDF real e o que aparece na tela

// 1. Carregar e Visualizar PDF
pdfInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    pdfBytes = await file.arrayBuffer();
    pdfDocLib = await PDFLib.PDFDocument.load(pdfBytes);
    
    // Para visualização, usamos um truque: converter a primeira página em imagem para o fundo
    // Em um ambiente real de 2026, usaríamos pdf.js para renderizar o Canvas
    const blobUrl = URL.createObjectURL(file);
    
    // Renderização simplificada para preview (usando iframe oculta ou PDF.js)
    // Aqui simulamos a exibição do container
    pdfCanvasContainer.style.display = 'inline-block';
    
    // Carregamos as dimensões da página 1
    const pages = pdfDocLib.getPages();
    const firstPage = pages[0];
    const { width, height } = firstPage.getSize();
    
    // Ajustamos o canvas de preview
    scaleRatio = 600 / width; // Redimensiona para caber na tela (largura 600px)
    canvas.width = width * scaleRatio;
    canvas.height = height * scaleRatio;
    
    alert("PDF Carregado. Agora escolha uma imagem!");
});

// 2. Carregar e Visualizar Imagem
imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            resizableImage.style.backgroundImage = `url(${event.target.result})`;
            resizableImage.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
});

// 3. Lógica de Arrastar e Redimensionar (Mouse & Touch)
let isDragging = false;
let isResizing = false;
let currentResizer = null;

resizableImage.addEventListener('pointerdown', (e) => {
    if (e.target.classList.contains('resizer')) {
        isResizing = true;
        currentResizer = e.target;
    } else {
        isDragging = true;
    }
    resizableImage.setPointerCapture(e.pointerId);
});

window.addEventListener('pointermove', (e) => {
    if (!isDragging && !isResizing) return;

    const rect = pdfCanvasContainer.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;

    if (isDragging) {
        resizableImage.style.left = `${x - resizableImage.offsetWidth / 2}px`;
        resizableImage.style.top = `${y - resizableImage.offsetHeight / 2}px`;
    } else if (isResizing) {
        const width = x - resizableImage.offsetLeft;
        if (width > 20) {
            resizableImage.style.width = `${width}px`;
            resizableImage.style.height = `${width}px`; // Mantém proporção 1:1 ou ajuste conforme desejar
        }
    }
});

window.addEventListener('pointerup', (e) => {
    isDragging = false;
    isResizing = false;
});

// 4. Processar e Gerar PDF Final
processBtn.addEventListener('click', async () => {
    if (!pdfDocLib || !imageInput.files[0]) {
        alert("Selecione o PDF e a imagem primeiro!");
        return;
    }

    try {
        const imageBytes = await imageInput.files[0].arrayBuffer();
        let embeddedImage;
        if (imageInput.files[0].type === 'image/png') {
            embeddedImage = await pdfDocLib.embedPng(imageBytes);
        } else {
            embeddedImage = await pdfDocLib.embedJpg(imageBytes);
        }

        const pages = pdfDocLib.getPages();
        const firstPage = pages[0];
        const pdfHeight = firstPage.getHeight();

        // Conversão de coordenadas da tela para coordenadas do PDF (Invertendo o Y)
        // O PDF conta o Y de baixo para cima.
        const x = parseFloat(resizableImage.style.left) / scaleRatio;
        const screenY = parseFloat(resizableImage.style.top) / scaleRatio;
        const width = resizableImage.offsetWidth / scaleRatio;
        const height = resizableImage.offsetHeight / scaleRatio;
        
        const y = pdfHeight - screenY - height; // Inversão necessária

        firstPage.drawImage(embeddedImage, {
            x: x,
            y: y,
            width: width,
            height: height,
        });

        const modifiedPdfBytes = await pdfDocLib.save();
        const blob = new Blob([modifiedPdfBytes], { type: 'application/pdf' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = "pdf_editado_2026.pdf";
        link.click();
    } catch (err) {
        console.error(err);
        alert("Erro na geração: " + err.message);
    }
});
