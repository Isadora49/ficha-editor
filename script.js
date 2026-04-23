const { PDFDocument, PDFName, PDFString, TextAlignment, rgb } = window.PDFLib || {};

let pdfOriginalBytes = null;
const labels = [
    "C1 (Lista Base)", "C2 (Nível 1)", "C3 (Dado 1)", "C4 (Total 1)", 
    "C5 (Nível 2)", "C6 (Dado 2)", "C7 (Total 2)", "C8 (Total 3)",
    "C9 (Nível 3)", "C10 (Dado 3)", "C11 (Nível 4)", "C12 (Dado 4)",
    "C13 (Nível 5)", "C14 (Dado 5)", "C15 (Nível 6)", "C16 (Dado 6)",
    "C17 (Nível 7)", "C18 (Dado 7)", "C19 (Nível 8)", "C20 (Dado 8)",
    "C21 (Nível 9)", "C22 (Dado 9)", "C23 (Nível 10)", "C24 (Dado 10)",
    "C25 (Nível 11)", "C26 (Dado 11)", "C27 (Nível 12)", "C28 (Dado 12)",
    "C29 (Nível 13)", "C30 (Dado 13)", "C31 (Nível 14)", "C32 (Dado 14)",
    "C33 (Nível 15)", "C34 (Dado 15)", "C35 (Nível 16)", "C36 (Dado 16)",
    "C37 (Texto 1)", "C38 (Texto 2)", "C39 (Texto 3)", "C40 (Texto 4)",
    "C41 (Multi-linha 1)", "C42 (Multi-linha 2)", "C43 (Multi-linha 3)",
    "C44 (Texto 5)", "C45 (Texto 6 Central)", "C46 (Texto 7 Central)", "C47 (Texto 8 Central)",
    "C48 (Imagem 1)", "C49 (Imagem 2)"
];

const TOTAL_FIELDS = labels.length;
let currentStep = 0;
const canvas = document.getElementById('pdf-canvas');
const wrapper = document.getElementById('canvas-wrapper');
const statusEl = document.getElementById('status');
const btnDownload = document.getElementById('btnDownload');

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

// UPLOAD E RENDER
document.getElementById('uploadPdf').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
        const arrayBuffer = await file.arrayBuffer();
        pdfOriginalBytes = arrayBuffer.slice(0); 
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 1.5 });
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        await page.render({ canvasContext: context, viewport: viewport }).promise;
        document.querySelectorAll('.marker').forEach(m => m.remove());
        currentStep = 0;
        statusEl.innerText = "Posicione: " + labels[0];
        btnDownload.disabled = true;
    } catch (err) { alert("Erro: " + err.message); }
});

// CLIQUE PARA POSICIONAR
canvas.addEventListener('click', (e) => {
    if (currentStep >= TOTAL_FIELDS || !pdfOriginalBytes) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const marker = document.createElement('div');
    marker.className = 'marker';
    marker.id = `field-${currentStep}`;
    
    // Deixando o marcador visual maior para as imagens
    const isImg = currentStep >= 47;
    const w = isImg ? 100 : 60; 
    const h = isImg ? 100 : 20;

    marker.style.width = w + 'px';
    marker.style.height = h + 'px';
    marker.style.left = (x - w / 2) + 'px';
    marker.style.top = (y - h / 2) + 'px';
    marker.innerHTML = `<span class="label-text">${labels[currentStep]}</span>`;
    wrapper.appendChild(marker);
    makeDraggable(marker);
    currentStep++;
    statusEl.innerText = currentStep === TOTAL_FIELDS ? "Pronto para baixar!" : "Posicione: " + labels[currentStep];
    if (currentStep === TOTAL_FIELDS) btnDownload.disabled = false;
});

function makeDraggable(el) {
    let isDragging = false;
    let offset = { x: 0, y: 0 };
    el.addEventListener('mousedown', (e) => {
        isDragging = true;
        offset = { x: e.clientX - el.offsetLeft, y: e.clientY - el.offsetTop };
    });
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        el.style.left = (e.clientX - offset.x) + 'px';
        el.style.top = (e.clientY - offset.y) + 'px';
    });
    document.addEventListener('mouseup', () => isDragging = false);
}

// DOWNLOAD E GERAÇÃO
btnDownload.addEventListener('click', async () => {
    try {
        const pdfDoc = await PDFDocument.load(pdfOriginalBytes.slice(0));
        const form = pdfDoc.getForm();
        const page = pdfDoc.getPage(0);
        const { width, height } = page.getSize();
        
        const cvW = canvas.width;
        const cvH = canvas.height;

        for (let i = 0; i < TOTAL_FIELDS; i++) {
            const el = document.getElementById(`field-${i}`);
            if (!el) continue;

            const name = (i === 3) ? 'res' : (i === 6) ? 'res2' : `c${i+1}`;
            
            // Coordenadas
            const l = parseFloat(el.style.left);
            const t = parseFloat(el.style.top);
            const w = parseFloat(el.style.width);
            const h = parseFloat(el.style.height);
            const fX = (l * width) / cvW;
            const fY = height - ((t * height) / cvH) - ((h * height) / cvH);
            const fW = (w * width) / cvW;
            const fH = (h * height) / cvH;

            if (i >= 47) {
                // CAMPO DE IMAGEM (BOTÃO)
                const btn = form.createButton(name);
                btn.addToPage(page, { x: fX, y: fY, width: fW, height: fH });
                btn.setLabel('CLIQUE PARA FOTO');
                
                // Forçando cores para o botão NÃO ser invisível
                btn.setBackgroundColor(rgb(0.9, 0.9, 0.9));
                btn.setBorderColor(rgb(0, 0, 0));
                
                // Ação de Importar Imagem
                const actionJS = 'event.target.buttonImportIcon();';
                const action = pdfDoc.context.obj({
                    Type: 'Action', S: 'JavaScript', JS: PDFString.of(actionJS)
                });
                btn.acroField.getWidgets().forEach(w => {
                    w.dict.set(PDFName.of('AA'), pdfDoc.context.obj({ U: action }));
                });
            } else if (i === 0) {
                const drop = form.createDropdown(name);
                drop.addOptions([' ', 'Tank', 'Hibrido', 'Assassino', 'Destruidor', 'Arcano', 'Mentalista', 'Vitalista', 'Invocador', 'Elementalista']);
                drop.addToPage(page, { x: fX, y: fY, width: fW, height: fH });
            } else {
                const txt = form.createTextField(name);
                if (i >= 40 && i <= 42) txt.enableMultiline();
                txt.addToPage(page, { x: fX, y: fY, width: fW, height: fH });
                txt.setText(i < 36 ? "0" : "");
                txt.setFontSize(11);
                const isLeft = [36,37,40,41,42,43].includes(i);
                txt.setAlignment(isLeft ? Text
