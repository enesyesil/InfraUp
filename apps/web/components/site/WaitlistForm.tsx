"use client";

import { useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";

const saasTools = [
  "Notion", "Slack", "HubSpot", "Jira", "GitHub", "Google Analytics",
  "Zapier", "Mailchimp", "Calendly", "Zendesk", "Intercom", "Datadog",
  "Confluence", "Salesforce", "Figma", "Airtable",
];

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [replacingTools, setReplacingTools] = useState<string[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const toggleTool = (tool: string) => {
    setReplacingTools((prev) =>
      prev.includes(tool) ? prev.filter((t) => t !== tool) : [...prev, tool]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const res = await fetch(`${apiUrl}/v1/waitlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role, replacingTools }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Something went wrong");
      }

      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  if (status === "success") {
    return (
      <div className="border-2 border-ink p-8 text-center">
        <p className="font-serif text-2xl font-bold mb-2">You&apos;re on the list.</p>
        <p className="text-ink/70">
          We&apos;ll notify you when the config generator launches.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" id="waitlist">
      <div>
        <label htmlFor="email" className="block font-mono text-xs uppercase tracking-wider mb-2">
          Email address *
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          className="w-full px-4 py-3 border-2 border-ink bg-white font-mono text-sm placeholder:text-ink/30 focus:outline-none focus:ring-0"
        />
      </div>

      <div>
        <label htmlFor="role" className="block font-mono text-xs uppercase tracking-wider mb-2">
          Your role
        </label>
        <select
          id="role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full px-4 py-3 border-2 border-ink bg-white font-mono text-sm focus:outline-none focus:ring-0"
        >
          <option value="">Select your role</option>
          <option value="founder">Founder / CEO</option>
          <option value="cto">CTO / VP Engineering</option>
          <option value="developer">Developer</option>
          <option value="devops">DevOps / SRE</option>
          <option value="sysadmin">Sysadmin</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div>
        <p className="font-mono text-xs uppercase tracking-wider mb-3">
          Tools you want to replace
        </p>
        <div className="flex flex-wrap gap-2">
          {saasTools.map((tool) => (
            <button
              key={tool}
              type="button"
              onClick={() => toggleTool(tool)}
              className={`px-3 py-1 font-mono text-xs border transition-colors ${
                replacingTools.includes(tool)
                  ? "bg-ink text-white border-ink"
                  : "bg-white text-ink/60 border-ink/30 hover:border-ink"
              }`}
            >
              {tool}
            </button>
          ))}
        </div>
      </div>

      {status === "error" && (
        <p className="text-accent font-mono text-sm">{errorMsg}</p>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className="btn-accent w-full flex items-center justify-center gap-2"
      >
        {status === "loading" ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <>
            Join the Waitlist <ArrowRight size={16} />
          </>
        )}
      </button>
    </form>
  );
}
