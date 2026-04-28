// Variáveis Globais para controle de posição e escala
let xPos = 50, yPos = 50;
let imgWidth = 150, imgHeight = 150;
let currentPdfFile = null;
let currentImageFile = null;

// Configuração do Interact.js (Movimentação e Redimensionamento)
interact('.draggable-resizable')
  .draggable({
    listeners: {
      move (event) {
        xPos += event.dx;
        yPos += event.dy;
        event.target.style.transform = `translate(${xPos}px, ${yPos}px)`;
      }
    }
  })
  .resizable({
    edges: { left: true, right: true, bottom: true, top: true },
    listeners: {
      move (event) {
        let { x, y } = event.target.dataset;
        x = (parseFloat(x) || 0) + event.deltaRect.left;
        y = (parseFloat(y) || 0) + event.deltaRect.top;

        Object.assign(event.target.style, {
          width: `${event.rect.width}px`,
          height: `${event.rect.height}px`,
          transform: `translate(${xPos}px, ${yPos}px)`
        });

        imgWidth = event.rect.width;
        imgHeight = event.rect.height;
      }
    }
  });

// Visualizar PDF no Canvas do Site
document.getElementById('pdfInput').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    currentPdfFile = file;
    
    // Para visualização real do PDF usamos um truque de renderização
    // ou simplesmente exibimos o PDF no fundo do container.
    const fileURL = URL.createObjectURL(file);
    const pdfData = await file.arrayBuffer();
    
    // Usamos PDF-LIB para detectar dimensões reais e ajustar o container
    const pdfDoc = await PDFLib.PDFDocument.load(pdfData);
    const page = pdfDoc.getPages()[0];
    const pWidth = page.getWidth();
    const pHeight = page.getHeight();

    alert("PDF carregado! Use a área abaixo para posicionar sua imagem.");
});

// Visualizar Imagem no campo móvel
document.getElementById('imageInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    currentImageFile = file;
    
    const reader = new FileReader();
    reader.onload = (event) => {
        const img = document.getElementById('imgPreview');
        img.src = event.target.result;
        img.style.display = 'block';
        document.querySelector('.placeholder-text').style.display = 'none';
    };
    reader.readAsDataURL(file);
});

// Processar e Gerar Download
document.getElementById('processBtn').addEventListener('click', async () => {
    if (!currentPdfFile || !currentImageFile) {
        alert("Selecione ambos os arquivos primeiro!");
        return;
    }

    try {
        const pdfBytes = await currentPdfFile.arrayBuffer();
        const imageBytes = await currentImageFile.arrayBuffer();
        
        const { PDFDocument } = PDFLib;
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const pages = pdfDoc.getPages();
        const firstPage = pages[0];
        
        const imgType = currentImageFile.type;
        const embeddedImage = imgType.includes('png') ? 
            await pdfDoc.embedPng(imageBytes) : await pdfDoc.embedJpg(imageBytes);

        const { width: pWidth, height: pHeight } = firstPage.getSize();
        
        // CÁLCULO DE COORDENADAS (Conversão Tela -> PDF)
        // O PDF no PDF-Lib começa o (0,0) no canto INFERIOR ESQUERDO.
        // No navegador, começa no SUPERIOR ESQUERDO.
        const pdfX = xPos; 
        const pdfY = pHeight - yPos - imgHeight; 

        firstPage.drawImage(embeddedImage, {
            x: pdfX,
            y: pdfY,
            width: imgWidth,
            height: imgHeight,
        });

        const modifiedPdfBytes = await pdfDoc.save();
        const blob = new Blob([modifiedPdfBytes], { type: 'application/pdf' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = "pdf_final_editado.pdf";
        link.click();
        
        alert("Sucesso! PDF gerado com as alterações.");
    } catch (err) {
        console.error(err);
        alert("Erro no processamento: " + err.message);
    }
});
