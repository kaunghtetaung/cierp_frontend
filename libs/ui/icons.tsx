import React from "react";
import * as LucideIcons from "lucide-react";

interface IconComponentProps {
  name: string;
  className?: string;
  size?: number;
}

export function IconComponent({ name, className, size }: IconComponentProps) {
  const Icon = (LucideIcons as any)[name];
  
  if (!Icon) {
    console.warn(`Icon "${name}" not found in lucide-react`);
    return null;
  }
  
  return <Icon className={className} size={size} />;
}