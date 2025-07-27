// 设置PDF.js worker路径
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.worker.min.js';

// 你的PDF文件路径
const pdfUrl = 'assets/current.pdf';

// 初始化PDF查看器
const container = document.getElementById('viewerContainer');

// 计算适合屏幕的缩放比例
function calculateScale(viewportWidth = window.innerWidth) {
    // 基础缩放比例
    let baseScale = 1.0;
    
    // 如果是移动设备
    if (viewportWidth < 768) {
        // 根据屏幕宽度动态计算比例
        baseScale = Math.min(1.5, Math.max(0.8, viewportWidth / 600));
    }
    
    return baseScale;
}

// 渲染PDF页面
function renderPDF(pdfDocument) {
    // 清空容器
    container.innerHTML = '';
    
    const numPages = pdfDocument.numPages;
    const viewportWidth = container.clientWidth;
    const scale = calculateScale(viewportWidth);
    
    // 逐页渲染
    for (let i = 1; i <= numPages; i++) {
        pdfDocument.getPage(i).then(function(page) {
            const viewport = page.getViewport({ scale: scale });
            
            // 创建页面容器
            const pageDiv = document.createElement('div');
            pageDiv.className = 'page';
            pageDiv.setAttribute('data-page-number', i);
            container.appendChild(pageDiv);
            
            // 创建Canvas用于渲染
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            pageDiv.appendChild(canvas);
            
            // 渲染PDF页面
            page.render({
                canvasContext: context,
                viewport: viewport
            });
            
            // 添加页间间距
            if (i < numPages) {
                const spacer = document.createElement('div');
                spacer.style.height = '20px';
                container.appendChild(spacer);
            }
        });
    }
}

// 加载PDF文档
pdfjsLib.getDocument(pdfUrl).promise.then(function(pdfDocument) {
    // 初始渲染
    renderPDF(pdfDocument);
    
    // 窗口大小改变时重新渲染
    let resizeTimeout;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(function() {
            renderPDF(pdfDocument);
        }, 200); // 200ms防抖
    });
}).catch(function(error) {
    console.error('加载失败:', error);
    container.innerHTML = '<p>加载失败，请检查网络</p>';
});

// 禁用右键菜单（可选）
document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
});