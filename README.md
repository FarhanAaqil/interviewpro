# ⚡ InterviewPro — AI-Powered Learning & Interview Platform

<div align="center">

![InterviewPro Banner](https://img.shields.io/badge/InterviewPro-Zero%20to%20Job--Ready-f59e0b?style=for-the-badge&logo=lightning&logoColor=black)

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![Claude AI](https://img.shields.io/badge/Powered%20by-Claude%20AI-f59e0b?style=flat-square)](https://anthropic.com)
[![Live Demo](https://img.shields.io/badge/Live-Demo-10b981?style=flat-square)](https://claude.ai/artifacts)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

**The only platform that takes you from complete beginner → job-ready in AI/ML, Data Science & Web Development — through hands-on projects, live coding, and AI-powered mock interviews.**

</div>

---

## 🎯 What Is InterviewPro?

InterviewPro is a **full-stack learning + interview preparation platform** built entirely in React, powered by Claude AI. It doesn't just teach theory — it forces you to **build real things**, get your code reviewed, debug with a mentor, and get grilled in mock interviews.

> Built for the self-taught dev who wants to go from zero to cracking FAANG-level interviews.

---

## ✨ Features

### 6 AI-Powered Modes

| Mode | Description |
|------|-------------|
| 📚 **Learn** | Micro-skill teaching: 10% theory, 90% hands-on code tasks |
| 🏗️ **Build Project** | Step-by-step real project mentoring — never full code upfront |
| 🎤 **Mock Interview** | Adaptive AI interviewer — scores every answer, gives final report |
| 🔍 **Code Review** | Expert review: bugs, performance, best practices + refactored version |
| 🐛 **Debug Mode** | Paste error → AI diagnoses root cause → minimal hints → full fix |
| ⚡ **Live Playground** | Run JavaScript & HTML/CSS live in the browser |

### 3 Learning Tracks

- 🤖 **AI / Machine Learning** — Python, NumPy, Pandas, Regression, Neural Networks, Transformers, MLOps
- 📊 **AI & Data Science** — Statistics, SQL, EDA, A/B Testing, Time Series, Dashboards
- 🌐 **Web Development** — HTML/CSS, JavaScript, React, Node.js, REST APIs, System Design

### Smart Personalization
- **Beginner** → guided learning with detailed comments
- **Intermediate** → partial code + fill-the-gap challenges
- **Advanced** → requirements-only, build from scratch

---

## 🚀 Demo

```
🧭 Onboard → Select level + track
📚 Learn   → Pick a topic → AI teaches with hands-on task
🏗️ Project → Choose project → Build step by step
🎤 Interview → AI interviews you → Scores each answer → Final report
🔍 Review  → Paste code → Get expert feedback
🐛 Debug   → Paste error → Get root cause + fix
⚡ Play    → Live JS/HTML runner
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 (hooks, no class components) |
| AI Engine | Anthropic Claude API (`claude-sonnet-4-20250514`) |
| Styling | Pure CSS-in-JS (no external UI library) |
| Code Runner | Browser `Function()` sandbox (JS/HTML live) |
| Fonts | Outfit + Fira Code (Google Fonts) |
| State | useState / useCallback / useEffect |
| Deployment | Claude Artifacts / Vercel / Netlify |

---

## 📦 Getting Started

### Prerequisites
- Node.js 18+
- Anthropic API key ([get one here](https://console.anthropic.com))

### Installation

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/interviewpro.git
cd interviewpro

# Install dependencies
npm install

# Add your API key
echo "VITE_ANTHROPIC_API_KEY=your_key_here" > .env

# Start development server
npm run dev
```

> ⚠️ **Note:** For production, proxy API calls through a backend server to protect your API key. Never expose API keys in client-side code.

### Quick Deploy (Claude Artifacts)
Copy `src/App.jsx` content → paste into [Claude.ai](https://claude.ai) → run as artifact.

---

## 🏗️ Project Structure

```
interviewpro/
├── src/
│   └── App.jsx          # Entire application (single-file React)
├── public/
│   └── index.html
├── package.json
├── vite.config.js
└── README.md
```

---

## 🤖 AI System Prompts

The platform uses **5 specialized system prompts** — each engineered for a specific teaching mode:

- **Learn Mode** — Enforces 10% theory / 90% practical ratio, hands-on task every response
- **Project Mode** — Step-by-step mentoring, never reveals full solution upfront
- **Interview Mode** — Adaptive difficulty, scores each answer, gives running total
- **Code Review Mode** — Structured report (bugs → performance → readability → refactored code)
- **Debug Mode** — Hint-first diagnosis, teaches root cause patterns

---

## 📸 Screenshots

> *(Add your screenshots here after running the app)*

| Onboarding | Learn Mode | Interview |
|---|---|---|
| ![onboard](screenshots/onboard.png) | ![learn](screenshots/learn.png) | ![interview](screenshots/interview.png) |

---

## 🗺️ Roadmap

- [ ] User authentication + progress tracking
- [ ] Streak system & XP gamification
- [ ] Python code execution (via Pyodide)
- [ ] Whiteboard / canvas for system design
- [ ] Video mock interviews
- [ ] Company-specific question banks (Google, Meta, Amazon)
- [ ] Resume review mode
- [ ] Peer code review matching

---

## 🤝 Contributing

Contributions are welcome! Please open an issue first to discuss what you'd like to change.

```bash
git checkout -b feature/your-feature
git commit -m "feat: add your feature"
git push origin feature/your-feature
# Open a Pull Request
```

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 👨‍💻 Author

Built with ❤️ by **Farhan**

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0077B5?style=flat-square&logo=linkedin)](https://linkedin.com/in/YOUR_USERNAME)
[![GitHub](https://img.shields.io/badge/GitHub-Follow-181717?style=flat-square&logo=github)](https://github.com/YOUR_USERNAME)

---

<div align="center">

**⭐ Star this repo if it helped you — it means a lot!**

*Built using Claude AI + React · No frameworks harmed in the making*

</div>
