import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { invoke } from "@tauri-apps/api/core";
import type { ExamPaper, PaperMetadata } from "../types";

// Query keys
export const paperKeys = {
  all: ["papers"] as const,
  detail: (id: string) => ["papers", id] as const,
};

// Fetch all papers
export function usePapers() {
  const queryClient = useQueryClient();

  const { data: papers = [], isLoading, error, refetch } = useQuery({
    queryKey: paperKeys.all,
    queryFn: async () => {
      try {
        return await invoke<ExamPaper[]>("list_exam_papers");
      } catch (error) {
        console.error("Failed to fetch papers:", error);
        return [];
      }
    },
  });

  const createPaper = useMutation({
    mutationFn: async (paper: ExamPaper) => {
      await invoke("create_exam_paper", { paper });
      return paper;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paperKeys.all });
    },
  });

  const deletePaper = useMutation({
    mutationFn: async (id: string) => {
      await invoke("delete_exam_paper", { paperId: id });
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paperKeys.all });
    },
  });

  const getPaper = (id: string) => {
    return papers.find((p) => p.metadata.id === id);
  };

  return {
    papers,
    loading: isLoading,
    error,
    refetch,
    createPaper: createPaper.mutateAsync,
    deletePaper: deletePaper.mutateAsync,
    getPaper,
  };
}

// Fetch a single paper
export function usePaper(id: string | undefined) {
  return useQuery({
    queryKey: id ? paperKeys.detail(id) : [],
    queryFn: async () => {
      if (!id) throw new Error("No paper ID");
      return await invoke<ExamPaper>("get_exam_paper", { paperId: id });
    },
    enabled: !!id,
  });
}

// Built-in papers
export function useBuiltinPapers() {
  return useQuery({
    queryKey: ["papers", "builtin"],
    queryFn: async () => {
      return await invoke<ExamPaper[]>("get_builtin_papers");
    },
  });
}