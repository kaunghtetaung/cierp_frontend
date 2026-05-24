"use client";

import React from "react";
import {
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
  NavigationMenuContent,
} from "@repo/ui";
import { IconComponent } from "@repo/ui";
import Link from "next/link";
import { NavigationItemProps } from "./types";
import {
  getTitle,
  generateHref,
  getLinkTarget,
  getLinkRel,
  hasVisibleChildren,
  getIconName,
} from "./utils";
import { cn } from "@repo/utils";

// Content component for icon and title
const ItemContent = ({
  item,
  isMobile,
  currentLanguage,
}: Pick<NavigationItemProps, "item" | "isMobile" | "currentLanguage">) => {
  const title = getTitle(item, currentLanguage || 'en');
  const iconName = getIconName(item);

  return (
    <div
      className={cn(
        "flex items-center",
        isMobile ? "gap-3 p-3 text-base" : "gap-2"
      )}
    >
      {iconName && (
        <IconComponent
          name={iconName}
          className={cn(isMobile ? "h-5 w-5" : "h-4 w-4")}
        />
      )}
      <span>{title}</span>
    </div>
  );
};

// Dropdown content component
const DropdownContent = ({
  children,
  currentLanguage,
  isAuthenticated = false,
  userRoles = [],
}: {
  children: any[];
  currentLanguage: "en" | "mm";
  isAuthenticated?: boolean;
  userRoles?: string[];
}) => (
  <NavigationMenuContent>
    <div className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
      {children.map((child) => (
        <NavigationItemComponent
          key={child.id}
          item={child}
          currentLanguage={currentLanguage}
          isAuthenticated={isAuthenticated}
          userRoles={userRoles}
          isMobile={false}
        />
      ))}
    </div>
  </NavigationMenuContent>
);

// Desktop navigation item
const DesktopNavigationItem = ({
  item,
  currentLanguage,
  isAuthenticated,
  userRoles,
}: Omit<NavigationItemProps, "isMobile">) => {
  const href = generateHref(item);
  const target = getLinkTarget(item);
  const rel = getLinkRel(item);
  const hasChildren = hasVisibleChildren(item, isAuthenticated, userRoles);

  const content = (
    <ItemContent
      item={item}
      currentLanguage={currentLanguage}
      isMobile={false}
    />
  );

  if (hasChildren) {
    return (
      <NavigationMenuItem className={cn(item.cssClass)}>
        <NavigationMenuTrigger>{content}</NavigationMenuTrigger>
        <DropdownContent
          currentLanguage={currentLanguage || 'en'}
          isAuthenticated={isAuthenticated}
          userRoles={userRoles}
        >
          {item.children || []}
        </DropdownContent>
      </NavigationMenuItem>
    );
  }

  return (
    <NavigationMenuItem className={cn(item.cssClass)}>
      <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
        <Link href={href} target={target} rel={rel}>
          {content}
        </Link>
      </NavigationMenuLink>
    </NavigationMenuItem>
  );
};

// Mobile navigation item
const MobileNavigationItem = ({
  item,
  currentLanguage,
  isAuthenticated,
  userRoles,
}: Omit<NavigationItemProps, "isMobile">) => {
  const href = generateHref(item);
  const target = getLinkTarget(item);
  const rel = getLinkRel(item);
  const hasChildren = hasVisibleChildren(item, isAuthenticated, userRoles);

  const content = (
    <ItemContent
      item={item}
      currentLanguage={currentLanguage}
      isMobile={true}
    />
  );

  if (hasChildren) {
    return (
      <div className={cn(item.cssClass)}>
        <div className="block w-full text-left hover:bg-accent hover:text-accent-foreground rounded-md transition-colors">
          {content}
        </div>
        {item.children && (
          <div className="ml-6 mt-1 space-y-1">
            {item.children.map((child) => (
              <NavigationItemComponent
                key={child.id}
                item={child}
                currentLanguage={currentLanguage}
                isAuthenticated={isAuthenticated}
                userRoles={userRoles}
                isMobile={true}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn(item.cssClass)}>
      <Link
        href={href}
        target={target}
        rel={rel}
        className="block w-full text-left hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
      >
        {content}
      </Link>
    </div>
  );
};

export function NavigationItemComponent({
  isMobile = false,
  ...props
}: NavigationItemProps) {
  if (isMobile) {
    return <MobileNavigationItem {...props} />;
  }
  return <DesktopNavigationItem {...props} />;
}
