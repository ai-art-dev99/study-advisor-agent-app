# StudyAbroad AI — Frontend

The Next.js frontend for StudyAbroad AI: a multi-step agentic advisor that helps international students plan their academic journey to the **US, UK, and Canada**.

Ask anything — visa requirements, university selection, housing costs, scholarships — and the agent reasons through multiple steps before answering with up-to-date, grounded information.

🔗 **Live Demo:** [your-deployment-url]  
⚙️ **Backend (agent + API):** [study-abroad-assistant repo](https://github.com/ai-art-dev99/study-abroad-assistant)

---

## What makes this different from a chatbot

Most study abroad tools return static FAQ answers. This agent actually **thinks**:

```
User question
    ↓
LangGraph orchestrates multi-step reasoning
    ↓
Claude (Anthropic) decides which tools to call
    ↓
Live web search (Tavily + DuckDuckGo) + RAG over knowledge base (pgvector)
    ↓
Grounded, up-to-date answer streamed back in real time
```

No hallucinated visa deadlines. No outdated tuition figures. The agent fetches before it answers.

---

## Architecture

```
┌─────────────────────────────────┐
│   Next.js Frontend (this repo)  │
│   TypeScript · Tailwind CSS     │
│   WebSocket streaming           │
└────────────────┬────────────────┘
                 │ WebSocket
┌────────────────▼────────────────┐
│   FastAPI Backend               │
│   LangGraph · Claude Haiku      │
│   pgvector (Supabase)           │
│   Tavily + DuckDuckGo search    │
│   Deployed on Fly.io            │
└─────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js · TypeScript |
| Styling | Tailwind CSS |
| Real-time | WebSocket streaming |
| Containerisation | Docker |
| Deployment | Vercel |
| Backend (separate) | FastAPI · LangGraph · Claude · pgvector |

---

## Getting Started

```bash
# Clone the repo
git clone https://github.com/ai-art-dev99/study-advisor-agent-app.git
cd study-advisor-agent-app

# Install dependencies
npm install

# Set environment variables
cp .env.example .env
# Add your backend WebSocket URL

# Run locally
npm run dev
```

**Or with Docker:**
```bash
docker build -t study-advisor-app .
docker run -p 3000:3000 study-advisor-app
```

---

## Features

- **Real-time streaming** — responses stream token by token via WebSocket
- **Multi-domain guidance** — universities, visas, housing, scholarships, cost of living
- **Live data** — agent fetches current information before answering
- **Clean chat UI** — built with Next.js App Router and Tailwind CSS

---

## Related

- ⚙️ [Backend repo](https://github.com/ai-art-dev99/study-abroad-assistant) — FastAPI, LangGraph, Claude, RAG pipeline

---

## Author

**Amirparsa Rouhi** · [aprouhi.com](https://aprouhi.com) · [LinkedIn](https://linkedin.com/in/amirparsa-rouhi)
