"use client";

import React, { useState } from "react";
import { ChevronDown, Mail, Phone, User, Building } from "lucide-react";
import { OrganizationStructureSectionData, SectionProps } from "../types";
import { getLocalizedText } from "../utils";
import { getMessages } from "../../../lib/messages";

interface OrganizationNode {
  id: string;
  name: any; // MultiLanguageText
  title?: any; // MultiLanguageText
  photo?: string;
  email?: string;
  phone?: string;
  department?: any; // MultiLanguageText
  description?: any; // MultiLanguageText
  children?: OrganizationNode[];
}

/**
 * Organization Structure Section Component
 * Displays organizational hierarchy with expandable nodes
 */
export function OrganizationStructureSection({
  section,
  currentLanguage = "en",
}: SectionProps<OrganizationStructureSectionData>) {
  const {
    structure,
    displayOptions = {},
    // layout = "tree",
    // orientation = "vertical",
    nodeStyle = "card",
  } = section;

  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(
    new Set((displayOptions as any)?.expandByDefault ? [structure?.id] : [])
  );

  const headline = section.headline
    ? getLocalizedText(section.headline, currentLanguage)
    : null;

  const description = section.description
    ? getLocalizedText(section.description, currentLanguage)
    : null;

  if (!structure) {
    const t = getMessages(currentLanguage);
    return (
      <section className="py-16 bg-gradient-to-b from-background via-muted/50 to-background">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="bg-card border border-border rounded-lg p-8 shadow-lg">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {t.section.noOrgStructureTitle}
            </h3>
            <p className="text-muted-foreground">
              {t.section.noOrgStructureMessage}
            </p>
          </div>
        </div>
      </section>
    );
  }

  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(nodeId)) {
        newExpanded.delete(nodeId);
      } else {
        newExpanded.add(nodeId);
      }
      return newExpanded;
    });
  };

  const renderTreeNode = (person: OrganizationNode, depth: number = 0) => {
    const hasChildren = person.children && person.children.length > 0;
    const isExpanded = expandedNodes.has(person.id);
    const shouldShowChildren =
      hasChildren &&
      isExpanded &&
      (!(displayOptions as any)?.maxDepth || depth < (displayOptions as any)?.maxDepth);

    const cardClasses = {
      card: "bg-card border border-border rounded-lg p-4 shadow-lg hover:shadow-xl hover:border-primary transition-all duration-300",
      minimal: "bg-primary/5 rounded-lg p-3 border border-primary/20",
      detailed:
        "bg-card border border-border rounded-lg p-6 shadow-lg hover:shadow-2xl hover:border-primary transition-all duration-300 transform hover:-translate-y-1",
    };

    return (
      <div className="flex flex-col items-center">
        {/* Person Card */}
        <div className="relative">
          <div
            className={`${cardClasses[nodeStyle]} min-w-[280px] max-w-[320px]`}
          >
            {/* Expand/Collapse Button */}
            {hasChildren && (
              <button
                type="button"
                onClick={() => toggleNode(person.id)}
                className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center hover:bg-primary/90 transition-colors shadow-lg z-10"
                aria-label={isExpanded ? "Collapse" : "Expand"}
              >
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    isExpanded ? "rotate-180" : ""
                  }`}
                />
              </button>
            )}

            <div className="flex gap-4">
              {/* Photo */}
              {(displayOptions as any)?.showPhotos && person.photo && (
                <div className="flex-shrink-0">
                  <img
                    src={person.photo}
                    alt={getLocalizedText(person.name, currentLanguage)}
                    className="w-16 h-16 rounded-full object-cover border-2 border-primary shadow-md"
                  />
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground text-lg mb-1">
                  {getLocalizedText(person.name, currentLanguage)}
                </h3>

                {(displayOptions as any)?.showTitles && person.title && (
                  <p className="text-primary font-medium mb-2">
                    {getLocalizedText(person.title, currentLanguage)}
                  </p>
                )}

                {person.department && (
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                    <Building className="w-4 h-4 text-muted-foreground" />
                    <span>
                      {getLocalizedText(person.department, currentLanguage)}
                    </span>
                  </div>
                )}

                {/* Contact Info */}
                <div className="flex flex-col gap-1">
                  {(displayOptions as any)?.showEmails && person.email && (
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <Mail className="w-4 h-4 text-primary" />
                      <a
                        href={`mailto:${person.email}`}
                        className="hover:text-primary transition-colors truncate"
                      >
                        {person.email}
                      </a>
                    </div>
                  )}

                  {(displayOptions as any)?.showPhones && person.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <Phone className="w-4 h-4 text-primary" />
                      <a
                        href={`tel:${person.phone}`}
                        className="hover:text-primary transition-colors"
                      >
                        {person.phone}
                      </a>
                    </div>
                  )}
                </div>

                {/* Description */}
                {nodeStyle === "detailed" && person.description && (
                  <p className="text-muted-foreground text-sm mt-3 leading-relaxed">
                    {getLocalizedText(person.description, currentLanguage)}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Connecting Line and Children */}
        {shouldShowChildren && (
          <div className="flex flex-col items-center mt-8">
            {/* Vertical Line */}
            <div className="w-px h-8 bg-border"></div>

            {/* Children Container */}
            <div className="relative">
              {/* Horizontal Line - accounts for gap-x-8 spacing */}
              {person.children!.length > 1 && (
                <div
                  className="absolute top-0 h-px bg-border"
                  style={{
                    left: `calc(${100 / person.children!.length / 2}% - 0.5em)`,
                    right: `calc(${
                      100 / person.children!.length / 2
                    }% - 0.5em)`,
                  }}
                ></div>
              )}

              {/* Children Grid */}
              <div
                className={`
                grid gap-x-8 gap-y-12 pt-8
                ${
                  person.children!.length === 1
                    ? "grid-cols-1"
                    : person.children!.length === 2
                    ? "grid-cols-2"
                    : person.children!.length === 3
                    ? "grid-cols-3"
                    : person.children!.length === 4
                    ? "grid-cols-2 lg:grid-cols-4"
                    : "grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                }
              `}
              >
                {person.children!.map((child) => (
                  <div key={child.id} className="relative">
                    {/* Vertical connector line to parent */}
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 w-px h-8 bg-border"></div>
                    {renderTreeNode(child, depth + 1)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <section
      className="py-16 bg-gradient-to-b from-background via-muted/50 to-background"
      data-section-id={section._id}
      data-section-type={section.type}
    >
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        {(headline || description) && (
          <div className="text-center mb-12">
            {headline && (
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 relative">
                <span className="absolute -top-3 -left-3 w-8 h-8 bg-muted rounded-full blur-sm"></span>
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

        {/* Controls */}
        <div className="flex justify-center mb-12">
          <div className="flex gap-2 bg-primary/5 rounded-md p-1">
            <button
              type="button"
              onClick={() => {
                const expandAll = (node: OrganizationNode): string[] => {
                  const ids = [node.id];
                  if (node.children) {
                    node.children.forEach((child) => {
                      ids.push(...expandAll(child));
                    });
                  }
                  return ids;
                };
                setExpandedNodes(new Set(expandAll(structure)));
              }}
              className="px-4 py-2 text-sm font-medium rounded-md bg-background text-foreground shadow-sm hover:bg-primary/10 transition-colors"
            >
              Expand All
            </button>
            <button
              type="button"
              onClick={() => setExpandedNodes(new Set())}
              className="px-4 py-2 text-sm font-medium rounded-md text-muted-foreground hover:bg-primary/10 transition-colors"
            >
              Collapse All
            </button>
          </div>
        </div>

        {/* Organization Structure - Tree View */}
        <div className="overflow-x-auto">
          <div className="min-w-fit flex justify-center py-8">
            {renderTreeNode(structure)}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-12 p-4 bg-gradient-to-r from-muted/50 to-primary/10 rounded-lg border border-border">
          <h4 className="font-semibold text-foreground mb-3">Legend</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Person</span>
            </div>
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-secondary" />
              <span className="text-muted-foreground">Department</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-accent" />
              <span className="text-muted-foreground">Email</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-accent" />
              <span className="text-muted-foreground">Phone</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default OrganizationStructureSection;
