import { ReactNode } from "react";
import { cn } from "../utils/cn";

interface VirtualKeyboardProps {
  layout?: "qwerty" | "inscript" | "custom";
  activeKey?: string;
  correctKeys?: Set<string>;
  incorrectKeys?: Set<string>;
  onKeyClick?: (key: string) => void;
  children?: ReactNode;
  className?: string;
}

const QWERTY_LAYOUT = [
  ["`", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "=", "Backspace"],
  ["Tab", "q", "w", "e", "r", "t", "y", "u", "i", "o", "p", "[", "]", "\\"],
  ["CapsLock", "a", "s", "d", "f", "g", "h", "j", "k", "l", ";", "'", "Enter"],
  ["Shift", "z", "x", "c", "v", "b", "n", "m", ",", ".", "/", "Shift"],
  [" ", " ", " ", " ", " ", " ", " ", " ", " ", " "], // Space bar
];

const INSCRIPT_LAYOUT = [
  ["~", "!", "@", "#", "$", "%", "^", "&", "*", "(", ")", "_", "+", "Backspace"],
  ["Tab", "ँ", "ं", "ः", "अ", "आ", "इ", "ई", "उ", "ऊ", "ऋ", "ॠ", "ऌ", "\\"],
  ["CapsLock", "ए", "ऐ", "ओ", "औ", "क", "ख", "ग", "घ", "ङ", "च", "छ", "Enter"],
  ["Shift", "ज", "झ", "ञ", "ट", "ठ", "ड", "ढ", "ण", "त", "थ", "Shift"],
  [" ", " ", " ", " ", " ", " ", " ", " ", " ", " "],
];

const KEY_LABELS: Record<string, string> = {
  "`": "`\n~",
  "1": "1\n!",
  "2": "2\n@",
  "3": "3\n#",
  "4": "4\n$",
  "5": "5\n%",
  "6": "6\n^",
  "7": "7\n&",
  "8": "8\n*",
  "9": "9\n(",
  "0": "0\n)",
  "-": "-\n_",
  "=": "=\n+",
  "[": "[\n{",
  "]": "]\n}",
  "\\": "\\\n|",
  ";": ";\n:",
  "'": "'\n\"",
  ",": ",",
  ".": ".\n>",
  "/": "/\n?",
  "Backspace": "⌫",
  "Tab": "Tab",
  "CapsLock": "⇪",
  "Enter": "↵",
  "Shift": "⇧",
  " ": "Space",
};

function VirtualKey({ 
  key, 
  wide = false, 
  active = false, 
  correct = false, 
  incorrect = false,
  onClick 
}: { 
  key: string; 
  wide?: boolean; 
  active?: boolean; 
  correct?: boolean; 
  incorrect?: boolean;
  onClick?: () => void;
}) {
  const label = KEY_LABELS[key] || key;
  
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "virtual-key relative flex items-center justify-center text-xs font-medium rounded border border-border bg-background",
        "transition-all duration-100",
        "hover:bg-accent hover:text-accent-foreground",
        "active:scale-[0.98]",
        wide && "virtual-key-wide w-24",
        active && "virtual-key-active bg-primary text-primary-foreground scale-105 shadow-lg",
        correct && "virtual-key-correct bg-green-500 text-white",
        incorrect && "virtual-key-incorrect bg-red-500 text-white",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      )}
      disabled={!onClick}
      aria-label={key === " " ? "Space" : key === "Backspace" ? "Backspace" : key === "Enter" ? "Enter" : key === "Shift" ? "Shift" : key === "Tab" ? "Tab" : key === "CapsLock" ? "Caps Lock" : key}
    >
      {label.split("\n").map((line, i) => (
        <span key={i} className="block leading-tight">{line}</span>
      ))}
    </button>
  );
}

export function VirtualKeyboard({ 
  layout = "qwerty", 
  activeKey, 
  correctKeys = new Set(),
  incorrectKeys = new Set(),
  onKeyClick,
  className 
}: VirtualKeyboardProps) {
  const currentLayout = layout === "inscript" ? INSCRIPT_LAYOUT : QWERTY_LAYOUT;

  return (
    <div 
      className={cn("virtual-keyboard font-mono", className)}
      role="region"
      aria-label="Virtual keyboard"
    >
      {currentLayout.map((row, rowIndex) => (
        <div key={rowIndex} className="flex gap-1 justify-center">
          {row.map((key, keyIndex) => {
            const isWide = ["Backspace", "Tab", "CapsLock", "Enter", "Shift", " "].includes(key);
            const isSpace = key === " ";
            
            if (isSpace) {
              return (
                <VirtualKey
                  key={`${rowIndex}-space`}
                  key=" "
                  wide={true}
                  active={activeKey === " "}
                  correct={correctKeys.has(" ")}
                  incorrect={incorrectKeys.has(" ")}
                  onClick={() => onKeyClick?.(" ")}
                />
              );
            }
            
            return (
              <VirtualKey
                key={`${rowIndex}-${keyIndex}`}
                key={key}
                wide={isWide}
                active={activeKey === key}
                correct={correctKeys.has(key)}
                incorrect={incorrectKeys.has(key)}
                onClick={() => onKeyClick?.(key)}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}