import { useState } from "react";
import { 
  FileText, Download, Upload, Plus, Edit, Trash2, 
  Eye, Copy, Check, X, ChevronLeft, ChevronRight,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Bold, Italic, Underline, Type, Font, TextHeight,
  Minus, Maximize2, Minimize2
} from "lucide-react";
import { cn } from "../utils/cn";
import type { ExamPaper, PaperSegment, FormatSpec, SegmentType, Language } from "../types";

const DEFAULT_FORMAT_SPEC: FormatSpec = {
  font_family: "Noto Sans Devanagari",
  font_size: 16,
  font_weight: "normal",
  font_style: "normal",
  text_align: "left",
  text_decoration: "none",
  line_height: 1.5,
  margin: "0",
  indent: 0,
};

const SEGMENT_TYPES: { value: SegmentType; label: string }[] = [
  { value: "paragraph", label: "Paragraph" },
  { value: "heading", label: "Heading" },
  { value: "table", label: "Table" },
  { value: "list", label: "List" },
  { value: "signature", label: "Signature" },
  { value: "date", label: "Date" },
  { value: "reference", label: "Reference" },
  { value: "subject", label: "Subject" },
  { value: "body", label: "Body" },
  { value: "closing", label: "Closing" },
  { value: "enclosure", label: "Enclosure" },
  { value: "copy_to", label: "Copy To" },
];

const ALIGN_OPTIONS = [
  { value: "left", label: "Left", icon: AlignLeft },
  { value: "center", label: "Center", icon: AlignCenter },
  { value: "right", label: "Right", icon: AlignRight },
  { value: "justify", label: "Justify", icon: AlignJustify },
];

export function Typography() {
  const [paper, setPaper] = useState<ExamPaper>({
    version: 1,
    metadata: {
      id: "new-paper",
      title: "New Formatting Paper",
      description: "A letter formatting exercise",
      language: "hindi",
      paper_type: "formatting",
      author: "Examoffice User",
      license: "CC0-1.0",
      tags: ["formatting", "hindi"],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      version: "1.0",
    },
    requirements: {
      name: "Custom Formatting",
      min_net_wpm: null,
      min_accuracy: 95,
      max_errors: 10,
      duration_minutes: 30,
      scoring_method: "standard",
    },
    segments: [
      {
        id: "1",
        segment_type: "heading",
        content: "कार्यालय आदेश",
        expected_format: {
          ...DEFAULT_FORMAT_SPEC,
          font_size: 20,
          font_weight: "bold",
          text_align: "center",
        },
        marks: 5,
      },
      {
        id: "2",
        segment_type: "heading",
        content: "कार्यालय ज्ञापन",
        expected_format: {
          ...DEFAULT_FORMAT_SPEC,
          font_size: 16,
          text_align: "center",
          text_decoration: "underline",
        },
        marks: 5,
      },
      {
        id: "3",
        segment_type: "body",
        content: "यह सूचित किया जाता है कि कल दिनांक 15 अक्टूबर 2024 को कार्यालय में विशेष बैठक आयोजित की जाएगी। सभी अधिकारी एवं कर्मचारी समय पर उपस्थित हों।",
        expected_format: {
          ...DEFAULT_FORMAT_SPEC,
          font_size: 16,
          text_align: "justify",
          indent: 24,
        },
        marks: 10,
      },
      {
        id: "4",
        segment_type: "signature",
        content: "हस्ताक्षर\nवरिष्ठ अधिकारी\nकार्यालय प्रमुख",
        expected_format: {
          ...DEFAULT_FORMAT_SPEC,
          font_size: 16,
          font_weight: "bold",
          text_align: "right",
        },
        marks: 5,
      },
    ],
    keyboard_layout: undefined,
  });

  const [editingSegmentId, setEditingSegmentId] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  const addSegment = () => {
    const newSegment: PaperSegment = {
      id: Date.now().toString(),
      segment_type: "paragraph",
      content: "",
      expected_format: { ...DEFAULT_FORMAT_SPEC },
    };
    setPaper(prev => ({
      ...prev,
      segments: [...prev.segments, newSegment],
      metadata: { ...prev.metadata, updated_at: new Date().toISOString() },
    }));
  };

  const updateSegment = (id: string, updates: Partial<PaperSegment>) => {
    setPaper(prev => ({
      ...prev,
      segments: prev.segments.map(s => s.id === id ? { ...s, ...updates } : s),
      metadata: { ...prev.metadata, updated_at: new Date().toISOString() },
    }));
  };

  const deleteSegment = (id: string) => {
    setPaper(prev => ({
      ...prev,
      segments: prev.segments.filter(s => s.id !== id),
      metadata: { ...prev.metadata, updated_at: new Date().toISOString() },
    }));
  };

  const moveSegment = (id: string, direction: "up" | "down") => {
    setPaper(prev => {
      const index = prev.segments.findIndex(s => s.id === id);
      if (index === -1) return prev;
      const newIndex = direction === "up" ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= prev.segments.length) return prev;
      const newSegments = [...prev.segments];
      [newSegments[index], newSegments[newIndex]] = [newSegments[newIndex], newSegments[index]];
      return {
        ...prev,
        segments: newSegments,
        metadata: { ...prev.metadata, updated_at: new Date().toISOString() },
      };
    });
  };

  const updateFormat = (segmentId: string, formatUpdates: Partial<FormatSpec>) => {
    setPaper(prev => ({
      ...prev,
      segments: prev.segments.map(s => 
        s.id === segmentId 
          ? { ...s, expected_format: { ...s.expected_format, ...formatUpdates } }
          : s
      ),
      metadata: { ...prev.metadata, updated_at: new Date().toISOString() },
    }));
  };

  const handleExport = () => {
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
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (imported.metadata && imported.segments) {
          setPaper(imported);
        }
      } catch (err) {
        alert("Invalid paper format");
      }
    };
    reader.readAsText(file);
  };

  const getLanguageName = (lang: Language) => {
    const names: Record<string, string> = {
      english: "English",
      hindi: "Hindi (हिंदी)",
      marathi: "Marathi (मराठी)",
      gujarati: "Gujarati (ગુજરાતી)",
      punjabi: "Punjabi (ਪੰਜਾਬੀ)",
      tamil: "Tamil (தமிழ்)",
      telugu: "Telugu (తెలుగు)",
      kannada: "Kannada (ಕನ್ನಡ)",
      malayalam: "Malayalam (മലയാളം)",
      bengali: "Bengali (বাংলা)",
      oriya: "Odia (ଓଡ଼ିଆ)",
      assamese: "Assamese (অসমীয়া)",
      urdu: "Urdu (اردو)",
    };
    return names[lang as string] || lang;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Typography & Formatting</h1>
          <p className="text-muted-foreground mt-1">
            Create letter formatting exercises with precise font, size, alignment, and style requirements.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="btn-outline">
            <Download className="h-4 w-4 mr-1" />
            Export JSON
          </button>
          <label className="btn-outline cursor-pointer">
            <Upload className="h-4 w-4 mr-1" />
            Import JSON
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
        </div>
      </div>

      {/* Paper Metadata */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4">Paper Metadata</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Paper ID</label>
            <input
              type="text"
              value={paper.metadata.id}
              onChange={(e) => setPaper(prev => ({ ...prev, metadata: { ...prev.metadata, id: e.target.value } }))}
              className="input font-mono"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              type="text"
              value={paper.metadata.title}
              onChange={(e) => setPaper(prev => ({ ...prev, metadata: { ...prev.metadata, title: e.target.value } }))}
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Language</label>
            <select
              value={paper.metadata.language}
              onChange={(e) => setPaper(prev => ({ ...prev, metadata: { ...prev.metadata, language: e.target.value as Language } }))}
              className="input"
            >
              <option value="english">English</option>
              <option value="hindi">Hindi (हिंदी)</option>
              <option value="marathi">Marathi (मराठी)</option>
              <option value="gujarati">Gujarati (ગુજરાતી)</option>
              <option value="punjabi">Punjabi (ਪੰਜਾਬੀ)</option>
              <option value="tamil">Tamil (தமிழ்)</option>
              <option value="telugu">Telugu (తెలుగు)</option>
              <option value="kannada">Kannada (ಕನ್ನಡ)</option>
              <option value="malayalam">Malayalam (മലയാളം)</option>
              <option value="bengali">Bengali (বাংলা)</option>
              <option value="oriya">Odia (ଓଡ଼ିଆ)</option>
              <option value="assamese">Assamese (অসমীয়া)</option>
              <option value="urdu">Urdu (اردو)</option>
            </select>
          </div>
          <div className="md:col-span-3">
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={paper.metadata.description}
              onChange={(e) => setPaper(prev => ({ ...prev, metadata: { ...prev.metadata, description: e.target.value } }))}
              className="input min-h-[80px]"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tags (comma-separated)</label>
            <input
              type="text"
              value={paper.metadata.tags.join(", ")}
              onChange={(e) => setPaper(prev => ({ ...prev, metadata: { ...prev.metadata, tags: e.target.value.split(",").map(t => t.trim()).filter(Boolean) } }))}
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Duration (minutes)</label>
            <input
              type="number"
              value={paper.requirements.duration_minutes || 30}
              onChange={(e) => setPaper(prev => ({ ...prev, requirements: { ...prev.requirements, duration_minutes: parseInt(e.target.value) || 30 } }))}
              className="input w-32"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Min Accuracy %</label>
            <input
              type="number"
              min="0"
              max="100"
              value={paper.requirements.min_accuracy || 95}
              onChange={(e) => setPaper(prev => ({ ...prev, requirements: { ...prev.requirements, min_accuracy: parseInt(e.target.value) || 95 } }))}
              className="input w-32"
            />
          </div>
        </div>
      </div>

      {/* Segments */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <h2 className="text-lg font-semibold">Segments ({paper.segments.length})</h2>
        <button onClick={addSegment} className="btn-primary">
          <Plus className="h-4 w-4 mr-1" />
          Add Segment
        </button>
      </div>

      {paper.segments.length === 0 ? (
        <div className="card p-12 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">No segments yet. Add your first segment to start building the formatting exercise.</p>
          <button onClick={addSegment} className="btn-primary mt-4">
            <Plus className="h-4 w-4 mr-1" />
            Add First Segment
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {paper.segments.map((segment, index) => (
            <SegmentEditor
              key={segment.id}
              segment={segment}
              index={index}
              total={paper.segments.length}
              isEditing={editingSegmentId === segment.id}
              onEdit={() => setEditingSegmentId(segment.id)}
              onCancel={() => setEditingSegmentId(null)}
              onUpdate={updateSegment}
              onDelete={deleteSegment}
              onMove={moveSegment}
              onFormatChange={(updates) => updateFormat(segment.id, updates)}
            />
          ))}
        </div>
      )}

      {/* Live Preview */}
      <div className="card">
        <div className="border-b p-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Live Preview</h2>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={previewMode}
              onChange={(e) => setPreviewMode(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span className="text-sm">Preview Mode</span>
          </label>
        </div>
        <div className="p-6 min-h-[400px] bg-white dark:bg-gray-900 rounded-b-lg">
          {previewMode ? (
            <FormattedPreview paper={paper} />
          ) : (
            <div className="space-y-4 font-mono text-sm text-muted-foreground">
              {paper.segments.map((segment, index) => (
                <div key={segment.id} className="p-3 bg-muted/50 rounded">
                  <div className="flex items-center gap-2 text-xs mb-2">
                    <span className="px-2 py-0.5 bg-primary/10 text-primary rounded">{segment.segment_type}</span>
                    <span className="text-muted-foreground">{segment.marks ? `${segment.marks} marks` : "No marks"}</span>
                  </div>
                  <pre className="whitespace-pre-wrap text-base">{segment.content}</pre>
                  {segment.expected_format && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      Format: {JSON.stringify(segment.expected_format, null, 2)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SegmentEditor({ 
  segment, 
  index, 
  total, 
  isEditing, 
  onEdit, 
  onCancel, 
  onUpdate, 
  onDelete, 
  onMove,
  onFormatChange,
}: {
  segment: PaperSegment;
  index: number;
  total: number;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onUpdate: (id: string, updates: Partial<PaperSegment>) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, direction: "up" | "down") => void;
  onFormatChange: (updates: Partial<FormatSpec>) => void;
}) {
  const format = segment.expected_format || DEFAULT_FORMAT_SPEC;

  if (!isEditing) {
    return (
      <div className="card border-l-4 border-primary">
        <div className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className={cn(
                  "px-2 py-0.5 rounded text-xs font-medium",
                  segment.segment_type === "heading" && "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
                  segment.segment_type === "signature" && "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
                  segment.segment_type === "body" && "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
                  "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                )}>
                  {segment.segment_type}
                </span>
                {segment.marks && (
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 text-xs font-medium">
                    {segment.marks} marks
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">{segment.content}</p>
              {format && (
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span>Font: {format.font_family} {format.font_size}px</span>
                  <span>{format.font_weight} {format.font_style}</span>
                  <span>Align: {format.text_align}</span>
                  {format.text_decoration !== "none" && <span>Decoration: {format.text_decoration}</span>}
                  {format.indent && <span>Indent: {format.indent}px</span>}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={onEdit} className="btn-ghost p-1 h-8 w-8" title="Edit">
                <Edit className="h-4 w-4" />
              </button>
              <button 
                onClick={() => onMove(segment.id, "up")} 
                disabled={index === 0}
                className="btn-ghost p-1 h-8 w-8 disabled:opacity-50"
                title="Move Up"
              >
                <ChevronLeft className="h-4 w-4 rotate-90" />
              </button>
              <button 
                onClick={() => onMove(segment.id, "down")} 
                disabled={index === total - 1}
                className="btn-ghost p-1 h-8 w-8 disabled:opacity-50"
                title="Move Down"
              >
                <ChevronRight className="h-4 w-4 rotate-90" />
              </button>
              <button 
                onClick={() => onDelete(segment.id)} 
                className="btn-ghost p-1 h-8 w-8 text-red-600 hover:text-red-500 hover:bg-red-50"
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card border-l-4 border-primary">
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Editing Segment #{index + 1}</h3>
          <div className="flex gap-2">
            <button onClick={onCancel} className="btn-outline">
              <X className="h-4 w-4 mr-1" />
              Cancel
            </button>
            <button onClick={() => onUpdate(segment.id, {})} className="btn-primary">
              <Check className="h-4 w-4 mr-1" />
              Save
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Segment Type</label>
            <select
              value={segment.segment_type}
              onChange={(e) => onUpdate(segment.id, { segment_type: e.target.value as SegmentType })}
              className="input"
            >
              {SEGMENT_TYPES.map((type) => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Marks</label>
            <input
              type="number"
              min="0"
              value={segment.marks || 0}
              onChange={(e) => onUpdate(segment.id, { marks: parseInt(e.target.value) || undefined })}
              className="input w-32"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Content</label>
          <textarea
            value={segment.content}
            onChange={(e) => onUpdate(segment.id, { content: e.target.value })}
            className="input min-h-[100px] font-mono"
            rows={5}
            placeholder="Enter the text content for this segment..."
          />
        </div>

        <div className="border-t pt-4">
          <h4 className="font-medium mb-3">Expected Format</h4>
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Font Family</label>
              <input
                type="text"
                value={format.font_family || ""}
                onChange={(e) => onFormatChange({ font_family: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Font Size</label>
              <input
                type="number"
                min="8"
                max="72"
                step="0.5"
                value={format.font_size || 16}
                onChange={(e) => onFormatChange({ font_size: parseFloat(e.target.value) })}
                className="input w-32"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Font Weight</label>
              <select
                value={format.font_weight || "normal"}
                onChange={(e) => onFormatChange({ font_weight: e.target.value })}
                className="input"
              >
                <option value="normal">Normal</option>
                <option value="bold">Bold</option>
                <option value="100">100 (Thin)</option>
                <option value="200">200 (Extra Light)</option>
                <option value="300">300 (Light)</option>
                <option value="400">400 (Normal)</option>
                <option value="500">500 (Medium)</option>
                <option value="600">600 (Semi Bold)</option>
                <option value="700">700 (Bold)</option>
                <option value="800">800 (Extra Bold)</option>
                <option value="900">900 (Black)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Font Style</label>
              <select
                value={format.font_style || "normal"}
                onChange={(e) => onFormatChange({ font_style: e.target.value })}
                className="input"
              >
                <option value="normal">Normal</option>
                <option value="italic">Italic</option>
                <option value="oblique">Oblique</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Text Align</label>
              <select
                value={format.text_align || "left"}
                onChange={(e) => onFormatChange({ text_align: e.target.value })}
                className="input"
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
                <option value="justify">Justify</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Text Decoration</label>
              <select
                value={format.text_decoration || "none"}
                onChange={(e) => onFormatChange({ text_decoration: e.target.value })}
                className="input"
              >
                <option value="none">None</option>
                <option value="underline">Underline</option>
                <option value="overline">Overline</option>
                <option value="line-through">Line Through</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Line Height</label>
              <input
                type="number"
                min="1"
                max="3"
                step="0.1"
                value={format.line_height || 1.5}
                onChange={(e) => onFormatChange({ line_height: parseFloat(e.target.value) })}
                className="input w-32"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Indent (px)</label>
              <input
                type="number"
                min="0"
                max="200"
                step="4"
                value={format.indent || 0}
                onChange={(e) => onFormatChange({ indent: parseInt(e.target.value) })}
                className="input w-32"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={format.font_weight === "bold"}
                  onChange={(e) => onFormatChange({ font_weight: e.target.checked ? "bold" : "normal" })}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-sm">Bold</span>
              </label>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={format.font_style === "italic"}
                  onChange={(e) => onFormatChange({ font_style: e.target.checked ? "italic" : "normal" })}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-sm">Italic</span>
              </label>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={format.text_decoration === "underline"}
                  onChange={(e) => onFormatChange({ text_decoration: e.target.checked ? "underline" : "none" })}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-sm">Underline</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FormattedPreview({ paper }: { paper: ExamPaper }) {
  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      {paper.segments.map((segment) => {
        const format = segment.expected_format || DEFAULT_FORMAT_SPEC;
        const style: React.CSSProperties = {
          fontFamily: format.font_family,
          fontSize: `${format.font_size}px`,
          fontWeight: format.font_weight,
          fontStyle: format.font_style,
          textAlign: format.text_align,
          textDecoration: format.text_decoration,
          lineHeight: format.line_height,
          margin: format.margin,
          textIndent: format.indent ? `${format.indent}px` : undefined,
        };

        const Tag = segment.segment_type === "heading" ? "h2" : "p";
        
        return (
          <Tag key={segment.id} style={style} className="whitespace-pre-wrap">
            {segment.content}
          </Tag>
        );
      })}
    </div>
  );
}