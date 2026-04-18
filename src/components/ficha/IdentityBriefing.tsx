"use client";

import React from "react";

type IdentityBriefingProps = {
  title: string;
  subtitle: string;
  tags: string[];
  details: Array<{ label: string; value?: string | null }>;
};

export default function IdentityBriefing({ title, subtitle, tags, details }: IdentityBriefingProps) {
  return (
    <section className="aq-panel p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="aq-kicker">Briefing Inicial</div>
          <h2 className="mt-2 text-2xl font-black tracking-[0.06em] text-[var(--aq-title)]">{title}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[var(--aq-text-muted)]">{subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {tags.filter(Boolean).map((tag) => (
            <span key={tag} className="aq-pill aq-pill-muted">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {details.map((detail) => (
          <div key={detail.label} className="rounded-2xl border border-[var(--aq-border)] bg-[rgba(5,10,16,0.58)] p-4">
            <div className="aq-kicker">{detail.label}</div>
            <div className="mt-2 text-sm font-bold text-[var(--aq-title)]">{detail.value || "Nao definido"}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
