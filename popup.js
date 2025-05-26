// 预设提示词模板
const PROMPT_TEMPLATES = {
    explanation: `你是一个专业的学术助手。用户会给你一些专有名词、概念或短语，请你：

1. 清晰解释这个词汇的含义和定义
2. 提供相关的背景知识和上下文
3. 如果有必要，给出具体的例子来说明
4. 用简洁易懂的语言，帮助用户快速理解

用户选中的内容：{selectedText}

请详细解释上述内容。`,

    english: `你是一个英语学习助手。用户会给你英文内容，请你：

1. 提供准确的中文翻译
2. 解释重要词汇和短语的用法
3. 分析语法结构（如果有复杂句型）
4. 提供相关的例句来帮助理解
5. 指出学习要点和注意事项

用户选中的英文内容：{selectedText}

请帮助用户学习和理解这段英文。`,

    translation: `请翻译以下内容，并提供准确、自然的翻译结果：

原文：{selectedText}

请提供翻译，并解释任何重要的语言或文化背景。`,

    summary: `请总结以下内容的要点：

内容：{selectedText}

请提供清晰的总结，突出主要观点和关键信息。`,

    custom: `{selectedText}`
};

// DOM元素
let apiKeyInput, promptTypeSelect, currentPromptTextarea, saveButton, statusDiv, testApiButton;

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    initializeElements();
    loadSettings();
    setupEventListeners();
});

function initializeElements() {
    apiKeyInput = document.getElementById('apiKey');
    promptTypeSelect = document.getElementById('promptType');
    currentPromptTextarea = document.getElementById('currentPrompt');
    saveButton = document.getElementById('saveSettings');
    statusDiv = document.getElementById('status');
    testApiButton = document.getElementById('testApi');
}

function setupEventListeners() {
    // 保存设置
    saveButton.addEventListener('click', saveSettings);
    
    // 测试API连接
    testApiButton.addEventListener('click', testApiConnection);
    
    // 提示词类型改变
    promptTypeSelect.addEventListener('change', function() {
        const selectedType = this.value;
        if (PROMPT_TEMPLATES[selectedType]) {
            currentPromptTextarea.value = PROMPT_TEMPLATES[selectedType];
        }
        updatePresetButtons();
    });
    
    // 预设按钮点击
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const type = this.dataset.type;
            promptTypeSelect.value = type;
            currentPromptTextarea.value = PROMPT_TEMPLATES[type];
            updatePresetButtons();
        });
    });
}

function updatePresetButtons() {
    const currentType = promptTypeSelect.value;
    document.querySelectorAll('.preset-btn').forEach(btn => {
        if (btn.dataset.type === currentType) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

async function loadSettings() {
    try {
        const result = await chrome.storage.sync.get(['apiKey', 'promptType', 'customPrompt']);
        
        if (result.apiKey) {
            apiKeyInput.value = result.apiKey;
        }
        
        const promptType = result.promptType || 'explanation';
        promptTypeSelect.value = promptType;
        
        if (result.customPrompt) {
            currentPromptTextarea.value = result.customPrompt;
        } else {
            currentPromptTextarea.value = PROMPT_TEMPLATES[promptType];
        }
        
        updatePresetButtons();
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

async function saveSettings() {
    const apiKey = apiKeyInput.value.trim();
    const promptType = promptTypeSelect.value;
    const customPrompt = currentPromptTextarea.value.trim();
    
    if (!apiKey) {
        showStatus('请输入API密钥', 'error');
        return;
    }
    
    if (!customPrompt) {
        showStatus('请输入提示词', 'error');
        return;
    }
    
    try {
        await chrome.storage.sync.set({
            apiKey: apiKey,
            promptType: promptType,
            customPrompt: customPrompt
        });
        
        showStatus('设置已保存', 'success');
    } catch (error) {
        console.error('Error saving settings:', error);
        showStatus('保存失败', 'error');
    }
}

async function testApiConnection() {
    const apiKey = apiKeyInput.value.trim();
    
    if (!apiKey) {
        showStatus('请先输入API密钥', 'error');
        return;
    }
    
    testApiButton.textContent = '测试中...';
    testApiButton.disabled = true;
    
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: '你好，这是一个API连接测试。'
                    }]
                }]
            })
        });
        
        if (response.ok) {
            showStatus('API连接成功！', 'success');
        } else {
            const errorData = await response.json();
            showStatus(`API连接失败: ${errorData.error?.message || '未知错误'}`, 'error');
        }
    } catch (error) {
        console.error('API test error:', error);
        showStatus('网络错误，请检查网络连接', 'error');
    } finally {
        testApiButton.textContent = '测试连接';
        testApiButton.disabled = false;
    }
}

function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    
    // 3秒后清除状态
    setTimeout(() => {
        statusDiv.textContent = '';
        statusDiv.className = 'status';
    }, 3000);
}