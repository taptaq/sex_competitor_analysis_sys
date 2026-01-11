# 部署指南

本指南将帮助你将应用免费部署到 Deno Deploy (后端) 和 Netlify (前端)。

## 1. 后端部署 (Deno Deploy)

后端代码位于 `deno_server/` 文件夹。

### 步骤

1.  **准备 GitHub 仓库**：确保你的项目已推送到 GitHub。
2.  **访问 Deno Deploy**：打开 [dash.deno.com](https://dash.deno.com/) 并登录。
3.  **新建项目**：
    - 点击 "New Project"。
    - 选择你的 GitHub 仓库。
    - **Entrypoint File** 选择 `deno_server/main.ts`。
4.  **配置环境变量**：
    - 在项目设置页面找到 "Environment Variables"。
    - 添加以下 Key (与你的 `.env` 一致)：
      - `QWEN_API_KEY`: 你的千问 API Key
      - `DEEPSEEK_API_KEY`: 你的 DeepSeek API Key (可选)
      - `GOOGLE_API_KEY`: 你的 Google API Key (可选)
5.  **获取后端 URL**：部署成功后，复制项目分配的域名（例如 `https://your-project.deno.dev`）。

## 2. 前端部署 (Netlify)

前端使用 Vite 构建，静态托管。

### 步骤

1.  **访问 Netlify**：打开 [netlify.com](https://www.netlify.com/) 并登录。
2.  **新建站点**：
    - 点击 "Add new site" -> "Import from existing project"。
    - 连接 GitHub 并选择你的仓库。
3.  **构建配置**：
    - **Build command**: `npm run build`
    - **Publish directory**: `dist`
4.  **环境变量**：
    - 点击 "Add environment variables"。
    - Key: `VITE_API_URL`
    - Value: 刚才获取的 Deno 后端 URL (如 `https://your-project.deno.dev`，**注意不要带结尾斜杠**)。
5.  **部署**：点击 "Deploy site"。

## 3. 验证

访问 Netlify 分配的域名，测试“新增竞品”或“分析报告”功能。如果一切正常，你的应用已成功上线！

### 常见问题

- **跨域错误 (CORS)**: 后端 `main.ts` 已开启全局 CORS，通常不会有问题。如果出现，请检查浏览器控制台 Network 面板的 Request URL 是否正确指向了 Deno 后端。
- **页面 404**: `netlify.toml` 已配置 SPA 重定向，刷新页面应正常工作。
