import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { invoke } from "@tauri-apps/api/core";
import type { UserSettings, StorageStats } from "../types";

// Settings query keys
export const settingsKeys = {
  all: ["settings"] as const,
  stats: ["settings", "stats"] as const,
};

export function useSettings() {
  const queryClient = useQueryClient();

  const { data: settings, isLoading, error } = useQuery({
    queryKey: settingsKeys.all,
    queryFn: async () => {
      try {
        const all = await invoke<Record<string, string>>("get_all_settings");
        // Convert to UserSettings with defaults
        return {
          theme: (all.theme as UserSettings["theme"]) || "system",
          font_size: parseInt(all.font_size) || 16,
          font_family: all.font_family || "JetBrains Mono",
          sound_enabled: all.sound_enabled !== "false",
          keystroke_sound: all.keystroke_sound === "true",
          error_sound: all.error_sound !== "false",
          completion_sound: all.completion_sound !== "false",
          auto_save: all.auto_save !== "false",
          show_virtual_keyboard: all.show_virtual_keyboard !== "false",
          show_heatmap: all.show_heatmap !== "false",
          show_realtime_stats: all.show_realtime_stats !== "false",
          default_duration: parseInt(all.default_duration) || 300,
          allow_backspace: all.allow_backspace !== "false",
          language: (all.language as UserSettings["language"]) || "english",
          layout: all.layout || "qwerty",
        } as UserSettings;
      } catch (error) {
        console.error("Failed to load settings:", error);
        return null;
      }
    },
  });

  const updateSetting = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      await invoke("set_setting", { key, value });
      return { key, value };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.all });
    },
  });

  const updateSettings = useMutation({
    mutationFn: async (newSettings: Partial<UserSettings>) => {
      for (const [key, value] of Object.entries(newSettings)) {
        await invoke("set_setting", { key, value: String(value) });
      }
      return newSettings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.all });
    },
  });

  return {
    settings,
    loading: isLoading,
    error,
    updateSetting: updateSetting.mutateAsync,
    updateSettings: updateSettings.mutateAsync,
  };
}

export function useStorageStats() {
  return useQuery({
    queryKey: settingsKeys.stats,
    queryFn: async () => {
      try {
        return await invoke<StorageStats>("get_storage_stats");
      } catch (error) {
        console.error("Failed to load stats:", error);
        return {
          total_results: 0,
          total_papers: 0,
          average_wpm: null,
          best_wpm: null,
        };
      }
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}