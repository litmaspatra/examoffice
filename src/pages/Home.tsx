import { Link } from "react-router-dom";
import { usePapers } from "../hooks/usePapers";
import { useBuiltinPapers } from "../hooks/usePapers";
import { useSettings } from "../hooks/useSettings";
import { StatsPanel } from "../components/StatsPanel";
import { TypingDisplay } from "../components/TypingDisplay";
import { VirtualKeyboard } from "../components/VirtualKeyboard";
import { 
  Play, BookOpen, Trophy, Settings, Zap, Shield, 
  Globe, Code, FileText, ArrowRight, ExternalLink,
  CheckCircle, Clock, Target, TrendingUp
} from "lucide-react";
import { formatWPM, formatAccuracy, getLanguageName, getPaperTypeName } from "../utils/cn";
import type { ExamPaper, TypingResult } from "../types";

export function Home() {
  const { papers, loading: papersLoading } = usePapers();
  const { stats, loading: statsLoading } = useSettings();

  const recentResults = []; // Would come from a hook
  
  const features = [
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Native performance with Tauri + Rust. Sub-16ms keystroke latency.",
    },
    {
      icon: Shield,
      title: "Privacy First",
      description: "No accounts, no tracking, no cloud. Your data stays on your device.",
    },
    {
      icon: Globe,
      title: "Multi-Language",
      description: "English, Hindi, Marathi, Gujarati, Punjabi, Tamil, Telugu, and more.",
    },
    {
      icon: Code,
      title: "Open Source",
      description: "MIT licensed. Community-driven. Extensible with plugins.",
    },
  ];

  const examTypes = [
    { name: "CPCT", icon: Target, color: "text-blue-600", desc: "Computer Proficiency Certification Test" },
    { name: "SSC", icon: Trophy, color: "text-green-600", desc: "Staff Selection Commission" },
    { name: "High Court", icon: Shield, color: "text-purple-600", desc: "Judicial Service Exams" },
    { name: "Formatting", icon: FileText, color: "text-orange-600", desc: "Letter/Draft Formatting" },
  ];

  if (papersLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="text-center py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Examoffice
            <span className="text-primary">.</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Free, open-source typing tutor & exam platform. 
            Practice for CPCT, SSC, High Court, and other government typing tests.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/practice" className="btn-primary text-lg px-8 py-3">
              <Play className="h-5 w-5 mr-2" />
              Start Practicing
            </Link>
            <Link to="/papers" className="btn-outline text-lg px-8 py-3">
              <BookOpen className="h-5 w-5 mr-2" />
              Browse Papers
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsPanel stats={{ 
          total_keystrokes: stats?.total_results || 0,
          correct_keystrokes: 0,
          errors: 0,
          gross_wpm: stats?.average_wpm || 0,
          net_wpm: stats?.best_wpm || 0,
          accuracy: 100,
          elapsed_ms: 0,
          current_streak: 0,
          best_streak: 0,
        }} compact />
      </section>

      {/* Features */}
      <section>
        <h2 className="text-2xl font-bold mb-6">Why Examoffice?</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature) => (
            <div key={feature.title} className="card p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Exam Types */}
      <section>
        <h2 className="text-2xl font-bold mb-6">Supported Exam Types</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {examTypes.map((exam) => (
            <Link 
              key={exam.name} 
              to="/practice" 
              className="card p-6 hover:shadow-lg transition-shadow group"
            >
              <div className="flex items-center gap-4">
                <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center", `${exam.color} bg-current/10`)}>
                  <exam.icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">{exam.name}</h3>
                  <p className="text-sm text-muted-foreground">{exam.desc}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Quick Start */}
      <section>
        <h2 className="text-2xl font-bold mb-6">Quick Start</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <Link to="/practice" className="card p-6 hover:shadow-lg transition-shadow">
            <CheckCircle className="h-10 w-10 text-green-600 mb-3" />
            <h3 className="text-xl font-semibold mb-2">1. Choose a Test</h3>
            <p className="text-muted-foreground">Select from built-in papers or create your own</p>
          </Link>
          <Link to="/typography" className="card p-6 hover:shadow-lg transition-shadow">
            <Clock className="h-10 w-10 text-blue-600 mb-3" />
            <h3 className="text-xl font-semibold mb-2">2. Practice Typing</h3>
            <p className="text-muted-foreground">Real-time WPM, accuracy, and error heatmap</p>
          </Link>
          <Link to="/results" className="card p-6 hover:shadow-lg transition-shadow">
            <TrendingUp className="h-10 w-10 text-purple-600 mb-3" />
            <h3 className="text-xl font-semibold mb-2">3. Track Progress</h3>
            <p className="text-muted-foreground">Detailed history, statistics, and improvements</p>
          </Link>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="border-t pt-8">
        <div className="card p-8 text-center bg-primary/5 border-primary/20">
          <h2 className="text-2xl font-bold mb-2">Ready to improve your typing?</h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Join thousands of users practicing for free. No registration required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/practice" className="btn-primary px-8 py-3">
              <Play className="h-5 w-5 mr-2" />
              Start Free Practice
            </Link>
            <a 
              href="https://github.com/examoffice/examoffice" 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn-outline px-8 py-3 flex items-center gap-2"
            >
              <ExternalLink className="h-5 w-5" />
              View on GitHub
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}