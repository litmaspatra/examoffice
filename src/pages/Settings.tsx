import { useState } from "react";
import { useSettings } from "../hooks/useSettings";
import { 
  Sun, Moon, Monitor, Keyboard, Volume2, VolumeX,
  Eye, EyeOff, Save, RotateCcw, Shield, Database,
  Palette, Bell, Globe, Hash, Download, Upload,
  Trash2, AlertTriangle
} from "lucide-react";
import { cn } from "../utils/cn";
import type { UserSettings, Language, ScoringMethod } from "../types";

export function Settings() {
  const { settings, loading, updateSettings, updateSetting } = useSettings();
  
  const [localSettings, setLocalSettings] = useState<UserSettings | null>(null);
  const [activeTab, setActiveTab] = useState("general");
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const tabs = [
    { id: "general", label: "General", icon: Sun },
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "typing", label: "Typing", icon: Keyboard },
    { id: "audio", label: "Audio", icon: Volume2 },
    { id: "privacy", label: "Privacy & Data", icon: Shield },
    { id: "advanced", label: "Advanced", icon: Hash },
  ];

  const languages: { value: Language; label: string }[] = [
    { value: "english", label: "English" },
    { value: "hindi", label: "Hindi (हिंदी)" },
    { value: "marathi", label: "Marathi (मराठी)" },
    { value: "gujarati", label: "Gujarati (ગુજરાતી)" },
    { value: "punjabi", label: "Punjabi (ਪੰਜਾਬੀ)" },
    { value: "tamil", label: "Tamil (தமிழ்)" },
    { value: "telugu", label: "Telugu (తెలుగు)" },
    { value: "kannada", label: "Kannada (ಕನ್ನಡ)" },
    { value: "malayalam", label: "Malayalam (മലയാളം)" },
    { value: "bengali", label: "Bengali (বাংলা)" },
    { value: "oriya", label: "Odia (ଓଡ଼ିଆ)" },
    { value: "assamese", label: "Assamese (অসমীয়া)" },
    { value: "urdu", label: "Urdu (اردو)" },
  ];

  const themes: { value: UserSettings["theme"]; label: string; icon: typeof Sun }[] = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ];

  const scoringMethods: { value: ScoringMethod; label: string }[] = [
    { value: "standard", label: "Standard WPM" },
    { value: "indian_govt", label: "Indian Govt Standard" },
    { value: "cpct", label: "CPCT" },
    { value: "ssc", label: "SSC" },
  ];

  const handleSave = async () => {
    if (!localSettings) return;
    try {
      await updateSettings(localSettings);
      alert("Settings saved successfully!");
    } catch (error) {
      alert("Failed to save settings");
    }
  };

  const handleReset = async () => {
    if (confirm("Are you sure you want to reset all settings to defaults?")) {
      setLocalSettings({
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
        default_duration: 300,
        allow_backspace: true,
        language: "english",
        layout: "qwerty",
      });
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <p className="text-muted-foreground">Failed to load settings</p>
      </div>
    );
  }

  // Sync local settings with store
  if (!localSettings) {
    setLocalSettings({ ...settings });
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Customize your Examoffice experience
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleReset} className="btn-outline" disabled={!localSettings}>
            <RotateCcw className="h-4 w-4 mr-1" />
            Reset to Defaults
          </button>
          <button onClick={handleSave} className="btn-primary" disabled={!localSettings}>
            <Save className="h-4 w-4 mr-1" />
            Save Changes
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 bg-muted p-1 rounded-lg mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
              activeTab === tab.id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="card">
        <div className="p-6 space-y-6">
          {activeTab === "general" && (
            <GeneralSettings settings={localSettings!} onChange={setLocalSettings} languages={languages} themes={themes} />
          )}
          {activeTab === "appearance" && (
            <AppearanceSettings settings={localSettings!} onChange={setLocalSettings} />
          )}
          {activeTab === "typing" && (
            <TypingSettings settings={localSettings!} onChange={setLocalSettings} scoringMethods={scoringMethods} />
          )}
          {activeTab === "audio" && (
            <AudioSettings settings={localSettings!} onChange={setLocalSettings} />
          )}
          {activeTab === "privacy" && (
            <PrivacySettings settings={localSettings!} onChange={setLocalSettings} />
          )}
          {activeTab === "advanced" && (
            <AdvancedSettings settings={localSettings!} onChange={setLocalSettings} />
          )}
        </div>
      </div>
    </div>
  );
}

function GeneralSettings({ settings, onChange, languages, themes }: { 
  settings: UserSettings; 
  onChange: React.Dispatch<React.SetStateAction<UserSettings>>;
  languages: { value: Language; label: string }[];
  themes: { value: UserSettings["theme"]; label: string; icon: typeof Sun }[];
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">General Preferences</h2>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">Default Language</label>
          <select
            value={settings.language}
            onChange={(e) => onChange(prev => prev ? { ...prev, language: e.target.value as Language } : null)}
            className="input"
          >
            {languages.map((lang) => (
              <option key={lang.value} value={lang.value}>{lang.label}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Default Keyboard Layout</label>
          <input
            type="text"
            value={settings.layout}
            onChange={(e) => onChange(prev => prev ? { ...prev, layout: e.target.value } : null)}
            className="input"
            placeholder="qwerty, inscript, etc."
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Theme</label>
          <div className="grid grid-cols-3 gap-2">
            {themes.map((theme) => (
              <button
                key={theme.value}
                onClick={() => onChange(prev => prev ? { ...prev, theme: theme.value } : null)}
                className={cn(
                  "flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-colors",
                  settings.theme === theme.value
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                )}
              >
                <theme.icon className="h-5 w-5" />
                <span>{theme.label}</span>
              </button>
            ))}
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Default Test Duration</label>
          <select
            value={settings.default_duration}
            onChange={(e) => onChange(prev => prev ? { ...prev, default_duration: parseInt(e.target.value) } : null)}
            className="input"
          >
            <option value={60}>1 minute</option>
            <option value={300}>5 minutes</option>
            <option value={600}>10 minutes</option>
            <option value={900}>15 minutes</option>
            <option value={1800}>30 minutes</option>
            <option value={0}>Untimed</option>
          </select>
        </div>
      </div>
    </div>
  );
}

function AppearanceSettings({ settings, onChange }: { 
  settings: UserSettings; 
  onChange: React.Dispatch<React.SetStateAction<UserSettings>>;
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Appearance</h2>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">Font Size</label>
          <input
            type="range"
            min="12"
            max="24"
            step="1"
            value={settings.font_size}
            onChange={(e) => onChange(prev => prev ? { ...prev, font_size: parseInt(e.target.value) } : null)}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>12px</span>
            <span className="font-mono">{settings.font_size}px</span>
            <span>24px</span>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Font Family</label>
          <input
            type="text"
            value={settings.font_family}
            onChange={(e) => onChange(prev => prev ? { ...prev, font_family: e.target.value } : null)}
            className="input"
            placeholder="JetBrains Mono, Fira Code, etc."
          />
        </div>
      </div>
      
      <div className="border-t pt-6">
        <h3 className="font-semibold mb-4">Preview</h3>
        <div className="p-4 bg-muted rounded-lg font-mono" style={{ fontSize: `${settings.font_size}px`, fontFamily: settings.font_family }}>
          The quick brown fox jumps over the lazy dog.
          <br />
          भारत एक महान देश है।
        </div>
      </div>
    </div>
  );
}

function TypingSettings({ settings, onChange, scoringMethods }: { 
  settings: UserSettings; 
  onChange: React.Dispatch<React.SetStateAction<UserSettings>>;
  scoringMethods: { value: ScoringMethod; label: string }[];
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Typing Behavior</h2>
      
      <div className="space-y-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.allow_backspace}
            onChange={(e) => onChange(prev => prev ? { ...prev, allow_backspace: e.target.checked } : null)}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <div>
            <div className="font-medium">Allow Backspace</div>
            <div className="text-sm text-muted-foreground">Enable backspace during tests (disabled in exam mode)</div>
          </div>
        </label>
        
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.show_virtual_keyboard}
            onChange={(e) => onChange(prev => prev ? { ...prev, show_virtual_keyboard: e.target.checked } : null)}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <div>
            <div className="font-medium">Show Virtual Keyboard</div>
            <div className="text-sm text-muted-foreground">Display on-screen keyboard during tests</div>
          </div>
        </label>
        
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.show_heatmap}
            onChange={(e) => onChange(prev => prev ? { ...prev, show_heatmap: e.target.checked } : null)}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <div>
            <div className="font-medium">Show Error Heatmap</div>
            <div className="text-sm text-muted-foreground">Highlight frequently missed characters</div>
          </div>
        </label>
        
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.show_realtime_stats}
            onChange={(e) => onChange(prev => prev ? { ...prev, show_realtime_stats: e.target.checked } : null)}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <div>
            <div className="font-medium">Real-time Stats Bar</div>
            <div className="text-sm text-muted-foreground">Show live WPM/accuracy during tests</div>
          </div>
        </label>
        
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.auto_save}
            onChange={(e) => onChange(prev => prev ? { ...prev, auto_save: e.target.checked } : null)}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <div>
            <div className="font-medium">Auto-save Results</div>
            <div className="text-sm text-muted-foreground">Automatically save test results to history</div>
          </div>
        </label>
      </div>

      <div className="border-t pt-6">
        <h3 className="font-semibold mb-4">Default Scoring Method</h3>
        <select
          value={scoringMethods.find(m => m.value === "indian_govt")?.value || "indian_govt"}
          onChange={(e) => console.log("Scoring method:", e.target.value)}
          className="input w-64"
        >
          {scoringMethods.map((method) => (
            <option key={method.value} value={method.value}>{method.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

function AudioSettings({ settings, onChange }: { 
  settings: UserSettings; 
  onChange: React.Dispatch<React.SetStateAction<UserSettings>>;
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Audio Feedback</h2>
      
      <div className="space-y-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.sound_enabled}
            onChange={(e) => onChange(prev => prev ? { ...prev, sound_enabled: e.target.checked } : null)}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <div>
            <div className="font-medium">Enable Sound Effects</div>
            <div className="text-sm text-muted-foreground">Master toggle for all audio feedback</div>
          </div>
        </label>
        
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.keystroke_sound}
            onChange={(e) => onChange(prev => prev ? { ...prev, keystroke_sound: e.target.checked } : null)}
            disabled={!settings.sound_enabled}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary disabled:opacity-50"
          />
          <div>
            <div className="font-medium">Keystroke Sounds</div>
            <div className="text-sm text-muted-foreground">Play sound on each key press</div>
          </div>
        </label>
        
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.error_sound}
            onChange={(e) => onChange(prev => prev ? { ...prev, error_sound: e.target.checked } : null)}
            disabled={!settings.sound_enabled}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary disabled:opacity-50"
          />
          <div>
            <div className="font-medium">Error Sounds</div>
            <div className="text-sm text-muted-foreground">Play sound when making a mistake</div>
          </div>
        </label>
        
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.completion_sound}
            onChange={(e) => onChange(prev => prev ? { ...prev, completion_sound: e.target.checked } : null)}
            disabled={!settings.sound_enabled}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary disabled:opacity-50"
          />
          <div>
            <div className="font-medium">Completion Sound</div>
            <div className="text-sm text-muted-foreground">Play sound when test finishes</div>
          </div>
        </label>
      </div>
    </div>
  );
}

function PrivacySettings({ settings, onChange }: { 
  settings: UserSettings; 
  onChange: React.Dispatch<React.SetStateAction<UserSettings>>;
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Privacy & Data</h2>
      
      <div className="space-y-4">
        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-green-600" />
            <div>
              <h3 className="font-semibold text-green-800 dark:text-green-200">Privacy First</h3>
              <p className="text-sm text-green-700 dark:text-green-300">
                Examoffice does not collect any personal data. All your typing history, 
                settings, and preferences are stored locally on your device only.
              </p>
            </div>
          </div>
        </div>
        
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={true} // Would be a real setting
            disabled
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <div>
            <div className="font-medium">Local Storage Only</div>
            <div className="text-sm text-muted-foreground">No cloud sync, no analytics, no tracking</div>
          </div>
        </label>
      </div>

      <div className="border-t pt-6">
        <h3 className="font-semibold mb-4">Data Management</h3>
        <div className="flex flex-wrap gap-3">
          <button className="btn-outline">
            <Download className="h-4 w-4 mr-1" />
            Export All Data
          </button>
          <button className="btn-outline">
            <Upload className="h-4 w-4 mr-1" />
            Import Data
          </button>
          <button className="btn-destructive">
            <Trash2 className="h-4 w-4 mr-1" />
            Clear All History
          </button>
        </div>
      </div>
    </div>
  );
}

function AdvancedSettings({ settings, onChange }: { 
  settings: UserSettings; 
  onChange: React.Dispatch<React.SetStateAction<UserSettings>>;
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Advanced</h2>
      
      <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-6 w-6 text-yellow-600" />
          <div>
            <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">Advanced Settings</h3>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
              These settings affect core behavior. Only change if you know what you're doing.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Log Level</label>
          <select className="input w-64">
            <option value="error">Error Only</option>
            <option value="warn">Warnings</option>
            <option value="info">Info</option>
            <option value="debug">Debug</option>
            <option value="trace">Trace</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Database Path</label>
          <input type="text" value="~/.local/share/examoffice/examoffice.db" readOnly className="input bg-muted" />
        </div>
        
        <div className="border-t pt-4">
          <h3 className="font-semibold mb-3">Developer Options</h3>
          <div className="flex flex-wrap gap-3">
            <button className="btn-outline">
              <Database className="h-4 w-4 mr-1" />
              View Database
            </button>
            <button className="btn-outline">
              <Download className="h-4 w-4 mr-1" />
              Export Config
            </button>
            <button className="btn-outline">
              <Upload className="h-4 w-4 mr-1" />
              Import Config
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}