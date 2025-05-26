// 安装时创建右键菜单
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: 'aiAssistant',
        title: 'AI助手解释',
        contexts: ['selection']
    });
});

// 处理右键菜单点击
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'aiAssistant' && info.selectionText) {
        handleTextSelection(info.selectionText, tab.id);
    }
});

// 处理来自content script的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'explainText') {
        handleTextSelection(request.text, sender.tab.id);
    } else if (request.action === 'getGeminiResponse') {
        getGeminiResponse(request.text, request.prompt)
            .then(response => sendResponse({ success: true, response }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true; // 保持消息通道开放
    }
});

async function handleTextSelection(selectedText, tabId) {
    try {
        // 获取设置
        const settings = await chrome.storage.sync.get(['apiKey', 'customPrompt']);
        
        if (!settings.apiKey) {
            // 打开设置页面
            chrome.action.openPopup();
            return;
        }
        
        if (!settings.customPrompt) {
            console.error('No prompt template found');
            return;
        }
        
        // 确保content script已加载，添加重试机制
        await ensureContentScriptLoaded(tabId);
        
        // 向content script发送消息，显示弹窗
        try {
            await chrome.tabs.sendMessage(tabId, {
                action: 'showPopup',
                selectedText: selectedText,
                prompt: settings.customPrompt
            });
        } catch (error) {
            console.error('Failed to send message to content script:', error);
            // 如果发送失败，尝试重新注入content script
            await reinjectContentScript(tabId);
            // 重试发送消息
            setTimeout(async () => {
                try {
                    await chrome.tabs.sendMessage(tabId, {
                        action: 'showPopup',
                        selectedText: selectedText,
                        prompt: settings.customPrompt
                    });
                } catch (retryError) {
                    console.error('Retry failed:', retryError);
                }
            }, 100);
        }
        
    } catch (error) {
        console.error('Error handling text selection:', error);
    }
}

// 确保content script已加载
async function ensureContentScriptLoaded(tabId) {
    try {
        await chrome.tabs.sendMessage(tabId, { action: 'ping' });
    } catch (error) {
        // Content script未加载，重新注入
        await reinjectContentScript(tabId);
    }
}

// 重新注入content script
async function reinjectContentScript(tabId) {
    try {
        await chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ['content.js']
        });
        
        await chrome.scripting.insertCSS({
            target: { tabId: tabId },
            files: ['popup.css']
        });
    } catch (error) {
        console.error('Failed to inject content script:', error);
    }
}

async function getGeminiResponse(selectedText, promptTemplate) {
    try {
        // 获取API密钥
        const settings = await chrome.storage.sync.get(['apiKey']);
        
        if (!settings.apiKey) {
            throw new Error('API密钥未设置');
        }
        
        // 替换提示词中的占位符
        const prompt = promptTemplate.replace('{selectedText}', selectedText);
        
        // 调用Gemini API
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${settings.apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 2048,
                }
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || `API请求失败: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
            throw new Error('API返回数据格式错误');
        }
        
        return data.candidates[0].content.parts[0].text;
        
    } catch (error) {
        console.error('Gemini API error:', error);
        throw error;
    }
}

// 处理键盘快捷键
chrome.commands?.onCommand?.addListener((command) => {
    if (command === 'explain-selection') {
        chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
            if (tabs[0]) {
                try {
                    await ensureContentScriptLoaded(tabs[0].id);
                    await chrome.tabs.sendMessage(tabs[0].id, { action: 'getSelection' });
                } catch (error) {
                    console.error('Command execution error:', error);
                }
            }
        });
    }
});