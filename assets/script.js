// 设置PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.worker.min.js';

// 配置变量
const config = {
    pdfUrl: 'assets/current.pdf',
    scale: 1.0, // 基础缩放比例
    mobileScale: 0.8, // 移动端基础缩放
    minScale: 0.5, // 最小缩放比例
    maxScale: 2.0, // 最大缩放比例
    pageSpacing: 20 // 页间距
};

// 获取DOM元素
const container = document.getElementById('viewerContainer');
let currentPdfDocument = null;
let currentPageRendering = false;
let pageNumPending = null;

// 计算适合屏幕的缩放比例
function getViewportScale() {
    const isMobile = window.innerWidth < 768;
    let baseScale = isMobile ? config.mobileScale : config.scale;
    
    // 根据屏幕宽度动态调整
    const screenWidth = window.innerWidth;
    if (screenWidth < 400) {
        baseScale = Math.max(config.minScale, screenWidth / 500);
    }
    
    return baseScale;
}

// 渲染单页PDF
function renderPage(pageNum) {
    currentPageRendering = true;
    
    currentPdfDocument.getPage(pageNum).then(function(page) {
        const viewport = page.getViewport({ scale: getViewportScale() });
        
        // 创建页面容器
        const pageDiv = document.createElement('div');
        pageDiv.className = 'page-container';
        pageDiv.dataset.pageNumber = pageNum;
        container.appendChild(pageDiv);
        
        // 创建Canvas
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        canvas.className = 'page';
        pageDiv.appendChild(canvas);
        
        // 渲染页面
        const renderContext = {
            canvasContext: context,
            viewport: viewport
        };
        
        page.render(renderContext).promise.then(function() {
            currentPageRendering = false;
            if (pageNumPending !== null) {
                renderPage(pageNumPending);
                pageNumPending = null;
            }
            
            // 添加页间距（最后一页不加）
            if (pageNum < currentPdfDocument.numPages) {
                const spacer = document.createElement('div');
                spacer.style.height = `${config.pageSpacing}px`;
                container.appendChild(spacer);
            }
        });
    });
}

// 渲染所有PDF页面
function renderAllPages() {
    container.innerHTML = '';
    
    for (let i = 1; i <= currentPdfDocument.numPages; i++) {
        renderPage(i);
    }
}

// 初始化PDF查看器
function initPdfViewer() {
    pdfjsLib.getDocument(config.pdfUrl).promise.then(function(pdfDoc) {
        currentPdfDocument = pdfDoc;
        renderAllPages();
    }).catch(function(error) {
        console.error('加载错误:', error);
        container.innerHTML = '<div style="padding:20px;text-align:center;">加载失败，请刷新重试</div>';
    });
}

// 窗口大小改变时重新渲染
function handleResize() {
    if (!currentPdfDocument || currentPageRendering) return;
    
    // 使用防抖避免频繁重绘
    clearTimeout(window.resizeTimer);
    window.resizeTimer = setTimeout(function() {
        renderAllPages();
    }, 200);
}

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    initPdfViewer();
    window.addEventListener('resize', handleResize);
});

// 禁用右键菜单（可选）
document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
});