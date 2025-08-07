"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { DebugImports } from "./debug-imports";
import { StateDebug } from "./state-debug";

// Import toast functions using direct path (this actually works!)
import * as toastUtils from "@repo/utils/toast";

export default function TestToastPage() {
  // Extract functions from the imported utils
  const { toastSuccess, toastError, toastWarning, toastInfo, toastDefault, toastPromise, dismissAllToasts } = toastUtils;
  
  // Toast functions are now directly imported and available!
  console.log("🍞 Toast functions imported successfully:", {
    toastSuccess: !!toastSuccess,
    toastError: !!toastError,
    toastWarning: !!toastWarning,
    toastInfo: !!toastInfo,
    toastDefault: !!toastDefault,
    toastPromise: !!toastPromise,
    dismissAllToasts: !!dismissAllToasts,
  });
  // Test direct sonner first
  const testDirectSonner = () => {
    console.log("🧪 Testing direct sonner toast...");
    toast("Direct Sonner Test - This should appear!", {
      duration: 3000
    });
  };

  // Test promise for promise toast
  const testPromise = () => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() > 0.5) {
          resolve("Operation completed successfully!");
        } else {
          reject(new Error("Operation failed!"));
        }
      }, 2000);
    });
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Toast Testing Page</CardTitle>
          <CardDescription>
            Test all toast notification functions to verify they display correctly
          </CardDescription>
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">Import Status:</span>
            <span className="text-green-600">
              ✅ Using @repo/utils functions (direct import)
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Debug Import Analysis */}
          <DebugImports />
          
          {/* React State Debug */}
          <StateDebug />
          
          {/* Direct Sonner Test - First Priority */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h3 className="text-lg font-semibold mb-3 text-blue-800 dark:text-blue-200">🧪 Direct Sonner Test (Priority)</h3>
            <p className="text-sm text-blue-600 dark:text-blue-300 mb-3">Test if Sonner toast library is working at all</p>
            <Button 
              onClick={testDirectSonner}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Test Direct Sonner Toast
            </Button>
          </div>

          {/* Basic Toast Tests */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Basic Toast Functions</h3>
            <div className="flex flex-wrap gap-3">
              <Button 
                onClick={() => toastSuccess("Success! This is a success message.")}
                variant="default"
                className="bg-green-600 hover:bg-green-700"
              >
                Test Success Toast
              </Button>
              
              <Button 
                onClick={() => toastError("Error! This is an error message.")}
                variant="destructive"
              >
                Test Error Toast
              </Button>
              
              <Button 
                onClick={() => toastWarning("Warning! This is a warning message.")}
                variant="outline"
                className="border-yellow-500 text-yellow-600 hover:bg-yellow-50"
              >
                Test Warning Toast
              </Button>
              
              <Button 
                onClick={() => toastInfo("Info! This is an info message.")}
                variant="outline"
                className="border-blue-500 text-blue-600 hover:bg-blue-50"
              >
                Test Info Toast
              </Button>
              
              <Button 
                onClick={() => toastDefault("Default! This is a default message.")}
                variant="outline"
              >
                Test Default Toast
              </Button>
            </div>
          </div>

          {/* Custom Options Tests */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Custom Options Tests</h3>
            <div className="flex flex-wrap gap-3">
              <Button 
                onClick={() => toastSuccess("Long duration success", { duration: 10000 })}
                variant="default"
                className="bg-green-600 hover:bg-green-700"
              >
                Long Duration (10s)
              </Button>
              
              <Button 
                onClick={() => toastError("Short duration error", { duration: 1000 })}
                variant="destructive"
              >
                Short Duration (1s)
              </Button>
              
              <Button 
                onClick={() => toastSuccess("Success with action", {
                  action: {
                    label: "Undo",
                    onClick: () => toastInfo("Action clicked!")
                  }
                })}
                variant="default"
                className="bg-green-600 hover:bg-green-700"
              >
                With Action Button
              </Button>
              
              <Button 
                onClick={() => toastWarning("Non-dismissible warning", { dismissible: false, duration: 5000 })}
                variant="outline"
                className="border-yellow-500 text-yellow-600 hover:bg-yellow-50"
              >
                Non-dismissible (5s)
              </Button>
            </div>
          </div>

          {/* Promise Toast Test */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Promise Toast Test</h3>
            <div className="flex flex-wrap gap-3">
              <Button 
                onClick={() => toastPromise(
                  testPromise(),
                  {
                    loading: "Processing request...",
                    success: "Request completed successfully!",
                    error: (err) => `Request failed: ${err.message}`
                  }
                )}
                variant="outline"
                className="border-purple-500 text-purple-600 hover:bg-purple-50"
              >
                Test Promise Toast
              </Button>
            </div>
          </div>

          {/* Backend Error Simulation */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Backend Error Simulations</h3>
            <div className="flex flex-wrap gap-3">
              <Button 
                onClick={() => toastError("BAD_REQUEST_FORMAT: The request format is invalid")}
                variant="destructive"
              >
                Simulate BAD_REQUEST_FORMAT
              </Button>
              
              <Button 
                onClick={() => toastError("FORM_VALIDATION_FAIL: Please check the required fields")}
                variant="destructive"
              >
                Simulate FORM_VALIDATION_FAIL
              </Button>
              
              <Button 
                onClick={() => toastWarning("SESSION_EXPIRED: Your session has expired. Please log in again.")}
                variant="outline"
                className="border-yellow-500 text-yellow-600 hover:bg-yellow-50"
              >
                Simulate SESSION_EXPIRED
              </Button>
            </div>
          </div>

          {/* Multiple Toasts Test */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Multiple Toasts Test</h3>
            <div className="flex flex-wrap gap-3">
              <Button 
                onClick={() => {
                  toastInfo("First toast");
                  setTimeout(() => toastSuccess("Second toast"), 500);
                  setTimeout(() => toastWarning("Third toast"), 1000);
                  setTimeout(() => toastError("Fourth toast"), 1500);
                }}
                variant="outline"
              >
                Show Multiple Toasts
              </Button>
              
              <Button 
                onClick={() => dismissAllToasts()}
                variant="outline"
                className="border-red-500 text-red-600 hover:bg-red-50"
              >
                Dismiss All Toasts
              </Button>
            </div>
          </div>

          {/* Note: Position is now handled at the Toaster component level */}
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>ℹ️ Position Configuration:</strong> All toasts now appear at "top-center" position as configured in the Toaster component.
            </p>
          </div>

          {/* Console Logs Info */}
          <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h4 className="font-semibold mb-2">💡 Debug Information</h4>
            <p className="text-sm text-muted-foreground">
              • Check browser console for detailed toast debugging logs<br/>
              • Each toast call generates logs with unique IDs and timestamps<br/>
              • Success/Error/Warning toasts should appear at "top-center" position<br/>
              • All toasts should be visible and dismissible (unless specified otherwise)
            </p>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}