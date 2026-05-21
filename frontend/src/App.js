import { useState, useRef } from 'react';
import './App.css';

const LOADING_MSGS = [
  'Parsing resume structure…',
  'Extracting skill signals…',
  'Mapping domain alignment…',
  'Scoring candidate profile…',
  'Finalizing prediction…',
];

function ConfidenceBadge({ level, pct }) {
  const cls = level?.toLowerCase() === 'high' ? 'high'
    : level?.toLowerCase() === 'medium' ? 'medium' : 'low';
  return (
    <div className="conf-row">
      <span className={`conf-badge ${cls}`}>
        <span className="conf-badge-dot" />
        {level}
      </span>
      {pct != null && <span className="conf-pct">{pct}% confidence</span>}
    </div>
  );
}

function ScoreBar({ name, value, delay }) {
  const v = Math.min(100, Math.max(0, Math.round(value)));
  return (
    <div className="score-row">
      <span className="score-name">{name}</span>
      <div className="score-track">
        <div className="score-fill" style={{ width: `${v}%`, animationDelay: `${delay}s` }} />
      </div>
      <span className="score-val">{v}%</span>
    </div>
  );
}

function Placeholder() {
  return (
    <div className="placeholder">
      <div className="placeholder-ring">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
        </svg>
      </div>
      <p>Paste a resume on the left and hit <em>Analyze</em> to see the result here.</p>
    </div>
  );
}

function ResultPanel({ data }) {
  if (!data) return <Placeholder />;
  return (
    <div className="result-panel">
      <p className="res-eyebrow">Classification Result</p>
      <p className="res-category">{data.category}</p>
      <ConfidenceBadge level={data.confidence} pct={data.confidencePct} />
      <p className="res-summary">{data.summary}</p>

      {data.skills?.length > 0 && (
        <>
          <p className="section-label">Key Skills</p>
          <div className="skills-wrap">
            {data.skills.map((skill, i) => (
              <span key={i} className="skill-tag" style={{ animationDelay: `${i * 0.04}s` }}>
                {skill}
              </span>
            ))}
          </div>
        </>
      )}

      {data.scores?.length > 0 && (
        <>
          <p className="section-label">Domain Scores</p>
          <div className="scores-block">
            {data.scores.map((s, i) => (
              <ScoreBar key={i} name={s.name} value={s.value} delay={i * 0.08} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function App() {
  const [text, setText]       = useState('');
  const [loading, setLoading] = useState(false);
  const [loadMsg, setLoadMsg] = useState('');
  const [result, setResult]   = useState(null);
  const [error, setError]     = useState('');
  const timerRef              = useRef(null);
  const textareaRef           = useRef(null);

  const startLoader = () => {
    let i = 0;
    setLoadMsg(LOADING_MSGS[0]);
    timerRef.current = setInterval(() => {
      i = (i + 1) % LOADING_MSGS.length;
      setLoadMsg(LOADING_MSGS[i]);
    }, 900);
  };

  const stopLoader = () => {
    clearInterval(timerRef.current);
    setLoadMsg('');
  };

  const analyze = async () => {
    if (!text.trim() || text.trim().length < 50) {
      setError('Please paste at least 50 characters of resume content.');
      return;
    }
    setError('');
    setResult(null);
    setLoading(true);
    startLoader();

    const prompt = `You are an expert resume classifier. Analyze the resume below.
Return ONLY valid JSON, no markdown, no extra text.

Resume:
"""
${text.substring(0, 3500)}
"""

Return exactly:
{
  "category": "Job title/category",
  "confidence": "High",
  "confidencePct": 91,
  "summary": "One-sentence candidate profile (max 22 words).",
  "skills": ["Skill 1","Skill 2","Skill 3","Skill 4","Skill 5","Skill 6"],
  "scores": [
    { "name": "Technical Depth", "value": 88 },
    { "name": "Domain Match",    "value": 82 },
    { "name": "Leadership",      "value": 65 },
    { "name": "Communication",   "value": 74 },
    { "name": "Industry Fit",    "value": 79 }
  ]
}`;

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 800,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || `HTTP ${res.status}`);
      const raw    = (data.content || []).map(b => b.text || '').join('').trim();
      const clean  = raw.replace(/```json|```/g, '').trim();
      setResult(JSON.parse(clean));
    } catch (e) {
      setError('Analysis failed. Check your API key or network and try again.');
      console.error(e);
    } finally {
      setLoading(false);
      stopLoader();
    }
  };

  const clear = () => {
    setText(''); setResult(null); setError('');
    textareaRef.current?.focus();
  };

  return (
    <div className="app">

      <header className="header">
        <div className="logo">
          <div className="logo-mark">
            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          ResumeAI
        </div>
        <div className="header-status">
          <div className="status-dot" />
          API Online
        </div>
      </header>

      <main className="main">

        <div className="col-left">
          <div className="eyebrow">
            <div className="eyebrow-dot">
              <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
              </svg>
            </div>
            AI-Powered Classifier
          </div>

          <h1 className="heading">
            Scan Any<br /><span>Resume</span><br />Instantly
          </h1>

          <p className="subheading">
            Paste raw resume text below. Our model classifies the job category,
            surfaces key skills, and scores domain alignment in seconds.
          </p>

          <div className="input-header">
            <span className="input-label">Resume Input</span>
            <span className={`char-count ${text.length > 0 ? 'active' : ''}`}>
              {text.length.toLocaleString()} chars
            </span>
          </div>

          <textarea
            ref={textareaRef}
            className="resume-textarea"
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Paste resume text here — work history, skills, education…"
            disabled={loading}
          />

          <div className="cta-row">
            <button
              className="btn-primary"
              onClick={analyze}
              disabled={loading || text.trim().length < 50}
            >
              {loading ? (
                <>
                  <div className="spinner"
                    style={{ border: '1.5px solid rgba(255,255,255,0.2)', borderTopColor: '#fff' }} />
                  Analyzing…
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="5 3 19 12 5 21 5 3"/>
                  </svg>
                  Analyze Resume
                </>
              )}
            </button>

            {text.length > 0 && (
              <button className="btn-ghost" onClick={clear} disabled={loading} title="Clear">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14H6L5 6"/>
                  <path d="M10 11v6M14 11v6M9 6V4h6v2"/>
                </svg>
              </button>
            )}
          </div>

          {loading && (
            <div className="loader-block">
              <div className="loader-top">
                <div className="spinner" />
                <span className="loader-msg">{loadMsg}</span>
              </div>
              <div className="loader-track">
                <div className="loader-fill" />
              </div>
            </div>
          )}

          {error && !loading && (
            <div className="error-block">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}
        </div>

        <div className="col-right">
          <ResultPanel data={result} />
        </div>

      </main>

      <footer className="footer">
        <span>ResumeAI — v1.0.0</span>
        <span>Results are AI-generated and may not be 100% accurate.</span>
      </footer>

    </div>
  );
}