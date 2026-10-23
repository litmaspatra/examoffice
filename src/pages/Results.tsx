import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useSettings } from "../hooks/useSettings";
import { StatsPanel } from "../components/StatsPanel";
import { 
  ArrowLeft, Filter, Download, Calendar, Clock, 
  TrendingUp, Target, Award, FileText, Search,
  ChevronLeft, ChevronRight
} from "lucide-react";
import { cn, formatTime, formatDate, formatWPM, formatAccuracy } from "../utils/cn";
import type { TypingResult, StorageStats } from "../types";

export function Results() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPaper, setFilterPaper] = useState<string>("all");
  const [filterDate, setFilterDate] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" }>({ 
    key: "timestamp", 
    direction: "desc" 
  });
  const resultsPerPage = 10;

  const { stats: storageStats } = useSettings();

  // Mock results data - would come from a hook
  const allResults: TypingResult[] = [
    {
      paper_id: "cpct-hindi-practice-1",
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      duration_ms: 300000,
      stats: {
        total_keystrokes: 1250,
        correct_keystrokes: 1180,
        errors: 70,
        gross_wpm: 41.6,
        net_wpm: 34.6,
        accuracy: 94.4,
        elapsed_ms: 300000,
        current_streak: 45,
        best_streak: 78,
      },
      heatmap: { "क": 12, "ा": 8, "न": 5, " ": 45 },
      keystroke_log: [],
    },
    {
      paper_id: "english-typing-practice-1",
      timestamp: new Date(Date.now() - 172800000).toISOString(),
      duration_ms: 300000,
      stats: {
        total_keystrokes: 980,
        correct_keystrokes: 950,
        errors: 30,
        gross_wpm: 32.6,
        net_wpm: 31.0,
        accuracy: 96.9,
        elapsed_ms: 300000,
        current_streak: 67,
        best_streak: 89,
      },
      heatmap: { "e": 8, "t": 5, " ": 32 },
      keystroke_log: [],
    },
    {
      paper_id: "cpct-hindi-practice-1",
      timestamp: new Date(Date.now() - 259200000).toISOString(),
      duration_ms: 300000,
      stats: {
        total_keystrokes: 1100,
        correct_keystrokes: 1020,
        errors: 80,
        gross_wpm: 36.6,
        net_wpm: 31.3,
        accuracy: 92.7,
        elapsed_ms: 300000,
        current_streak: 34,
        best_streak: 56,
      },
      heatmap: { "म": 15, "े": 10, " ": 40 },
      keystroke_log: [],
    },
  ];

  // Filter results
  const filteredResults = allResults.filter((result) => {
    if (searchQuery && !result.paper_id.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (filterPaper !== "all" && result.paper_id !== filterPaper) {
      return false;
    }
    if (filterDate !== "all") {
      const resultDate = new Date(result.timestamp);
      const now = new Date();
      if (filterDate === "today") {
        if (resultDate.toDateString() !== now.toDateString()) return false;
      } else if (filterDate === "week") {
        const weekAgo = new Date(now.getTime() - 7 * 86400000);
        if (resultDate < weekAgo) return false;
      } else if (filterDate === "month") {
        const monthAgo = new Date(now.getTime() - 30 * 86400000);
        if (resultDate < monthAgo) return false;
      }
    }
    return true;
  });

  // Sort results
  const sortedResults = [...filteredResults].sort((a, b) => {
    const aVal = (a as Record<string, unknown>)[sortConfig.key];
    const bVal = (b as Record<string, unknown>)[sortConfig.key];
    if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  // Paginate
  const totalPages = Math.ceil(sortedResults.length / resultsPerPage);
  const paginatedResults = sortedResults.slice(
    (currentPage - 1) * resultsPerPage,
    currentPage * resultsPerPage
  );

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const SortableHeader = ({ key, label }: { key: string; label: string }) => (
    <th
      onClick={() => handleSort(key)}
      className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground select-none"
    >
      <div className="flex items-center gap-1">
        {label}
        {sortConfig.key === key && (
          <span>{sortConfig.direction === "asc" ? "↑" : "↓"}</span>
        )}
      </div>
    </th>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link to="/" className="btn-ghost mb-2 inline-flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          <h1 className="text-3xl font-bold">Results & History</h1>
          <p className="text-muted-foreground mt-1">
            Track your progress and analyze your typing performance over time.
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn-outline">
            <Download className="h-4 w-4 mr-1" />
            Export CSV
          </button>
          <button className="btn-outline">
            <Filter className="h-4 w-4 mr-1" />
            Filters
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsPanel stats={{ 
          total_keystrokes: allResults.length,
          correct_keystrokes: 0,
          errors: 0,
          gross_wpm: storageStats?.average_wpm || 0,
          net_wpm: storageStats?.best_wpm || 0,
          accuracy: 100,
          elapsed_ms: 0,
          current_streak: 0,
          best_streak: 0,
        }} compact />
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search papers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10"
            />
          </div>
          <select
            value={filterPaper}
            onChange={(e) => setFilterPaper(e.target.value)}
            className="input w-48"
          >
            <option value="all">All Papers</option>
            <option value="cpct-hindi-practice-1">CPCT Hindi Practice</option>
            <option value="english-typing-practice-1">English Typing Practice</option>
          </select>
          <select
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="input w-40"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>
      </div>

      {/* Results Table */}
      <div className="card overflow-hidden">
        {sortedResults.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No results found</h3>
            <p className="text-muted-foreground">Try adjusting your filters or complete a test to see results.</p>
            <Link to="/practice" className="btn-primary mt-4 inline-block">
              Start a Test
            </Link>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <SortableHeader key="timestamp" label="Date & Time" />
                    <SortableHeader key="paper_id" label="Paper" />
                    <SortableHeader key="stats.gross_wpm" label="Gross WPM" />
                    <SortableHeader key="stats.net_wpm" label="Net WPM" />
                    <SortableHeader key="stats.accuracy" label="Accuracy" />
                    <SortableHeader key="stats.errors" label="Errors" />
                    <SortableHeader key="duration_ms" label="Duration" />
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paginatedResults.map((result) => (
                    <tr key={`${result.paper_id}-${result.timestamp}`} className="hover:bg-muted/50">
                      <td className="px-4 py-3 text-sm">
                        <div className="font-mono">{formatDate(result.timestamp)}</div>
                        <div className="text-xs text-muted-foreground">{formatTime(result.duration_ms)}</div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="font-medium">{result.paper_id}</span>
                      </td>
                      <td className="px-4 py-3 text-sm font-mono font-medium">
                        {formatWPM(result.stats.gross_wpm)}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono font-medium text-green-600 dark:text-green-400">
                        {formatWPM(result.stats.net_wpm)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={cn(
                          "font-medium",
                          result.stats.accuracy >= 95 ? "text-green-600" :
                          result.stats.accuracy >= 90 ? "text-yellow-600" : "text-red-600"
                        )}>
                          {formatAccuracy(result.stats.accuracy)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-red-600 dark:text-red-400">
                        {result.stats.errors}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono">
                        {formatTime(result.duration_ms)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <Link 
                            to={`/results/${result.paper_id}-${result.timestamp}`}
                            className="btn-ghost p-1 h-8 w-8"
                            title="View Details"
                          >
                            <FileText className="h-4 w-4" />
                          </Link>
                          <button className="btn-ghost p-1 h-8 w-8" title="Export">
                            <Download className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages} • {sortedResults.length} results
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="btn-outline p-2 h-8"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="btn-outline p-2 h-8"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}