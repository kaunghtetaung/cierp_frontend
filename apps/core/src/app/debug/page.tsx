"use client";

import React from "react";
import Link from "next/link";
import { useLanguage } from "@repo/language";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IconComponent } from "@repo/ui/components/icons";

export default function DebugPage() {
  const { currentLanguage } = useLanguage();

  const debugPages = [
    {
      title: currentLanguage === "mm" ? "ဌာန စမ်းသပ်မှု" : "Department Testing",
      description: currentLanguage === "mm" 
        ? "Dynamic dropdown နှင့် React Hook Form စမ်းသပ်ရန်"
        : "Test dynamic dropdowns and React Hook Form functionality",
      href: "/test-departments",
      icon: "Building2"
    }
  ];

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">
          {currentLanguage === "mm" ? "Debug စာမျက်နှာများ" : "Debug Pages"}
        </h1>
        <p className="text-muted-foreground text-lg">
          {currentLanguage === "mm" 
            ? "Form နှင့် Module လုပ်ဆောင်ချက်များ စမ်းသပ်ရန်"
            : "Test form and module functionalities"
          }
        </p>
      </div>

      {/* Debug Pages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {debugPages.map((page, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <IconComponent name={page.icon as any} className="w-6 h-6 text-primary" />
                </div>
                {page.title}
              </CardTitle>
              <CardDescription>
                {page.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href={page.href}>
                  <IconComponent name="ExternalLink" className="w-4 h-4 mr-2" />
                  {currentLanguage === "mm" ? "စမ်းသပ်မည်" : "Open Test"}
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconComponent name="Info" className="w-5 h-5" />
            {currentLanguage === "mm" ? "အသုံးပြုပုံ" : "How to Use"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <IconComponent name="Target" className="w-4 h-4" />
                {currentLanguage === "mm" ? "ရည်ရွယ်ချက်" : "Purpose"}
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  {currentLanguage === "mm" 
                    ? "Dynamic dropdown လုပ်ဆောင်မှု စမ်းသပ်ရန်"
                    : "Test dynamic dropdown functionality"
                  }
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  {currentLanguage === "mm" 
                    ? "React Hook Form validation စမ်းသပ်ရန်"
                    : "Test React Hook Form validation"
                  }
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  {currentLanguage === "mm" 
                    ? "Backend API integration စစ်ဆေးရန်"
                    : "Debug backend API integration"
                  }
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <IconComponent name="AlertTriangle" className="w-4 h-4" />
                {currentLanguage === "mm" ? "မှတ်သားရန်" : "Important Notes"}
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  {currentLanguage === "mm" 
                    ? "Browser console ကို ဖွင့်ထားပါ"
                    : "Keep browser console open"
                  }
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  {currentLanguage === "mm" 
                    ? "Network tab ကို ကြည့်ရှုပါ"
                    : "Monitor network tab for API calls"
                  }
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  {currentLanguage === "mm" 
                    ? "Debug အချက်အလက်များ သိမ်းဆည်းပါ"
                    : "Save debug information for analysis"
                  }
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}