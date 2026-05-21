import { useState, useRef, useEffect } from 'react';
import './App.css';

const LOADING_MSGS = [
  'Parsing resume structure…',
  'Extracting skill signals…',
  'Mapping domain alignment…',
  'Scoring candidate profile…',
  'Finalizing prediction…',
];

function Placeholder() {
  return (
    <div className="placeholder">
      <div className="placeholder-ring">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="1.5"
          strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
        </svg>
      </div>
      <p>Paste a resume on the left and hit <em>Analyze</em> to see results here.</p>
    </div>
  );
}

function ResultPanel({ data }) {
  if (!data) return <Placeholder />;
  return (
    <div className="result-panel">
      <p className="res-eyebrow">Classification Result</p>
      <p className="res-category">{data.predicted_category}</p>
      <p className="res-summary">{data.message}</p>
    </div>
  );
}

export default function App() {
  const [text, setText]           = useState('');
  const [loading, setLoading]     = useState(false);
  const [loadMsg, setLoadMsg]     = useState('');
  const [result, setResult]       = useState(null);
  const [error, setError]         = useState('');
  const [apiOnline, setApiOnline] = useState(null); // null = checking
  const timerRef                  = useRef(null);
  const textareaRef               = useRef(null);

  // ── Check if API is alive on page load ──
  useEffect(() => {
    const checkApi = async () => {
      try {
        const res = await fetch('https://tr1jal-resume-scanner-backend.hf.space/predict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resume_text: 'ping' }),
        });
        // any response (even 422/400) means server is UP
        setApiOnline(true);
      } catch (e) {
        // fetch throws TypeError only on network failure = truly offline
        setApiOnline(false);
      }
    };

    checkApi();

    // re-check every 30 seconds
    const interval = setInterval(checkApi, 30000);
    return () => clearInterval(interval);
  }, []);

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

    try {
      const res = await fetch('https://tr1jal-resume-scanner-backend.hf.space/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume_text: text }),
      });

      if (!res.ok) {
        setApiOnline(false);
        throw new Error(`Server error: ${res.status}`);
      }

      const data = await res.json();
      setApiOnline(true);
      setResult(data);

    } catch (e) {
      if (e instanceof TypeError) {
        setApiOnline(false);
      }
      setError('Analysis failed. Make sure your Hugging Face backend is running.');
      console.error(e);
    } finally {
      setLoading(false);
      stopLoader();
    }
  };

  const clear = () => {
    setText('');
    setResult(null);
    setError('');
    textareaRef.current?.focus();
  };

  // ── Status label and dot class ──
  const statusLabel = apiOnline === null ? 'Checking…'
    : apiOnline ? 'API Online' : 'API Offline';

  const dotClass = apiOnline === null ? 'checking'
    : apiOnline ? 'online' : 'offline';

  return (
    <div className="app">

      <header className="header">
        <div className="logo">
          <div className="logo-mark">
            <svg viewBox="0 0 24 24" fill="none" stroke="#fff"
              strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          ResumeAI
        </div>

        <div className="header-status">
          <div className={`status-dot ${dotClass}`} />
          <span>{statusLabel}</span>
        </div>
      </header>

      <main className="main">

        <div className="col-left">
          <div className="eyebrow">
            <div className="eyebrow-dot">
              <svg viewBox="0 0 24 24" fill="none" stroke="#c7d2fe"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
            Paste raw resume text below. Our model classifies the job category
            and surfaces key insights in seconds.
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
                  <div className="spinner" />
                  Analyzing…
                </>
              ) : (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.2"
                    strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="5 3 19 12 5 21 5 3"/>
                  </svg>
                  Analyze Resume
                </>
              )}
            </button>

            {text.length > 0 && (
              <button className="btn-ghost" onClick={clear} disabled={loading} title="Clear">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round">
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
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round">
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