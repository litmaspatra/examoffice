import { BrowserRouter, Routes, Route, Link, useLocation, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Layout } from "./components/Layout";
import { Home } from "./pages/Home";
import { Practice } from "./pages/Practice";
import { Exam } from "./pages/Exam";
import { Results } from "./pages/Results";
import { Settings } from "./pages/Settings";
import { Typography } from "./pages/Typography";
import { PaperManager } from "./pages/PaperManager";
import { useTheme } from "./hooks/useTheme";
import { usePapers } from "./hooks/usePapers";
import { useSettings } from "./hooks/useSettings";
import { ExamPaper, TestConfig, Language, PaperType } from "./types";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/practice" element={<Practice />} />
      <Route path="/exam/:paperId" element={<Exam />} />
      <Route path="/results/:resultId" element={<Results />} />
      <Route path="/typography" element={<Typography />} />
      <Route path="/papers" element={<PaperManager />} />
      <Route path="/settings" element={<Settings />} />
    </Routes>
  );
}

function AppInner() {
  const { theme, toggleTheme } = useTheme();
  const { papers, loading: papersLoading, refetch: refetchPapers } = usePapers();
  const { settings, loading: settingsLoading } = useSettings();

  useEffect(() => {
    // Apply theme to document
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  return (
    <BrowserRouter>
      <div className={`min-h-screen transition-colors duration-200 ${theme === "dark" ? "dark" : ""}`}>
        <Layout papers={papers} theme={theme} toggleTheme={toggleTheme}>
          <AppRoutes />
        </Layout>
      </div>
    </BrowserRouter>
  );
}

function App() {
  // Initialize Tauri
  useEffect(() => {
    // Check if Tauri is available
    if (window.__TAURI__) {
      console.log("Tauri is available");
    }
  }, []);

  return <AppInner />;
}

export default App;