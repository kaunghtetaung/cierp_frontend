"use client";

import React, { useState } from "react";
import { useLanguage } from "@repo/language";
import { ReactHookFormWrapper } from "@/components/forms/ReactHookFormWrapper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { IconComponent } from "@repo/ui/components/icons";
import { submitModuleForm } from "@repo/app-modules/server-actions";
import { generateZodSchema } from "@/lib/form-schema";
import type { FormField, ModuleSchema } from "@repo/types";

// Test department form schema
const departmentFormFields: FormField[] = [
  {
    fieldName: "name",
    fieldType: "text",
    label: {
      en: "Department Name",
      mm: "ဌာနအမည်"
    },
    placeHolder: "Enter department name",
    validationRule: {
      required: true,
      errorMessage: {
        en: "Department name is required",
        mm: "ဌာနအမည် ထည့်ရပါမည်"
      }
    },
    readonly: false,
    hidden: false,
    isMultiLang: false
  },
  {
    fieldName: "description",
    fieldType: "textArea",
    label: {
      en: "Description",
      mm: "ဖော်ပြချက်"
    },
    placeHolder: "Enter department description",
    validationRule: {
      required: false,
      errorMessage: {
        en: "Please enter a valid description",
        mm: "မှန်ကန်သော ဖော်ပြချက် ထည့်သွင်းပါ"
      }
    },
    readonly: false,
    hidden: false,
    isMultiLang: false
  },
  {
    fieldName: "organizationId",
    fieldType: "select",
    label: {
      en: "Organization",
      mm: "အဖွဲ့အစည်း"
    },
    placeHolder: "Select organization",
    validationRule: {
      required: true,
      errorMessage: {
        en: "Organization is required",
        mm: "အဖွဲ့အစည်း ရွေးချယ်ရပါမည်"
      }
    },
    readonly: false,
    hidden: false,
    isMultiLang: false,
    dropdownConfig: {
      type: "dynamic",
      refPath: "/organizations/ref",
      searchable: true,
      clearable: false,
      preloadData: true
    }
  },
  {
    fieldName: "parentDepartmentId",
    fieldType: "select",
    label: {
      en: "Parent Department",
      mm: "မူလဌာန"
    },
    placeHolder: "Select parent department (optional)",
    validationRule: {
      required: false,
      errorMessage: {
        en: "Please enter a valid description",
        mm: "မှန်ကန်သော ဖော်ပြချက် ထည့်သွင်းပါ"
      }
    },
    readonly: false,
    hidden: false,
    isMultiLang: false,
    dropdownConfig: {
      type: "dynamic",
      refPath: "/departments/ref",
      searchable: true,
      clearable: true,
      preloadData: true,
      dependsOn: ["organizationId"],
      queryParams: ["orgId"]
    }
  },
  {
    fieldName: "departmentCode",
    fieldType: "text",
    label: {
      en: "Department Code",
      mm: "ဌာနကုဒ်"
    },
    placeHolder: "Enter department code",
    validationRule: {
      required: true,
      minLength: 2,
      maxLength: 10,
      errorMessage: {
        en: "Department code is required (2-10 characters)",
        mm: "ဌာနကုဒ် ထည့်ရပါမည် (၂-၁၀ စာလုံး)"
      }
    },
    readonly: false,
    hidden: false,
    isMultiLang: false
  },
  {
    fieldName: "isActive",
    fieldType: "checkbox",
    label: {
      en: "Active",
      mm: "အသုံးပြုနေသည်"
    },
    validationRule: {
      required: false,
      errorMessage: {
        en: "Please enter a valid description",
        mm: "မှန်ကန်သော ဖော်ပြချက် ထည့်သွင်းပါ"
      }
    },
    readonly: false,
    hidden: false,
    isMultiLang: false
  },
  {
    fieldName: "managerName",
    fieldType: "text",
    label: {
      en: "Manager Name",
      mm: "မန်နေဂျာအမည်"
    },
    placeHolder: "Enter manager name",
    validationRule: {
      required: false,
      errorMessage: {
        en: "Please enter a valid description",
        mm: "မှန်ကန်သော ဖော်ပြချက် ထည့်သွင်းပါ"
      }
    },
    readonly: false,
    hidden: false,
    isMultiLang: false
  }
];

// Mock ModuleSchema for testing
const mockDepartmentModule: ModuleSchema = {
  slug: "departments",
  name: {
    en: "Departments",
    mm: "ဌာနများ"
  },
  description: {
    en: "Department Management",
    mm: "ဌာန စီမံခန့်ခွဲမှု"
  },
  iconName: "Building2",
  formFields: departmentFormFields,
  dataTableSchema: {
    layout: "withCheckbox",
    pagination: {
      enabled: true,
      defaultLimit: 10,
      allowedLimits: [5, 10, 25, 50]
    },
    filtering: {
      enabled: true,
      searchFields: ["name", "departmentCode"]
    },
    sorting: {
      enabled: true,
      defaultSort: {
        field: "name",
        direction: "asc"
      }
    },
    columns: [
      {
        fieldName: "name",
        label: { en: "Name", mm: "အမည်" },
        type: "text",
        sortable: true,
        filterable: true
      }
    ],
    actions: {
      view: {
        type: "page",
        label: { en: "View", mm: "ကြည့်ရှု" },
        icon: "Eye",
        permission: "read"
      },
      edit: {
        type: "page", 
        label: { en: "Edit", mm: "တည်းဖြတ်" },
        icon: "Edit",
        permission: "update"
      },
      delete: {
        type: "api",
        label: { en: "Delete", mm: "ဖျက်" },
        icon: "Trash",
        permission: "delete"
      },
      extraActions: []
    }
  },
  extraActionForms: [],
  moduleAccessPolicy: {
    resourceIdField: "id",
    hasOrganizationField: true,
    organizationIdFieldName: "organizationId",
    hasDepartmentField: false,
    departmentIdFieldName: "",
    queryAllowedFields: [
      { fieldName: "name", fieldType: "text", operators: ["eq", "like"] },
      { fieldName: "departmentCode", fieldType: "text", operators: ["eq", "like"] }
    ],
    accessPolicy: {
      systemAdmin: {
        operation: {
          create: true,
          read: { allow: true, restrictInvisibleFields: false },
          update: { allow: true },
          softDelete: true,
          hardDelete: true
        }
      },
      organizationAdmin: {
        operation: {
          create: true,
          read: { allow: true, restrictInvisibleFields: false },
          update: { allow: true },
          softDelete: true,
          hardDelete: false
        }
      },
      organizationMember: {
        operation: {
          create: false,
          read: { allow: true, restrictInvisibleFields: true },
          update: { allow: false },
          softDelete: false,
          hardDelete: false
        }
      },
      public: {
        operation: {
          create: false,
          read: { allow: false, restrictInvisibleFields: true },
          update: { allow: false },
          softDelete: false,
          hardDelete: false
        }
      }
    }
  }
};

export default function TestDepartmentsPage() {
  const { currentLanguage } = useLanguage();
  const [debugInfo, setDebugInfo] = useState<any[]>([]);
  const [formData, setFormData] = useState<any>(null);
  const [testMode, setTestMode] = useState<"create" | "update">("create");

  const addDebugInfo = (info: string, data?: any) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugInfo(prev => [...prev, { timestamp, info, data }]);
  };

  const handleFormSuccess = (data: any) => {
    addDebugInfo("Form submitted successfully", data);
    setFormData(data);
  };

  const clearDebugInfo = () => {
    setDebugInfo([]);
    setFormData(null);
  };

  const testOrganizationDropdown = async () => {
    addDebugInfo("Testing organization dropdown...");
    try {
      const { getModuleReferenceAction } = await import("@repo/app-modules/server-actions");
      const result = await getModuleReferenceAction("organizations");
      addDebugInfo("Organization dropdown test result", result);
    } catch (error) {
      addDebugInfo("Organization dropdown test failed", error);
    }
  };

  const testDepartmentDropdown = async () => {
    addDebugInfo("Testing department dropdown...");
    try {
      const { getModuleReferenceAction } = await import("@repo/app-modules/server-actions");
      const result = await getModuleReferenceAction("departments");
      addDebugInfo("Department dropdown test result", result);
    } catch (error) {
      addDebugInfo("Department dropdown test failed", error);
    }
  };

  // Mock initial data for edit mode testing
  const mockEditData = {
    name: "Engineering Department",
    description: "Software engineering and development team",
    organizationId: "org_12345", // This ID should display as label once options load
    parentDepartmentId: "dept_67890", // This ID should display as label once options load
    departmentCode: "ENG",
    isActive: true,
    managerName: "John Doe"
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {currentLanguage === "mm" ? "ဌာန စမ်းသပ်မှု စာမျက်နှာ" : "Department Test Page"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {currentLanguage === "mm" 
              ? "Dynamic dropdown နှင့် React Hook Form စမ်းသပ်ရန်"
              : "Test dynamic dropdowns and React Hook Form functionality"
            }
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setTestMode(testMode === "create" ? "update" : "create")} 
            variant="outline"
          >
            <IconComponent name="RotateCcw" className="w-4 h-4 mr-2" />
            {currentLanguage === "mm" 
              ? (testMode === "create" ? "Edit Mode သို့" : "Create Mode သို့")
              : (testMode === "create" ? "Switch to Edit" : "Switch to Create")
            }
          </Button>
          <Button onClick={clearDebugInfo} variant="outline">
            <IconComponent name="Trash2" className="w-4 h-4 mr-2" />
            {currentLanguage === "mm" ? "Debug စာရင်း ရှင်းမည်" : "Clear Debug"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form Section */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconComponent name="Building2" className="w-5 h-5" />
                {currentLanguage === "mm" ? "ဌာန ဖောင်" : "Department Form"}
                <span className="text-sm bg-primary/10 text-primary px-2 py-1 rounded-md">
                  {testMode === "create" ? "Create Mode" : "Edit Mode"}
                </span>
              </CardTitle>
              <CardDescription>
                {currentLanguage === "mm" 
                  ? "အောက်ပါဖောင်သည် dynamic dropdown များကို စမ်းသပ်ရန်အတွက်ဖြစ်သည်"
                  : "This form tests dynamic dropdowns with dependent fields"
                }
                {testMode === "update" && (
                  <span className="block mt-1 text-xs">
                    {currentLanguage === "mm" 
                      ? "Edit mode တွင် dropdown များသည် ID များအစား label များကို ပြသရမည်"
                      : "In edit mode, dropdowns should display labels instead of IDs"
                    }
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ReactHookFormWrapper
                module={mockDepartmentModule}
                action={testMode}
                initialData={testMode === "update" ? mockEditData : undefined}
                moduleSlug="departments"
                itemId={testMode === "update" ? "1" : undefined}
              />
            </CardContent>
          </Card>

          {/* Manual Test Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconComponent name="TestTube" className="w-5 h-5" />
                {currentLanguage === "mm" ? "လက်ဖြင့် စမ်းသပ်မှု" : "Manual Tests"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button onClick={testOrganizationDropdown} variant="outline" size="sm">
                  <IconComponent name="Building" className="w-4 h-4 mr-2" />
                  {currentLanguage === "mm" ? "အဖွဲ့အစည်း စမ်းသပ်မည်" : "Test Organizations"}
                </Button>
                <Button onClick={testDepartmentDropdown} variant="outline" size="sm">
                  <IconComponent name="Building2" className="w-4 h-4 mr-2" />
                  {currentLanguage === "mm" ? "ဌာန စမ်းသပ်မည်" : "Test Departments"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Debug Section */}
        <div className="space-y-6">
          {/* Form Data Display */}
          {formData && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconComponent name="CheckCircle" className="w-5 h-5 text-green-500" />
                  {currentLanguage === "mm" ? "ဖောင် ဒေတာ" : "Form Data"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                  {JSON.stringify(formData, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}

          {/* Debug Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconComponent name="Bug" className="w-5 h-5" />
                {currentLanguage === "mm" ? "Debug အချက်အလက်များ" : "Debug Information"}
              </CardTitle>
              <CardDescription>
                {currentLanguage === "mm" 
                  ? "API calls နှင့် ဖောင် events များ"
                  : "API calls and form events"
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {debugInfo.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    {currentLanguage === "mm" ? "Debug အချက်အလက် မရှိသေးပါ" : "No debug information yet"}
                  </p>
                ) : (
                  debugInfo.map((item, index) => (
                    <div key={index} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{item.info}</span>
                        <span className="text-xs text-muted-foreground">{item.timestamp}</span>
                      </div>
                      {item.data && (
                        <>
                          <Separator />
                          <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
                            {JSON.stringify(item.data, null, 2)}
                          </pre>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconComponent name="Info" className="w-5 h-5" />
            {currentLanguage === "mm" ? "အသုံးပြုပုံ" : "Instructions"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">
                {currentLanguage === "mm" ? "ဖောင် စမ်းသပ်ရန်:" : "To test the form:"}
              </h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>{currentLanguage === "mm" ? "အဖွဲ့အစည်း ရွေးချယ်ပါ" : "Select an organization"}</li>
                <li>{currentLanguage === "mm" ? "မူလဌာန ရွေးချယ်ပါ (မရွေးလည်းရသည်)" : "Select parent department (optional)"}</li>
                <li>{currentLanguage === "mm" ? "ကျန်သော အချက်အလက်များ ဖြည့်ပါ" : "Fill in other required fields"}</li>
                <li>{currentLanguage === "mm" ? "သိမ်းမည် ကို နှိပ်ပါ" : "Click Save Department"}</li>
              </ol>
            </div>
            <div>
              <h4 className="font-medium mb-2">
                {currentLanguage === "mm" ? "လက်ဖြင့် စမ်းသပ်ရန်:" : "To test manually:"}
              </h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>{currentLanguage === "mm" ? "Organizations စမ်းသပ်မည် ကို နှိပ်ပါ" : "Click 'Test Organizations' button"}</li>
                <li>{currentLanguage === "mm" ? "Departments စမ်းသပ်မည် ကို နှိပ်ပါ" : "Click 'Test Departments' button"}</li>
                <li>{currentLanguage === "mm" ? "Debug အချက်အလက်များ ကြည့်ပါ" : "Check debug information"}</li>
                <li>{currentLanguage === "mm" ? "Browser console ကိုလည်း ကြည့်ပါ" : "Also check browser console"}</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}