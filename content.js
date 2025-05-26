// 监听键盘快捷键 - 改为 Ctrl+Shift+E 避免冲突
document.addEventListener('keydown', function(e) {
    // Ctrl+Shift+E (Windows/Linux) 或 Cmd+Shift+E (Mac)
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'E') {
        e.preventDefault();
        const selectedText = window.getSelection().toString().trim();
        if (selectedText) {
            chrome.runtime.sendMessage({
                action: 'explainText',
                text: selectedText
            });
        }
    }
});

// 监听来自background script的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'showPopup') {
        showAIAssistantPopup(request.selectedText, request.prompt);
        sendResponse({ success: true });
    } else if (request.action === 'getSelection') {
        const selectedText = window.getSelection().toString().trim();
        if (selectedText) {
            chrome.runtime.sendMessage({
                action: 'explainText',
                text: selectedText
            });
        }
        sendResponse({ success: true });
    } else if (request.action === 'ping') {
        // 用于检查content script是否已加载
        sendResponse({ success: true });
    }
    return true; // 保持消息通道开放
});

// 当前弹窗实例
let currentPopup = null;

// 新增函数：注入弹窗样式
function injectPopupStyles() {
    if (document.getElementById('ai-assistant-popup-styles')) {
        return; // 样式已存在
    }
    
    const style = document.createElement('style');
    style.id = 'ai-assistant-popup-styles';
    style.textContent = `
        /* 响应式弹窗样式 - 使用高优先级选择器避免冲突 */
        .ai-assistant-popup {
            position: fixed !important;
            top: 20px !important;
            right: 20px !important;
            width: 400px !important;
            max-height: 600px !important;
            background: white !important;
            border: 1px solid #ddd !important;
            border-radius: 12px !important;
            box-shadow: 0 10px 40px rgba(0,0,0,0.15) !important;
            z-index: 2147483647 !important;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif !important;
            font-size: 14px !important;
            overflow: hidden !important;
            margin: 0 !important;
            padding: 0 !important;
        }

        .ai-assistant-header {
            background: #1a73e8 !important;
            color: white !important;
            padding: 15px 20px !important;
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            margin: 0 !important;
        }

        .ai-assistant-title {
            font-weight: 600 !important;
            font-size: 16px !important;
            margin: 0 !important;
            padding: 0 !important;
        }

        .ai-assistant-close {
            background: none !important;
            border: none !important;
            color: white !important;
            font-size: 20px !important;
            cursor: pointer !important;
            padding: 0 !important;
            width: 24px !important;
            height: 24px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            border-radius: 4px !important;
            margin: 0 !important;
        }

        .ai-assistant-close:hover {
            background: rgba(255,255,255,0.2) !important;
        }

        .ai-assistant-content {
            padding: 20px !important;
            max-height: 500px !important;
            overflow-y: auto !important;
            margin: 0 !important;
        }

        .ai-assistant-selected-text {
            background: #f8f9fa !important;
            border-left: 4px solid #1a73e8 !important;
            padding: 12px 16px !important;
            margin-bottom: 16px !important;
            border-radius: 0 6px 6px 0 !important;
            font-style: italic !important;
            color: #666 !important;
        }

        .ai-assistant-response {
            line-height: 1.6 !important;
            color: #333 !important;
            margin: 0 !important;
            padding: 0 !important;
        }

        .ai-assistant-loading {
            display: flex !important;
            align-items: center !important;
            gap: 10px !important;
            color: #666 !important;
            font-style: italic !important;
            margin: 0 !important;
            padding: 0 !important;
        }

        .ai-assistant-spinner {
            width: 16px !important;
            height: 16px !important;
            border: 2px solid #f3f3f3 !important;
            border-top: 2px solid #1a73e8 !important;
            border-radius: 50% !important;
            animation: ai-assistant-spin 1s linear infinite !important;
            margin: 0 !important;
            padding: 0 !important;
        }

        @keyframes ai-assistant-spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        /* 确保弹窗内所有元素都使用border-box */
        .ai-assistant-popup *,
        .ai-assistant-popup *::before,
        .ai-assistant-popup *::after {
            box-sizing: border-box !important;
        }
    `;
    document.head.appendChild(style);
}

function showAIAssistantPopup(selectedText, promptTemplate) {
    // 如果已有弹窗，先关闭
    if (currentPopup) {
        currentPopup.remove();
        currentPopup = null;
    }
    
    // 注入弹窗专用样式（仅在需要时）
    injectPopupStyles();
    
    // 创建弹窗容器
    const popup = document.createElement('div');
    popup.className = 'ai-assistant-popup';
    
    // 弹窗HTML结构
    popup.innerHTML = `
        <div class="ai-assistant-header">
            <h3 class="ai-assistant-title">AI学习助手</h3>
            <button class="ai-assistant-close">×</button>
        </div>
        <div class="ai-assistant-content">
            <div class="ai-assistant-selected-text">
                <strong>选中内容：</strong>${escapeHtml(selectedText)}
            </div>
            <div class="ai-assistant-response">
                <div class="ai-assistant-loading">
                    <div class="ai-assistant-spinner"></div>
                    正在分析中，请稍候...
                </div>
            </div>
        </div>
    `;
    
    // 添加到页面
    document.body.appendChild(popup);
    currentPopup = popup;
    
    // 绑定关闭按钮事件
    const closeBtn = popup.querySelector('.ai-assistant-close');
    closeBtn.addEventListener('click', () => {
        closePopup();
    });
    
    // 点击弹窗外部关闭
    const closeOnOutside = (e) => {
        if (!popup.contains(e.target)) {
            closePopup();
            document.removeEventListener('click', closeOnOutside);
        }
    };
    
    // 延迟添加外部点击监听，避免立即触发
    setTimeout(() => {
        document.addEventListener('click', closeOnOutside);
    }, 100);
    
    // 按ESC键关闭
    const closeOnEsc = (e) => {
        if (e.key === 'Escape') {
            closePopup();
            document.removeEventListener('keydown', closeOnEsc);
        }
    };
    document.addEventListener('keydown', closeOnEsc);
    
    // 获取AI回复
    getAIResponse(selectedText, promptTemplate, popup);
}

function closePopup() {
    if (currentPopup) {
        currentPopup.remove();
        currentPopup = null;
    }
}

async function getAIResponse(selectedText, promptTemplate, popup) {
    try {
        const response = await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('请求超时'));
            }, 30000); // 30秒超时
            
            chrome.runtime.sendMessage({
                action: 'getGeminiResponse',
                text: selectedText,
                prompt: promptTemplate
            }, (response) => {
                clearTimeout(timeout);
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else {
                    resolve(response);
                }
            });
        });
        
        const responseDiv = popup.querySelector('.ai-assistant-response');
        
        if (response && response.success) {
            // 显示成功回复
            responseDiv.innerHTML = formatResponse(response.response);
        } else {
            // 显示错误信息
            const errorMessage = response?.error || '未知错误';
            responseDiv.innerHTML = `
                <div style="color: #d93025; padding: 10px; background: #fce8e6; border-radius: 4px; border-left: 4px solid #d93025;">
                    <strong>错误：</strong>${escapeHtml(errorMessage)}
                    <br><br>
                    <small>请检查API密钥设置或网络连接</small>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error getting AI response:', error);
        const responseDiv = popup.querySelector('.ai-assistant-response');
        if (responseDiv) {
            responseDiv.innerHTML = `
                <div style="color: #d93025; padding: 10px; background: #fce8e6; border-radius: 4px; border-left: 4px solid #d93025;">
                    <strong>连接错误：</strong>${escapeHtml(error.message)}
                    <br><br>
                    <small>请检查网络连接或稍后重试</small>
                </div>
            `;
        }
    }
}

function formatResponse(text) {
    // 基本的Markdown格式转换
    let formatted = escapeHtml(text);
    
    // 转换粗体
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // 转换斜体
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // 转换换行
    formatted = formatted.replace(/\n\n/g, '</p><p>');
    formatted = formatted.replace(/\n/g, '<br>');
    
    // 转换列表
    formatted = formatted.replace(/^(\d+\.\s)/gm, '<br><strong>$1</strong>');
    formatted = formatted.replace(/^(-\s)/gm, '<br>• ');
    
    // 包装在段落中
    formatted = '<p>' + formatted + '</p>';
    
    return formatted;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
