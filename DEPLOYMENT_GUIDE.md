# Deployment Guide: Terminal Pro Rust

We have successfully rebuilt the backend in Rust! Here is how to host this new high-performance version under the name **"Terminal Pro Rust"**.

## Prerequisites
You need to create a **NEW** GitHub Repository for this project (do not overwrite your main project).
1.  Go to GitHub and create a new repo named `terminal-pro-rust`.
2.  Open your terminal in this project folder (`/Users/putta/.gemini/antigravity/scratch/1207_copy`).

```bash
# Initialize new git if needed or reset remote
rm -rf .git
git init
git add .
git commit -m "Initial commit of Rust hybrid architecture"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/terminal-pro-rust.git
git push -u origin main
```

## 1. Deploy Backend (Render)
1.  Log in to your [Render Dashboard](https://dashboard.render.com).
2.  Click **New +** -> **Web Service**.
3.  Connect your new `terminal-pro-rust` repository.
4.  Render should automatically detect the `render.yaml` file I created.
    *   **Service Name**: `terminal-pro-rust-backend`
    *   **Runtime**: Docker
    *   **Plan**: Free
5.  Click **Create Web Service**.
6.  **Wait for deploy**. Once live, copy the URL (e.g., `https://terminal-pro-rust-backend.onrender.com`).

## 2. Deploy Frontend (Vercel)
1.  Log in to [Vercel](https://vercel.com).
2.  Click **Add New...** -> **Project**.
3.  Import the same `terminal-pro-rust` repository.
4.  **Configure Project**:
    *   **Framework Preset**: Vite
    *   **Root Directory**: `./` (default is fine)
    *   **Environment Variables**:
        *   Key: `VITE_API_URL`
        *   Value: `https://terminal-pro-rust-backend.onrender.com` (Paste the Render URL from Step 1).
5.  Click **Deploy**.

## 3. Done!
Your site "Terminal Pro Rust" is now live. The React frontend is on Vercel, and the high-speed Rust backend is on Render.
