// 高清PDF渲染配置
const config = {
    pdfUrl: 'assets/current.pdf',
    desktopScale: 1.0,
    mobileInitialScale: 1.8, // 移动端初始放大比例
    minScale: null, // 动态计算最小缩放
    maxScale: 3.0,
    pageSpacing: 15,
    quality: {
        mobile: 2,
        desktop: 1
    }
};

let pdfRenderer = {
    container: document.getElementById('viewerContainer'),
    currentScale: 1.0,
    isMobile: false,
    pdfDocument: null,
    naturalPageWidth: 0, // 存储PDF自然宽度
    
    init: function() {
        this.isMobile = window.innerWidth < 768;
        this.loadDocument();
        this.setupEvents();
    },
    
    loadDocument: function() {
        pdfjsLib.getDocument(config.pdfUrl).promise
            .then(pdfDoc => {
                this.pdfDocument = pdfDoc;
                // 获取第一页的自然宽度用于计算最小缩放
                return pdfDoc.getPage(1);
            })
            .then(firstPage => {
                const viewport = firstPage.getViewport({ scale: 1.0 });
                this.naturalPageWidth = viewport.width;
                this.calculateMinScale();
                this.renderAllPages();
            })
            .catch(error => {
                console.error('加载错误:', error);
                this.container.innerHTML = '<div class="error">加载失败，请刷新重试</div>';
            });
    },
    
    // 计算最小缩放比例(使页面宽度适应屏幕)
    calculateMinScale: function() {
        if (!this.isMobile) {
            config.minScale = 0.8;
            return;
        }
        
        const screenWidth = this.container.clientWidth - 20; // 留出边距
        config.minScale = screenWidth / this.naturalPageWidth;
        console.log('Calculated min scale:', config.minScale);
    },
    
    renderPage: function(pageNum) {
        const pageDiv = document.createElement('div');
        pageDiv.className = 'page-container';
        pageDiv.dataset.pageNumber = pageNum;
        this.container.appendChild(pageDiv);
        
        this.pdfDocument.getPage(pageNum).then(page => {
            const targetScale = this.isMobile ? 
                config.mobileInitialScale : 
                config.desktopScale;
            
            const qualityFactor = this.isMobile ? 
                config.quality.mobile : 
                config.quality.desktop;
            
            const viewport = page.getViewport({ 
                scale: targetScale * qualityFactor 
            });
            
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            
            const displayWidth = viewport.width / qualityFactor;
            const displayHeight = viewport.height / qualityFactor;
            
            canvas.style.width = `${displayWidth}px`;
            canvas.style.height = `${displayHeight}px`;
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            
            canvas.className = 'pdf-page';
            pageDiv.appendChild(canvas);
            
            page.render({
                canvasContext: context,
                viewport: viewport,
                intent: 'display'
            });
            
            if (pageNum < this.pdfDocument.numPages) {
                const spacer = document.createElement('div');
                spacer.className = 'page-spacer';
                this.container.appendChild(spacer);
            }
        });
    },
    
    renderAllPages: function() {
        this.container.innerHTML = '';
        this.currentScale = this.isMobile ? config.mobileInitialScale : config.desktopScale;
        
        for (let i = 1; i <= this.pdfDocument.numPages; i++) {
            this.renderPage(i);
        }
        
        this.applyZoom();
    },
    
    setupEvents: function() {
        // 窗口大小变化
        window.addEventListener('resize', () => {
            clearTimeout(this.resizeTimer);
            this.resizeTimer = setTimeout(() => {
                const newIsMobile = window.innerWidth < 768;
                if (newIsMobile !== this.isMobile) {
                    this.isMobile = newIsMobile;
                    this.calculateMinScale();
                    this.renderAllPages();
                }
            }, 200);
        });
        
        // 双指缩放
        let initialDistance = null;
        
        this.container.addEventListener('touchstart', (e) => {
            if (e.touches.length === 2) {
                initialDistance = Math.hypot(
                    e.touches[0].clientX - e.touches[1].clientX,
                    e.touches[0].clientY - e.touches[1].clientY
                );
            }
        }, { passive: true });
        
        this.container.addEventListener('touchmove', (e) => {
            if (e.touches.length === 2 && initialDistance) {
                e.preventDefault();
                
                const currentDistance = Math.hypot(
                    e.touches[0].clientX - e.touches[1].clientX,
                    e.touches[0].clientY - e.touches[1].clientY
                );
                
                const scaleDelta = (currentDistance - initialDistance) / 100;
                this.handleZoom(scaleDelta);
                initialDistance = currentDistance;
            }
        }, { passive: false });
        
        // 双击重置缩放
        this.container.addEventListener('dblclick', () => {
            if (this.isMobile) {
                this.currentScale = config.mobileInitialScale;
                this.applyZoom();
            }
        });
    },
    
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
    
    applyZoom: function() {
        const pageContainers = document.querySelectorAll('.page-container');
        pageContainers.forEach(container => {
            container.style.transform = `scale(${this.currentScale})`;
            container.style.transformOrigin = 'top center';
            container.style.marginBottom = `${15 * this.currentScale}px`;
        });
    }
};

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    pdfRenderer.init();
});

// 禁用右键菜单
document.addEventListener('contextmenu', e => e.preventDefault());