// 高清PDF渲染配置
const config = {
    pdfUrl: 'assets/current.pdf',
    desktopScale: 1.0,
    mobileInitialScale: 1.5, // 稍微降低初始缩放比例
    minScale: null, // 动态计算
    maxScale: 3.0,
    pageSpacing: 15,
    quality: {
        mobile: 2,
        desktop: 1
    },
    pagePadding: 16 // 添加页面内边距
};

let pdfRenderer = {
    container: document.getElementById('viewerContainer'),
    currentScale: 1.0,
    isMobile: false,
    pdfDocument: null,
    naturalPageWidth: 0,
    
    init: function() {
        this.isMobile = window.innerWidth < 768;
        this.loadDocument();
        this.setupEvents();
    },
    
    loadDocument: function() {
        pdfjsLib.getDocument(config.pdfUrl).promise
            .then(pdfDoc => {
                this.pdfDocument = pdfDoc;
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
    
    calculateMinScale: function() {
        if (!this.isMobile) {
            config.minScale = 0.8;
            return;
        }
        
        const screenWidth = this.container.clientWidth - (config.pagePadding * 2);
        config.minScale = Math.min(screenWidth / this.naturalPageWidth, 1.0);
        console.log('Calculated min scale:', config.minScale);
    },
    
    renderPage: function(pageNum) {
        const pageDiv = document.createElement('div');
        pageDiv.className = 'page-container';
        pageDiv.dataset.pageNumber = pageNum;
        
        // 设置容器初始尺寸
        const initialScale = this.isMobile ? config.mobileInitialScale : config.desktopScale;
        const qualityFactor = this.isMobile ? config.quality.mobile : config.quality.desktop;
        const baseWidth = this.naturalPageWidth * initialScale;
        
        pageDiv.style.width = `${baseWidth}px`;
        pageDiv.style.padding = `${config.pagePadding}px`;
        this.container.appendChild(pageDiv);
        
        this.pdfDocument.getPage(pageNum).then(page => {
            const viewport = page.getViewport({ 
                scale: initialScale * qualityFactor 
            });
            
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            
            // 设置Canvas尺寸
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            canvas.style.width = '100%';
            canvas.style.height = 'auto';
            
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
        
        // 触摸缩放
        let initialDistance = null;
        let initialScale = 1.0;
        
        this.container.addEventListener('touchstart', (e) => {
            if (e.touches.length === 2) {
                initialDistance = Math.hypot(
                    e.touches[0].clientX - e.touches[1].clientX,
                    e.touches[0].clientY - e.touches[1].clientY
                );
                initialScale = this.currentScale;
            }
        }, { passive: true });
        
        this.container.addEventListener('touchmove', (e) => {
            if (e.touches.length === 2 && initialDistance) {
                e.preventDefault();
                
                const currentDistance = Math.hypot(
                    e.touches[0].clientX - e.touches[1].clientX,
                    e.touches[0].clientY - e.touches[1].clientY
                );
                
                const newScale = (currentDistance / initialDistance) * initialScale;
                this.setScale(newScale);
            }
        }, { passive: false });
        
        // 鼠标滚轮缩放
        this.container.addEventListener('wheel', (e) => {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                const delta = e.deltaY < 0 ? 0.1 : -0.1;
                this.setScale(this.currentScale + delta);
            }
        }, { passive: false });
    },
    
    setScale: function(newScale) {
        if (!this.isMobile) return;
        
        newScale = Math.min(Math.max(newScale, config.minScale), config.maxScale);
        
        if (newScale !== this.currentScale) {
            this.currentScale = newScale;
            this.applyZoom();
        }
    },
    
    applyZoom: function() {
        const pageContainers = document.querySelectorAll('.page-container');
        pageContainers.forEach(container => {
            // 同步缩放容器和内容
            container.style.transform = `scale(${this.currentScale})`;
            container.style.transformOrigin = 'top center';
            
            // 调整容器实际占用空间
            const baseWidth = this.naturalPageWidth * config.mobileInitialScale;
            container.style.width = `${baseWidth}px`;
            container.style.marginBottom = `${config.pageSpacing * this.currentScale}px`;
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    pdfRenderer.init();
});

document.addEventListener('contextmenu', e => e.preventDefault());