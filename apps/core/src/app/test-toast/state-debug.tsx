"use client";

import React from "react";
import * as directToastUtils from "@repo/utils/toast";

export function StateDebug() {
  const [toastFunctions, setToastFunctions] = React.useState<any>({});
  const [debugInfo, setDebugInfo] = React.useState<string[]>([]);

  React.useEffect(() => {
    const log = (message: string) => {
      console.log(message);
      setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    };

    log("🔍 State Debug: Starting initialization...");
    
    const initializeToastFunctions = async () => {
      try {
        log(`🔍 State Debug: directToastUtils keys: ${Object.keys(directToastUtils)}`);
        log(`🔍 State Debug: toastSuccess exists: ${!!directToastUtils.toastSuccess}`);
        log(`🔍 State Debug: toastSuccess type: ${typeof directToastUtils.toastSuccess}`);
        
        // Check if direct import worked
        if (directToastUtils.toastSuccess) {
          log("✅ State Debug: Direct toast import successful");
          
          const functions = {
            toastSuccess: directToastUtils.toastSuccess,
            toastError: directToastUtils.toastError,
            toastWarning: directToastUtils.toastWarning,
            toastInfo: directToastUtils.toastInfo,
            toastDefault: directToastUtils.toastDefault,
            toastPromise: directToastUtils.toastPromise,
            dismissAllToasts: directToastUtils.dismissAllToasts,
          };
          
          log(`🔍 State Debug: Setting functions in state: ${Object.keys(functions)}`);
          setToastFunctions(functions);
          
          // Verify state was set (this will happen in next render)
          setTimeout(() => {
            log(`🔍 State Debug: State verification - functions set: ${Object.keys(toastFunctions)}`);
          }, 100);
          
          return;
        }

        throw new Error("Toast functions not found in direct import");
        
      } catch (error) {
        log(`❌ State Debug: Import failed: ${error}`);
      }
    };

    initializeToastFunctions();
  }, []);

  // Separate effect to monitor state changes
  React.useEffect(() => {
    const log = (message: string) => {
      console.log(message);
      setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    };

    log(`🔍 State Debug: State changed, current keys: ${Object.keys(toastFunctions)}`);
    
    if (toastFunctions.toastSuccess) {
      log("✅ State Debug: toastSuccess is now available in state");
    } else {
      log("❌ State Debug: toastSuccess is still NOT available in state");
    }
  }, [toastFunctions]);

  // Get the functions from state
  const { toastSuccess, toastError, toastWarning } = toastFunctions;

  const testStateFunction = () => {
    console.log("🧪 State Debug: Testing function from state...");
    console.log("🧪 State Debug: toastSuccess from state:", toastSuccess);
    console.log("🧪 State Debug: typeof toastSuccess:", typeof toastSuccess);
    
    if (toastSuccess) {
      try {
        console.log("🧪 State Debug: Calling toastSuccess from state...");
        const result = toastSuccess("State debug test message");
        console.log("🧪 State Debug: State function executed successfully, result:", result);
      } catch (error) {
        console.error("❌ State Debug: State function execution failed:", error);
      }
    } else {
      console.error("❌ State Debug: toastSuccess from state is undefined/null");
    }
  };

  return (
    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
      <h3 className="text-lg font-semibold mb-3 text-purple-800 dark:text-purple-200">
        🔍 React State Debug
      </h3>
      
      <div className="mb-4">
        <div className="text-sm font-semibold mb-2">Current State:</div>
        <div className="text-sm font-mono bg-white dark:bg-gray-800 p-2 rounded">
          Functions in state: {Object.keys(toastFunctions).join(", ") || "none"}
        </div>
        <div className="text-sm font-mono bg-white dark:bg-gray-800 p-2 rounded mt-1">
          toastSuccess available: {toastSuccess ? "✅ YES" : "❌ NO"}
        </div>
      </div>
      
      <button 
        onClick={testStateFunction}
        className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 mb-4"
        disabled={!toastSuccess}
      >
        Test Function From State
      </button>
      
      <div className="text-xs space-y-1 max-h-40 overflow-y-auto bg-white dark:bg-gray-800 p-2 rounded">
        {debugInfo.map((info, index) => (
          <div key={index} className="font-mono">
            {info}
          </div>
        ))}
      </div>
    </div>
  );
}