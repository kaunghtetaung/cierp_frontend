"use client";

import React, { useState } from "react";
import { getModuleReferenceAction } from "@repo/app-modules/server-actions";

export function DropdownDebugger() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testApplicationsDropdown = async () => {
    console.log("🧪 DropdownDebugger: Starting test...");
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log("🌐 DropdownDebugger: Calling getModuleReferenceAction for 'applications'");
      const result = await getModuleReferenceAction("applications");
      console.log("📊 DropdownDebugger: Result:", result);
      
      setResult(result);
      
      if (result.success) {
        console.log(`✅ DropdownDebugger: Success! Got ${result.data?.length || 0} applications`);
      } else {
        console.error(`❌ DropdownDebugger: Failed:`, result.error);
        setError(result.error || "Unknown error");
      }
    } catch (err) {
      console.error("💥 DropdownDebugger: Exception:", err);
      setError(err instanceof Error ? err.message : "Unknown exception");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-card">
      <h3 className="text-lg font-medium mb-4">Dropdown Debugger</h3>
      
      <button
        onClick={testApplicationsDropdown}
        disabled={isLoading}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-md disabled:opacity-50"
      >
        {isLoading ? "Testing..." : "Test Applications Dropdown"}
      </button>

      {error && (
        <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
          <h4 className="font-medium text-destructive">Error:</h4>
          <p className="text-sm text-destructive/80">{error}</p>
        </div>
      )}

      {result && (
        <div className="mt-4 p-3 bg-muted rounded-md">
          <h4 className="font-medium mb-2">Result:</h4>
          <pre className="text-xs overflow-auto max-h-64">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}