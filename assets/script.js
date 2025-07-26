// 设置PDF.js worker路径
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.worker.min.js';

// 你的PDF文件路径（保持原assets目录结构）
const pdfUrl = 'assets/current.pdf';

// 初始化PDF查看器
const container = document.getElementById('viewerContainer');

// 创建自定义的简单查看器
const pdfViewer = {
    container: container,
    scrollPageIntoView: function(options) {
        // 简单的页面滚动功能
        const pageView = this._pages[options.pageNumber - 1];
        pageView.div.scrollIntoView();
    },
    _pages: []
};

// 加载PDF文档
pdfjsLib.getDocument(pdfUrl).promise.then(function(pdfDocument) {
    // 文档加载完成
    const numPages = pdfDocument.numPages;
    
    // 逐页渲染
    for (let i = 1; i <= numPages; i++) {
        pdfDocument.getPage(i).then(function(page) {
            const viewport = page.getViewport({ scale: 1.5 });
            
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
            
            // 保存页面引用
            pdfViewer._pages.push({
                div: pageDiv,
                pageNumber: i
            });
            
            // 添加页间间距（可选）
            if (i < numPages) {
                const spacer = document.createElement('div');
                spacer.style.height = '20px';
                container.appendChild(spacer);
            }
        });
    }
}).catch(function(error) {
    console.error('加载PDF出错:', error);
    container.innerHTML = '<p>无法加载文档内容</p>';
});

// 禁用右键菜单（可选）
document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
});