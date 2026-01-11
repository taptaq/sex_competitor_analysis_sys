# 部署指南 (Unified Deno Deploy)

本指南介绍如何将**前后端**整合并一次性部署到 **Deno Deploy**。最简单的方式是本地打包前端，然后将构建产物连同代码一起推送到 GitHub。

## 1. 准备工作

在本地终端执行以下命令，构建前端代码：

```bash
# 1. 安装依赖 (如果还没安装)
npm install

# 2. 构建前端
# 注意：构建前请确保 .env 中的 VITE_API_URL 为空 (VITE_API_URL=)
# 或者在构建时临时指定: VITE_API_URL= npm run build
npm run build
```

执行完成后，项目根目录下会生成一个 `dist` 文件夹，里面包含了所有的前端静态文件。

**关键步骤**：你需要将这个 `dist` 文件夹提交到 GitHub。
通常 `dist` 会被 `.gitignore` 忽略，你需要强制添加它，或者修改 `.gitignore`。

```bash
# 修改 .gitignore，删掉 /dist 或注释掉它
# 或者直接强制添加
git add dist -f
git commit -m "chore: add build artifacts for deployment"
git push
```

## 2. 部署到 Deno Deploy

1.  **访问 Deno Deploy**：打开 [dash.deno.com](https://dash.deno.com/) 并登录。
2.  **新建项目**：
    - 点击 "New Project"。
    - 选择你的 GitHub 仓库。
    - **Entrypoint File** 选择 `deno_server/main.ts`。
3.  **配置环境变量**：
    - 在项目设置页面 "Environment Variables" 中添加：
      - `QWEN_API_KEY`: 你的千问 API Key
      - `DEEPSEEK_API_KEY`: (可选) DeepSeek API Key
      - `GOOGLE_API_KEY`: (可选) Google API Key
4.  **保存并部署**。

## 3. 验证

Deno Deploy 会提供一个形如 `https://your-project.deno.dev` 的域名。
直接访问该域名：

- 如果看到前端页面，说明静态文件服务正常。
- 尝试使用“分析”功能，如果能正常返回结果，说明后端 API 正常。

## 常见问题

- **页面白屏或 404**：检查 GitHub 仓库中是否真的存在 `dist` 文件夹。Deno Deploy 必须能读取到 `../dist` 目录。
- **前端无法连接后端**：确保前端构建时没有设置错误的 `VITE_API_URL`。默认为空字符串时，前端会向当前域名发送 API 请求（即向 Deno 后端发送），这是正确的。
