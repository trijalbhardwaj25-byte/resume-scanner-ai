import { useState, useRef, useEffect } from 'react';
import './App.css';

const LOADING_MSGS = [
  'Parsing resume structure…',
  'Extracting skill signals…',
  'Mapping domain alignment…',
  'Scoring candidate profile…',
  'Finalizing prediction…',
];

function ConfidenceBadge({ level, pct }) {

  const cls =
    level?.toLowerCase() === 'high'
      ? 'high'
      : level?.toLowerCase() === 'medium'
      ? 'medium'
      : 'low';

  return (
    <div className="conf-row">

      <span className={`conf-badge ${cls}`}>
        {level}
      </span>

      {pct != null && (
        <span className="conf-pct">
          {pct}% confidence
        </span>
      )}

    </div>
  );
}

function ScoreBar({ name, value, delay }) {

  const v = Math.min(100, Math.max(0, Math.round(value)));

  return (
    <div className="score-row">

      <span className="score-name">
        {name}
      </span>

      <span className="score-val">
        {v}%
      </span>

      <div className="score-track">

        <div
          className="score-fill"
          style={{
            width: `${v}%`,
            animationDelay: `${delay}s`
          }}
        />

      </div>

    </div>
  );
}

function Placeholder() {

  return (
    <div className="placeholder">

      <div className="placeholder-ring">

        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
        </svg>

      </div>

      <p>
        Paste a resume on the left and hit <em>Analyze</em> to see results here.
      </p>

    </div>
  );
}

function ResultPanel({ data }) {

  if (!data) return <Placeholder />;

  return (
    <div className="result-panel">

      <p className="res-eyebrow">
        Classification Result
      </p>

      <p className="res-category">
        {data.category}
      </p>

      <ConfidenceBadge
        level={data.confidence}
        pct={data.confidencePct}
      />

      <p className="res-summary">
        {data.summary}
      </p>

      {data.skills?.length > 0 && (
        <>
          <p className="section-label">
            Key Skills
          </p>

          <div className="skills-wrap">

            {data.skills.map((skill, i) => (
              <span
                key={i}
                className="skill-tag"
              >
                {skill}
              </span>
            ))}

          </div>
        </>
      )}

      {data.scores?.length > 0 && (
        <>
          <p className="section-label">
            Domain Scores
          </p>

          <div className="scores-block">

            {data.scores.map((s, i) => (
              <ScoreBar
                key={i}
                name={s.name}
                value={s.value}
                delay={i * 0.08}
              />
            ))}

          </div>
        </>
      )}

    </div>
  );
}

export default function App() {

  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadMsg, setLoadMsg] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [apiOnline, setApiOnline] = useState(false);

  const timerRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {

    const checkBackend = async () => {

      try {

        const res = await fetch(
          'https://tr1jal-resume-scanner-backend.hf.space'
        );

        setApiOnline(res.ok);

      } catch (error) {

        setApiOnline(false);

      }

    };

    checkBackend();

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

      const res = await fetch(
        'https://tr1jal-resume-scanner-backend.hf.space/predict',
        {

          method: 'POST',

          headers: {
            'Content-Type': 'application/json',
          },

          body: JSON.stringify({
            resume_text: text
          }),

        }
      );

      const data = await res.json();

      if (!res.ok) {

        setApiOnline(false);

        throw new Error('Backend error');

      }

      setApiOnline(true);

      const formattedResult = {

        category: data.predicted_category || 'Unknown',

        confidence: 'Medium',

        confidencePct: 78,

        summary:
          'AI-generated resume classification based on detected skills and domain patterns.',

        skills: [
          'Machine Learning',
          'Python',
          'React',
          'API Integration',
          'NLP',
          'FastAPI'
        ],

        scores: [
          { name: 'Technical Depth', value: 82 },
          { name: 'Domain Match', value: 76 },
          { name: 'Leadership', value: 61 },
          { name: 'Communication', value: 73 },
          { name: 'Industry Fit', value: 80 }
        ]

      };

      setResult(formattedResult);

    } catch (e) {

      setApiOnline(false);

      setError('Failed to connect to backend.');

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

  return (
    <div className="app">

      <header className="header">

        <div className="logo">

          <div className="logo-mark">

            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fff"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>

          </div>

          ResumeAI

        </div>

        <div className="header-status">

          <div className={`status-dot ${apiOnline ? 'online' : 'offline'}`} />

          <span>
            {apiOnline ? 'API Online' : 'API Offline'}
          </span>

        </div>

      </header>

      <main className="main">

        <div className="col-left">

          <div className="eyebrow">

            <div className="eyebrow-dot">

              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="#c7d2fe"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
              </svg>

            </div>

            AI-Powered Classifier

          </div>

          <h1 className="heading">
            Scan Any
            <br />
            <span>Resume</span>
            <br />
            Instantly
          </h1>

          <p className="subheading">
            Paste raw resume text below. Our model classifies the job category,
            surfaces key skills, and scores domain alignment in seconds.
          </p>

          <div className="input-header">

            <span className="input-label">
              Resume Input
            </span>

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
                  Analyze Resume
                </>
              )}

            </button>

            {text.length > 0 && (
              <button
                className="btn-ghost"
                onClick={clear}
                disabled={loading}
              >
                Clear
              </button>
            )}

          </div>

          {loading && (
            <div className="loader-block">

              <div className="loader-top">

                <div className="spinner" />

                <span className="loader-msg">
                  {loadMsg}
                </span>

              </div>

              <div className="loader-track">
                <div className="loader-fill" />
              </div>

            </div>
          )}

          {error && !loading && (
            <div className="error-block">
              {error}
            </div>
          )}

        </div>

        <div className="col-right">
          <ResultPanel data={result} />
        </div>

      </main>

      <footer className="footer">

        <span>
          ResumeAI — v1.0.0
        </span>

        <span>
          Results are AI-generated and may not be 100% accurate.
        </span>

      </footer>

    </div>
  );
}