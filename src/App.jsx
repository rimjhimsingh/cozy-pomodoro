import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import musicSrc from "./assets/lofi-girl-lofi-ambient-music-365952.mp3";

const PRESETS = [
  { id: "50_10", label: "50 / 10", workMin: 50, breakMin: 10 },
  { id: "25_5", label: "25 / 5", workMin: 25, breakMin: 5 },
  { id: "90_20", label: "90 / 20", workMin: 90, breakMin: 20 },
];

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(minutes)}:${pad(seconds)}`;
}

function App() {
  const [presetId, setPresetId] = useState(
    () => localStorage.getItem("presetId") || PRESETS[0].id
  );
  const currentPreset = useMemo(
    () => PRESETS.find((p) => p.id === presetId) || PRESETS[0],
    [presetId]
  );

  const [isRunning, setIsRunning] = useState(false);
  const [phase, setPhase] = useState("work"); // 'work' | 'break'
  const [completedWorkSessions, setCompletedWorkSessions] = useState(0);

  const initialSeconds = useMemo(() => {
    return (
      (phase === "work" ? currentPreset.workMin : currentPreset.breakMin) * 60
    );
  }, [phase, currentPreset]);

  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);

  useEffect(() => {
    setSecondsLeft(initialSeconds);
  }, [initialSeconds]);

  // Persist preset
  useEffect(() => {
    localStorage.setItem("presetId", presetId);
  }, [presetId]);

  const intervalRef = useRef(null);
  const beepRef = useRef(null);
  const musicRef = useRef(null);

  // Play/pause ambient music with timer state
  useEffect(() => {
    const el = musicRef.current;
    if (!el) return;
    el.volume = 0.25;
    if (isRunning) {
      // Play returns a promise; ignore rejections (autoplay policy handled by user click)
      el.play().catch(() => {});
    } else {
      el.pause();
    }
  }, [isRunning]);

  useEffect(() => {
    if (!isRunning) return;

    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          if (beepRef.current) {
            try {
              beepRef.current.currentTime = 0;
              beepRef.current.play();
            } catch (_) {}
          }
          if (phase === "work") {
            setCompletedWorkSessions((n) => n + 1);
            setPhase("break");
          } else {
            setPhase("work");
          }
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, phase]);

  function handleStartPause() {
    setIsRunning((v) => !v);
  }

  function handleReset() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setIsRunning(false);
    setSecondsLeft(initialSeconds);
    if (musicRef.current) musicRef.current.currentTime = 0;
  }

  function handleSkip() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    if (beepRef.current) {
      try {
        beepRef.current.currentTime = 0;
        beepRef.current.play();
      } catch (_) {}
    }
    setPhase((p) => (p === "work" ? "break" : "work"));
    setIsRunning(false);
  }

  function setPhaseDirect(next) {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setIsRunning(false);
    setPhase(next);
  }

  function choosePreset(id) {
    setPresetId(id);
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setIsRunning(false);
    setPhase("work");
    if (musicRef.current) musicRef.current.currentTime = 0;
  }

  const title = useMemo(() => {
    const label = phase === "work" ? "Work" : "Break";
    return `${formatTime(secondsLeft)} • ${label} — Cozy Pomodoro`;
  }, [secondsLeft, phase]);

  useEffect(() => {
    document.title = title;
  }, [title]);

  return (
    <div className="app">
      <audio
        ref={beepRef}
        src="https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg"
        preload="auto"
      />
      <audio ref={musicRef} src={musicSrc} preload="auto" loop />

      <header className="header">
        <h1>Cozy Pomodoro 🐾☕📓</h1>
        <div className="phase-switcher">
          <button
            className={phase === "work" ? "active" : ""}
            onClick={() => setPhaseDirect("work")}
          >
            📝 Work
          </button>
          <button
            className={phase === "break" ? "active" : ""}
            onClick={() => setPhaseDirect("break")}
          >
            ☕ Break
          </button>
        </div>
        <div className="presets" role="group" aria-label="Presets">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              className={`preset ${presetId === p.id ? "selected" : ""}`}
              onClick={() => choosePreset(p.id)}
              title={`${p.workMin} min work, ${p.breakMin} min break`}
            >
              {p.id === "50_10"
                ? "🍩 50/10"
                : p.id === "25_5"
                ? "🍪 25/5"
                : "🥐 90/20"}
            </button>
          ))}
        </div>
      </header>

      <main className="timer">
        <div className={`clock ${phase}`}>
          <span>{formatTime(secondsLeft)}</span>
        </div>
        <div className="controls">
          <button onClick={handleStartPause}>
            {isRunning ? "⏸️ Pause" : "▶️ Start"}
          </button>
          <button onClick={handleReset}>🔄 Reset</button>
          <button onClick={handleSkip}>🌸 Take a break</button>
        </div>
        <div className="rounds">
          Work sessions completed: {completedWorkSessions}
        </div>
      </main>

      <footer className="footer">Stay focused. Be cozy. 🐱🥐</footer>
    </div>
  );
}

export default App;
