import { useState } from "react";
import { usePapers } from "../hooks/usePapers";
import { useBuiltinPapers } from "../hooks/usePapers";
import { 
  Plus, Download, Upload, Edit, Trash2, Eye, 
  Copy, Search, Filter, FileText, BookOpen,
  Tag, Globe, Clock, Award, ExternalLink,
  LayoutGrid, List, Save, X, ArrowLeft
} from "lucide-react";
import { cn } from "../utils/cn";
import type { ExamPaper, PaperType, Language } from "../types";

export function PaperManager() {
  const { papers, loading, deletePaper, createPaper } = usePapers();
  const { data: builtinPapers = [] } = useBuiltinPapers();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPaper, setEditingPaper] = useState<ExamPaper | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterLanguage, setFilterLanguage] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const allPapers = [...papers, ...builtinPapers];
  
  const filteredPapers = allPapers.filter((paper) => {
    if (searchQuery && !paper.metadata.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !paper.metadata.id.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !paper.metadata.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))) {
      return false;
    }
    if (filterType !== "all" && paper.metadata.paper_type !== filterType) {
      return false;
    }
    if (filterLanguage !== "all" && paper.metadata.language !== filterLanguage) {
      return false;
    }
    return true;
  });

  const isBuiltin = (paper: ExamPaper) => builtinPapers.some(p => p.metadata.id === paper.metadata.id);

  const handleCreate = async (paper: Omit<ExamPaper, "metadata"> & { metadata: Omit<ExamPaper["metadata"], "id" | "created_at" | "updated_at"> }) => {
    const newPaper: ExamPaper = {
      ...paper,
      metadata: {
        ...paper.metadata,
        id: paper.metadata.id || `paper-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    };
    await createPaper(newPaper);
    setShowCreateModal(false);
  };

  const handleUpdate = async (paper: ExamPaper) => {
    const updated: ExamPaper = {
      ...paper,
      metadata: {
        ...paper.metadata,
        updated_at: new Date().toISOString(),
      },
    };
    await createPaper(updated);
    setEditingPaper(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this paper? This cannot be undone.")) {
      await deletePaper(id);
    }
  };

  const handleExport = (paper: ExamPaper) => {
    const json = JSON.stringify(paper, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${paper.metadata.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (imported.metadata && imported.segments) {
          await createPaper(imported);
        }
      } catch (err) {
        alert("Invalid paper format");
      }
    };
    reader.readAsText(file);
  };

  const getLanguageName = (lang: Language) => {
    const names: Record<string, string> = {
      english: "English", hindi: "Hindi", marathi: "Marathi", gujarati: "Gujarati",
      punjabi: "Punjabi", tamil: "Tamil", telugu: "Telugu", kannada: "Kannada",
      malayalam: "Malayalam", bengali: "Bengali", oriya: "Odia", assamese: "Assamese", urdu: "Urdu",
    };
    return names[lang as string] || lang;
  };

  const getPaperTypeName = (type: PaperType) => {
    const names: Record<string, string> = {
      typing: "Typing", formatting: "Formatting", code: "Code", mixed: "Mixed"
    };
    return names[type] || type;
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-12 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Paper Manager</h1>
          <p className="text-muted-foreground mt-1">
            Manage your exam papers. Create, edit, import, and organize typing and formatting exercises.
          </p>
        </div>
        <div className="flex gap-2">
          <label className="btn-outline cursor-pointer">
            <Upload className="h-4 w-4 mr-1" />
            Import JSON
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
          <button onClick={() => setShowCreateModal(true)} className="btn-primary">
            <Plus className="h-4 w-4 mr-1" />
            Create Paper
          </button>
        </div>
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
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="input w-40"
          >
            <option value="all">All Types</option>
            <option value="typing">Typing</option>
            <option value="formatting">Formatting</option>
            <option value="code">Code</option>
            <option value="mixed">Mixed</option>
          </select>
          <select
            value={filterLanguage}
            onChange={(e) => setFilterLanguage(e.target.value)}
            className="input w-40"
          >
            <option value="all">All Languages</option>
            <option value="english">English</option>
            <option value="hindi">Hindi</option>
            <option value="marathi">Marathi</option>
            <option value="gujarati">Gujarati</option>
            <option value="punjabi">Punjabi</option>
            <option value="tamil">Tamil</option>
            <option value="telugu">Telugu</option>
            <option value="kannada">Kannada</option>
            <option value="malayalam">Malayalam</option>
            <option value="bengali">Bengali</option>
            <option value="oriya">Odia</option>
            <option value="assamese">Assamese</option>
            <option value="urdu">Urdu</option>
          </select>
          <div className="flex gap-2">
            <button 
              onClick={() => setViewMode("grid")} 
              className={cn("btn-outline p-2", viewMode === "grid" && "bg-primary text-primary-foreground")}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button 
              onClick={() => setViewMode("list")} 
              className={cn("btn-outline p-2", viewMode === "list" && "bg-primary text-primary-foreground")}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Papers Grid/List */}
      {filteredPapers.length === 0 ? (
        <div className="card p-12 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No papers found</h3>
          <p className="text-muted-foreground mb-4">Try adjusting your filters or create a new paper.</p>
          <button onClick={() => setShowCreateModal(true)} className="btn-primary">
            <Plus className="h-4 w-4 mr-1" />
            Create Your First Paper
          </button>
        </div>
      ) : (
        <>
          {viewMode === "grid" ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredPapers.map((paper) => (
                <PaperCard 
                  key={paper.metadata.id} 
                  paper={paper} 
                  isBuiltin={isBuiltin(paper)}
                  onEdit={() => setEditingPaper(paper)}
                  onDelete={() => handleDelete(paper.metadata.id)}
                  onExport={() => handleExport(paper)}
                  onView={() => {}}
                />
              ))}
            </div>
          ) : (
            <div className="card overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Paper</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Language</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Segments</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Updated</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredPapers.map((paper) => (
                    <tr key={paper.metadata.id} className="hover:bg-muted/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {isBuiltin(paper) && <span className="text-amber-500" title="Built-in">★</span>}
                          <div>
                            <div className="font-medium">{paper.metadata.title}</div>
                            <div className="text-xs text-muted-foreground font-mono">{paper.metadata.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-xs font-medium",
                          paper.metadata.paper_type === "typing" && "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
                          paper.metadata.paper_type === "formatting" && "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
                          paper.metadata.paper_type === "code" && "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
                          "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                        )}>
                          {getPaperTypeName(paper.metadata.paper_type)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-xs font-medium",
                          paper.metadata.language === "hindi" && "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
                          paper.metadata.language === "english" && "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
                          "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                        )}>
                          {getLanguageName(paper.metadata.language)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-mono">{paper.segments.length}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {new Date(paper.metadata.updated_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {!isBuiltin(paper) && (
                            <button onClick={() => setEditingPaper(paper)} className="btn-ghost p-1 h-8 w-8" title="Edit">
                              <Edit className="h-4 w-4" />
                            </button>
                          )}
                          <button onClick={() => handleExport(paper)} className="btn-ghost p-1 h-8 w-8" title="Export">
                            <Download className="h-4 w-4" />
                          </button>
                          {!isBuiltin(paper) && (
                            <button onClick={() => handleDelete(paper.metadata.id)} className="btn-ghost p-1 h-8 w-8 text-red-600 hover:text-red-500 hover:bg-red-50" title="Delete">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || editingPaper) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="border-b p-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                {editingPaper ? "Edit Paper" : "Create New Paper"}
              </h2>
              <button onClick={() => { setShowCreateModal(false); setEditingPaper(null); }} className="btn-ghost p-1">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6">
              <PaperForm 
                initialData={editingPaper || null}
                onSubmit={editingPaper ? handleUpdate : handleCreate}
                onCancel={() => { setShowCreateModal(false); setEditingPaper(null); }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PaperCard({ paper, isBuiltin, onEdit, onDelete, onExport, onView }: { 
  paper: ExamPaper; 
  isBuiltin: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onExport: () => void;
  onView: () => void;
}) {
  return (
    <div className="card p-4 hover:shadow-lg transition-shadow h-full flex flex-col">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {isBuiltin && <span className="text-amber-500" title="Built-in">★</span>}
          <span className={cn(
            "px-2 py-0.5 rounded text-xs font-medium",
            paper.metadata.paper_type === "typing" && "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
            paper.metadata.paper_type === "formatting" && "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
            "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
          )}>
            {paper.metadata.paper_type}
          </span>
        </div>
        <div className="flex gap-1">
          <button onClick={onExport} className="btn-ghost p-1 h-8 w-8" title="Export">
            <Download className="h-4 w-4" />
          </button>
          {!isBuiltin && (
            <button onClick={onEdit} className="btn-ghost p-1 h-8 w-8" title="Edit">
              <Edit className="h-4 w-4" />
            </button>
          )}
          {!isBuiltin && (
            <button onClick={onDelete} className="btn-ghost p-1 h-8 w-8 text-red-600 hover:text-red-500 hover:bg-red-50" title="Delete">
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      
      <h3 className="font-semibold mb-1 line-clamp-1">{paper.metadata.title}</h3>
      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{paper.metadata.description}</p>
      
      <div className="flex flex-wrap gap-2 mb-4">
        <span className={cn(
          "px-2 py-0.5 rounded text-xs font-medium",
          paper.metadata.language === "hindi" && "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
          paper.metadata.language === "english" && "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
          "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
        )}>
          {paper.metadata.language}
        </span>
        {paper.metadata.tags.slice(0, 3).map((tag) => (
          <span key={tag} className="px-2 py-0.5 bg-muted text-xs rounded">{tag}</span>
        ))}
        {paper.metadata.tags.length > 3 && (
          <span className="px-2 py-0.5 bg-muted text-xs rounded">+{paper.metadata.tags.length - 3}</span>
        )}
      </div>

      <div className="mt-auto pt-4 border-t flex items-center justify-between text-xs text-muted-foreground">
        <span>{paper.segments.length} segments</span>
        <span>{paper.requirements.duration_minutes || 0} min</span>
        {paper.requirements.min_net_wpm && <span>≥{paper.requirements.min_net_wpm} WPM</span>}
      </div>
    </div>
  );
}

function PaperForm({ initialData, onSubmit, onCancel }: { 
  initialData: ExamPaper | null; 
  onSubmit: (paper: ExamPaper) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState<Partial<ExamPaper>>({
    metadata: {
      id: initialData?.metadata.id || "",
      title: initialData?.metadata.title || "",
      description: initialData?.metadata.description || "",
      language: initialData?.metadata.language || "english",
      paper_type: initialData?.metadata.paper_type || "typing",
      author: "Examoffice User",
      license: "CC0-1.0",
      tags: initialData?.metadata.tags || [],
      version: "1.0",
      source_url: undefined,
    },
    requirements: {
      name: "Custom",
      min_net_wpm: null,
      min_accuracy: null,
      max_errors: null,
      duration_minutes: 5,
      scoring_method: "standard",
    },
    segments: initialData?.segments || [],
    keyboard_layout: initialData?.keyboard_layout,
  });

  const updateField = (path: string, value: unknown) => {
    setFormData(prev => {
      const newData = JSON.parse(JSON.stringify(prev));
      const keys = path.split(".");
      let obj: unknown = newData;
      for (let i = 0; i < keys.length - 1; i++) {
        obj = (obj as Record<string, unknown>)[keys[i]];
      }
      (obj as Record<string, unknown>)[keys[keys.length - 1]] = value;
      return newData;
    });
  };

  const addSegment = () => {
    setFormData(prev => ({
      ...prev,
      segments: [
        ...(prev.segments || []),
        {
          id: `seg-${Date.now()}`,
          segment_type: "paragraph" as const,
          content: "",
          expected_format: {
            font_family: "Noto Sans Devanagari",
            font_size: 16,
            font_weight: "normal",
            font_style: "normal",
            text_align: "left",
            text_decoration: "none",
            line_height: 1.5,
            margin: "0",
            indent: 0,
          },
        },
      ],
    }));
  };

  const updateSegment = (index: number, updates: Partial<ExamPaper["segments"][0]>) => {
    setFormData(prev => ({
      ...prev,
      segments: prev.segments?.map((s, i) => i === index ? { ...s, ...updates } : s) || [],
    }));
  };

  const deleteSegment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      segments: prev.segments?.filter((_, i) => i !== index) || [],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.metadata?.title || !formData.metadata?.id) {
      alert("Please fill in title and ID");
      return;
    }
    onSubmit(formData as ExamPaper);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-1">Paper ID *</label>
          <input
            type="text"
            value={formData.metadata?.id || ""}
            onChange={(e) => updateField("metadata.id", e.target.value)}
            className="input font-mono"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Title *</label>
          <input
            type="text"
            value={formData.metadata?.title || ""}
            onChange={(e) => updateField("metadata.title", e.target.value)}
            className="input"
            required
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            value={formData.metadata?.description || ""}
            onChange={(e) => updateField("metadata.description", e.target.value)}
            className="input min-h-[80px]"
            rows={3}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Language</label>
          <select
            value={formData.metadata?.language || "english"}
            onChange={(e) => updateField("metadata.language", e.target.value)}
            className="input"
          >
            <option value="english">English</option>
            <option value="hindi">Hindi</option>
            <option value="marathi">Marathi</option>
            <option value="gujarati">Gujarati</option>
            <option value="punjabi">Punjabi</option>
            <option value="tamil">Tamil</option>
            <option value="telugu">Telugu</option>
            <option value="kannada">Kannada</option>
            <option value="malayalam">Malayalam</option>
            <option value="bengali">Bengali</option>
            <option value="oriya">Odia</option>
            <option value="assamese">Assamese</option>
            <option value="urdu">Urdu</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Paper Type</label>
          <select
            value={formData.metadata?.paper_type || "typing"}
            onChange={(e) => updateField("metadata.paper_type", e.target.value)}
            className="input"
          >
            <option value="typing">Typing</option>
            <option value="formatting">Formatting</option>
            <option value="code">Code</option>
            <option value="mixed">Mixed</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Tags (comma-separated)</label>
          <input
            type="text"
            value={formData.metadata?.tags.join(", ") || ""}
            onChange={(e) => updateField("metadata.tags", e.target.value.split(",").map(t => t.trim()).filter(Boolean))}
            className="input"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Duration (minutes)</label>
          <input
            type="number"
            min="0"
            value={formData.requirements?.duration_minutes || 5}
            onChange={(e) => updateField("requirements.duration_minutes", parseInt(e.target.value) || 5)}
            className="input w-32"
          />
        </div>
      </div>

      <div className="border-t pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Segments ({formData.segments?.length || 0})</h3>
          <button type="button" onClick={addSegment} className="btn-outline">
            <Plus className="h-4 w-4 mr-1" />
            Add Segment
          </button>
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {formData.segments?.map((segment, index) => (
            <div key={segment.id} className="card p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-muted text-xs font-medium rounded">{index + 1}</span>
                  <select
                    value={segment.segment_type}
                    onChange={(e) => updateSegment(index, { segment_type: e.target.value as any })}
                    className="input w-auto px-2 py-1 text-sm"
                  >
                    <option value="paragraph">Paragraph</option>
                    <option value="heading">Heading</option>
                    <option value="body">Body</option>
                    <option value="signature">Signature</option>
                    <option value="date">Date</option>
                    <option value="reference">Reference</option>
                    <option value="subject">Subject</option>
                    <option value="closing">Closing</option>
                    <option value="enclosure">Enclosure</option>
                    <option value="copy_to">Copy To</option>
                  </select>
                  <input
                    type="number"
                    min="0"
                    value={segment.marks || 0}
                    onChange={(e) => updateSegment(index, { marks: parseInt(e.target.value) || undefined })}
                    className="input w-20"
                    placeholder="Marks"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => deleteSegment(index)}
                  className="btn-ghost p-1 h-8 w-8 text-red-600 hover:text-red-500 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <textarea
                value={segment.content}
                onChange={(e) => updateSegment(index, { content: e.target.value })}
                className="input min-h-[80px] font-mono"
                rows={3}
                placeholder="Segment content..."
              />
              {segment.expected_format && (
                <div className="mt-2 text-xs text-muted-foreground flex flex-wrap gap-2">
                  <span>Font: {segment.expected_format.font_family} {segment.expected_format.font_size}px</span>
                  <span>{segment.expected_format.font_weight} {segment.expected_format.font_style}</span>
                  <span>Align: {segment.expected_format.text_align}</span>
                </div>
              )}
            </div>
          ))}
          {(formData.segments?.length || 0) === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>No segments yet. Add your first segment to start building the paper.</p>
            </div>
          )}
        </div>
      </div>

      <div className="border-t pt-6 flex justify-end gap-3">
        <button type="button" onClick={onCancel} className="btn-outline">
          Cancel
        </button>
        <button type="submit" className="btn-primary">
          <Save className="h-4 w-4 mr-1" />
          {initialData ? "Update Paper" : "Create Paper"}
        </button>
      </div>
    </form>
  );
}