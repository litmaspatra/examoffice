import { useMemo } from "react";
import { cn } from "../utils/cn";
import type { Keystroke } from "../types";

interface TypingDisplayProps {
  targetText: string;
  targetGraphemes: string[];
  currentPosition: number;
  keystrokeLog: Keystroke[];
  showHeatmap?: boolean;
  heatmap?: Record<string, number>;
  language?: string;
  className?: string;
}

export function TypingDisplay({ 
  targetText, 
  targetGraphemes, 
  currentPosition, 
  keystrokeLog,
  showHeatmap = false,
  heatmap = {},
  language = "english",
  className 
}: TypingDisplayProps) {
  const isDevanagari = ["hindi", "marathi", "sanskrit", "nepali"].includes(language.toLowerCase());

  const renderedChars = useMemo(() => {
    return targetGraphemes.map((grapheme, index) => {
      const logEntry = keystrokeLog[index];
      let className = "typing-text inline";
      
      if (index < currentPosition) {
        if (logEntry?.correct) {
          className += " char-correct";
        } else {
          className += " char-incorrect";
        }
      } else if (index === currentPosition) {
        className += " char-current";
      } else {
        className += " char-pending";
      }
      
      // Add heatmap intensity
      if (showHeatmap && heatmap[grapheme]) {
        const intensity = Math.min(heatmap[grapheme] / 5, 1);
        className += ` heatmap-${Math.round(intensity * 100)}`;
      }
      
      return (
        <span 
          key={index} 
          className={className}
          style={{ 
            // Heatmap background
            ...(showHeatmap && heatmap[grapheme] && {
              backgroundColor: `rgba(239, 68, 68, ${Math.min(heatmap[grapheme] / 10, 0.3)})`,
              borderRadius: "2px",
            })
          }}
        >
          {grapheme === " " ? "␣" : grapheme === "\n" ? "↵" : grapheme === "\t" ? "⇥" : grapheme}
        </span>
      );
    });
  }, [targetGraphemes, currentPosition, keystrokeLog, showHeatmap, heatmap]);

  return (
    <div 
      className={cn(
        "typing-display p-6 bg-card border rounded-xl",
        "font-mono text-lg leading-relaxed",
        "max-h-96 overflow-y-auto",
        isDevanagari && "devanagari-text",
        className
      )}
      role="text"
      aria-label="Text to type"
      aria-live="polite"
    >
      {renderedChars.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          No text to display. Select a paper to begin.
        </p>
      ) : (
        <>
          {renderedChars}
          {/* Cursor indicator */}
          <span className="typing-cursor inline-block w-1 h-6 bg-current animate-pulse ml-0.5" />
        </>
      )}
    </div>
  );
}

// Heatmap legend component
export function HeatmapLegend({ heatmap }: { heatmap: Record<string, number> }) {
  const maxErrors = useMemo(() => Math.max(...Object.values(heatmap), 1), [heatmap]);
  
  return (
    <div className="flex items-center gap-2 p-2">
      <span className="text-xs text-muted-foreground">Error heatmap:</span>
      <div className="flex gap-1">
        {[0, 1, 2, 3, 4, 5].map((level) => (
          <div
            key={level}
            className="w-3 h-3 rounded"
            style={{
              backgroundColor: `rgba(239, 68, 68, ${level / 5 * 0.8})`,
            }}
            title={`${level} errors`}
          />
        ))}
        <span className="text-xs text-muted-foreground ml-2">More errors →</span>
      </div>
    </div>
  );
}