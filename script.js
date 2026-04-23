const { PDFDocument, PDFName, PDFString, TextAlignment } = window.PDFLib || {};

let pdfOriginalBytes = null;

// 1. LISTA ATUALIZADA: Agora com 49 campos no total (0 até 48)
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
    "C48 (Imagem 1)", "C49 (Imagem 2)" // Índices 47 e 48
];

const TOTAL_FIELDS = labels.length;
let currentStep = 0;
const canvas = document.getElementById('pdf-canvas');
const wrapper = document.getElementById('canvas-wrapper');
const statusEl = document.getElementById('status');
const btnDownload = document.getElementById('btnDownload');

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

// CARREGAMENTO DO PDF
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
    } catch (err) {
        alert("Erro no PDF: " + err.message);
    }
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
    
    // Ajuste de tamanho visual
    const isMultiLine = (currentStep >= 40 && currentStep <= 42);
    const isImage = (currentStep >= 47);
    const defaultW = isImage ? 80 : (isMultiLine ? 120 : 60);
    const defaultH = isImage ? 80 : (isMultiLine ? 60 : 20);

    marker.style.width = defaultW + 'px';
    marker.style.height = defaultH + 'px';
    marker.style.left = (x - defaultW / 2) + 'px';
    marker.style.top = (y - defaultH / 2) + 'px';
    
    marker.innerHTML = `<span class="label-text">${labels[currentStep]}</span>`;
    wrapper.appendChild(marker);

    makeDraggable(marker);

    currentStep++;
    if (currentStep === TOTAL_FIELDS) {
        statusEl.innerText = "Pronto para baixar!";
        btnDownload.disabled = false;
    } else {
        statusEl.innerText = "Posicione: " + labels[currentStep];
    }
});

function makeDraggable(el) {
    let isDragging = false;
    let offset = { x: 0, y: 0 };
    el.addEventListener('mousedown', (e) => {
        if (e.offsetX > el.clientWidth - 15 && e.offsetY > el.clientHeight - 15) return; 
        isDragging = true;
        offset = { x: e.clientX - el.offsetLeft, y: e.clientY - el.offsetTop };
    });
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        el.style.left = (e.clientX - offset.x) + 'px';
        el.style.top = (e.clientY - offset.y) + 'px';
    });
    document.addEventListener('mouseup', () => { isDragging = false; });
}

// GERAÇÃO DO PDF FINAL
btnDownload.addEventListener('click', async () => {
    try {
        const pdfDoc = await PDFDocument.load(pdfOriginalBytes.slice(0));
        const form = pdfDoc.getForm();
        const page = pdfDoc.getPage(0);
        const { width, height } = page.getSize();
        
        // Configurações de campo
        const indicesEsquerda = [36, 37, 40, 41, 42, 43];
        const dadosIndices = [2, 5, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31, 33, 35];
        const resultadosIndices = [3, 6, 7]; 
        const imagemIndices = [47, 48];

        // Travas de segurança para as dimensões do canvas
        const cWidth = canvas.width || 1;
        const cHeight = canvas.height || 1;

        for (let i = 0; i < TOTAL_FIELDS; i++) {
            const el = document.getElementById(`field-${i}`);
            if (!el) continue;

            let name = (i === 3) ? 'res' : (i === 6) ? 'res2' : `c${i+1}`;
            let f;

            if (i === 0) {
                f = form.createDropdown(name);
                f.addOptions([' ', 'Tank', 'Hibrido', 'Assassino', 'Destruidor', 'Arcano', 'Mentalista', 'Vitalista', 'Invocador', 'Elementalista']);
                f.select(' ');
            } else if (imagemIndices.includes(i)) {
                f = form.createButton(name);
                const action = pdfDoc.context.obj({ 
                    Type: 'Action', 
                    S: 'JavaScript', 
                    JS: PDFString.of('event.target.buttonImportIcon();') 
                });
                f.acroField.dict.set(PDFName.of('AA'), pdfDoc.context.obj({ U: action }));
            } else {
                f = form.createTextField(name);
                if (i < 36) {
                    f.setText(dadosIndices.includes(i) ? "1d4" : "0");
                } else if (i >= 40 && i <= 42) {
                    f.enableMultiline();
                }

                if (dadosIndices.includes(i) || resultadosIndices.includes(i)) {
                    f.enableReadOnly();
                }

                f.acroField.dict.set(PDFName.of('DA'), PDFString.of('/Helvetica 12 Tf 0 g'));
                f.setFontSize(12);
                f.setAlignment(indicesEsquerda.includes(i) ? TextAlignment.Left : TextAlignment.Center);
            }

            // SEGURANÇA CONTRA NaN: Garantimos que os valores sejam números válidos
            const elLeft = parseFloat(el.style.left) || 0;
            const elTop = parseFloat(el.style.top) || 0;
            const elW = parseFloat(el.style.width) || el.offsetWidth || 50;
            const elH = parseFloat(el.style.height) || el.offsetHeight || 20;

            const pdfX = (elLeft * width) / cWidth;
            const pdfY = height - ((elTop * height) / cHeight) - ((elH * height) / cHeight);
            const pdfW = (elW * width) / cWidth;
            const pdfH = (elH * height) / cHeight;

            // Se por algum motivo o cálculo der errado, usamos 0 para não travar o PDF
            f.addToPage(page, { 
                x: isNaN(pdfX) ? 0 : pdfX, 
                y: isNaN(pdfY) ? 0 : pdfY, 
                width: isNaN(pdfW) ? 50 : pdfW, 
                height: isNaN(pdfH) ? 20 : pdfH,
                borderWidth: 0 
            });
        }

        // MOTOR DE CÁLCULO INTERNO DO PDF
        const scriptMotor = `
            var escolha = this.getField("c1").value;
            var bases = {"Tank":[8,2,2],"Hibrido":[4,2,4],"Assassino":[2,2,8],"Destruidor":[2,4,2],"Arcano":[2,4,2],"Mentalista":[2,4,2],"Vitalista":[2,6,2],"Invocador":[2,6,2],"Elementalista":[2,5,2]};
            var b = bases[escolha] || [0,0,0];
            
            function getD(n){ n=Number(n)||0; return n>=51?"1d100":n>=36?"1d50":n>=26?"1d20":n>=21?"1d12":n>=16?"1d10":n>=11?"1d8":n>=6?"1d6":"1d4"; }
            function getV(n){ n=Number(n)||0; return n>=51?100:n>=36?50:n>=26?20:n>=21?12:n>=16?10:n>=11?8:n>=6?6:4; }

            var n1 = Number(this.getField("c2").value) || 0;
            this.getField("c3").value = getD(n1);
            this.getField("res").value = String((b[0]*n1) + getV(n1));
            this.getField("c8").value = String((b[2]*n1) + getV(n1));

            var n2 = Number(this.getField("c5").value) || 0;
            this.getField("c6").value = getD(n2);
            this.getField("res2").value = String((b[1]*n2) + getV(n2));

            for (var i=9; i<=35; i+=2) {
                var nf = this.getField("c"+i);
                var df = this.getField("c"+(i+1));
                if(nf && df) df.value = getD(nf.value);
            }
        `;

        const action = pdfDoc.context.obj({ Type: 'Action', S: 'JavaScript', JS: PDFString.of(scriptMotor) });
        form.acroForm.dict.set(PDFName.of('NeedAppearances'), pdfDoc.context.obj(true));

        const triggers = ['c1','c2','c5','c9','c11','c13','c15','c17','c19','c21','c23','c25','c27','c29','c31','c33','c35'];
        triggers.forEach(name => {
            try {
                const field = form.getField(name);
                field.acroField.dict.set(PDFName.of('AA'), pdfDoc.context.obj({ V: action, K: action, Bl: action }));
            } catch(e){}
        });

        const finalPdfBytes = await pdfDoc.save();
        const blob = new Blob([finalPdfBytes], { type: 'application/pdf' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = "ficha_RPG_v2.pdf";
        a.click();

    } catch (err) {
        console.error(err);
        alert("Erro técnico ao gerar: " + err.message);
    }
});
