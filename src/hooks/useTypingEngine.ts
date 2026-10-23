import { useState, useCallback, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { TypingStats, TypingResult, TestConfig, Keystroke } from "../types";

interface UseTypingEngineOptions {
  paperId: string;
  config: TestConfig;
  onFinish?: (result: TypingResult) => void;
}

export function useTypingEngine({ paperId, config, onFinish }: UseTypingEngineOptions) {
  const [sessionId] = useState(() => `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const [stats, setStats] = useState<TypingStats>({
    total_keystrokes: 0,
    correct_keystrokes: 0,
    errors: 0,
    gross_wpm: 0,
    net_wpm: 0,
    accuracy: 100,
    elapsed_ms: 0,
    current_streak: 0,
    best_streak: 0,
  });
  const [keystrokeLog, setKeystrokeLog] = useState<Keystroke[]>([]);
  const [heatmap, setHeatmap] = useState<Record<string, number>>({});
  const [progress, setProgress] = useState(0);
  const [finished, setFinished] = useState(false);
  const [targetText, setTargetText] = useState("");
  const [targetGraphemes, setTargetGraphemes] = useState<string[]>([]);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const statsRef = useRef(stats);
  const keystrokeLogRef = useRef(keystrokeLog);
  const heatmapRef = useRef(heatmap);

  // Keep refs in sync
  useEffect(() => { statsRef.current = stats; }, [stats]);
  useEffect(() => { keystrokeLogRef.current = keystrokeLog; }, [keystrokeLog]);
  useEffect(() => { heatmapRef.current = heatmap; }, [heatmap]);

  // Initialize session
  useEffect(() => {
    let mounted = true;

    const initSession = async () => {
      try {
        // For now, we'll get the paper text from the backend
        // In a real implementation, we'd fetch the paper and extract text
        const result = await invoke<{ text: string; graphemes: string[] }>("start_typing_session", {
          sessionId,
          paperId,
          config,
        });

        if (mounted) {
          setTargetText(result.text);
          setTargetGraphemes(result.graphemes);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Failed to start session");
        }
      }
    };

    initSession();

    return () => {
      mounted = false;
    };
  }, [sessionId, paperId, config]);

  // Process keystroke
  const processKeystroke = useCallback(async (char: string) => {
    if (finished) return;

    try {
      const newStats = await invoke<TypingStats>("process_keystroke", {
        sessionId,
        char,
      });

      // Update local state optimistically
      setStats(newStats);
      
      // Get updated log and heatmap
      const [newLog, newHeatmap, newProgress, newFinished, newPosition] = await Promise.all([
        invoke<Keystroke[]>("get_keystroke_log", { sessionId }),
        invoke<Record<string, number>>("get_heatmap", { sessionId }),
        invoke<number>("get_progress", { sessionId }),
        invoke<boolean>("is_finished", { sessionId }),
        invoke<number>("get_current_position", { sessionId }),
      ]);

      setKeystrokeLog(newLog);
      setHeatmap(newHeatmap);
      setProgress(newProgress);
      setCurrentPosition(newPosition);
      
      if (newFinished && !finished) {
        setFinished(true);
        // Finalize and save
        const result = await invoke<TypingResult>("finish_typing_session", {
          sessionId,
        });
        onFinish?.(result);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process keystroke");
    }
  }, [sessionId, finished, onFinish]);

  // Handle keyboard input
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Prevent default for certain keys
    if (e.key === "Backspace" && !config.allow_backspace) {
      e.preventDefault();
      return;
    }
    
    if (e.key === "Tab") {
      e.preventDefault();
      processKeystroke("\t");
      return;
    }
    
    if (e.key === "Enter") {
      e.preventDefault();
      processKeystroke("\n");
      return;
    }
    
    // Handle regular characters
    if (e.key.length === 1 || e.key === "Backspace") {
      e.preventDefault();
      processKeystroke(e.key === "Backspace" ? "\b" : e.key);
    }
  }, [config.allow_backspace, processKeystroke]);

  return {
    stats,
    keystrokeLog,
    heatmap,
    progress,
    finished,
    targetText,
    targetGraphemes,
    currentPosition,
    error,
    processKeystroke,
    handleKeyDown,
  };
}

// Hook for real-time stats polling (for when using backend engine)
export function useTypingStats(sessionId: string | null, interval = 100) {
  const [stats, setStats] = useState<TypingStats | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    const poll = async () => {
      try {
        const newStats = await invoke<TypingStats>("get_typing_stats", { sessionId });
        setStats(newStats);
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      }
    };

    poll();
    const timer = setInterval(poll, interval);
    return () => clearInterval(timer);
  }, [sessionId, interval]);

  return stats;
}