// PDF.js配置
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.worker.min.js';

// 渲染PDF
function renderPDF(url) {
    const container = document.getElementById('pdfContainer');
    
    pdfjsLib.getDocument(url).promise.then(function(pdf) {
        // 清空容器
        container.innerHTML = '';
        
        // 逐页渲染
        for (let i = 1; i <= pdf.numPages; i++) {
            pdf.getPage(i).then(function(page) {
                // 计算适合屏幕的缩放比例
                const viewport = page.getViewport({ scale: 1.5 }); // 初始放大1.5倍
                
                // 创建Canvas
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                canvas.className = 'pdf-page';
                container.appendChild(canvas);
                
                // 渲染页面
                page.render({
                    canvasContext: context,
                    viewport: viewport
                });
                
                // 添加页间距
                if (i < pdf.numPages) {
                    const spacer = document.createElement('div');
                    spacer.style.height = '20px';
                    container.appendChild(spacer);
                }
            });
        }
    }).catch(function(error) {
        console.error('加载错误:', error);
        container.innerHTML = '<div style="padding:20px;color:red;">加载失败，请刷新重试</div>';
    });
}

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    // 加载PDF文件
    renderPDF('assets/current.pdf');
    
    // 移动端提示
    if (window.innerWidth < 768) {
        alert('请使用双指缩放来调整文档大小');
    }
});