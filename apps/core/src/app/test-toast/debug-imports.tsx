"use client";

import React from "react";

// Test different import approaches
console.log("🔍 Debug Imports: Starting import tests...");

// Import 1: Direct toast import
try {
  console.log("🔍 Debug Imports: Attempting direct toast import...");
  const directToast = require("@repo/utils/toast");
  console.log("🔍 Debug Imports: Direct toast import result:", Object.keys(directToast));
  console.log("🔍 Debug Imports: toastSuccess type:", typeof directToast.toastSuccess);
  console.log("🔍 Debug Imports: toastSuccess function:", directToast.toastSuccess?.toString().substring(0, 100));
} catch (error) {
  console.error("❌ Debug Imports: Direct toast import failed:", error);
}

// Import 2: Dynamic import
let dynamicToastImport: any = null;
import("@repo/utils/toast").then((module) => {
  console.log("🔍 Debug Imports: Dynamic toast import result:", Object.keys(module));
  console.log("🔍 Debug Imports: Dynamic toastSuccess type:", typeof module.toastSuccess);
  dynamicToastImport = module;
}).catch((error) => {
  console.error("❌ Debug Imports: Dynamic toast import failed:", error);
});

// Import 3: ES6 static import
import * as staticToastImport from "@repo/utils/toast";
console.log("🔍 Debug Imports: Static toast import result:", Object.keys(staticToastImport));
console.log("🔍 Debug Imports: Static toastSuccess type:", typeof staticToastImport.toastSuccess);

// Import 4: Test main utils import
try {
  console.log("🔍 Debug Imports: Attempting main utils import...");
  const mainUtils = require("@repo/utils");
  console.log("🔍 Debug Imports: Main utils import result:", Object.keys(mainUtils));
  console.log("🔍 Debug Imports: Main utils toastSuccess found:", !!mainUtils.toastSuccess);
} catch (error) {
  console.error("❌ Debug Imports: Main utils import failed:", error);
}

// Import 5: Dynamic main utils
import("@repo/utils").then((module) => {
  console.log("🔍 Debug Imports: Dynamic main utils result:", Object.keys(module));
  console.log("🔍 Debug Imports: Dynamic main utils toastSuccess found:", !!module.toastSuccess);
}).catch((error) => {
  console.error("❌ Debug Imports: Dynamic main utils failed:", error);
});

export function DebugImports() {
  const [testResults, setTestResults] = React.useState<string[]>([]);

  React.useEffect(() => {
    const results = [];

    // Test static import
    results.push(`Static import keys: ${Object.keys(staticToastImport).join(", ")}`);
    results.push(`Static toastSuccess exists: ${!!staticToastImport.toastSuccess}`);
    results.push(`Static toastSuccess type: ${typeof staticToastImport.toastSuccess}`);

    // Test function execution
    if (staticToastImport.toastSuccess) {
      results.push("✅ Static toastSuccess function is available");
      try {
        // Test if function is callable (without actually calling it)
        results.push(`Function signature: ${staticToastImport.toastSuccess.toString().substring(0, 50)}...`);
        results.push("✅ Function appears to be valid");
      } catch (err) {
        results.push(`❌ Function validation failed: ${err}`);
      }
    } else {
      results.push("❌ Static toastSuccess function is NOT available");
    }

    setTestResults(results);
  }, []);

  const testExecuteFunction = () => {
    console.log("🧪 Debug Imports: Testing function execution...");
    
    if (staticToastImport.toastSuccess) {
      try {
        console.log("🧪 Debug Imports: Calling toastSuccess...");
        const result = staticToastImport.toastSuccess("Debug test message from direct import");
        console.log("🧪 Debug Imports: Function executed successfully, result:", result);
      } catch (error) {
        console.error("❌ Debug Imports: Function execution failed:", error);
      }
    } else {
      console.error("❌ Debug Imports: toastSuccess is not available for execution");
    }
  };

  const testDynamicExecution = () => {
    console.log("🧪 Debug Imports: Testing dynamic import execution...");
    
    if (dynamicToastImport && dynamicToastImport.toastSuccess) {
      try {
        console.log("🧪 Debug Imports: Calling dynamic toastSuccess...");
        const result = dynamicToastImport.toastSuccess("Debug test message from dynamic import");
        console.log("🧪 Debug Imports: Dynamic function executed successfully, result:", result);
      } catch (error) {
        console.error("❌ Debug Imports: Dynamic function execution failed:", error);
      }
    } else {
      console.error("❌ Debug Imports: Dynamic toastSuccess is not available for execution");
    }
  };

  return (
    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
      <h3 className="text-lg font-semibold mb-3 text-yellow-800 dark:text-yellow-200">
        🔍 Import Debug Results
      </h3>
      
      <div className="space-y-2 mb-4">
        {testResults.map((result, index) => (
          <div key={index} className="text-sm font-mono">
            {result}
          </div>
        ))}
      </div>
      
      <div className="flex gap-2">
        <button 
          onClick={testExecuteFunction}
          className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700"
        >
          Test Static Function
        </button>
        <button 
          onClick={testDynamicExecution}
          className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700"
        >
          Test Dynamic Function
        </button>
      </div>
      
      <div className="mt-3 text-xs text-yellow-600 dark:text-yellow-400">
        Check browser console for detailed import logs
      </div>
    </div>
  );
}