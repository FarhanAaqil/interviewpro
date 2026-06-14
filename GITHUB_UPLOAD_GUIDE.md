## 🚀 How to Upload InterviewPro to GitHub

Follow these steps exactly. Takes about 5 minutes.

---

### STEP 1 — Create a GitHub Repository

1. Go to https://github.com/new
2. Repository name: `interviewpro`
3. Description: `⚡ AI-powered platform to go from Zero to Job-Ready in AI/ML, Data Science & Web Dev`
4. Set to ✅ Public
5. ❌ Do NOT initialize with README (we have our own)
6. Click **"Create repository"**

---

### STEP 2 — Upload via GitHub Web UI (easiest)

1. On your new empty repo page, click **"uploading an existing file"**
2. Drag and drop ALL files from the `interviewpro/` folder:
   - `README.md`
   - `package.json`
   - `vite.config.js`
   - `LICENSE`
   - `.gitignore`
   - `src/App.jsx`
   - `src/main.jsx`
   - `public/index.html`
3. Commit message: `🚀 Initial release: InterviewPro v1.0`
4. Click **"Commit changes"**

---

### STEP 3 — Upload via Terminal (alternative)

```bash
# Navigate into the folder
cd interviewpro

# Initialize git
git init
git add .
git commit -m "🚀 Initial release: InterviewPro v1.0"

# Link to your GitHub repo (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/interviewpro.git
git branch -M main
git push -u origin main
```

---

### STEP 4 — Add Topics/Tags on GitHub

After pushing, go to your repo page → click the ⚙️ gear next to "About":
- Add topics: `react`, `ai`, `machine-learning`, `interview-prep`, `claude-ai`, `data-science`, `web-development`, `mock-interview`
- Add website URL (if deployed)

---

### STEP 5 — Deploy Live (Optional but recommended for LinkedIn)

**Option A — Vercel (recommended, free)**
1. Go to https://vercel.com
2. Click "New Project" → Import from GitHub
3. Select `interviewpro` → Deploy
4. Add environment variable: `VITE_ANTHROPIC_API_KEY = your_key`
5. Get your live URL like: `https://interviewpro.vercel.app`

**Option B — Netlify**
1. Go to https://netlify.com
2. Drag the `dist/` folder after running `npm run build`

---

### ⚠️ Important Security Note

Never commit your `.env` file with your real API key.
The `.gitignore` already excludes it. For production, always proxy API calls through a backend.
