// 加载PDF文档
function loadPDF() {
    const container = document.getElementById('pdfContainer');
    
    pdfjsLib.getDocument('assets/current.pdf').promise
        .then(function(pdf) {
            container.innerHTML = '';
            
            // 逐页渲染
            for (let i = 1; i <= pdf.numPages; i++) {
                pdf.getPage(i).then(function(page) {
                    const viewport = page.getViewport({ scale: 1.5 });
                    
                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;
                    canvas.className = 'pdf-page';
                    container.appendChild(canvas);
                    
                    page.render({
                        canvasContext: context,
                        viewport: viewport
                    });
                });
            }
        })
        .catch(function(error) {
            console.error('加载出错:', error);
            container.innerHTML = '<div class="loading" style="color:#d32f2f">加载失败，请刷新重试</div>';
        });
}

// 初始化PDF.js
document.addEventListener('DOMContentLoaded', function() {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.worker.min.js';
    loadPDF();
});