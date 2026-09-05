# yasamarium/llm

A sleek, responsive, modern web chat application for **Qwen3 4B**, designed for zero-config 1-click deployment on **Vercel** and powered by the **[`yasamarium/llmserver`](https://github.com/yasamarium/llmserver)** backend.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyasamarium%2Fllm)

---

## Features

- ⚡ **Real-time SSE Streaming**: Live typewriter token generation with stop controls.
- 🎨 **Sleek Dark Interface**: Responsive ChatGPT/Claude-style UI with syntax-highlighted code blocks and 1-click code copying.
- 🟢 **Live Backend Health Status**: Shows live connectivity to `yasamarium/llmserver` right in the top navigation bar.
- ⚙️ **Zero Configuration Required**: Built-in defaults in code. You can also paste your live Cloudflare tunnel URL directly into the in-app settings popup without redeploying.
- 🚀 **Instant Vercel Deployment**: No complex build frameworks—deploys in seconds with Vercel serverless streaming functions.

---

## 🚀 How to Deploy on Vercel

### Step 1: Push / Import to Vercel
1. Open [Vercel Dashboard](https://vercel.com/new).
2. Select **Import Git Repository** and choose **`yasamarium/llm`**.
3. Click **Deploy** (no build settings or framework presets needed!).

### Step 2: Connect to `llmserver`
You can connect in two simple ways:

#### Option A: Inside the Web App UI (Easiest)
1. Open your deployed Vercel site.
2. Click the status button at the top (e.g. `Server Offline`) or the **Settings ⚙️** icon.
3. Paste the active tunnel URL provided by your GitHub Actions runner (e.g. `https://xxxx.trycloudflare.com`).
4. Click **Test Connection** ➔ **Save & Apply**. Your browser remembers the URL!

#### Option B: In Vercel Project Settings (Automatic for all visitors)
In Vercel **Settings** ➔ **Environment Variables**:
- `LLMSERVER_URL`: The public tunnel URL (e.g. `https://xxxx.trycloudflare.com` or custom domain)
- `LLMSERVER_API_KEY`: Your secret API key (matching `API_KEY` in `yasamarium/llmserver`)

---

## 🛠️ Local Development

```bash
# Clone the repository
git clone https://github.com/yasamarium/llm.git
cd llm

# Start local server
npx serve .
# Open http://localhost:3000 in your browser
```

---

## Architecture Overview

```
Browser (yasamarium/llm on Vercel)
         │
         ▼  (POST /api/chat)
Vercel Serverless Function
         │
         ▼  (HTTPS Bearer Auth)
Cloudflare Tunnel (trycloudflare.com or custom domain)
         │
         ▼
GitHub Actions Runner (yasamarium/llmserver)
         │
         ▼
Qwen3 4B GGUF Q4_K_M (llama.cpp CPU)
```

---

## License

[MIT](LICENSE) © [yasamarium](https://github.com/yasamarium)
