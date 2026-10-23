import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserSettings } from "../types";

const DEFAULT_SETTINGS: UserSettings = {
  theme: "system",
  font_size: 16,
  font_family: "JetBrains Mono",
  sound_enabled: true,
  keystroke_sound: false,
  error_sound: true,
  completion_sound: true,
  auto_save: true,
  show_virtual_keyboard: true,
  show_heatmap: true,
  show_realtime_stats: true,
  default_duration: 300, // 5 minutes
  allow_backspace: true,
  language: "english",
  layout: "qwerty",
};

interface SettingsState {
  settings: UserSettings;
  loading: boolean;
  updateSettings: (settings: Partial<UserSettings>) => void;
  resetSettings: () => void;
  loadSettings: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      settings: DEFAULT_SETTINGS,
      loading: true,
      
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),
      
      resetSettings: () =>
        set({ settings: DEFAULT_SETTINGS }),
      
      loadSettings: async () => {
        set({ loading: true });
        try {
          // Load from Tauri store
          const { get_setting, get_all_settings } = await import("@tauri-apps/api/store");
          
          // For now, just use defaults
          // TODO: Implement actual Tauri store loading
          set({ loading: false });
        } catch (error) {
          console.error("Failed to load settings:", error);
          set({ loading: false });
        }
      },
    }),
    {
      name: "examoffice-settings",
      partialize: (state) => ({ settings: state.settings }),
    }
  )
);

// Hook for theme management
import { useEffect } from "react";

export function useTheme() {
  const { settings, updateSettings } = useSettingsStore();
  const theme = settings.theme;

  useEffect(() => {
    // Apply theme on mount
    const root = document.documentElement;
    if (theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  const toggleTheme = () => {
    const themes: UserSettings["theme"][] = ["light", "dark", "system"];
    const currentIndex = themes.indexOf(settings.theme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    updateSettings({ theme: nextTheme });
  };

  const setTheme = (newTheme: UserSettings["theme"]) => {
    updateSettings({ theme: newTheme });
  };

  return { theme, toggleTheme, setTheme };
}