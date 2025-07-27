/* // 配置
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
} */


// 高清PDF渲染配置
const config = {
    pdfUrl: 'assets/current.pdf',
    desktopScale: 1.0,
    mobileInitialScale: 1.8, // 移动端初始放大比例
    mobileNormalScale: 1.0, // 移动端正常比例
    minScale: 0.8,
    maxScale: 3.0,
    pageSpacing: 15,
    quality: {
        mobile: 2, // 移动端分辨率倍增(提高清晰度)
        desktop: 1
    }
};

// 高清渲染器
let pdfRenderer = {
    container: document.getElementById('viewerContainer'),
    currentScale: 1.0,
    isMobile: false,
    pdfDocument: null,
    
    // 初始化
    init: function() {
        this.isMobile = window.innerWidth < 768;
        this.loadDocument();
        this.setupEvents();
    },
    
    // 加载PDF文档
    loadDocument: function() {
        pdfjsLib.getDocument(config.pdfUrl).promise
            .then(pdfDoc => {
                this.pdfDocument = pdfDoc;
                this.renderAllPages();
            })
            .catch(error => {
                console.error('加载错误:', error);
                this.container.innerHTML = '<div class="error">加载失败，请刷新重试</div>';
            });
    },
    
    // 渲染单页(高清版)
    renderPage: function(pageNum) {
        const pageDiv = document.createElement('div');
        pageDiv.className = 'page-container';
        pageDiv.dataset.pageNumber = pageNum;
        this.container.appendChild(pageDiv);
        
        this.pdfDocument.getPage(pageNum).then(page => {
            // 计算缩放和分辨率
            const targetScale = this.isMobile ? 
                config.mobileInitialScale : 
                config.desktopScale;
            
            const qualityFactor = this.isMobile ? 
                config.quality.mobile : 
                config.quality.desktop;
            
            const viewport = page.getViewport({ 
                scale: targetScale * qualityFactor 
            });
            
            // 创建高清Canvas
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            
            // 设置Canvas显示尺寸和渲染尺寸
            const displayWidth = viewport.width / qualityFactor;
            const displayHeight = viewport.height / qualityFactor;
            
            canvas.style.width = `${displayWidth}px`;
            canvas.style.height = `${displayHeight}px`;
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            
            canvas.className = 'pdf-page';
            pageDiv.appendChild(canvas);
            
            // 高清渲染
            page.render({
                canvasContext: context,
                viewport: viewport,
                intent: 'display' // 提高渲染质量
            });
            
            // 添加页间距
            if (pageNum < this.pdfDocument.numPages) {
                const spacer = document.createElement('div');
                spacer.className = 'page-spacer';
                this.container.appendChild(spacer);
            }
        });
    },
    
    // 渲染所有页面
    renderAllPages: function() {
        this.container.innerHTML = '';
        
        for (let i = 1; i <= this.pdfDocument.numPages; i++) {
            this.renderPage(i);
        }
    },
    
    // 设置事件监听
    setupEvents: function() {
        // 窗口大小变化时重新渲染
        window.addEventListener('resize', () => {
            clearTimeout(this.resizeTimer);
            this.resizeTimer = setTimeout(() => {
                const newIsMobile = window.innerWidth < 768;
                if (newIsMobile !== this.isMobile) {
                    this.isMobile = newIsMobile;
                    this.renderAllPages();
                }
            }, 200);
        });
        
        // 双指缩放支持
        this.container.addEventListener('wheel', (e) => {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                this.handleZoom(e.deltaY < 0 ? 0.1 : -0.1);
            }
        }, { passive: false });
    },
    
    // 处理缩放
    handleZoom: function(delta) {
        if (!this.isMobile) return;
        
        const newScale = Math.min(
            Math.max(
                this.currentScale + delta, 
                config.minScale
            ), 
            config.maxScale
        );
        
        if (newScale !== this.currentScale) {
            this.currentScale = newScale;
            this.applyZoom();
        }
    },
    
    // 应用缩放
    applyZoom: function() {
        const pageContainers = document.querySelectorAll('.page-container');
        pageContainers.forEach(container => {
            container.style.transform = `scale(${this.currentScale})`;
            container.style.transformOrigin = 'top center';
        });
    }
};

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    pdfRenderer.init();
});

// 禁用右键菜单
document.addEventListener('contextmenu', e => e.preventDefault());