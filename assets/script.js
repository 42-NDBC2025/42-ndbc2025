// 配置
const config = {
    pdfUrl: 'assets/current.pdf',
    minScale: 0.8,
    maxScale: 3.0,
    pageSpacing: 15,
    mobile: {
        minFontSize: 10, // 最小字体大小(px)
        pagePadding: 10  // 页面边距
    }
};

// 智能缩放计算
function calculateOptimalScale(page, containerWidth) {
    const viewport = page.getViewport({ scale: 1.0 });
    const isMobile = containerWidth < 768;
    
    // 计算基于宽度的缩放
    let scale = (containerWidth - (isMobile ? config.mobile.pagePadding * 2 : 0)) / viewport.width;
    
    // 确保文字可读性
    if (isMobile) {
        const estimatedFontSize = viewport.height * scale * 0.05; // 估算字体大小
        if (estimatedFontSize < config.mobile.minFontSize) {
            scale *= (config.mobile.minFontSize / estimatedFontSize);
        }
    }
    
    return Math.min(Math.max(scale, config.minScale), config.maxScale);
}

// 增强的页面渲染
function renderPage(pageNum) {
    currentPdfDocument.getPage(pageNum).then(page => {
        const containerWidth = container.clientWidth;
        const scale = calculateOptimalScale(page, containerWidth);
        const viewport = page.getViewport({ scale });
        
        const pageDiv = document.createElement('div');
        pageDiv.className = 'page-container';
        pageDiv.style.width = `${viewport.width}px`;
        container.appendChild(pageDiv);
        
        const canvas = document.createElement('canvas');
        canvas.className = 'page';
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        pageDiv.appendChild(canvas);
        
        page.render({
            canvasContext: canvas.getContext('2d'),
            viewport: viewport
        });
    });
}