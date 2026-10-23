import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { usePapers } from "../hooks/usePapers";
import { useTypingEngine } from "../hooks/useTypingEngine";
import { StatsPanel, RealtimeStatsBar } from "../components/StatsPanel";
import { TypingDisplay } from "../components/TypingDisplay";
import { VirtualKeyboard } from "../components/VirtualKeyboard";
import { 
  Play, Pause, Stop, RotateCcw, Settings, 
  Keyboard, Volume2, VolumeX, Eye, EyeOff,
  Download, Share2, ArrowLeft
} from "lucide-react";
import { Link } from "react-router-dom";
import { cn, formatTime } from "../utils/cn";
import type { ExamPaper, TestConfig, TypingResult, TypingStats } from "../types";

export function Practice() {
  const { papers, loading, getPaper } = usePapers();
  const navigate = useNavigate();
  
  const [selectedPaperId, setSelectedPaperId] = useState<string | null>(null);
  const [config, setConfig] = useState<TestConfig>({
    duration_seconds: 300, // 5 minutes default
    allow_backspace: true,
    require_exact_match: true,
    language: "english",
    layout: "qwerty",
  });
  const [showKeyboard, setShowKeyboard] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [result, setResult] = useState<TypingResult | null>(null);
  const [countdown, setCountdown] = useState(3);
  const [showCountdown, setShowCountdown] = useState(false);

  const paper = selectedPaperId ? getPaper(selectedPaperId) : null;
  const paperOptions = papers.filter(p => p.metadata.paper_type === "typing");

  // Initialize typing engine
  const engine = useTypingEngine({
    paperId: selectedPaperId || "",
    config,
    onFinish: (result) => {
      setResult(result);
      setIsRunning(false);
      setIsPaused(false);
    },
  });

  // Handle keyboard input
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isRunning || isPaused || result) return;
    
    // Prevent default for certain keys
    if (e.key === "Backspace" && !config.allow_backspace) {
      e.preventDefault();
      return;
    }
    
    if (e.key === "Tab") {
      e.preventDefault();
      engine.processKeystroke("\t");
      return;
    }
    
    if (e.key === "Enter") {
      e.preventDefault();
      engine.processKeystroke("\n");
      return;
    }
    
    // Handle regular characters
    if (e.key.length === 1 || e.key === "Backspace") {
      e.preventDefault();
      engine.processKeystroke(e.key === "Backspace" ? "\b" : e.key);
    }
  }, [isRunning, isPaused, result, config.allow_backspace, engine]);

  // Start countdown
  const startCountdown = useCallback(() => {
    if (!paper) return;
    setShowCountdown(true);
    setCountdown(3);
    const timer = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(timer);
          setShowCountdown(false);
          setIsRunning(true);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  }, [paper]);

  // Handle finish
  const handleFinish = useCallback(() => {
    if (!isRunning) return;
    setIsRunning(false);
    setIsPaused(false);
    // Engine will call onFinish callback
  }, [isRunning]);

  // Reset test
  const handleReset = useCallback(() => {
    setIsRunning(false);
    setIsPaused(false);
    setResult(null);
    setShowCountdown(false);
    engine.processKeystroke("\u{1b}"); // Reset signal (would need backend support)
  }, [engine]);

  // Keyboard event listener
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown as EventListener);
    return () => window.removeEventListener("keydown", handleKeyDown as EventListener);
  }, [handleKeyDown]);

  // Show paper selector if no paper selected
  if (!selectedPaperId) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Link to="/" className="btn-ghost mb-4 inline-flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
            <h1 className="text-3xl font-bold">Practice Mode</h1>
            <p className="text-muted-foreground mt-1">
              Select a paper to start practicing. Real-time WPM, accuracy, and heatmap.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {paperOptions.map((p) => (
              <Link
                key={p.metadata.id}
                to={`/practice?paper=${p.metadata.id}`}
                className="card p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={cn(
                        "px-2 py-1 rounded-full text-xs font-medium",
                        p.metadata.language === "hindi" && "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
                        p.metadata.language === "english" && "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                      )}>
                        {p.metadata.language.toUpperCase()}
                      </span>
                      <span className="text-xs text-muted-foreground">{p.metadata.tags.join(", ")}</span>
                    </div>
                    <h3 className="text-xl font-semibold mb-1">{p.metadata.title}</h3>
                    <p className="text-muted-foreground text-sm mb-3">{p.metadata.description}</p>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="px-2 py-1 rounded bg-muted">~{p.segments.reduce((sum, s) => sum + s.content.length, 0)} chars</span>
                      <span className="px-2 py-1 rounded bg-muted">{p.requirements.duration_minutes || 5} min</span>
                      <span className="px-2 py-1 rounded bg-muted">{p.requirements.min_net_wpm ? `≥${p.requirements.min_net_wpm} WPM` : "No min WPM"}</span>
                    </div>
                  </div>
                  <Play className="h-8 w-8 text-primary opacity-50 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>
            ))}
            {paperOptions.length === 0 && (
              <div className="col-span-full card p-12 text-center">
                <p className="text-muted-foreground mb-4">No typing papers available.</p>
                <Link to="/papers" className="btn-primary">
                  Create or Import Papers
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Show active test
  if (!paper) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <p className="text-muted-foreground">Paper not found</p>
        <Link to="/practice" className="btn-primary mt-4 inline-block">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Papers
        </Link>
      </div>
    );
  }

  // Countdown overlay
  if (showCountdown) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="card p-12 text-center animate-in">
          <div className="text-7xl font-bold text-primary mb-4">{countdown}</div>
          <p className="text-xl text-muted-foreground">Get ready...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link to="/practice" className="btn-ghost mb-2 inline-flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            All Papers
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{paper.metadata.title}</h1>
            <span className={cn(
              "px-2 py-1 rounded-full text-xs font-medium",
              paper.metadata.language === "hindi" && "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
              paper.metadata.language === "english" && "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
            )}>
              {paper.metadata.language.toUpperCase()}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowKeyboard(!showKeyboard)}
            className={cn("btn-outline", showKeyboard && "bg-primary text-primary-foreground")}
          >
            <Keyboard className="h-4 w-4 mr-1" />
            Keyboard
          </button>
          <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={cn("btn-outline", showHeatmap && "bg-primary text-primary-foreground")}
          >
            <Eye className="h-4 w-4 mr-1" />
            Heatmap
          </button>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={cn("btn-outline", soundEnabled ? "bg-primary text-primary-foreground" : "")}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Countdown / Timer */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={cn(
            "font-mono text-2xl md:text-3xl font-bold tabular-nums px-4 py-2 bg-card border rounded-lg",
            isRunning ? "text-green-600" : "text-muted-foreground"
          )}>
            {showCountdown ? countdown : formatTime(engine.stats.elapsed_ms)}
          </div>
          
          {!showCountdown && !result && (
            <div className="flex items-center gap-2">
              {isRunning ? (
                <button onClick={() => setIsPaused(true)} className="btn-outline">
                  <Pause className="h-4 w-4 mr-1" />
                  Pause
                </button>
              ) : isPaused ? (
                <button onClick={() => { setIsPaused(false); setIsRunning(true); }} className="btn-primary">
                  <Play className="h-4 w-4 mr-1" />
                  Resume
                </button>
              ) : (
                <button onClick={startCountdown} className="btn-primary">
                  <Play className="h-4 w-4 mr-1" />
                  Start Test
                </button>
              )}
              {(isRunning || isPaused) && (
                <button onClick={handleFinish} className="btn-destructive">
                  <Stop className="h-4 w-4 mr-1" />
                  Finish
                </button>
              )}
              {(isRunning || isPaused) && (
                <button onClick={handleReset} className="btn-outline">
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Reset
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Real-time stats bar */}
      {isRunning && !result && (
        <RealtimeStatsBar stats={engine.stats} />
      )}

      {/* Main content */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Typing area */}
        <div className="lg:col-span-8 space-y-6">
          {/* Stats panel */}
          <StatsPanel stats={engine.stats} />
          
          {/* Typing display */}
          <TypingDisplay
            targetText={paper.get_full_text()}
            targetGraphemes={engine.targetGraphemes}
            currentPosition={engine.currentPosition}
            keystrokeLog={engine.keystrokeLog}
            showHeatmap={showHeatmap}
            heatmap={engine.heatmap}
            language={paper.metadata.language}
          />
          
          {/* Progress bar */}
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${engine.progress * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>{Math.round(engine.progress * 100)}% complete</span>
            <span>{engine.currentPosition}/{engine.targetGraphemes.length} chars</span>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          {/* Virtual keyboard */}
          {showKeyboard && (
            <div className="card p-4 sticky top-24">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Keyboard className="h-4 w-4" />
                Virtual Keyboard
              </h3>
              <VirtualKeyboard
                layout={paper.metadata.language === "hindi" ? "inscript" : "qwerty"}
                activeKey={engine.targetGraphemes[engine.currentPosition]}
                correctKeys={new Set(engine.keystrokeLog.filter(k => k.correct).map(k => k.char))}
                incorrectKeys={new Set(engine.keystrokeLog.filter(k => !k.correct).map(k => k.char))}
                onKeyClick={(key) => {
                  if (key === "Backspace") engine.processKeystroke("\b");
                  else if (key === "Tab") engine.processKeystroke("\t");
                  else if (key === "Enter") engine.processKeystroke("\n");
                  else if (key === " ") engine.processKeystroke(" ");
                  else if (key.length === 1) engine.processKeystroke(key);
                }}
              />
            </div>
          )}

          {/* Paper info */}
          <div className="card p-4">
            <h3 className="font-semibold mb-3">Test Details</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Duration</dt>
                <dd className="font-mono">{config.duration_seconds ? `${config.duration_seconds / 60} min` : "Untimed"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Backspace</dt>
                <dd>{config.allow_backspace ? "Allowed" : "Disabled"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Min WPM</dt>
                <dd>{paper.requirements.min_net_wpm ? `${paper.requirements.min_net_wpm}` : "None"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Min Accuracy</dt>
                <dd>{paper.requirements.min_accuracy ? `${paper.requirements.min_accuracy}%` : "None"}</dd>
              </div>
            </dl>
          </div>

          {/* Result display */}
          {result && (
            <div className="card p-4 border-green-500/50 bg-green-500/5">
              <h3 className="font-semibold text-green-600 mb-3 flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Test Complete!
              </h3>
              <StatsPanel stats={result.stats} compact />
              <div className="mt-4 flex gap-2">
                <Link to={`/results/${result.paper_id}`} className="btn-primary flex-1">
                  View Details
                </Link>
                <button onClick={handleReset} className="btn-outline flex-1">
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Retry
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}