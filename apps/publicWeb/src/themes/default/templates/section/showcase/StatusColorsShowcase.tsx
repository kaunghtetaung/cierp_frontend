"use client";

import React from "react";
import { CheckCircle, AlertTriangle, XCircle, Info } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/base-components/ui/alert";
import { Button } from "@/styled-components/ui/Button";

/**
 * Status Colors Showcase Component
 * Demonstrates the usage of semantic status colors (success, warning, danger, info)
 * across various UI elements
 */
export function StatusColorsShowcase() {
  const statusExamples = [
    {
      type: "success",
      icon: CheckCircle,
      title: "Success State",
      description: "Operation completed successfully",
      bgClass: "bg-success/10",
      borderClass: "border-success/30",
      textClass: "text-success",
      examples: [
        "Form submission completed",
        "File uploaded successfully",
        "Payment processed",
        "Account created",
      ],
    },
    {
      type: "warning",
      icon: AlertTriangle,
      title: "Warning State",
      description: "Attention required, but not critical",
      bgClass: "bg-warning/10",
      borderClass: "border-warning/30",
      textClass: "text-warning",
      examples: [
        "Password will expire soon",
        "Storage almost full",
        "Unsaved changes",
        "Session timeout warning",
      ],
    },
    {
      type: "danger",
      icon: XCircle,
      title: "Danger State",
      description: "Critical error or destructive action",
      bgClass: "bg-danger/10",
      borderClass: "border-danger/30",
      textClass: "text-danger",
      examples: [
        "Delete confirmation",
        "System error occurred",
        "Access denied",
        "Data corruption detected",
      ],
    },
    {
      type: "info",
      icon: Info,
      title: "Info State",
      description: "General information or neutral updates",
      bgClass: "bg-info/10",
      borderClass: "border-info/30",
      textClass: "text-info",
      examples: [
        "New features available",
        "Maintenance scheduled",
        "Tips and recommendations",
        "Version update notes",
      ],
    },
  ];

  const buttonVariants = [
    { variant: "success" as const, label: "Success Action" },
    { variant: "warning" as const, label: "Warning Action" },
    { variant: "destructive" as const, label: "Danger Action" },
    { variant: "info" as const, label: "Info Action" },
  ];

  return (
    <section className="py-16 bg-gradient-to-b from-background via-foreground/5 to-background">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 relative text-foreground">
            <span className="absolute -top-3 -left-3 w-8 h-8 bg-primary/20 rounded-full blur-sm"></span>
            Semantic Status Colors
          </h2>
          <p className="text-xl max-w-3xl mx-auto leading-relaxed text-muted-foreground">
            Our design system includes semantic status colors to communicate
            different states and messages effectively.
          </p>
        </div>

        {/* Color System Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {statusExamples.map((status) => {
            const IconComponent = status.icon;
            return (
              <div
                key={status.type}
                className={`
                  ${status.bgClass} ${status.borderClass} border rounded-lg p-6
                  shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1
                `}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2 rounded-md bg-card shadow-md`}>
                    <IconComponent className={`w-5 h-5 ${status.textClass}`} />
                  </div>
                  <h3 className={`font-semibold ${status.textClass}`}>
                    {status.title}
                  </h3>
                </div>

                <p className="text-sm mb-4 text-muted-foreground">
                  {status.description}
                </p>

                <div className="space-y-2">
                  <h4
                    className={`text-xs font-medium uppercase tracking-wide ${status.textClass}`}
                  >
                    Use Cases:
                  </h4>
                  <ul className="space-y-1">
                    {status.examples.map((example, index) => (
                      <li
                        key={index}
                        className="text-xs flex items-center gap-2 text-muted-foreground"
                      >
                        <div
                          className={`w-1 h-1 rounded-full ${status.bgClass.replace(
                            "/10",
                            ""
                          )}`}
                        ></div>
                        {example}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        {/* Alert Examples */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold mb-8 text-center text-foreground">
            Alert Components
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Alert variant="success">
              <CheckCircle className="w-4 h-4" />
              <AlertTitle>Success Alert</AlertTitle>
              <AlertDescription>
                Your changes have been saved successfully. All data has been
                updated.
              </AlertDescription>
            </Alert>

            <Alert variant="warning">
              <AlertTriangle className="w-4 h-4" />
              <AlertTitle>Warning Alert</AlertTitle>
              <AlertDescription>
                Your session will expire in 5 minutes. Please save your work.
              </AlertDescription>
            </Alert>

            <Alert variant="destructive">
              <XCircle className="w-4 h-4" />
              <AlertTitle>Error Alert</AlertTitle>
              <AlertDescription>
                Failed to process your request. Please try again later.
              </AlertDescription>
            </Alert>

            <Alert variant="info">
              <Info className="w-4 h-4" />
              <AlertTitle>Information Alert</AlertTitle>
              <AlertDescription>
                New features are now available. Check out the latest updates.
              </AlertDescription>
            </Alert>
          </div>
        </div>

        {/* Button Examples */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold mb-8 text-center text-foreground">
            Button Variants
          </h3>
          <div className="flex flex-wrap justify-center gap-4">
            {buttonVariants.map((btn) => (
              <Button
                key={btn.variant}
                variant={btn.variant}
                className="min-w-[140px]"
              >
                {btn.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Badge Examples */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold mb-8 text-center text-foreground">
            Status Badges
          </h3>
          <div className="flex flex-wrap justify-center gap-6">
            <div className="px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 border bg-success/10 border-success/30 text-success">
              <CheckCircle className="w-3 h-3" />
              Active
            </div>
            <div className="px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 border bg-warning/10 border-warning/30 text-warning">
              <AlertTriangle className="w-3 h-3" />
              Pending
            </div>
            <div className="px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 border bg-danger/10 border-danger/30 text-danger">
              <XCircle className="w-3 h-3" />
              Inactive
            </div>
            <div className="px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 border bg-info/10 border-info/30 text-info">
              <Info className="w-3 h-3" />
              Draft
            </div>
          </div>
        </div>

        {/* Interactive Examples */}
        <div className="rounded-lg p-8 border bg-gradient-to-r from-secondary/5 to-accent/5 border-secondary/20">
          <h3 className="text-2xl font-bold mb-6 text-center text-foreground">
            Interactive Status Example
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {statusExamples.map((status) => {
              const IconComponent = status.icon;
              return (
                <div
                  key={`interactive-${status.type}`}
                  className={`border rounded-lg p-4 cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105 group ${status.bgClass} ${status.borderClass}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <IconComponent className={`w-5 h-5 ${status.textClass}`} />
                    <div
                      className={`w-2 h-2 rounded-full animate-pulse ${status.bgClass.replace(
                        "/10",
                        ""
                      )}`}
                    ></div>
                  </div>
                  <h4 className={`font-medium mb-1 ${status.textClass}`}>
                    {status.type.charAt(0).toUpperCase() + status.type.slice(1)}
                  </h4>
                  <p className="text-xs group-hover:opacity-80 transition-colors text-muted-foreground">
                    Click to interact
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Color Variables Reference */}
        <div className="mt-16 rounded-lg p-6 shadow-lg border bg-card border-border">
          <h3 className="text-xl font-bold mb-4 text-foreground">
            CSS Variables Reference
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-mono">
            <div>
              <h4 className="font-semibold mb-2 text-success">
                Success Colors:
              </h4>
              <div className="space-y-1 text-muted-foreground">
                <div>--success: 142 76% 36%</div>
                <div>--success-foreground: 0 0% 100%</div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2 text-warning">
                Warning Colors:
              </h4>
              <div className="space-y-1 text-muted-foreground">
                <div>--warning: 38 92% 50%</div>
                <div>--warning-foreground: 0 0% 100%</div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2 text-danger">Danger Colors:</h4>
              <div className="space-y-1 text-muted-foreground">
                <div>--destructive: 0 84.2% 60.2%</div>
                <div>--destructive-foreground: 210 40% 98%</div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2 text-info">Info Colors:</h4>
              <div className="space-y-1 text-muted-foreground">
                <div>--info: 221.2 83.2% 53.3%</div>
                <div>--info-foreground: 210 40% 98%</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default StatusColorsShowcase;
