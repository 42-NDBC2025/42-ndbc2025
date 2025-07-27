// 配置项
const config = {
    pdfUrl: 'assets/current.pdf',
    initialLoadPages: 3,    // 初始加载页数
    renderQuality: 1.5,     // 渲染质量
    loadBatchSize: 2,       // 分批加载大小
    zoom: {
        min: 0.5,          // 最小缩放
        max: 3.0,          // 最大缩放
        step: 0.2,         // 缩放步长
        initialMobile: 1.3 // 移动端初始缩放
    }
};

// 全局状态
let currentZoom = 1.0;
let isMobile = window.innerWidth < 768;
let pdfDocument = null;

// 初始化PDF加载
async function loadPDF() {
    const container = document.getElementById('pdfContainer');
    container.innerHTML = '<div class="loading">加载中...</div>';
    
    try {
        pdfDocument = await pdfjsLib.getDocument(config.pdfUrl).promise;
        
        // 初始加载
        await renderPages(1, Math.min(config.initialLoadPages, pdfDocument.numPages));
        
        // 后台加载剩余页
        if (pdfDocument.numPages > config.initialLoadPages) {
            loadRemainingPages(config.initialLoadPages + 1);
        }
        
        // 设置初始缩放
        if (isMobile) {
            setZoom(config.zoom.initialMobile);
        }
    } catch (error) {
        console.error('加载错误:', error);
        container.innerHTML = '<div class="error">加载失败，请刷新重试</div>';
    }
}

// 渲染指定页范围
async function renderPages(startPage, endPage) {
    const container = document.getElementById('pdfContainer');
    if (startPage === 1) container.innerHTML = '';
    
    for (let i = startPage; i <= endPage; i++) {
        const page = await pdfDocument.getPage(i);
        const viewport = page.getViewport({ scale: config.renderQuality * currentZoom });
        
        // 创建占位容器
        const pageDiv = document.createElement('div');
        pageDiv.className = 'page-container';
        pageDiv.style.width = `${viewport.width}px`;
        pageDiv.innerHTML = `
            <div class="page-placeholder" 
                 style="height:${viewport.height}px">
            </div>
        `;
        container.appendChild(pageDiv);
        
        // 异步渲染
        setTimeout(async () => {
            const canvas = document.createElement('canvas');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            canvas.className = 'pdf-page';
            
            await page.render({
                canvasContext: canvas.getContext('2d'),
                viewport: viewport
            }).promise;
            
            // 替换占位符
            pageDiv.querySelector('.page-placeholder').replaceWith(canvas);
        }, 0);
    }
}

// 后台加载剩余页
async function loadRemainingPages(startPage) {
    for (let i = startPage; i <= pdfDocument.numPages; i += config.loadBatchSize) {
        await renderPages(
            i, 
            Math.min(i + config.loadBatchSize - 1, pdfDocument.numPages)
        );
    }
}

// 缩放控制函数
function setZoom(zoomLevel) {
    currentZoom = Math.max(config.zoom.min, Math.min(zoomLevel, config.zoom.max));
    document.body.style.transform = `scale(${currentZoom})`;
    
    // 重新计算容器宽度
    document.body.style.width = `${100 / currentZoom}%`;
}

function zoomIn() {
    setZoom(currentZoom + config.zoom.step);
}

function zoomOut() {
    setZoom(currentZoom - config.zoom.step);
}

function resetZoom() {
    setZoom(isMobile ? config.zoom.initialMobile : 1.0);
}

// 触摸缩放支持
let touchStartDistance = null;
let touchStartZoom = null;

document.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) {
        e.preventDefault();
        touchStartDistance = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
        );
        touchStartZoom = currentZoom;
    }
}, { passive: false });

document.addEventListener('touchmove', (e) => {
    if (e.touches.length === 2 && touchStartDistance) {
        e.preventDefault();
        const currentDistance = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
        );
        const newZoom = (currentDistance / touchStartDistance) * touchStartZoom;
        setZoom(newZoom);
    }
}, { passive: false });

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.worker.min.js';
    
    isMobile = window.innerWidth < 768;
    loadPDF();
    
    // 响应式处理
    window.addEventListener('resize', () => {
        const newIsMobile = window.innerWidth < 768;
        if (newIsMobile !== isMobile) {
            isMobile = newIsMobile;
            resetZoom();
        }
    });
});