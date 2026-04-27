const pdfUpload = document.getElementById('pdf-upload');
const imageUpload = document.getElementById('image-upload');
const imageField = document.getElementById('image-field');
const previewImg = document.getElementById('preview-img');
const downloadBtn = document.getElementById('download-btn');

let pdfDocBytes = null;
let imageBytes = null;

// 1. Ler o PDF e mostrar (simplificado para exibição)
pdfUpload.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    pdfDocBytes = await file.arrayBuffer();
    alert("PDF Carregado! Agora escolha uma imagem.");
});

// 2. Ler a imagem e mostrar o campo flutuante
imageUpload.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
        previewImg.src = event.target.result;
        imageField.classList.remove('hidden');
        downloadBtn.disabled = false;
    };
    reader.readAsDataURL(file);
    imageBytes = await file.arrayBuffer();
});

// 3. Tornar o campo arrastável (Lógica Simples)
let isDragging = false;
imageField.onmousedown = (e) => { isDragging = true; };
document.onmousemove = (e) => {
    if (isDragging) {
        const rect = document.getElementById('viewer').getBoundingClientRect();
        imageField.style.left = (e.clientX - rect.left - 75) + 'px';
        imageField.style.top = (e.clientY - rect.top - 20) + 'px';
    }
};
document.onmouseup = () => { isDragging = false; };

// 4. Mesclar e Baixar
downloadBtn.addEventListener('click', async () => {
    const { PDFDocument } = PDFLib;
    const pdfDoc = await PDFDocument.load(pdfDocBytes);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];

    // Converter imagem
    const embedImg = await pdfDoc.embedPng(imageBytes); // Suporta PNG/JPG
    
    // Pegar posição do campo na tela e converter para escala do PDF
    // Nota: Em um projeto real, você calcularia a proporção Canvas vs PDF.
    firstPage.drawImage(embedImg, {
        x: 50, // Posição fixa para este exemplo
        y: 50,
        width: 150,
        height: 100,
    });

    const modifiedPdfBytes = await pdfDoc.save();
    
    // Download
    const blob = new Blob([modifiedPdfBytes], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'pdf-modificado.pdf';
    link.click();
});
