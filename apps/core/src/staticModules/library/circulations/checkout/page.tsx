"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui";
import { IconComponent } from "@repo/ui";
import { CheckoutForm } from "./CheckoutForm";
import { BulkCheckoutForm } from "./BulkCheckoutForm";

export default function CheckoutPage() {
  const [activeTab, setActiveTab] = useState<"single" | "bulk">("single");

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2 mb-2">
          <IconComponent name="BookOpen" className="w-8 h-8" />
          Book Checkout
        </h1>
        <p className="text-muted-foreground">Check out books to borrowers</p>
      </div>

      {/* Info Card */}
      {/* <Card className="mb-6 border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-900">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2 text-blue-900 dark:text-blue-100">
            <IconComponent name="Info" className="w-4 h-4" />
            Quick Tips
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-800 dark:text-blue-200">
          <ul className="list-disc list-inside space-y-1">
            <li>Use <strong>Single Checkout</strong> for checking out one book at a time</li>
            <li>Use <strong>Bulk Checkout</strong> for checking out multiple books to one borrower</li>
            <li>Barcode scanner is available for quick accession number entry</li>
            <li>All fields marked with <span className="text-destructive">*</span> are required</li>
          </ul>
        </CardContent>
      </Card> */}

      {/* Tabs for Single vs Bulk Checkout */}
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as "single" | "bulk")}
      >
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-6">
          <TabsTrigger value="single" className="flex items-center gap-2">
            <IconComponent name="BookOpen" className="w-4 h-4" />
            Single Checkout
          </TabsTrigger>
          <TabsTrigger value="bulk" className="flex items-center gap-2">
            <IconComponent name="BookMarked" className="w-4 h-4" />
            Bulk Checkout
          </TabsTrigger>
        </TabsList>

        {/* Single Checkout Tab */}
        <TabsContent value="single" className="flex justify-center">
          <CheckoutForm />
        </TabsContent>

        {/* Bulk Checkout Tab */}
        <TabsContent value="bulk" className="flex justify-center">
          <BulkCheckoutForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}
