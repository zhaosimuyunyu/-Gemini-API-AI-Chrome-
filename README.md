
# AI 学习助手 (AI Learning Assistant)

![版本](https://img.shields.io/badge/version-1.0-blue)
![清单](https://img.shields.io/badge/manifest-v3-brightgreen)
![技术](https://img.shields.io/badge/API-Gemini-orange)

这是一个 Chrome 浏览器扩展程序，旨在通过集成 Google Gemini API，帮助用户快速理解和学习网页上选中的文本内容，从而提升学习和浏览效率。

## ✨ 核心功能

* **右键菜单解释**: 在网页上选中文本后，通过右键菜单的 "AI助手解释" 选项，快速调用 AI 进行解释。
* **键盘快捷键**: 支持使用 `Ctrl+Shift+E` (Windows/Linux) 或 `Cmd+Shift+E` (Mac) 快捷键，快速解释选中的文本。
* **Gemini API 集成**: 连接 Google Gemini API，获取强大、智能的文本解释和分析能力。
* **页面内弹窗**: 直接在当前网页上以浮动弹窗的形式展示 AI 的解释结果，无需切换页面，阅读体验流畅。
* **自定义提示词 (Prompt)**: 用户可以在扩展设置页面中，根据自己的需求选择预设的提示词模板（如专有名词解释、英文学习等）或完全自定义提示词。
* **API 密钥配置**: 用户需要在设置页面配置自己的 Gemini API 密钥，并提供测试连接功能。
* **动态内容注入**: 能够智能判断并尝试注入内容脚本，确保在各种页面（非受限页面）上的可用性。
* **图标生成工具**: 项目内包含一个 `generate_imige.html` 文件，可以方便地生成扩展所需的各种尺寸图标。

## 📂 文件结构

```
chrome-extension/
├── manifest.json         # 扩展核心配置文件，定义权限、脚本等
├── background.js         # 后台服务工作线程，处理事件、API调用等
├── content.js            # 内容脚本，注入网页，处理文本选择、显示弹窗
├── popup.html            # 扩展设置弹窗的HTML结构
├── popup.js              # 扩展设置弹窗的逻辑
├── popup.css             # 扩展设置弹窗的样式
├── icon16.png            # 16x16 图标
├── icon48.png            # 48x48 图标
├── icon128.png           # 128x128 图标
└── generate_imige.html   # (可选工具) 用于生成上述图标
```

## 🚀 安装与设置

1.  **获取 Gemini API 密钥**: 前往 [Google AI Studio](https://aistudio.google.com/app/apikey) 获取您的 Gemini API 密钥。
2.  **准备图标**:
    * 如果您还没有 `icon16.png`, `icon48.png`, `icon128.png` 文件，可以在浏览器中打开 `generate_imige.html` 文件。
    * 点击 "下载所有图标" 按钮，并将下载的三个 PNG 文件保存到 `chrome-extension` 文件夹中。
3.  **克隆或下载项目**: 将本项目文件下载到本地。
4.  **加载扩展程序**:
    * 打开 Chrome 浏览器，进入 `chrome://extensions/` 页面。
    * 确保右上角的 **“开发者模式” (Developer mode)** 开关已打开。
    * 点击左上角的 **“加载已解压的扩展程序” (Load unpacked)**。
    * 选择您本地的 `chrome-extension` 文件夹。
5.  **配置 API 密钥**:
    * 点击 Chrome 工具栏上的 "AI学习助手" 图标，打开设置弹窗。
    * 输入您在步骤 1 中获取的 Gemini API 密钥。
    * (可选) 点击 "测试连接" 按钮，确认密钥有效。
6.  **选择/自定义提示词**:
    * 根据需要选择一个预设模式，或选择 "自定义" 并编辑文本框中的提示词。
    * 提示词中的 `{selectedText}` 将会被您在网页上选中的文本替换。
7.  **保存设置**: 点击 "保存设置" 按钮。

## 📖 使用方法

1.  **打开网页**: 访问任何您想阅读的网页 (注意：此扩展无法在 `chrome://` 内部页面或 Chrome 应用商店页面运行)。
2.  **选中文本**: 用鼠标选中您想了解或解释的文本。
3.  **触发解释**:
    * **方法一**: 在选中的文本上点击鼠标右键，然后选择 "AI助手解释"。
    * **方法二**: 按下键盘快捷键 `Ctrl+Shift+E` (Mac: `Cmd+Shift+E`)。
4.  **查看结果**: 页面右侧将出现一个弹窗，显示 AI 对您选中文本的解释结果。
5.  **关闭弹窗**: 点击弹窗右上角的 "×" 或按 `Esc` 键或点击弹窗外部区域即可关闭。

## ⚠️ 注意事项

* **受限页面**: 出于安全原因，Chrome 扩展无法在 `chrome://` 开头的内部页面和 Chrome 网上应用店 (`chrome.google.com/webstore`) 上运行。在这些页面上尝试使用扩展会失败，这是正常现象。
* **API 密钥**: 请妥善保管您的 Gemini API 密钥，不要泄露。

---
```
