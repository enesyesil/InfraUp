"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface Tab {
  label: string;
  code: string;
}

interface DockerSnippetProps {
  tabs: Tab[];
}

export function DockerSnippet({ tabs }: DockerSnippetProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(tabs[activeTab].code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="border-2 border-ink" style={{ boxShadow: "var(--shadow-brutal)" }}>
      <div className="flex border-b-2 border-ink">
        {tabs.map((tab, i) => (
          <button
            key={tab.label}
            onClick={() => {
              setActiveTab(i);
              setCopied(false);
            }}
            className={`px-4 py-2 font-mono text-xs uppercase tracking-wider transition-colors ${
              activeTab === i
                ? "bg-ink text-white"
                : "bg-white text-ink hover:bg-ink/10"
            } ${i > 0 ? "border-l-2 border-ink" : ""}`}
          >
            {tab.label}
          </button>
        ))}
        <div className="flex-1" />
        <button
          onClick={handleCopy}
          className="px-3 py-2 text-ink/50 hover:text-ink transition-colors border-l-2 border-ink"
          aria-label="Copy to clipboard"
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
        </button>
      </div>
      <pre className="code-block p-4 text-sm overflow-x-auto">
        <code>{tabs[activeTab].code}</code>
      </pre>
    </div>
  );
}
