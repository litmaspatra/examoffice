import { useParams, Link } from "react-router-dom";
import { usePapers } from "../hooks/usePapers";
import { useTypingEngine } from "../hooks/useTypingEngine";
import { StatsPanel, RealtimeStatsBar } from "../components/StatsPanel";
import { TypingDisplay } from "../components/TypingDisplay";
import { VirtualKeyboard } from "../components/VirtualKeyboard";
import { ArrowLeft, Play, Pause, Stop, RotateCcw, Keyboard, Eye, Volume2, VolumeX, CheckCircle, Trophy, Download } from "lucide-react";
import { cn, formatTime } from "../utils/cn";
import type { ExamPaper, TestConfig, TypingResult } from "../types";
import { useState, useEffect, useCallback } from "react";

export function Exam() {
  const { paperId } = useParams<{ paperId: string }>();
  const { getPaper } = usePapers();
  
  const [config] = useState<TestConfig>({
    duration_seconds: 600, // 10 minutes for exam
    allow_backspace: false,
    require_exact_match: true,
    language: "english",
    layout: "qwerty",
  });
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [result, setResult] = useState<TypingResult | null>(null);
  const [countdown, setCountdown] = useState(5);
  const [showCountdown, setShowCountdown] = useState(false);

  const paper = paperId ? getPaper(paperId) : null;

  const engine = useTypingEngine({
    paperId: paperId || "",
    config,
    onFinish: (result) => {
      setResult(result);
      setIsRunning(false);
      setIsPaused(false);
    },
  });

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isRunning || isPaused || result) return;
    
    if (e.key === "Backspace") {
      e.preventDefault();
      return; // No backspace in exam mode
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
    
    if (e.key.length === 1) {
      e.preventDefault();
      engine.processKeystroke(e.key);
    }
  }, [isRunning, isPaused, result, engine]);

  const startCountdown = useCallback(() => {
    if (!paper) return;
    setShowCountdown(true);
    setCountdown(5);
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

  const handleFinish = useCallback(() => {
    if (!isRunning) return;
    setIsRunning(false);
    setIsPaused(false);
  }, [isRunning]);

  const handleReset = useCallback(() => {
    setIsRunning(false);
    setIsPaused(false);
    setResult(null);
    setShowCountdown(false);
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown as EventListener);
    return () => window.removeEventListener("keydown", handleKeyDown as EventListener);
  }, [handleKeyDown]);

  if (!paperId || !paper) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <h1 className="text-2xl font-bold mb-4">Exam Not Found</h1>
        <p className="text-muted-foreground mb-6">The exam paper could not be found.</p>
        <Link to="/practice" className="btn-primary inline-flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Practice
        </Link>
      </div>
    );
  }

  if (showCountdown) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="card p-12 text-center animate-in max-w-md">
          <div className="text-7xl font-bold text-red-600 mb-4">{countdown}</div>
          <p className="text-xl text-muted-foreground mb-2">Exam starting in...</p>
          <p className="text-sm text-muted-foreground">No backspace allowed. Type carefully.</p>
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
            Back to Practice
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{paper.metadata.title}</h1>
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
              EXAM MODE
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button onClick={() => setShowKeyboard(!showKeyboard)} className="btn-outline">
            <Keyboard className="h-4 w-4 mr-1" />
            Keyboard
          </button>
          <button onClick={() => setShowHeatmap(!showHeatmap)} className="btn-outline">
            <Eye className="h-4 w-4 mr-1" />
            Heatmap
          </button>
        </div>
      </div>

      {/* Exam warning */}
      <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-6 h-6 text-red-600">⚠</div>
          <div>
            <h3 className="font-semibold text-red-800 dark:text-red-200">Exam Rules</h3>
            <ul className="text-sm text-red-700 dark:text-red-300 mt-1 space-y-1">
              <li>• No backspace allowed - type carefully</li>
              <li>• Timer cannot be paused once started</li>
              <li>• Test auto-submits when time expires</li>
              <li>• Minimum WPM and accuracy required to pass</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Timer */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={cn(
            "font-mono text-2xl md:text-3xl font-bold tabular-nums px-4 py-2 bg-card border rounded-lg",
            isRunning ? "text-red-600" : "text-muted-foreground"
          )}>
            {showCountdown ? countdown : formatTime(engine.stats.elapsed_ms)}
          </div>
          
          {!showCountdown && !result && (
            <div className="flex items-center gap-2">
              {isRunning ? (
                <>Exam in progress - cannot pause</>
              ) : (
                <button onClick={startCountdown} className="btn-primary bg-red-600 hover:bg-red-700">
                  <Play className="h-4 w-4 mr-1" />
                  Start Exam
                </button>
              )}
              {isRunning && (
                <button onClick={handleFinish} className="btn-destructive">
                  <Stop className="h-4 w-4 mr-1" />
                  Submit Exam
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {isRunning && !result && <RealtimeStatsBar stats={engine.stats} />}

      {/* Main content */}
      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <StatsPanel stats={engine.stats} />
          
          <TypingDisplay
            targetText={paper.get_full_text()}
            targetGraphemes={engine.targetGraphemes}
            currentPosition={engine.currentPosition}
            keystrokeLog={engine.keystrokeLog}
            showHeatmap={showHeatmap}
            heatmap={engine.heatmap}
            language={paper.metadata.language}
          />
          
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-red-600 transition-all duration-300"
              style={{ width: `${engine.progress * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>{Math.round(engine.progress * 100)}% complete</span>
            <span>{engine.currentPosition}/{engine.targetGraphemes.length} chars</span>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
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
              />
            </div>
          )}

          <div className="card p-4">
            <h3 className="font-semibold mb-3 text-red-600">Exam Requirements</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Duration</dt>
                <dd className="font-mono">{config.duration_seconds / 60} minutes</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Backspace</dt>
                <dd className="text-red-600">NOT ALLOWED</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Min Net WPM</dt>
                <dd className="font-bold">{paper.requirements.min_net_wpm || "N/A"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Min Accuracy</dt>
                <dd className="font-bold">{paper.requirements.min_accuracy ? `${paper.requirements.min_accuracy}%` : "N/A"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Max Errors</dt>
                <dd className="font-bold">{paper.requirements.max_errors || "N/A"}</dd>
              </div>
            </dl>
          </div>

          {result && (
            <div className={cn(
              "card p-4",
              result.stats.passing ? "border-green-500/50 bg-green-500/5" : "border-red-500/50 bg-red-500/5"
            )}>
              <h3 className={cn(
                "font-semibold mb-3 flex items-center gap-2",
                result.stats.passing ? "text-green-600" : "text-red-600"
              )}>
                {result.stats.passing ? (
                  <>
                    <CheckCircle className="h-5 w-5" />
                    PASSED
                  </>
                ) : (
                  <>
                    <Trophy className="h-5 w-5" />
                    NEEDS IMPROVEMENT
                  </>
                )}
              </h3>
              <StatsPanel stats={result.stats} compact />
              <div className="mt-4 flex gap-2">
                <Link to={`/results/${paperId}`} className="btn-primary flex-1">
                  View Detailed Results
                </Link>
                <button onClick={handleReset} className="btn-outline flex-1">
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Retry Exam
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}