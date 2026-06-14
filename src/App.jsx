import { useState, useRef, useEffect, useCallback } from "react";

// Each mode gets its own system prompt. Keeping them as functions so I can
// inject track/level/topic dynamically — made a big difference in response quality
// when I stopped hardcoding the track name.
const SYSTEM_PROMPTS = {
  learn: (track, level, topic) => `You are an expert AI tutor and senior software engineer specializing in ${track}.

Your job is to teach ${level}-level developers through hands-on practice, not lectures.

Current context:
- Track: ${track}
- Level: ${level}
- Topic: ${topic || "General"}

Every response must follow this exact structure:
1. Explain the concept in 4 lines or less — plain English, no jargon
2. Show a short code example (10-20 lines max, real working code)
3. Give the user ONE specific task to try
4. End with: "🎯 Your turn — try it and paste your code!"

Rules:
- 90% practical, 10% theory
- Don't give away the solution before they try
- If ${level} is beginner, add helpful comments inside the code
- If ${level} is intermediate, leave some gaps for them to fill in
- If ${level} is advanced, just describe the requirement and let them figure it out
- Keep responses under 300 words
- Always use markdown code blocks with the language tag`,

  project: (track, level) => `You are a senior ${track} engineer mentoring someone building a real project.

The user is ${level} level. Guide them step by step — don't dump everything at once.

How to mentor:
1. Start by explaining what we're building and why (keep it short)
2. Break the project into numbered steps, reveal ONE at a time
3. Each step: quick context → starter code → specific task → expected output
4. When they share their code: point out what's good first, then fix what's broken
5. Explain WHY something is wrong, not just what
6. Only move to the next step once the current one is working

Projects I work on:
- AI/ML: Spam Classifier → Movie Recommender → Chatbot → Image Classifier
- Data Science: EDA Dashboard → Prediction Pipeline → Real-time Analytics
- Web Dev: Portfolio → Auth System → REST API → Full-Stack App

Format each step like this:
## Step [N]: [Title]
**What we're building:** (1 line)
\`\`\`language
// starter code
\`\`\`
**Your task:** [what to do]
**Expected output:** [what they should see]

Keep it short. One step at a time.`,

  interview: (track, level) => `You are a technical interviewer at a top tech company. You're hiring for ${track} roles.

This is a mock interview. The candidate is ${level} level.

Ground rules:
1. Ask ONE question at a time, never stack multiple
2. If they answer well, go harder. If they're struggling, ease up a little.
3. Mix up question types: concepts, coding problems, debugging, system design, real scenarios
4. After every answer, give structured feedback:
   - ✅ What was good
   - ❌ What was missing or wrong
   - 💡 What the ideal answer looks like (keep it brief)
   - Score: X/10
5. After every 5 questions, show a running total
6. After 8 questions, wrap up with a final report:
   - Overall score /10
   - What they're strongest at
   - Gaps to work on
   - 3 specific resources to study

Be direct. Don't accept hand-wavy answers — push for specifics.
Start by introducing yourself, stating the role, then ask your first question.`,

  review: (track) => `You are a senior ${track} engineer reviewing someone's code.

Structure every review like this:

## 🔍 Code Review

### ✅ What's Working
(2-3 genuine things that are done well)

### 🚨 Critical Issues
(Bugs, security problems, broken logic — things that need to be fixed)

### ⚡ Performance
(Anything that's slow or inefficient)

### 📖 Readability & Style
(Naming, structure, repeated code, etc.)

### 🔧 Refactored Version
\`\`\`language
// improved version with comments explaining the changes
\`\`\`

### 📊 Scores
- Correctness: X/10
- Performance: X/10
- Readability: X/10
- Best Practices: X/10
- **Overall: X/10**

Be specific — reference actual variable names or line numbers when you can.
Be constructive. Explain why each change matters. You're mentoring, not criticizing.`,

  debug: (track) => `You are an expert ${track} developer helping someone fix a bug.

Work through it like this:
1. Identify what type of error it is (syntax, logic, runtime, async, etc.)
2. Pinpoint exactly where the problem is
3. Explain WHY it's happening — not just what the error says
4. Give a small hint first: "Try checking X..."
5. If they're still stuck after one try, give the full fix
6. Always explain what you changed and why it works
7. End with a one-liner they can remember to avoid this mistake in the future

Format:
## 🐛 Bug Diagnosis
**Error Type:** [type]
**Root Cause:** [clear explanation]

## 💡 Hint
(the smallest nudge that might be enough)

## ✅ Fix
\`\`\`language
// fixed code with comments
\`\`\`

## 🧠 Remember
(short takeaway)

Bugs happen to everyone. Keep the tone encouraging.`
};

// track data — color + glow pairs took a while to get right in dark mode
// TODO: could pull this from a config file later if we add more tracks
const TRACKS = {
  aiml: {
    name: "AI / Machine Learning",
    short: "AI/ML",
    emoji: "🤖",
    color: "#f59e0b",
    glow: "#f59e0b33",
    topics: [
      "Python for ML", "NumPy & Pandas", "Linear Regression",
      "Logistic Regression", "Decision Trees", "Random Forest",
      "Neural Networks", "CNN & Image Processing", "NLP & Text",
      "Transformers & LLMs", "Model Evaluation", "MLOps & Deployment"
    ],
    projects: [
      "📧 Spam Email Classifier", "🎬 Movie Recommendation Engine",
      "🤖 Rule-based Chatbot", "🖼️ Image Classifier (CNN)",
      "📈 Stock Price Predictor", "😊 Sentiment Analyzer"
    ]
  },
  aids: {
    name: "AI & Data Science",
    short: "AIDS",
    emoji: "📊",
    color: "#06b6d4",
    glow: "#06b6d433",
    topics: [
      "Python Basics", "Statistics & Probability", "Data Cleaning",
      "Exploratory Analysis", "SQL for Data Science", "Data Visualization",
      "Hypothesis Testing", "A/B Testing", "Feature Engineering",
      "Time Series Analysis", "Dashboard Building", "Data Pipelines"
    ],
    projects: [
      "📊 EDA Dashboard", "🔮 Sales Prediction Model",
      "📉 Customer Churn Analysis", "🌡️ Real-time Analytics",
      "📦 Inventory Forecasting", "🗺️ Geo Data Visualizer"
    ]
  },
  webdev: {
    name: "Web Development",
    short: "Web Dev",
    emoji: "🌐",
    color: "#10b981",
    glow: "#10b98133",
    topics: [
      "HTML & CSS", "JavaScript ES6+", "DOM & Events",
      "React Basics", "React Hooks", "State Management",
      "Node.js & Express", "REST API Design", "Authentication & JWT",
      "Databases & ORMs", "System Design", "DevOps & CI/CD"
    ],
    projects: [
      "🎨 Portfolio Website", "🔐 Auth System (JWT)", "📡 REST API (Express)",
      "💬 Real-time Chat App", "🛒 E-Commerce Frontend", "🚀 Full-Stack SaaS App"
    ]
  }
};

const LEVELS = [
  { id: "beginner",     label: "Beginner",     icon: "🌱", desc: "New to the field" },
  { id: "intermediate", label: "Intermediate", icon: "⚡", desc: "6 months+ experience" },
  { id: "advanced",     label: "Advanced",     icon: "🔥", desc: "Ready for senior roles" }
];

const MODES = [
  { id: "learn",      icon: "📚", label: "Learn",        desc: "Micro-skill guided learning" },
  { id: "project",    icon: "🏗️", label: "Build Project", desc: "Step-by-step real projects" },
  { id: "interview",  icon: "🎤", label: "Interview",     desc: "Adaptive mock interviews" },
  { id: "review",     icon: "🔍", label: "Code Review",   desc: "Expert code feedback" },
  { id: "debug",      icon: "🐛", label: "Debug",         desc: "Fix errors with a mentor" },
  { id: "playground", icon: "⚡", label: "Playground",    desc: "Live JS/HTML executor" }
];

// direct fetch to Anthropic — good enough for now, should proxy through a backend eventually
// keeping max_tokens at 1200 so responses stay focused and don't run long
async function callClaude(systemPrompt, messages) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1200,
      system: systemPrompt,
      messages
    })
  });

  if (!res.ok) {
    console.error("Claude API error:", res.status, res.statusText);
    throw new Error(`API returned ${res.status}`);
  }

  const data = await res.json();
  return data.content?.[0]?.text || "⚠️ No response received.";
}

export default function App() {
  const [screen, setScreen] = useState("onboard");
  const [userLevel, setUserLevel] = useState(null);
  const [track, setTrack] = useState(null);
  const [mode, setMode] = useState("learn");
  const [topic, setTopic] = useState(null);
  const [project, setProject] = useState(null);
  const [sideOpen, setSideOpen] = useState(true);

  const tr = track ? TRACKS[track] : null;

  if (screen === "onboard") {
    return (
      <Onboard
        onDone={(lvl, trk) => {
          setUserLevel(lvl);
          setTrack(trk);
          setScreen("main");
        }}
      />
    );
  }

  return (
    <div style={styles.app}>
      <GlobalStyles />

      <header style={styles.topBar}>
        <div style={styles.topLeft}>
          <button style={styles.hamburger} onClick={() => setSideOpen(p => !p)}>☰</button>
          <span style={styles.brand}>
            ⚡ <span style={{ color: tr?.color }}>InterviewPro</span>
          </span>
          <span style={styles.brandTag}>Zero → Job-Ready</span>
        </div>

        <div style={styles.topCenter}>
          {MODES.map(m => (
            <button
              key={m.id}
              title={m.desc}
              className="htab"
              style={{
                ...styles.modeTab,
                ...(mode === m.id
                  ? { ...styles.modeTabActive, borderColor: tr?.color, color: tr?.color, background: tr?.glow }
                  : {})
              }}
              onClick={() => setMode(m.id)}
            >
              {m.icon} {m.label}
            </button>
          ))}
        </div>

        <div style={styles.topRight}>
          <div style={{ ...styles.levelBadge, borderColor: tr?.color, color: tr?.color }}>
            {LEVELS.find(l => l.id === userLevel)?.icon} {userLevel}
          </div>
          <button style={styles.resetBtn} onClick={() => setScreen("onboard")}>
            Switch Track
          </button>
        </div>
      </header>

      <div style={styles.body}>
        {sideOpen && (
          <aside style={styles.sidebar}>
            <div style={{ ...styles.sideTrack, borderColor: tr?.color + "44" }}>
              <span style={{ fontSize: "1.5rem" }}>{tr?.emoji}</span>
              <div>
                <div style={{ fontWeight: 700, color: tr?.color, fontSize: "0.85rem" }}>{tr?.short}</div>
                <div style={{ fontSize: "0.7rem", color: "#556" }}>
                  {LEVELS.find(l => l.id === userLevel)?.icon} {userLevel}
                </div>
              </div>
            </div>

            {(mode === "learn" || mode === "interview") && (
              <div style={styles.sideSection}>
                <div style={styles.sideSectionTitle}>Topics</div>
                {tr?.topics.map(t => (
                  <button
                    key={t}
                    className="hitem"
                    style={{
                      ...styles.sideItem,
                      ...(topic === t ? { ...styles.sideItemActive, color: tr?.color, background: tr?.glow } : {})
                    }}
                    onClick={() => setTopic(t)}
                  >
                    <span style={styles.sideItemDot(topic === t, tr?.color)} />
                    {t}
                  </button>
                ))}
              </div>
            )}

            {mode === "project" && (
              <div style={styles.sideSection}>
                <div style={styles.sideSectionTitle}>Projects</div>
                {tr?.projects.map(p => (
                  <button
                    key={p}
                    className="hitem"
                    style={{
                      ...styles.sideItem,
                      ...(project === p ? { ...styles.sideItemActive, color: tr?.color, background: tr?.glow } : {})
                    }}
                    onClick={() => setProject(p)}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}

            {(mode === "review" || mode === "debug" || mode === "playground") && (
              <div style={styles.sideSection}>
                <div style={styles.sideSectionTitle}>Quick Snippets</div>
                {QUICK_SNIPPETS[track]?.map(s => (
                  <div
                    key={s.name}
                    style={{ padding: "0.4rem 0.75rem", fontSize: "0.75rem", color: "#556", cursor: "default" }}
                  >
                    {s.name}
                  </div>
                ))}
              </div>
            )}
          </aside>
        )}

        <main style={styles.main}>
          {mode === "playground"
            ? <Playground track={track} />
            : <ChatPane
                mode={mode}
                track={track}
                trackData={tr}
                level={userLevel}
                topic={topic}
                project={project}
                setMode={setMode}
                setTopic={setTopic}
                setProject={setProject}
              />
          }
        </main>
      </div>
    </div>
  );
}

// Two-step onboarding — pick level first, then track.
// Kept the state local here since App doesn't need it until onDone fires.
function Onboard({ onDone }) {
  const [step, setStep] = useState(0);
  const [level, setLevel] = useState(null);
  const [trk, setTrk] = useState(null);

  return (
    <div style={styles.onboard}>
      <GlobalStyles />
      <div style={styles.onboardGlow} />
      <div style={styles.onboardCard}>
        <div style={styles.onboardLogo}>⚡ InterviewPro</div>
        <div style={styles.onboardSub}>AI Tutor · Live Compiler · Mock Interviews · Code Review</div>

        {step === 0 && (
          <div className="fadein">
            <div style={styles.onboardQ}>Where are you right now?</div>
            <div style={styles.onboardGrid}>
              {LEVELS.map(l => (
                <button
                  key={l.id}
                  className="hcard"
                  style={{ ...styles.onboardCard2, ...(level === l.id ? styles.onboardCard2Active : {}) }}
                  onClick={() => setLevel(l.id)}
                >
                  <span style={{ fontSize: "2.2rem" }}>{l.icon}</span>
                  <div style={{ fontWeight: 700, fontSize: "1rem" }}>{l.label}</div>
                  <div style={{ fontSize: "0.78rem", color: "#667" }}>{l.desc}</div>
                </button>
              ))}
            </div>
            <button
              style={{ ...styles.onboardNext, ...(level ? {} : { opacity: 0.4, cursor: "not-allowed" }) }}
              disabled={!level}
              onClick={() => setStep(1)}
            >
              Continue →
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="fadein">
            <div style={styles.onboardQ}>What do you want to master?</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {Object.entries(TRACKS).map(([k, t]) => (
                <button
                  key={k}
                  className="hcard"
                  style={{
                    ...styles.trackCard2,
                    ...(trk === k ? { ...styles.trackCard2Active, borderColor: t.color, background: t.glow } : {})
                  }}
                  onClick={() => setTrk(k)}
                >
                  <span style={{ fontSize: "2rem" }}>{t.emoji}</span>
                  <div style={{ flex: 1, textAlign: "left" }}>
                    <div style={{ fontWeight: 700, color: trk === k ? t.color : "#ccd" }}>{t.name}</div>
                    <div style={{ fontSize: "0.78rem", color: "#556", marginTop: "0.2rem" }}>
                      {t.topics.length} topics · {t.projects.length} projects
                    </div>
                  </div>
                  {trk === k && <span style={{ color: t.color }}>✓</span>}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
              <button style={styles.onboardBack} onClick={() => setStep(0)}>← Back</button>
              <button
                style={{ ...styles.onboardNext, flex: 1, ...(trk ? {} : { opacity: 0.4, cursor: "not-allowed" }) }}
                disabled={!trk}
                onClick={() => onDone(level, trk)}
              >
                🚀 Start Learning
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// This component handles all AI-powered modes (everything except Playground).
// The sessionKey trick is what makes topic/mode switching reset the conversation
// without causing any stale closure issues.
function ChatPane({ mode, track, trackData, level, topic, project }) {
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // using a string key to represent the current "session" — easier to compare than multiple deps
  const [sessionKey, setSessionKey] = useState(`${mode}-${topic}-${project}`);
  const bottomRef = useRef(null);

  useEffect(() => {
    const key = `${mode}-${topic}-${project}`;
    if (key !== sessionKey) {
      setMsgs([]);
      setSessionKey(key);
    }
  }, [mode, topic, project]);

  // scroll to bottom whenever messages update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, loading]);

  const getSystemPrompt = useCallback(() => {
    const trackName = TRACKS[track]?.name || track;
    switch (mode) {
      case "learn":     return SYSTEM_PROMPTS.learn(trackName, level, topic);
      case "project":   return SYSTEM_PROMPTS.project(trackName, level);
      case "interview": return SYSTEM_PROMPTS.interview(trackName, level);
      case "review":    return SYSTEM_PROMPTS.review(trackName);
      case "debug":     return SYSTEM_PROMPTS.debug(trackName);
      default:          return SYSTEM_PROMPTS.learn(trackName, level, topic);
    }
  }, [mode, track, level, topic, project]);

  const getStarterPrompt = useCallback(() => {
    switch (mode) {
      case "learn":     return topic ? `Teach me: ${topic}` : null;
      case "project":   return project ? `Start project: ${project}` : null;
      // interview kicks off automatically so the user doesn't have to type first
      case "interview": return `Start the interview. I am at ${level} level for ${TRACKS[track]?.name}.`;
      default:          return null;
    }
  }, [mode, topic, project, level, track]);

  // auto-start for modes that need it (interview, learn when topic is pre-selected)
  useEffect(() => {
    if (msgs.length > 0) return;
    const starter = getStarterPrompt();
    if (starter) sendMessage(starter, true);
  }, [sessionKey]);

  const sendMessage = useCallback(async (text, isAuto = false) => {
    if (!text.trim() || loading) return;

    const userMsg = { role: "user", content: text };
    const newMsgs = isAuto ? [userMsg] : [...msgs, userMsg];

    setMsgs(isAuto ? [userMsg] : newMsgs);
    setInput("");
    setLoading(true);

    try {
      const apiMsgs = newMsgs.map(m => ({ role: m.role, content: m.content }));
      const reply = await callClaude(getSystemPrompt(), apiMsgs);
      setMsgs(prev => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      console.error("Failed to get response:", err);
      setMsgs(prev => [...prev, { role: "assistant", content: "⚠️ Couldn't reach the AI. Check your connection and try again." }]);
    } finally {
      setLoading(false);
    }
  }, [msgs, loading, getSystemPrompt]);

  const clearChat = () => setMsgs([]);

  const needsSelection = (mode === "learn" && !topic) || (mode === "project" && !project);

  return (
    <div style={styles.chatPane}>
      <div style={{ ...styles.chatHeader, borderBottomColor: trackData?.color + "33" }}>
        <div style={styles.chatHeaderLeft}>
          <span style={{ fontSize: "1.3rem" }}>{MODES.find(m => m.id === mode)?.icon}</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>
              {MODES.find(m => m.id === mode)?.label} Mode
              {topic && mode === "learn" && (
                <span style={{ color: trackData?.color, fontWeight: 500 }}> — {topic}</span>
              )}
              {project && mode === "project" && (
                <span style={{ color: trackData?.color, fontWeight: 500 }}> — {project}</span>
              )}
            </div>
            <div style={{ fontSize: "0.72rem", color: "#556" }}>
              {MODES.find(m => m.id === mode)?.desc}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          {msgs.length > 0 && (
            <button style={styles.clearBtn} onClick={clearChat}>🗑 Clear</button>
          )}
          {mode === "learn" && topic && (
            <button
              style={{ ...styles.clearBtn, color: trackData?.color, borderColor: trackData?.color + "44" }}
              onClick={() => sendMessage(`Give me a harder challenge on ${topic}`)}
            >
              ⬆ Harder
            </button>
          )}
        </div>
      </div>

      <div style={styles.messages}>
        {needsSelection && msgs.length === 0 && (
          <EmptyState mode={mode} trackData={trackData} />
        )}
        {msgs.map((m, i) => (
          <MessageBubble key={i} msg={m} trackData={trackData} />
        ))}
        {loading && <TypingIndicator trackData={trackData} />}
        <div ref={bottomRef} />
      </div>

      <InputBar
        input={input}
        setInput={setInput}
        onSend={() => sendMessage(input)}
        loading={loading}
        mode={mode}
        trackData={trackData}
        disabled={needsSelection && msgs.length === 0}
        placeholder={
          mode === "review"    ? "Paste your code here for expert review..." :
          mode === "debug"     ? "Paste your code + error message here..." :
          mode === "interview" ? "Type your answer..." :
          "Type your response, question, or code..."
        }
      />
    </div>
  );
}

// Renders a single message — user messages are plain, AI messages get markdown parsing
function MessageBubble({ msg, trackData }) {
  const isUser = msg.role === "user";

  if (isUser) {
    return (
      <div style={styles.userRow} className="fadein">
        <div style={styles.userBubble}>
          <pre style={styles.userText}>{msg.content}</pre>
        </div>
        <div style={styles.avatar}>👤</div>
      </div>
    );
  }

  // split the AI response into text and code segments so we can render them differently
  const segments = parseContent(msg.content);

  return (
    <div style={styles.aiRow} className="fadein">
      <div style={{ ...styles.aiAvatar, background: trackData?.glow, border: `1px solid ${trackData?.color}44` }}>
        🤖
      </div>
      <div style={styles.aiBubble}>
        {segments.map((seg, i) =>
          seg.type === "code"
            ? <CodeBlock key={i} code={seg.content} lang={seg.lang} trackData={trackData} />
            : <MarkdownText key={i} text={seg.content} trackData={trackData} />
        )}
      </div>
    </div>
  );
}

// splits text into alternating text/code segments using the triple-backtick fence
function parseContent(text) {
  const segments = [];
  const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: "text", content: text.slice(lastIndex, match.index) });
    }
    segments.push({ type: "code", lang: match[1] || "text", content: match[2].trimEnd() });
    lastIndex = codeBlockRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    segments.push({ type: "text", content: text.slice(lastIndex) });
  }

  return segments;
}

// renders markdown-ish text line by line — handles headers, bullets, bold, inline code
// not a full markdown parser but handles everything Claude actually outputs
function MarkdownText({ text, trackData }) {
  const lines = text.split("\n");

  return (
    <div style={{ lineHeight: 1.8, fontSize: "0.88rem", color: "#ccd" }}>
      {lines.map((line, i) => {
        if (line.startsWith("## "))  return <div key={i} style={{ fontWeight: 700, fontSize: "1rem", color: "#eef", marginTop: "0.8rem", marginBottom: "0.3rem" }}>{line.slice(3)}</div>;
        if (line.startsWith("### ")) return <div key={i} style={{ fontWeight: 600, fontSize: "0.92rem", color: trackData?.color || "#aaa", marginTop: "0.6rem" }}>{line.slice(4)}</div>;
        if (line.startsWith("**") && line.endsWith("**")) return <div key={i} style={{ fontWeight: 600, color: "#dde", marginTop: "0.2rem" }}>{line.slice(2, -2)}</div>;
        if (line.startsWith("- ") || line.startsWith("* ")) return <div key={i} style={{ paddingLeft: "1rem", marginTop: "0.15rem" }}>• {renderInline(line.slice(2), trackData)}</div>;
        if (/^\d+\. /.test(line)) return <div key={i} style={{ paddingLeft: "1rem", marginTop: "0.15rem" }}>{line}</div>;
        if (line.trim() === "") return <div key={i} style={{ height: "0.5rem" }} />;
        return <div key={i}>{renderInline(line, trackData)}</div>;
      })}
    </div>
  );
}

function renderInline(text, trackData) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**")) return <strong key={i} style={{ color: "#eef" }}>{p.slice(2, -2)}</strong>;
    if (p.startsWith("`")  && p.endsWith("`"))  return <code key={i} style={{ background: "#0a0a18", border: "1px solid #222240", padding: "1px 5px", borderRadius: "4px", fontFamily: "'Fira Code',monospace", fontSize: "0.82em", color: trackData?.color || "#0f0" }}>{p.slice(1, -1)}</code>;
    return p;
  });
}

function CodeBlock({ code, lang, trackData }) {
  const [copied, setCopied] = useState(false);
  const [runOutput, setRunOutput] = useState(null);

  const copyCode = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  // runs JS inline using a sandboxed Function — captures console output
  // NOTE: this isn't truly sandboxed (window is still accessible), but fine for a learning context
  const runJs = () => {
    try {
      const logs = [];
      const fakeConsole = {
        log:   (...args) => logs.push(args.join(" ")),
        error: (...args) => logs.push("❌ " + args.join(" ")),
        warn:  (...args) => logs.push("⚠️ " + args.join(" "))
      };
      new Function("console", code)(fakeConsole);
      setRunOutput(logs.join("\n") || "(no output)");
    } catch (e) {
      setRunOutput("❌ " + e.message);
    }
  };

  const canRun = ["js", "javascript"].includes(lang?.toLowerCase());

  return (
    <div style={styles.codeBlock}>
      <div style={{ ...styles.codeHeader, borderBottomColor: trackData?.color + "22" }}>
        <span style={{ ...styles.codeLang, color: trackData?.color }}>{lang || "code"}</span>
        <div style={{ display: "flex", gap: "0.4rem" }}>
          {canRun && (
            <button style={styles.codeBtn} onClick={runJs}>▶ Run</button>
          )}
          <button style={styles.codeBtn} onClick={copyCode}>
            {copied ? "✓ Copied" : "Copy"}
          </button>
        </div>
      </div>
      <pre style={styles.codePre}>{code}</pre>
      {runOutput !== null && (
        <div style={styles.codeOutput}>
          <div style={{ fontSize: "0.72rem", color: "#556", marginBottom: "0.25rem" }}>OUTPUT</div>
          <pre style={{ color: "#39ff14", fontFamily: "'Fira Code',monospace", fontSize: "0.8rem", margin: 0 }}>
            {runOutput}
          </pre>
        </div>
      )}
    </div>
  );
}

function TypingIndicator({ trackData }) {
  return (
    <div style={styles.aiRow} className="fadein">
      <div style={{ ...styles.aiAvatar, background: trackData?.glow, border: `1px solid ${trackData?.color}44` }}>
        🤖
      </div>
      <div style={{ ...styles.aiBubble, padding: "0.8rem 1.2rem" }}>
        <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
          {[0, 1, 2].map(i => (
            <div
              key={i}
              style={{
                width: 7, height: 7, borderRadius: "50%",
                background: trackData?.color || "#aaa",
                animation: `bounce .9s ease ${i * 0.2}s infinite`
              }}
            />
          ))}
          <span style={{ fontSize: "0.78rem", color: "#556", marginLeft: "0.5rem" }}>
            AI thinking...
          </span>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ mode, trackData }) {
  const content = {
    learn:   { icon: "📚", title: "Pick a topic",          sub: "Select something from the sidebar and I'll start teaching you hands-on." },
    project: { icon: "🏗️", title: "Choose a project",     sub: "Pick a project from the sidebar and we'll build it step by step." },
    review:  { icon: "🔍", title: "Paste your code",       sub: "Drop any code below and I'll review it — bugs, performance, readability." },
    debug:   { icon: "🐛", title: "Share the error",       sub: "Paste your code and the error message. I'll help you track it down." },
  };
  const c = content[mode] || content.learn;

  return (
    <div style={styles.emptyState}>
      <div style={{ fontSize: "3.5rem", marginBottom: "1rem" }}>{c.icon}</div>
      <div style={{ fontWeight: 700, fontSize: "1.2rem", color: "#dde", marginBottom: "0.5rem" }}>{c.title}</div>
      <div style={{ color: "#667", maxWidth: "380px", lineHeight: 1.6, fontSize: "0.88rem" }}>{c.sub}</div>
    </div>
  );
}

// quick action chips that pre-fill the input — saves a lot of typing in practice
function InputBar({ input, setInput, onSend, loading, mode, trackData, disabled, placeholder }) {
  const quickActions = {
    learn:     ["Show me a harder example", "I don't get it, explain differently", "Give me the full solution", "What's next?"],
    project:   ["I finished this step", "I'm stuck, give me a hint", "Show me the complete code", "Move to next step"],
    interview: ["I don't know this one", "Can you give a hint?", "Show the ideal answer", "Next question please"],
    review:    ["Explain the refactored version", "What's the most critical fix?", "Give me more examples"],
    debug:     ["I still can't fix it", "Give me the full solution", "Why did this happen?", "How do I avoid this?"],
  };
  const qa = quickActions[mode] || [];

  return (
    <div style={styles.inputArea}>
      {qa.length > 0 && (
        <div style={styles.quickActions}>
          {qa.map(q => (
            <button
              key={q}
              className="hqa"
              style={{ ...styles.qaBtn, borderColor: trackData?.color + "33" }}
              disabled={loading}
              onClick={() => {
                setInput(q);
                // small delay so the state has time to update before we send
                setTimeout(() => onSend(), 50);
              }}
            >
              {q}
            </button>
          ))}
        </div>
      )}

      <div style={{
        ...styles.inputRow,
        borderColor: loading ? "#222" : trackData?.color + "44",
        boxShadow: loading ? "none" : `0 0 0 1px ${trackData?.color}22`
      }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
          placeholder={placeholder}
          disabled={disabled || loading}
          rows={3}
          style={styles.inputTA}
        />
        <button
          style={{
            ...styles.sendBtn,
            background: trackData?.color,
            opacity: (!input.trim() || loading || disabled) ? 0.4 : 1
          }}
          disabled={!input.trim() || loading || disabled}
          onClick={onSend}
        >
          {loading ? "⏳" : "↑"}
        </button>
      </div>

      <div style={styles.inputHint}>Enter to send · Shift+Enter for newline · Paste code directly</div>
    </div>
  );
}

// pre-built snippets for the playground — picked these because they come up a lot in interviews
const QUICK_SNIPPETS = {
  aiml: [
    {
      name: "Linear Regression",
      lang: "js",
      code: `// Linear Regression from scratch (no libraries)
const X = [1, 2, 3, 4, 5, 6, 7, 8];
const y = [40, 50, 58, 65, 72, 80, 87, 95];
const n = X.length;

const sumX  = X.reduce((a, b) => a + b, 0);
const sumY  = y.reduce((a, b) => a + b, 0);
const sumXY = X.reduce((s, x, i) => s + x * y[i], 0);
const sumX2 = X.reduce((s, x) => s + x * x, 0);

const slope     = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX ** 2);
const intercept = (sumY - slope * sumX) / n;

console.log(\`y = \${slope.toFixed(2)}x + \${intercept.toFixed(2)}\`);
[5, 9, 12].forEach(h => console.log(\`\${h}hrs → \${(slope * h + intercept).toFixed(1)} score\`));`
    },
    {
      name: "K-Means Cluster",
      lang: "js",
      code: `// K-Means clustering — 2 clusters, 2D points
const points = [[1,1],[1.5,2],[3,4],[5,7],[3.5,5],[4.5,5],[3.5,4.5]];
let centroids = [[1,1],[5,7]];

const dist = (a, b) => Math.sqrt((a[0]-b[0])**2 + (a[1]-b[1])**2);

const assign = pts => pts.map(p =>
  centroids.map((c, i) => ({ i, d: dist(p, c) })).sort((a, b) => a.d - b.d)[0].i
);

const update = (pts, labels) => centroids.map((_, c) => {
  const cluster = pts.filter((_, i) => labels[i] === c);
  if (!cluster.length) return centroids[c];
  return [
    cluster.reduce((s, p) => s + p[0], 0) / cluster.length,
    cluster.reduce((s, p) => s + p[1], 0) / cluster.length
  ];
});

for (let i = 0; i < 10; i++) {
  const labels = assign(points);
  centroids = update(points, labels);
}

const final = assign(points);
points.forEach((p, i) => console.log(\`Point \${p} → Cluster \${final[i]}\`));`
    }
  ],
  aids: [
    {
      name: "Stats Summary",
      lang: "js",
      code: `// Descriptive statistics — the basics you always need
const data = [23, 45, 67, 12, 89, 34, 56, 78, 45, 23, 90, 12, 56, 78, 34];
const n = data.length;
const sorted = [...data].sort((a, b) => a - b);

const mean     = data.reduce((a, b) => a + b, 0) / n;
const median   = n % 2 ? sorted[Math.floor(n / 2)] : (sorted[n/2 - 1] + sorted[n/2]) / 2;
const variance = data.reduce((s, x) => s + (x - mean) ** 2, 0) / n;
const std      = Math.sqrt(variance);
const q1       = sorted[Math.floor(n / 4)];
const q3       = sorted[Math.floor(3 * n / 4)];
const iqr      = q3 - q1;

console.log("Mean:",   mean.toFixed(2));
console.log("Median:", median);
console.log("Std Dev:", std.toFixed(2));
console.log("IQR:",    iqr);

const outliers = data.filter(x => x < q1 - 1.5 * iqr || x > q3 + 1.5 * iqr);
console.log("Outliers:", outliers);`
    }
  ],
  webdev: [
    {
      name: "Event Emitter",
      lang: "js",
      code: `// EventEmitter — classic pattern worth knowing cold
class EventEmitter {
  constructor() { this.events = {}; }

  on(event, fn) {
    (this.events[event] ??= []).push(fn);
    return this;
  }

  emit(event, ...args) {
    (this.events[event] ?? []).forEach(fn => fn(...args));
    return this;
  }

  off(event, fn) {
    this.events[event] = (this.events[event] ?? []).filter(f => f !== fn);
    return this;
  }

  once(event, fn) {
    const wrapper = (...args) => { fn(...args); this.off(event, wrapper); };
    return this.on(event, wrapper);
  }
}

const bus = new EventEmitter();
bus.on("login", user => console.log("Logged in:", user.name));
bus.once("purchase", ({ item, price }) => console.log(\`Sold \${item} for $\${price}\`));

bus.emit("login", { name: "Alice" });
bus.emit("purchase", { item: "Laptop", price: 999 });
bus.emit("purchase", { item: "Phone",  price: 599 }); // won't fire — once`
    },
    {
      name: "Promise Chain",
      lang: "js",
      code: `// Promise patterns — sequential vs parallel
const delay = (ms, val) => new Promise(r => setTimeout(() => r(val), ms));

async function fetchUser(id) {
  await delay(100);
  if (!id) throw new Error("Invalid ID");
  return { id, name: "User" + id, email: \`u\${id}@app.com\` };
}

async function fetchPosts(userId) {
  await delay(80);
  return [
    { id: 1, title: "Post A", userId },
    { id: 2, title: "Post B", userId }
  ];
}

// sequential
const user = await fetchUser(42);
console.log("User:", user.name);

// parallel — much faster when requests don't depend on each other
const [u1, u2, u3] = await Promise.all([fetchUser(1), fetchUser(2), fetchUser(3)]);
console.log("Parallel:", [u1, u2, u3].map(u => u.name));

const posts = await fetchPosts(user.id);
console.log("Posts:", posts.map(p => p.title));`
    }
  ]
};

// The Playground — a split-pane editor with live JS execution and HTML preview.
// Line numbers are rendered manually because I didn't want to pull in a full editor library.
function Playground({ track }) {
  const [lang, setLang] = useState("js");
  const [code, setCode] = useState("");
  const [output, setOutput] = useState(null);
  const [running, setRunning] = useState(false);

  const tr = TRACKS[track];
  const snippets = QUICK_SNIPPETS[track] || [];

  const run = () => {
    setRunning(true);
    setOutput(null);

    // small timeout so the "Running..." state actually shows up in the UI
    setTimeout(() => {
      try {
        if (lang === "html") {
          setOutput({ type: "html", content: code });
        } else {
          const logs = [];
          const fakeConsole = {
            log:   (...args) => logs.push(args.map(x => typeof x === "object" ? JSON.stringify(x, null, 2) : String(x)).join(" ")),
            error: (...args) => logs.push("❌ " + args.join(" ")),
            warn:  (...args) => logs.push("⚠️ " + args.join(" "))
          };
          new Function("console", code)(fakeConsole);
          setOutput({ type: "text", content: logs.join("\n") || "(no output — did you forget console.log?)" });
        }
      } catch (e) {
        setOutput({ type: "text", content: "❌ Error: " + e.message });
      }
      setRunning(false);
    }, 200);
  };

  const lines = (code || "").split("\n");

  return (
    <div style={styles.playground}>
      <div style={styles.pgHeader}>
        <span style={{ fontWeight: 700, color: tr?.color }}>⚡ Live Code Playground</span>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <select
            style={styles.pgSelect}
            value={lang}
            onChange={e => { setLang(e.target.value); setOutput(null); }}
          >
            <option value="js">JavaScript (runs live)</option>
            <option value="html">HTML / CSS (preview)</option>
          </select>
          <button
            className="hbtn"
            style={{ ...styles.pgRun, background: tr?.color }}
            onClick={run}
            disabled={running}
          >
            {running ? "⏳ Running..." : "▶ Run Code"}
          </button>
          <button style={styles.pgClear} onClick={() => { setCode(""); setOutput(null); }}>
            🗑 Clear
          </button>
        </div>
      </div>

      <div style={styles.pgSnippets}>
        <span style={{ fontSize: "0.75rem", color: "#445", marginRight: "0.5rem" }}>Load snippet:</span>
        {snippets.map(s => (
          <button
            key={s.name}
            className="hqa"
            style={styles.snippetPill}
            onClick={() => { setCode(s.code); setLang(s.lang || "js"); setOutput(null); }}
          >
            {s.name}
          </button>
        ))}
        <button className="hqa" style={styles.snippetPill} onClick={() => { setCode(STARTER_SNIPPETS.lru); setLang("js"); setOutput(null); }}>
          LRU Cache
        </button>
        <button className="hqa" style={styles.snippetPill} onClick={() => { setCode(STARTER_SNIPPETS.fib); setLang("js"); setOutput(null); }}>
          Fibonacci DP
        </button>
      </div>

      <div style={styles.pgBody}>
        <div style={styles.pgEditorPane}>
          <div style={styles.pgPaneTitle}>
            <span style={{ color: tr?.color }}>{lang === "js" ? "JavaScript" : "HTML / CSS"}</span>
            <span style={{ color: "#334", fontSize: "0.72rem" }}>{lines.length} lines</span>
          </div>
          <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
            <div style={styles.lineNums}>
              {lines.map((_, i) => <div key={i}>{i + 1}</div>)}
            </div>
            <textarea
              value={code}
              onChange={e => setCode(e.target.value)}
              spellCheck={false}
              placeholder={`// Write ${lang === "html" ? "HTML" : "JavaScript"} here...\n// Click ▶ Run to execute`}
              style={styles.codeTA}
            />
          </div>
        </div>

        <div style={styles.pgOutputPane}>
          <div style={styles.pgPaneTitle}>
            <span>Output</span>
            {output && <span style={{ color: "#39ff14", fontSize: "0.72rem" }}>● Ready</span>}
          </div>
          {!output && (
            <div style={{ padding: "2rem", color: "#334", fontFamily: "'Fira Code',monospace", fontSize: "0.82rem", lineHeight: 2 }}>
              <div>$ waiting for code...</div>
              <div style={{ color: "#223" }}>$ click ▶ Run to execute</div>
            </div>
          )}
          {output?.type === "text" && (
            <pre style={styles.pgOutput}>{output.content}</pre>
          )}
          {output?.type === "html" && (
            <iframe srcDoc={output.content} style={{ flex: 1, border: "none", background: "white" }} title="preview" />
          )}
        </div>
      </div>
    </div>
  );
}

// Classic interview problems — good to have these ready to run and experiment with
const STARTER_SNIPPETS = {
  lru: `// LRU Cache — comes up in almost every systems interview
// Uses Map insertion order to track recency (Map preserves order in JS)
class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.cache = new Map();
  }

  get(key) {
    if (!this.cache.has(key)) return -1;
    const val = this.cache.get(key);
    // move to end = most recently used
    this.cache.delete(key);
    this.cache.set(key, val);
    return val;
  }

  put(key, val) {
    if (this.cache.has(key)) this.cache.delete(key);
    else if (this.cache.size >= this.capacity) {
      // first key = least recently used
      this.cache.delete(this.cache.keys().next().value);
    }
    this.cache.set(key, val);
  }
}

const cache = new LRUCache(3);
cache.put(1, "one");
cache.put(2, "two");
cache.put(3, "three");
console.log(cache.get(1));   // "one" — moves to end
cache.put(4, "four");        // evicts key 2 (least recently used)
console.log(cache.get(2));   // -1 (evicted)
console.log(cache.get(3));   // "three"
console.log(cache.get(4));   // "four"`,

  fib: `// Fibonacci: three approaches, huge performance difference
function fibNaive(n) {
  return n <= 1 ? n : fibNaive(n - 1) + fibNaive(n - 2);
}

function fibMemo(n, memo = {}) {
  if (n <= 1) return n;
  return memo[n] ??= fibMemo(n - 1, memo) + fibMemo(n - 2, memo);
}

function fibDP(n) {
  const dp = [0, 1];
  for (let i = 2; i <= n; i++) dp[i] = dp[i - 1] + dp[i - 2];
  return dp[n];
}

const n = 40;
const time = fn => { const start = Date.now(); const result = fn(n); return { result, ms: Date.now() - start }; };

const memo = time(fibMemo);
const dp   = time(fibDP);

console.log(\`fib(\${n}) = \${memo.result}\`);
console.log(\`Memoized:   \${memo.ms}ms\`);
console.log(\`Bottom-up:  \${dp.ms}ms\`);
// fibNaive(40) would take ~30 seconds — exponential time`
};

// Inject global styles as a component so they work with Vite's module system.
// Hover effects live here since inline styles can't do :hover.
function GlobalStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Fira+Code:wght@400;500;600&display=swap');

      *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { height: 100%; }
      body { background: #050510; color: #ccd; font-family: 'Outfit', sans-serif; overflow: hidden; }

      ::-webkit-scrollbar { width: 4px; height: 4px; }
      ::-webkit-scrollbar-track { background: #050510; }
      ::-webkit-scrollbar-thumb { background: #1a1a35; border-radius: 2px; }

      ::selection { background: #f59e0b33; }
      textarea, input, select { font-family: 'Outfit', sans-serif; }

      .fadein { animation: fadeSlideIn .2s ease; }
      @keyframes fadeSlideIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
      @keyframes bounce { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1); } }

      .htab:hover  { background: #0a0a20 !important; transform: translateY(-1px); }
      .htab:active { transform: none; }
      .hitem:hover { background: #0d0d22 !important; color: #ccd !important; }
      .hcard:hover { transform: translateY(-3px); filter: brightness(1.1); }
      .hcard:active { transform: none; }
      .hqa:hover   { border-color: #aaa !important; color: #ccd !important; background: #0a0a1a !important; }
      .hbtn:hover  { filter: brightness(1.15); transform: translateY(-1px); }
      .hbtn:active { transform: none; }
    `}</style>
  );
}

// All styles in one place — easier to manage in a single-file component like this.
// Using inline styles (JS objects) because we need dynamic colors from trackData.
// Hover states are handled via CSS classes above since inline styles can't do :hover.
const styles = {
  // layout
  app:      { display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden", background: "#050510" },
  body:     { display: "flex", flex: 1, overflow: "hidden" },
  main:     { flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" },

  // top bar
  topBar:   { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 1rem", height: "52px", background: "#06060f", borderBottom: "1px solid #0f0f28", flexShrink: 0, gap: "0.75rem", flexWrap: "wrap" },
  topLeft:  { display: "flex", alignItems: "center", gap: "0.75rem", flexShrink: 0 },
  topCenter:{ display: "flex", gap: "0.25rem", overflow: "auto", flexShrink: 1, alignItems: "center" },
  topRight: { display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 },

  hamburger:  { background: "transparent", border: "1px solid #111128", color: "#667", padding: "0.3rem 0.6rem", borderRadius: "6px", cursor: "pointer", fontSize: "1rem" },
  brand:      { fontWeight: 800, fontSize: "1.1rem", letterSpacing: "-0.5px" },
  brandTag:   { fontSize: "0.68rem", color: "#334", display: window.innerWidth > 900 ? "inline" : "none" },
  modeTab:    { background: "transparent", border: "1px solid #0f0f25", color: "#556", padding: "0.35rem 0.7rem", borderRadius: "8px", cursor: "pointer", fontSize: "0.78rem", fontFamily: "'Outfit',sans-serif", transition: "all .15s", whiteSpace: "nowrap" },
  modeTabActive: { fontWeight: 600 },
  levelBadge: { border: "1px solid", padding: "0.25rem 0.7rem", borderRadius: "999px", fontSize: "0.73rem", fontWeight: 600 },
  resetBtn:   { background: "transparent", border: "1px solid #111128", color: "#445", padding: "0.3rem 0.7rem", borderRadius: "6px", cursor: "pointer", fontSize: "0.73rem", fontFamily: "'Outfit',sans-serif" },

  // sidebar
  sidebar:         { width: "220px", background: "#060610", borderRight: "1px solid #0f0f28", display: "flex", flexDirection: "column", overflow: "hidden", flexShrink: 0 },
  sideTrack:       { display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.85rem", borderBottom: "1px solid" },
  sideSection:     { flex: 1, overflowY: "auto", padding: "0.5rem 0" },
  sideSectionTitle:{ fontSize: "0.66rem", fontWeight: 700, color: "#334", textTransform: "uppercase", letterSpacing: "0.08em", padding: "0.5rem 0.85rem 0.3rem" },
  sideItem:        { width: "100%", background: "transparent", border: "none", color: "#556", padding: "0.45rem 0.85rem", fontSize: "0.79rem", cursor: "pointer", textAlign: "left", fontFamily: "'Outfit',sans-serif", transition: "all .12s", display: "flex", alignItems: "center", gap: "0.5rem" },
  sideItemActive:  { fontWeight: 600, borderLeft: "2px solid" },
  sideItemDot:     (active, color) => ({ width: 5, height: 5, borderRadius: "50%", background: active ? color : "#1a1a35", flexShrink: 0 }),

  // chat pane
  chatPane:      { display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" },
  chatHeader:    { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 1.25rem", borderBottom: "1px solid", flexShrink: 0, background: "#06060f" },
  chatHeaderLeft:{ display: "flex", alignItems: "center", gap: "0.75rem" },
  clearBtn:      { background: "transparent", border: "1px solid #111128", color: "#445", padding: "0.3rem 0.7rem", borderRadius: "6px", cursor: "pointer", fontSize: "0.75rem", fontFamily: "'Outfit',sans-serif" },
  messages:      { flex: 1, overflowY: "auto", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1.1rem" },

  // message bubbles
  userRow:   { display: "flex", gap: "0.75rem", justifyContent: "flex-end", alignItems: "flex-start" },
  userBubble:{ background: "#0d0d22", border: "1px solid #1a1a35", borderRadius: "14px 2px 14px 14px", padding: "0.75rem 1rem", maxWidth: "75%" },
  userText:  { fontFamily: "'Outfit',sans-serif", fontSize: "0.87rem", color: "#ccd", whiteSpace: "pre-wrap", wordBreak: "break-word", lineHeight: 1.6 },
  avatar:    { fontSize: "1.2rem", flexShrink: 0, marginTop: "0.1rem" },
  aiRow:     { display: "flex", gap: "0.75rem", alignItems: "flex-start" },
  aiAvatar:  { width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem", flexShrink: 0, marginTop: "0.1rem" },
  aiBubble:  { background: "#07071a", border: "1px solid #0f0f28", borderRadius: "2px 14px 14px 14px", padding: "0.9rem 1.1rem", maxWidth: "90%", flex: 1 },

  // code block
  codeBlock: { background: "#030308", border: "1px solid #0f0f25", borderRadius: "10px", overflow: "hidden", margin: "0.5rem 0", fontFamily: "'Fira Code',monospace" },
  codeHeader:{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.4rem 0.85rem", borderBottom: "1px solid", background: "#04040e" },
  codeLang:  { fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" },
  codeBtn:   { background: "#0a0a1e", border: "1px solid #1a1a35", color: "#778", padding: "0.2rem 0.6rem", borderRadius: "5px", cursor: "pointer", fontSize: "0.72rem", fontFamily: "'Outfit',sans-serif" },
  codePre:   { padding: "1rem", fontSize: "0.82rem", color: "#a8b8d8", lineHeight: "1.75", overflowX: "auto", margin: 0 },
  codeOutput:{ padding: "0.6rem 1rem", borderTop: "1px solid #0f0f25", background: "#030308" },

  // input area
  inputArea:   { padding: "0.75rem 1.25rem 1rem", background: "#06060f", borderTop: "1px solid #0f0f28", flexShrink: 0 },
  quickActions:{ display: "flex", gap: "0.4rem", marginBottom: "0.6rem", flexWrap: "wrap" },
  qaBtn:       { background: "#07071a", border: "1px solid", color: "#445", padding: "0.25rem 0.7rem", borderRadius: "999px", cursor: "pointer", fontSize: "0.73rem", fontFamily: "'Outfit',sans-serif", transition: "all .12s" },
  inputRow:    { display: "flex", gap: "0.75rem", alignItems: "flex-end", background: "#07071a", border: "1px solid", borderRadius: "12px", padding: "0.5rem 0.5rem 0.5rem 1rem", transition: "border .2s, box-shadow .2s" },
  inputTA:     { flex: 1, background: "transparent", border: "none", outline: "none", color: "#ccd", fontSize: "0.88rem", lineHeight: 1.65, resize: "none", maxHeight: "120px", overflowY: "auto" },
  sendBtn:     { color: "#000", border: "none", width: 36, height: 36, borderRadius: "9px", cursor: "pointer", fontSize: "1.1rem", fontWeight: 700, flexShrink: 0, transition: "all .15s", display: "flex", alignItems: "center", justifyContent: "center" },
  inputHint:   { fontSize: "0.68rem", color: "#223", marginTop: "0.35rem", paddingLeft: "0.25rem" },

  // empty state
  emptyState: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, textAlign: "center", padding: "3rem", minHeight: "300px" },

  // playground
  playground:   { display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" },
  pgHeader:     { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.6rem 1rem", background: "#06060f", borderBottom: "1px solid #0f0f28", flexShrink: 0, flexWrap: "wrap", gap: "0.5rem" },
  pgSelect:     { background: "#07071a", border: "1px solid #111130", color: "#aab", padding: "0.4rem 0.7rem", borderRadius: "7px", fontSize: "0.8rem", cursor: "pointer" },
  pgRun:        { border: "none", color: "#000", padding: "0.45rem 1.1rem", borderRadius: "8px", cursor: "pointer", fontWeight: 700, fontFamily: "'Outfit',sans-serif", fontSize: "0.83rem", transition: "all .15s" },
  pgClear:      { background: "#07071a", border: "1px solid #111130", color: "#445", padding: "0.45rem 0.75rem", borderRadius: "8px", cursor: "pointer", fontSize: "0.8rem", fontFamily: "'Outfit',sans-serif" },
  pgSnippets:   { display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.45rem 1rem", background: "#04040c", borderBottom: "1px solid #0d0d22", flexWrap: "wrap", flexShrink: 0 },
  snippetPill:  { background: "#07071a", border: "1px solid #111130", color: "#445", padding: "0.2rem 0.65rem", borderRadius: "999px", cursor: "pointer", fontSize: "0.73rem", fontFamily: "'Outfit',sans-serif", transition: "all .12s" },
  pgBody:       { display: "flex", flex: 1, overflow: "hidden", gap: "1px", background: "#0d0d22" },
  pgEditorPane: { flex: 1, display: "flex", flexDirection: "column", background: "#030308", overflow: "hidden" },
  pgOutputPane: { flex: 1, display: "flex", flexDirection: "column", background: "#020206", overflow: "hidden" },
  pgPaneTitle:  { padding: "0.4rem 0.85rem", background: "#04040e", borderBottom: "1px solid #0d0d22", fontSize: "0.72rem", fontWeight: 600, color: "#334", display: "flex", justifyContent: "space-between", flexShrink: 0 },
  lineNums:     { padding: "0.85rem 0.5rem", textAlign: "right", color: "#1c1c38", fontFamily: "'Fira Code',monospace", fontSize: "0.8rem", lineHeight: "1.75", minWidth: "42px", borderRight: "1px solid #0d0d22", userSelect: "none", overflowY: "hidden" },
  codeTA:       { flex: 1, background: "transparent", border: "none", outline: "none", color: "#a8b8d8", padding: "0.85rem", fontFamily: "'Fira Code',monospace", fontSize: "0.82rem", lineHeight: "1.75", resize: "none", overflowY: "auto" },
  pgOutput:     { flex: 1, padding: "1rem", fontFamily: "'Fira Code',monospace", fontSize: "0.82rem", color: "#39ff14", lineHeight: "1.7", overflowY: "auto", margin: 0, background: "#020206" },

  // onboarding
  onboard:          { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#050510", position: "relative", overflow: "hidden", padding: "1rem" },
  onboardGlow:      { position: "fixed", top: "30%", left: "50%", transform: "translate(-50%,-50%)", width: "800px", height: "400px", background: "radial-gradient(ellipse,#f59e0b0d 0%,transparent 65%)", pointerEvents: "none" },
  onboardCard:      { background: "#07071a", border: "1px solid #141430", borderRadius: "20px", padding: "2.5rem", width: "100%", maxWidth: "560px", position: "relative", zIndex: 1 },
  onboardLogo:      { fontWeight: 900, fontSize: "1.6rem", color: "#f59e0b", marginBottom: "0.3rem", fontFamily: "'Outfit',sans-serif" },
  onboardSub:       { fontSize: "0.8rem", color: "#445", marginBottom: "2rem", lineHeight: 1.5 },
  onboardQ:         { fontWeight: 700, fontSize: "1.1rem", color: "#dde", marginBottom: "1.25rem" },
  onboardGrid:      { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem", marginBottom: "1.5rem" },
  onboardCard2:     { background: "#04040e", border: "1px solid #0f0f28", borderRadius: "12px", padding: "1.25rem 0.75rem", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", textAlign: "center", transition: "all .2s", fontFamily: "'Outfit',sans-serif" },
  onboardCard2Active:{ borderColor: "#f59e0b", background: "#f59e0b11", boxShadow: "0 0 20px #f59e0b18" },
  onboardNext:      { width: "100%", background: "linear-gradient(135deg,#f59e0b,#f97316)", color: "#000", border: "none", padding: "0.9rem", borderRadius: "10px", cursor: "pointer", fontWeight: 700, fontFamily: "'Outfit',sans-serif", fontSize: "1rem", transition: "all .2s" },
  onboardBack:      { background: "transparent", border: "1px solid #141430", color: "#445", padding: "0.9rem 1.5rem", borderRadius: "10px", cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontSize: "0.9rem" },
  trackCard2:       { background: "#04040e", border: "2px solid #0f0f28", borderRadius: "12px", padding: "1rem 1.25rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "1rem", transition: "all .2s", fontFamily: "'Outfit',sans-serif" },
  trackCard2Active: { boxShadow: "0 0 20px #0a0" },
};
