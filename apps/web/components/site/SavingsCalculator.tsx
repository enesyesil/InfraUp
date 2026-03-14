"use client";

import { useState, useMemo } from "react";

const defaultTools = [
  { name: "Notion", perUser: 16, replacement: "Outline" },
  { name: "Slack", perUser: 7.25, replacement: "Mattermost" },
  { name: "HubSpot CRM", perUser: 0, flat: 90, replacement: "Twenty" },
  { name: "GitHub", perUser: 4, replacement: "Gitea" },
  { name: "Jira", perUser: 8.15, replacement: "Plane" },
  { name: "Google Analytics", perUser: 0, flat: 0, replacement: "Plausible", note: "Free, but your data is theirs" },
  { name: "Zapier", perUser: 0, flat: 19.99, replacement: "n8n" },
  { name: "Mailchimp", perUser: 0, flat: 13, replacement: "Listmonk" },
  { name: "Calendly", perUser: 10, replacement: "Cal.com" },
  { name: "Zendesk", perUser: 19, replacement: "Chatwoot" },
  { name: "Datadog", perUser: 0, flat: 31, replacement: "Grafana" },
  { name: "1Password", perUser: 7.99, replacement: "Vaultwarden" },
];

export function SavingsCalculator() {
  const [teamSize, setTeamSize] = useState(10);
  const [hourlyRate, setHourlyRate] = useState(100);
  const [vpsCost, setVpsCost] = useState(10);
  const [selectedTools, setSelectedTools] = useState<string[]>(
    ["Notion", "Slack", "Jira", "Google Analytics"]
  );

  const toggleTool = (name: string) => {
    setSelectedTools((prev) =>
      prev.includes(name) ? prev.filter((t) => t !== name) : [...prev, name]
    );
  };

  const results = useMemo(() => {
    let monthlySaas = 0;
    selectedTools.forEach((name) => {
      const tool = defaultTools.find((t) => t.name === name);
      if (!tool) return;
      if (tool.perUser) monthlySaas += tool.perUser * teamSize;
      if ("flat" in tool && tool.flat) monthlySaas += tool.flat;
    });

    const annualSaas = monthlySaas * 12;
    const annualVps = vpsCost * 12;
    const annualSavings = annualSaas - annualVps;
    const setupHours = selectedTools.length * 2;
    const setupCost = setupHours * hourlyRate;
    const weeksToBreakEven =
      annualSavings > 0
        ? Math.ceil((setupCost / (annualSavings / 52)) * 10) / 10
        : 0;

    return {
      monthlySaas,
      annualSaas,
      annualVps,
      annualSavings,
      setupHours,
      setupCost,
      weeksToBreakEven,
    };
  }, [teamSize, hourlyRate, vpsCost, selectedTools]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        <div>
          <label className="block font-mono text-xs uppercase tracking-wider mb-3">
            Team Size: {teamSize}
          </label>
          <input
            type="range"
            min="1"
            max="50"
            value={teamSize}
            onChange={(e) => setTeamSize(Number(e.target.value))}
            className="w-full accent-ink"
          />
          <div className="flex justify-between font-mono text-xs text-ink/40 mt-1">
            <span>1</span>
            <span>50</span>
          </div>
        </div>

        <div>
          <label className="block font-mono text-xs uppercase tracking-wider mb-3">
            Engineer Hourly Cost: ${hourlyRate}
          </label>
          <input
            type="range"
            min="50"
            max="200"
            step="10"
            value={hourlyRate}
            onChange={(e) => setHourlyRate(Number(e.target.value))}
            className="w-full accent-ink"
          />
          <div className="flex justify-between font-mono text-xs text-ink/40 mt-1">
            <span>$50</span>
            <span>$200</span>
          </div>
        </div>

        <div>
          <p className="font-mono text-xs uppercase tracking-wider mb-3">
            Tools You Currently Pay For
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {defaultTools.map((tool) => (
              <button
                key={tool.name}
                type="button"
                onClick={() => toggleTool(tool.name)}
                className={`flex items-center justify-between px-4 py-3 border text-left font-mono text-sm transition-colors ${
                  selectedTools.includes(tool.name)
                    ? "bg-ink text-white border-ink"
                    : "bg-white text-ink/60 border-ink/30 hover:border-ink"
                }`}
              >
                <span>{tool.name}</span>
                <span className="text-xs opacity-70">
                  {tool.perUser
                    ? `$${tool.perUser}/user/mo`
                    : tool.flat
                      ? `$${tool.flat}/mo`
                      : "Free*"}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block font-mono text-xs uppercase tracking-wider mb-3">
            VPS Monthly Cost: ${vpsCost}
          </label>
          <input
            type="range"
            min="3"
            max="50"
            value={vpsCost}
            onChange={(e) => setVpsCost(Number(e.target.value))}
            className="w-full accent-ink"
          />
          <div className="flex justify-between font-mono text-xs text-ink/40 mt-1">
            <span>$3</span>
            <span>$50</span>
          </div>
        </div>
      </div>

      <div className="lg:col-span-1">
        <div className="border-2 border-ink p-6 sticky top-24 space-y-6" style={{ boxShadow: "var(--shadow-brutal)" }}>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink/50">
            Your Savings
          </p>

          <div className="space-y-4">
            <div className="flex justify-between items-baseline">
              <span className="text-sm text-ink/70">Current SaaS spend</span>
              <span className="font-mono text-lg font-bold">
                ${results.monthlySaas.toLocaleString()}/mo
              </span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-sm text-ink/70">Server cost</span>
              <span className="font-mono text-lg font-bold">
                ${vpsCost}/mo
              </span>
            </div>
            <div className="ruled-divider pt-4">
              <div className="flex justify-between items-baseline">
                <span className="text-sm font-bold">Annual savings</span>
                <span className="font-mono text-2xl font-bold text-accent">
                  ${results.annualSavings > 0 ? results.annualSavings.toLocaleString() : 0}/yr
                </span>
              </div>
            </div>
          </div>

          <div className="ruled-divider pt-4 space-y-3">
            <p className="font-mono text-xs uppercase tracking-wider text-ink/50">
              Setup Investment
            </p>
            <p className="text-sm text-ink/70">
              ~{results.setupHours} hours &times; ${hourlyRate}/hr ={" "}
              <span className="font-mono font-bold">
                ${results.setupCost.toLocaleString()}
              </span>
            </p>
            <p className="text-sm text-ink/70">
              Break even in{" "}
              <span className="font-mono font-bold">
                {results.weeksToBreakEven > 0
                  ? `${results.weeksToBreakEven} weeks`
                  : "—"}
              </span>
            </p>
          </div>

          <div className="ruled-divider pt-4">
            <p className="text-sm text-ink/70">
              Your team of <span className="font-bold">{teamSize}</span> could save{" "}
              <span className="font-bold text-accent">
                ${results.annualSavings > 0 ? results.annualSavings.toLocaleString() : 0}/year
              </span>{" "}
              and break even in{" "}
              <span className="font-bold">
                {results.weeksToBreakEven > 0
                  ? `${results.weeksToBreakEven} weeks`
                  : "—"}
              </span>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
