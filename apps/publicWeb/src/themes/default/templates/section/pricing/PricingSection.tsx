"use client";

import React, { useState } from "react";
import { Check, Star, ArrowRight, Zap, Shield, Crown } from "lucide-react";
import Link from "next/link";
import { Button } from "@/styled-components/ui/Button";
import { PricingSectionData, SectionProps } from "../types";
import { getLocalizedText } from "../utils";

/**
 * Pricing Section Component
 * Displays pricing plans with features and billing options
 */
export function PricingSection({
  section,
  currentLanguage = "en",
}: SectionProps<PricingSectionData>) {
  const {
    billing = "monthly",
    layout = "cards",
    showComparison = false,
    plans = [],
  } = section;

  const [activeBilling, setActiveBilling] = useState<"monthly" | "yearly">(
    "monthly"
  );

  const headline = section.headline
    ? getLocalizedText(section.headline, currentLanguage)
    : null;

  const description = section.description
    ? getLocalizedText(section.description, currentLanguage)
    : null;

  if (!plans || plans.length === 0) {
    return (
      <section className="py-16 bg-gradient-to-b from-background via-muted to-background">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="bg-background border border-border rounded-lg p-8 shadow-lg">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No Pricing Plans Available
            </h3>
            <p className="text-muted-foreground">
              Pricing plans will be displayed here when available.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const formatPrice = (price: any, period: "monthly" | "yearly") => {
    if (!price) return "Custom";

    const amount =
      period === "yearly" ? price.yearlyAmount || price.amount : price.amount;
    const currency = price.currency || "$";
    const displayPeriod =
      period === "yearly" ? "year" : price.period || "month";

    if (amount === 0) return "Free";
    if (!amount) return "Custom";

    return `${currency}${amount}/${displayPeriod}`;
  };

  // Get status badge styling based on plan type
  const getStatusBadge = (plan: any) => {
    if (plan.status === "limited") {
      return {
        className: "bg-warning/20 border-warning text-warning-foreground",
        icon: Zap,
        text: "Limited Time",
      };
    }
    if (plan.status === "recommended" || plan.popular) {
      return {
        className: "bg-success/20 border-success text-success-foreground",
        icon: Star,
        text: "Best Value",
      };
    }
    if (plan.status === "enterprise") {
      return {
        className: "bg-accent/20 border-accent text-accent-foreground",
        icon: Crown,
        text: "Enterprise",
      };
    }
    if (plan.status === "premium") {
      return {
        className: "bg-accent/20 border-accent text-accent-foreground",
        icon: Shield,
        text: "Premium",
      };
    }
    return null;
  };

  const renderPlanCard = (plan: any, index: number) => {
    const statusBadge = getStatusBadge(plan);

    return (
      <div
        key={index}
        className={`
        relative bg-background border rounded-lg p-6 shadow-sm hover:shadow-md transition-all duration-300
        ${
          plan.popular
            ? "border-primary shadow-lg scale-105"
            : "border-border"
        }
        ${layout === "table" ? "flex-1" : ""}
      `}
      >
        {/* Status Badge */}
        {statusBadge && (
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <div
              className={`border px-4 py-1 rounded-full text-sm font-medium flex items-center gap-1 shadow-md ${statusBadge.className}`}
            >
              <statusBadge.icon className="w-3 h-3" />
              {statusBadge.text}
            </div>
          </div>
        )}

        {/* Custom Badge */}
        {plan.badge && !statusBadge && (
          <div className="absolute -top-3 right-4">
            <div className="bg-muted border border-border text-muted-foreground px-3 py-1 rounded-full text-sm font-medium">
              {getLocalizedText(plan.badge, currentLanguage)}
            </div>
          </div>
        )}

        {/* Plan Header */}
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-foreground mb-2">
            {getLocalizedText(plan.name, currentLanguage)}
          </h3>
          {plan.description && (
            <p className="text-muted-foreground text-sm">
              {getLocalizedText(plan.description, currentLanguage)}
            </p>
          )}
        </div>

        {/* Price */}
        <div className="text-center mb-6">
          <div className="text-4xl font-bold text-foreground mb-1">
            {formatPrice(plan.price, activeBilling)}
          </div>
          {billing === "both" &&
            plan.price?.yearlyAmount &&
            activeBilling === "yearly" && (
              <div className="text-sm text-muted-foreground">
                <span className="line-through">
                  {formatPrice(plan.price, "monthly")}
                </span>
                <span className="ml-2 border border-success bg-success/20 text-success-foreground px-2 py-1 rounded-full text-xs font-medium">
                  Save 20%
                </span>
              </div>
            )}
        </div>

        {/* Features */}
        <div className="mb-6">
          <ul className="space-y-3">
            {plan.features.map((feature: any, featureIndex: number) => (
              <li key={featureIndex} className="flex items-start gap-3">
                <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-foreground">
                  {typeof feature === "string"
                    ? feature
                    : getLocalizedText(feature, currentLanguage)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* CTA Button */}
        <div className="pt-4 border-t border-border">
          {plan.button ? (
            <Link
              href={plan.button.url}
              target={plan.button.openInNewTab ? "_blank" : undefined}
              rel={plan.button.openInNewTab ? "noopener noreferrer" : undefined}
            >
              <Button
                variant={plan.popular ? "primary" : "secondary"}
                size="md"
                className={`
                  w-full inline-flex items-center justify-center gap-2
                  ${
                    plan.popular
                      ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }
                `}
              >
                {getLocalizedText(plan.button.text, currentLanguage)}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          ) : (
            <Button
              variant={plan.popular ? "primary" : "secondary"}
              size="md"
              className={`
                w-full inline-flex items-center justify-center gap-2
                ${
                  plan.popular
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }
              `}
            >
              Get Started
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <section
      className="py-16 bg-background"
      data-section-id={section._id}
      data-section-type={section.type}
    >
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        {(headline || description) && (
          <div className="text-center mb-12">
            {headline && (
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                {headline}
              </h2>
            )}
            {description && (
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                {description}
              </p>
            )}
          </div>
        )}

        {/* Billing Toggle */}
        {billing === "both" && (
          <div className="flex justify-center mb-12">
            <div className="bg-muted rounded-lg p-1 flex">
              <Button
                variant={activeBilling === "monthly" ? "default" : "ghost"}
                size="sm"
                className={`${
                  activeBilling === "monthly"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setActiveBilling("monthly")}
              >
                Monthly
              </Button>
              <Button
                variant={activeBilling === "yearly" ? "default" : "ghost"}
                size="sm"
                className={`${
                  activeBilling === "yearly"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setActiveBilling("yearly")}
              >
                Yearly
                <span className="ml-2 text-xs border border-success bg-success/10 text-success-foreground px-2 py-1 rounded-full font-medium">
                  Save 20%
                </span>
              </Button>
            </div>
          </div>
        )}

        {/* Pricing Plans */}
        <div
          className={`
          ${
            layout === "cards"
              ? `grid gap-8 ${
                  plans.length === 1
                    ? "max-w-sm mx-auto"
                    : plans.length === 2
                    ? "grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto"
                    : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                }`
              : "flex flex-col lg:flex-row gap-6"
          }
        `}
        >
          {plans.map((plan, index) => renderPlanCard(plan, index))}
        </div>

        {/* Comparison Table */}
        {showComparison && plans.length > 1 && (
          <div className="mt-16">
            <h3 className="text-2xl font-bold text-center text-foreground mb-8">
              Compare Plans
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full border border-border rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-muted">
                    <th className="text-left p-4 font-semibold text-foreground">
                      Features
                    </th>
                    {plans.map((plan, index) => (
                      <th
                        key={index}
                        className="text-center p-4 font-semibold text-foreground min-w-[150px]"
                      >
                        {getLocalizedText(plan.name, currentLanguage)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Extract all unique features */}
                  {Array.from(
                    new Set(plans.flatMap((plan) => plan.features))
                  ).map((feature: any, featureIndex) => (
                    <tr key={featureIndex} className="border-t border-border">
                      <td className="p-4 text-foreground">
                        {typeof feature === "string"
                          ? feature
                          : getLocalizedText(feature, currentLanguage)}
                      </td>
                      {plans.map((plan, planIndex) => (
                        <td key={planIndex} className="p-4 text-center">
                          {plan.features.some(
                            (f: any) =>
                              (typeof f === "string"
                                ? f
                                : getLocalizedText(f, currentLanguage)) ===
                              (typeof feature === "string"
                                ? feature
                                : getLocalizedText(feature, currentLanguage))
                          ) ? (
                            <Check className="w-5 h-5 text-primary mx-auto" />
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default PricingSection;
