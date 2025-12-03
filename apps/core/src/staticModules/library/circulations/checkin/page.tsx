"use client";

import { IconComponent } from "@repo/ui";
import { CheckinForm } from "./CheckinForm";

export default function CheckinPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2 mb-2">
          <IconComponent name="BookCheck" className="w-8 h-8" />
          Book Check-In
        </h1>
        <p className="text-muted-foreground">Return checked-out books</p>
      </div>

      {/* Check-in Form */}
      <CheckinForm />
    </div>
  );
}
