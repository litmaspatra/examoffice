import { cn } from "../utils/cn";
import { formatWPM, formatAccuracy, formatTime } from "../utils/cn";
import type { TypingStats } from "../types";

interface StatsPanelProps {
  stats: TypingStats;
  compact?: boolean;
  className?: string;
}

export function StatsPanel({ stats, compact = false, className }: StatsPanelProps) {
  const statItems = [
    { 
      label: "Gross WPM", 
      value: formatWPM(stats.gross_wpm), 
      color: "text-blue-600 dark:text-blue-400",
      icon: "⚡",
    },
    { 
      label: "Net WPM", 
      value: formatWPM(stats.net_wpm), 
      color: "text-green-600 dark:text-green-400",
      icon: "🎯",
    },
    { 
      label: "Accuracy", 
      value: formatAccuracy(stats.accuracy), 
      color: "text-orange-600 dark:text-orange-400",
      icon: "📊",
    },
    { 
      label: "Errors", 
      value: stats.errors.toString(), 
      color: "text-red-600 dark:text-red-400",
      icon: "❌",
    },
    { 
      label: "Time", 
      value: formatTime(stats.elapsed_ms), 
      color: "text-purple-600 dark:text-purple-400",
      icon: "⏱️",
    },
    { 
      label: "Streak", 
      value: stats.current_streak.toString(), 
      color: "text-cyan-600 dark:text-cyan-400",
      icon: "🔥",
    },
  ];

  if (compact) {
    return (
      <div className={cn("flex flex-wrap gap-4", className)}>
        {statItems.map((item) => (
          <div 
            key={item.label} 
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg bg-card border",
              "text-sm"
            )}
          >
            <span className="text-lg">{item.icon}</span>
            <div>
              <div className={cn("text-xs text-muted-foreground", item.color)}>{item.label}</div>
              <div className={cn("font-mono font-bold text-lg", item.color)}>{item.value}</div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4", className)}>
      {statItems.map((item) => (
        <div 
          key={item.label} 
          className={cn(
            "card p-4 text-center",
            "hover:shadow-md transition-shadow"
          )}
        >
          <div className={cn("text-2xl md:text-3xl font-mono font-bold", item.color)}>
            {item.value}
          </div>
          <div className="text-xs text-muted-foreground mt-1">{item.label}</div>
          <div className="text-2xl mt-1">{item.icon}</div>
        </div>
      ))}
    </div>
  );
}

// Real-time stats bar for during typing
export function RealtimeStatsBar({ stats }: { stats: TypingStats }) {
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex gap-4 px-4 py-2 bg-card/95 backdrop-blur rounded-xl border shadow-lg animate-in">
      <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-lg">
        <span className="text-primary font-mono text-lg font-bold">{formatWPM(stats.net_wpm)}</span>
        <span className="text-xs text-muted-foreground">Net WPM</span>
      </div>
      <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 rounded-lg">
        <span className="text-green-600 dark:text-green-400 font-mono text-lg font-bold">{formatAccuracy(stats.accuracy)}</span>
        <span className="text-xs text-muted-foreground">Accuracy</span>
      </div>
      <div className="flex items-center gap-2 px-3 py-1 bg-red-500/10 rounded-lg">
        <span className="text-red-600 dark:text-red-400 font-mono text-lg font-bold">{stats.errors}</span>
        <span className="text-xs text-muted-foreground">Errors</span>
      </div>
      <div className="flex items-center gap-2 px-3 py-1 bg-purple-500/10 rounded-lg">
        <span className="text-purple-600 dark:text-purple-400 font-mono text-lg font-bold">{formatTime(stats.elapsed_ms)}</span>
        <span className="text-xs text-muted-foreground">Time</span>
      </div>
    </div>
  );
}