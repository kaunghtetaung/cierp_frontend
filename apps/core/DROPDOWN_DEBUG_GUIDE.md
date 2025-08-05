# Dynamic Dropdown Debug Guide

## 🎯 Issue
The dynamic application dropdown in extra action forms is not loading applications.

## 🔧 Debug Changes Made

### 1. Added Comprehensive Logging
Added detailed console logging throughout the dropdown flow:

- `🎯 useExtraActionForm.openForm` - When form is opened
- `🎭 ExtraActionFormRouter` - Form routing decisions
- `🏗️ DynamicExtraActionForm` - Form rendering
- `🎨 DynamicExtraActionForm` - Select field rendering  
- `🔧 DynamicExtraActionForm` - Controller render calls
- `🔍 DynamicSelect.fetchOptions` - Complete fetch flow
- `📦 DynamicSelect` - Module extraction
- `🌐 DynamicSelect` - Server action calls
- `📊 DynamicSelect` - Server responses
- `📋 DynamicSelect` - Data transformation
- `✅ DynamicSelect` - Final options

### 2. Fixed Import Path
Corrected the import path from `@repo/appModules` to `@repo/app-modules` to match the actual package name in package.json.

### 3. Created Debug Component
Created `DropdownDebugger.tsx` component to test the server action directly.

## 🕵️ How to Debug

### Step 1: Add Debug Component to a Page
Add the DropdownDebugger component to any page:

```tsx
import { DropdownDebugger } from "@/components/debug/DropdownDebugger";

// Add to your page
<DropdownDebugger />
```

### Step 2: Test Server Action Directly
1. Click "Test Applications Dropdown" button
2. Check browser console for logs
3. Check if it successfully fetches applications

### Step 3: Test Extra Action Form
1. Go to Organizations module
2. Click "Add Application" action on any organization
3. Check browser console for the following log sequence:

```
🎯 useExtraActionForm.openForm: Opening form for action "addApplication"
🎭 ExtraActionFormRouter: Routing form for action "addApplication"  
🏗️ DynamicExtraActionForm: Rendering form for action "addApplication"
🎨 DynamicExtraActionForm: Rendering select field "applicationIds"
🔧 DynamicExtraActionForm: Controller render for "applicationIds"
🔍 DynamicSelect.fetchOptions: Starting fetch for field "applicationIds"
📦 DynamicSelect.fetchOptions: Extracted module "applications"
🌐 DynamicSelect.fetchOptions: Calling getModuleReferenceAction
📊 DynamicSelect.fetchOptions: Server action result
📋 DynamicSelect.fetchOptions: Raw data
✅ DynamicSelect.fetchOptions: Transformed options
```

## 🎯 Expected Backend Configuration

The backend should provide this configuration for the "Add Application" action:

```json
{
  "actionKey": "addApplication",
  "formApproach": "schema-driven",
  "formFields": [
    {
      "fieldName": "applicationIds",
      "fieldType": "select",
      "dropdownConfig": {
        "type": "dynamic",
        "refPath": "/applications/ref",
        "searchable": true,
        "clearable": false,
        "preloadData": true,
        "multiple": true
      }
    }
  ]
}
```

## 🔍 Common Issues to Check

1. **Import Path Error**: Check console for import errors
2. **Server Action Not Found**: Check if `getModuleReferenceAction` is imported correctly
3. **Backend API Error**: Check if `/core/applications/ref` endpoint exists and returns data
4. **Form Configuration**: Check if action has `formApproach: "schema-driven"` and `formFields`
5. **Dependencies Not Satisfied**: Check if dropdown has `dependsOn` fields that aren't filled

## 🛠️ Expected Server Action Flow

1. DynamicSelect calls `getModuleReferenceAction("applications")`
2. Server action calls `getModuleReference("applications")` from wrapper
3. Wrapper creates ModuleService with authentication context
4. ModuleService calls `GET /{appName}/applications/ref`
5. Backend returns array of applications
6. Data is transformed to SelectOption format
7. Dropdown displays options

## 📋 Expected API Response Format

The `/core/applications/ref` endpoint should return:

```json
{
  "success": true,
  "data": [
    {
      "_id": "app1",
      "displayName": {
        "en": "Application 1",
        "mm": "အက်ပလီကေးရှင်း ၁"
      }
    }
  ]
}
```

## 🚀 Next Steps

1. Run the app and check console logs
2. Use DropdownDebugger to test server action
3. Test the actual extra action form
4. Check which step in the flow is failing
5. Fix the specific issue found