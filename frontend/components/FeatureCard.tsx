"use client";

import { LucideIcon } from "lucide-react";

type FeatureCardProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  gradient: string;
};

export default function FeatureCard({ icon: Icon, title, description, gradient }: FeatureCardProps) {
  return (
    <div className="glass-card p-8 group relative overflow-hidden">
      {/* Gradient accent */}
      <div
        className="absolute top-0 left-0 w-full h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: gradient }}
      />

      {/* Icon */}
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
        style={{ background: `${gradient.replace(')', ', 0.12)')}` }}
      >
        <Icon
          size={24}
          style={{ color: gradient.includes('#3b82f6') ? '#3b82f6' : gradient.includes('#8b5cf6') ? '#8b5cf6' : '#06b6d4' }}
        />
      </div>

      {/* Content */}
      <h3 className="text-lg font-semibold mb-3 text-[var(--text-primary)]">
        {title}
      </h3>
      <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
        {description}
      </p>
    </div>
  );
}
