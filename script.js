body { 
    font-family: 'Segoe UI', sans-serif; 
    background: #f4f7f6; 
    padding: 20px; 
    margin: 0; 
}

.container { 
    max-width: 900px; 
    margin: auto; 
    background: white; 
    padding: 30px; 
    border-radius: 12px; 
    box-shadow: 0 5px 15px rgba(0,0,0,0.1); 
}

#canvas-wrapper {
    position: relative;
    width: 100%;
    height: 600px;
    background: #555;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid #ccc;
    box-sizing: border-box; /* Garante que a borda não altere o tamanho interno */
}

#pdfPreview { 
    width: 100%; 
    height: 100%; 
    border: none; 
    display: block;
    pointer-events: none; /* Permite arrastar o quadro verde sem interferência do PDF */
}

#image-field {
    position: absolute;
    top: 0; 
    left: 0;
    width: 150px;
    height: 150px;
    background: rgba(40, 167, 69, 0.5);
    border: 2px dashed #1e7e34;
    cursor: move;
    display: none;
    z-index: 999;
    touch-action: none;
}

.image-content {
    width: 100%; height: 100%;
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: bold; color: white;
    text-shadow: 1px 1px 2px #000;
    text-align: center;
    pointer-events: none;
}

button { 
    padding: 12px 24px; background: #28a745; color: white; border: none; 
    border-radius: 6px; cursor: pointer; font-size: 16px; font-weight: bold;
    margin-bottom: 20px;
}
