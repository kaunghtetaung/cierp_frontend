import React from "react";
import { StatusColorsShowcase } from "../../../themes/default/templates/section";

/**
 * Direct Showcase Page
 * Directly renders the StatusColorsShowcase component within the theme system
 */
export default function ShowcasePage() {
  return (
    <div className="min-h-screen">
      <StatusColorsShowcase />
    </div>
  );
}

export const metadata = {
  title: "Design System Showcase",
  description: "Complete showcase of the enhanced 8-color design system",
};
