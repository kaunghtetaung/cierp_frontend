"use client";

import React, { useState, useEffect } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Button,
  Input,
  Label,
  Textarea,
  Alert,
  AlertDescription,
  Checkbox,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui";
import { Loader2, Plus, Trash2, CheckCircle2, XCircle } from "lucide-react";
import type { PreBuiltFormProps } from "../ExtraActionFormRouter";
import {
  getAcademicYears,
  getBatches,
  getBatchModules,
  getBatchSubjects,
  approveStudent,
} from "./student-actions";

// Validation schema
const batchEnrollmentSchema = z.object({
  isActive: z.boolean(),
  academicYearId: z.string().min(1, "Academic year is required"),
  batchId: z.string().min(1, "Batch is required"),
  rollNo: z.string().optional(),
  modules: z.array(z.string()).optional(),
  subjects: z.array(z.string()).optional(),
});

const approveStudentSchema = z.object({
  admissionNumber: z.string().optional(),
  batches: z.array(batchEnrollmentSchema).min(1, "At least one batch enrollment is required"),
  notes: z.string().optional(),
  libraryBorrowerRequest: z.boolean().default(true),
}).refine((data) => {
  // Only one batch can be active
  const activeCount = data.batches.filter(b => b.isActive).length;
  return activeCount <= 1;
}, {
  message: "Only one batch can be marked as active",
  path: ["batches"],
});

type ApproveStudentFormData = z.infer<typeof approveStudentSchema>;

interface ReferenceOption {
  id: string;
  _id: string;
  name: string;
  code?: string;
  learningMode?: 'subject-based' | 'module-based' | 'hybrid';
}

export function ApproveStudentForm({
  action,
  selectedItems,
  currentLanguage,
  onSubmit: onFormSubmit,
  onCancel,
  hideHeader = false,
}: PreBuiltFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Debug information state
  const [debugInfo, setDebugInfo] = useState<{
    url?: string;
    method?: string;
    requestBody?: any;
    response?: any;
    error?: string;
    timestamp?: string;
  } | null>(null);

  // Reference data
  const [academicYears, setAcademicYears] = useState<ReferenceOption[]>([]);
  const [batchesData, setBatchesData] = useState<Record<string, ReferenceOption[]>>({});
  const [modulesData, setModulesData] = useState<Record<string, ReferenceOption[]>>({});
  const [subjectsData, setSubjectsData] = useState<Record<string, ReferenceOption[]>>({});

  // Learning mode tracking per batch enrollment
  const [learningModes, setLearningModes] = useState<Record<number, 'subject-based' | 'module-based' | 'hybrid'>>({});

  // Loading states
  const [loadingAcademicYears, setLoadingAcademicYears] = useState(false);
  const [loadingBatches, setLoadingBatches] = useState<Record<number, boolean>>({});
  const [loadingModules, setLoadingModules] = useState<Record<number, boolean>>({});
  const [loadingSubjects, setLoadingSubjects] = useState<Record<number, boolean>>({});

  const {
    control,
    handleSubmit,
    formState: { errors, isValid, isSubmitting: formIsSubmitting },
    watch,
    setValue,
  } = useForm<ApproveStudentFormData>({
    resolver: zodResolver(approveStudentSchema),
    mode: 'onSubmit', // Only validate on submit to avoid showing errors immediately
    reValidateMode: 'onChange', // Re-validate on change after first submit
    defaultValues: {
      admissionNumber: "",
      batches: [
        {
          isActive: true,
          academicYearId: "",
          batchId: "",
          rollNo: "",
          modules: [],
          subjects: [],
        },
      ],
      notes: "",
      libraryBorrowerRequest: true,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "batches",
  });

  // Extract student data from selectedItems
  const studentData = selectedItems && selectedItems.length > 0
    ? (typeof selectedItems[0] === 'string' ? null : selectedItems[0])
    : null;

  const studentId = selectedItems && selectedItems.length > 0
    ? (typeof selectedItems[0] === 'string' ? selectedItems[0] : selectedItems[0]._id || selectedItems[0].id)
    : null;

  console.log('📦 [ApproveStudentForm] Component initialized', {
    selectedItems,
    studentData,
    studentId,
    hasFullData: !!studentData,
    existingBatches: studentData?.batches
  });

  // Load academic years on mount and pre-populate form with existing data
  useEffect(() => {
    loadAcademicYears();

    // Pre-populate form if student data is available
    if (studentData) {
      console.log('🔄 [ApproveStudentForm] Pre-populating form with existing student data', studentData);

      // Set admission number if available (MEDM field)
      if (studentData.medm) {
        setValue('admissionNumber', studentData.medm);
      }

      // Pre-populate existing batches
      if (studentData.batches && studentData.batches.length > 0) {
        // Clear default batch first
        remove(0);

        // Add each existing batch
        studentData.batches.forEach((batch: any, index: number) => {
          const academicYearId = batch.academicYearId?._id || batch.academicYearId || '';
          const batchId = batch.batchId?._id || batch.batchId || '';
          const rollNo = batch.rollNo || '';

          // Extract IDs from subjects (handle both string arrays and object arrays)
          const subjects = (batch.subjects || []).map((s: any) =>
            typeof s === 'string' ? s : (s.subjectId?._id || s.subjectId || s._id || s.id || s)
          );

          // Extract IDs from modules (handle both string arrays and object arrays)
          const modules = (batch.modules || []).map((m: any) =>
            typeof m === 'string' ? m : (m.moduleId?._id || m.moduleId || m._id || m.id || m)
          );

          console.log(`📝 [ApproveStudentForm] Processing batch ${index}`, {
            rawBatch: batch,
            extractedAcademicYearId: academicYearId,
            extractedBatchId: batchId,
            extractedRollNo: rollNo,
            extractedSubjects: subjects,
            extractedModules: modules
          });

          append({
            isActive: index === 0, // First batch is active by default
            academicYearId,
            batchId,
            rollNo,
            modules,
            subjects,
          });

          // Load batches for this academic year
          if (academicYearId) {
            loadBatchesForAcademicYear(academicYearId, index);
          }

          console.log(`✅ [ApproveStudentForm] Pre-populated batch ${index}`, {
            academicYearId,
            batchId,
            rollNo,
            subjectsCount: subjects.length,
            modulesCount: modules.length
          });
        });
      }
    }
  }, []);

  const loadAcademicYears = async () => {
    setLoadingAcademicYears(true);
    try {
      const result = await getAcademicYears();
      if (result.success) {
        setAcademicYears(result.data);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to load academic years' });
      }
    } catch (error) {
      console.error("Error loading academic years:", error);
      setMessage({ type: 'error', text: 'Failed to load academic years' });
    } finally {
      setLoadingAcademicYears(false);
    }
  };

  // Load batches when academic year changes
  const loadBatchesForAcademicYear = async (academicYearId: string, index: number) => {
    setLoadingBatches(prev => ({ ...prev, [index]: true }));
    try {
      const result = await getBatches(academicYearId);
      if (result.success) {
        setBatchesData(prev => ({ ...prev, [index]: result.data }));
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to load batches' });
      }
    } catch (error) {
      console.error("Error loading batches:", error);
      setMessage({ type: 'error', text: 'Failed to load batches' });
    } finally {
      setLoadingBatches(prev => ({ ...prev, [index]: false }));
    }
  };

  // Load modules and subjects when batch changes
  const loadBatchData = async (batchId: string, index: number, selectedBatch: ReferenceOption) => {
    // Store learning mode
    if (selectedBatch.learningMode) {
      setLearningModes(prev => ({ ...prev, [index]: selectedBatch.learningMode! }));
    }

    // Load modules if needed
    if (selectedBatch.learningMode === 'module-based' || selectedBatch.learningMode === 'hybrid') {
      setLoadingModules(prev => ({ ...prev, [index]: true }));
      try {
        const result = await getBatchModules(batchId);
        if (result.success) {
          setModulesData(prev => ({ ...prev, [index]: result.data }));
        } else {
          setMessage({ type: 'error', text: result.error || 'Failed to load modules' });
        }
      } catch (error) {
        console.error("Error loading modules:", error);
        setMessage({ type: 'error', text: 'Failed to load modules' });
      } finally {
        setLoadingModules(prev => ({ ...prev, [index]: false }));
      }
    }

    // Load subjects if needed
    if (selectedBatch.learningMode === 'subject-based' || selectedBatch.learningMode === 'hybrid') {
      setLoadingSubjects(prev => ({ ...prev, [index]: true }));
      try {
        const result = await getBatchSubjects(batchId);
        if (result.success) {
          setSubjectsData(prev => ({ ...prev, [index]: result.data }));
        } else {
          setMessage({ type: 'error', text: result.error || 'Failed to load subjects' });
        }
      } catch (error) {
        console.error("Error loading subjects:", error);
        setMessage({ type: 'error', text: 'Failed to load subjects' });
      } finally {
        setLoadingSubjects(prev => ({ ...prev, [index]: false }));
      }
    }
  };

  // Determine if modules should be shown for a batch enrollment
  const shouldShowModules = (index: number) => {
    const mode = learningModes[index];
    return mode === 'module-based' || mode === 'hybrid';
  };

  // Determine if subjects should be shown for a batch enrollment
  const shouldShowSubjects = (index: number) => {
    const mode = learningModes[index];
    return mode === 'subject-based' || mode === 'hybrid';
  };

  const onSubmit = async (formData: ApproveStudentFormData) => {
    setIsSubmitting(true);
    setMessage(null);
    setDebugInfo(null); // Clear previous debug info

    console.log('================================');
    console.log('📝 [ApproveStudentForm] FORM SUBMISSION STARTED');
    console.log('================================');
    console.log('👤 Student ID:', studentId);
    console.log('📋 Form Data:', JSON.stringify(formData, null, 2));
    console.log('🎯 Selected Items:', selectedItems);
    console.log('📊 Student Data:', studentData);
    console.log('================================');

    try {
      // Use the extracted studentId
      if (!studentId) {
        throw new Error("Student ID is required");
      }

      console.log('🚀 [ApproveStudentForm] Calling server action approveStudent()');
      console.log('   Student ID:', studentId);
      console.log('   Request Data (before transformation):', formData);

      // Transform data to match backend DTO
      const transformedData = {
        ...formData,
        batches: formData.batches.map(batch => ({
          ...batch,
          modules: batch.modules?.map(id => ({ moduleId: id })) || [],
          subjects: batch.subjects?.map(id => ({ subjectId: id })) || [],
        })),
      };

      console.log('   Request Data (after transformation):', transformedData);

      const result = await approveStudent(studentId, transformedData);

      // Set debug info - either from result or create our own
      const debugData = result.debugInfo || {
        url: result.debugInfo?.url || 'Server action: approveStudent',
        method: result.debugInfo?.method || 'POST',
        requestBody: transformedData,
        response: result.success ? result.data : null,
        error: result.success ? null : result.error,
        timestamp: new Date().toISOString(),
      };
      setDebugInfo(debugData);

      console.log('================================');
      console.log('📥 [ApproveStudentForm] SERVER ACTION RESPONSE');
      console.log('================================');
      console.log('✅ Success:', result.success);
      console.log('📦 Response Data:', JSON.stringify(result.data, null, 2));
      console.log('❌ Error:', result.error || 'None');
      console.log('🔍 Full Result:', result);
      console.log('================================');

      if (result.success) {
        // Don't show success message here - let parent modal handle it
        console.log('✅ [ApproveStudentForm] Action succeeded, letting parent handle toast');

        // Convert to FormData for parent onSubmit
        const submitData = new FormData();
        submitData.append('studentId', studentId);
        submitData.append('result', JSON.stringify(result));

        console.log('================================');
        console.log('✅ [ApproveStudentForm] SUCCESS - Calling parent onSubmit');
        console.log('================================');
        console.log('📤 FormData entries:', Array.from(submitData.entries()));
        console.log('================================');

        // Call parent onSubmit - it will handle success toast, refresh, and closing
        await onFormSubmit(submitData);

        console.log('🎉 [ApproveStudentForm] Parent onSubmit completed successfully');
        // Don't manually close - parent will handle it
      } else {
        console.log('================================');
        console.error('❌ [ApproveStudentForm] FAILURE - Server returned error');
        console.error('================================');
        console.error('Error message:', result.error);
        console.error('Full result:', result);
        console.error('================================');
        setMessage({ type: 'error', text: result.error || 'Failed to approve student' });
      }
    } catch (error) {
      console.log('================================');
      console.error("💥 [ApproveStudentForm] EXCEPTION CAUGHT");
      console.error('================================');
      console.error('Error:', error);
      console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      console.error('================================');
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to approve student'
      });
    } finally {
      setIsSubmitting(false);
      console.log('================================');
      console.log('🏁 [ApproveStudentForm] FORM SUBMISSION FLOW COMPLETED');
      console.log('================================');
    }
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Admission Number */}
            <div className="space-y-2">
              <Label htmlFor="admissionNumber">
                Admission Number <span className="text-muted-foreground text-xs">(Optional - auto-generated if blank)</span>
              </Label>
              <Controller
                name="admissionNumber"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="admissionNumber"
                    placeholder="Leave blank for auto-generation"
                  />
                )}
              />
              {errors.admissionNumber && (
                <p className="text-sm text-destructive">{errors.admissionNumber.message}</p>
              )}
            </div>

            {/* Batch Enrollments */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base">Batch Enrollments *</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({
                    isActive: false,
                    academicYearId: "",
                    batchId: "",
                    rollNo: "",
                    modules: [],
                    subjects: [],
                  })}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Batch
                </Button>
              </div>

              {errors.batches && typeof errors.batches.message === 'string' && (
                <Alert variant="destructive">
                  <AlertDescription>{errors.batches.message}</AlertDescription>
                </Alert>
              )}

              {fields.map((field, index) => (
                <div key={field.id} className="relative space-y-4 pb-4 border-b last:border-b-0">
                  {/* Delete button */}
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute top-0 right-0"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}

                  {/* Is Active */}
                  <div className="flex items-center space-x-2">
                    <Controller
                      name={`batches.${index}.isActive`}
                      control={control}
                      render={({ field: checkboxField }) => (
                        <Checkbox
                          id={`batches.${index}.isActive`}
                          checked={checkboxField.value}
                          onCheckedChange={(checked: boolean) => {
                            // Uncheck all other batches
                            if (checked) {
                              fields.forEach((_, i) => {
                                if (i !== index) {
                                  setValue(`batches.${i}.isActive`, false);
                                }
                              });
                            }
                            checkboxField.onChange(checked);
                          }}
                        />
                      )}
                    />
                    <Label htmlFor={`batches.${index}.isActive`} className="font-medium">
                      Active Batch
                    </Label>
                  </div>

                  {/* Academic Year, Batch, Roll Number - Single Row */}
                  <div className="grid grid-cols-12 gap-4">
                    {/* Academic Year - 5 columns */}
                    <div className="space-y-2 col-span-12 md:col-span-5">
                      <Label htmlFor={`batches.${index}.academicYearId`}>Academic Year *</Label>
                      <Controller
                        name={`batches.${index}.academicYearId`}
                        control={control}
                        render={({ field: selectField }) => (
                          <Select
                            value={selectField.value}
                            onValueChange={(value: string) => {
                              selectField.onChange(value);
                              // Reset batch when academic year changes
                              setValue(`batches.${index}.batchId`, "");
                              setValue(`batches.${index}.modules`, []);
                              setValue(`batches.${index}.subjects`, []);
                              setLearningModes(prev => {
                                const newModes = { ...prev };
                                delete newModes[index];
                                return newModes;
                              });
                              // Load batches for new academic year
                              if (value) {
                                loadBatchesForAcademicYear(value, index);
                              }
                            }}
                            disabled={loadingAcademicYears}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select academic year" />
                            </SelectTrigger>
                            <SelectContent>
                              {academicYears.map((year) => (
                                <SelectItem key={year.id || year._id} value={year.id || year._id}>
                                  {year.name} {year.code ? `(${year.code})` : ''}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {errors.batches?.[index]?.academicYearId && (
                        <p className="text-sm text-destructive">
                          {errors.batches[index]?.academicYearId?.message}
                        </p>
                      )}
                    </div>

                    {/* Batch - 5 columns */}
                    <div className="space-y-2 col-span-12 md:col-span-5">
                      <Label htmlFor={`batches.${index}.batchId`}>Batch *</Label>
                      <Controller
                        name={`batches.${index}.batchId`}
                        control={control}
                        render={({ field: selectField }) => (
                          <Select
                            value={selectField.value}
                            onValueChange={(value: string) => {
                              selectField.onChange(value);
                              // Find the selected batch to get learningMode
                              const selectedBatch = batchesData[index]?.find(
                                b => (b.id || b._id) === value
                              );
                              if (selectedBatch) {
                                loadBatchData(value, index, selectedBatch);
                              }
                            }}
                            disabled={!watch(`batches.${index}.academicYearId`) || loadingBatches[index]}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder={
                                loadingBatches[index] ? "Loading batches..." : "Select batch"
                              } />
                            </SelectTrigger>
                            <SelectContent>
                              {batchesData[index]?.map((batch) => (
                                <SelectItem key={batch.id || batch._id} value={batch.id || batch._id}>
                                  {batch.name} {batch.code ? `(${batch.code})` : ''}
                                  {batch.learningMode && (
                                    <span className="ml-2 text-xs text-muted-foreground">
                                      [{batch.learningMode}]
                                    </span>
                                  )}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {errors.batches?.[index]?.batchId && (
                        <p className="text-sm text-destructive">
                          {errors.batches[index]?.batchId?.message}
                        </p>
                      )}
                    </div>

                    {/* Roll Number - 2 columns */}
                    <div className="space-y-2 col-span-12 md:col-span-2">
                      <Label htmlFor={`batches.${index}.rollNo`}>Roll Number</Label>
                      <Controller
                        name={`batches.${index}.rollNo`}
                        control={control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            id={`batches.${index}.rollNo`}
                            placeholder="Enter roll number"
                          />
                        )}
                      />
                    </div>
                  </div>

                    {/* Modules (Conditional) */}
                    {shouldShowModules(index) && (
                      <div className="space-y-2">
                        <Label htmlFor={`batches.${index}.modules`}>
                          Modules {learningModes[index] === 'module-based' ? '*' : ''}
                        </Label>
                        <Controller
                          name={`batches.${index}.modules`}
                          control={control}
                          render={({ field: selectField }) => (
                            <div className="space-y-2">
                              {loadingModules[index] ? (
                                <div className="flex items-center text-sm text-muted-foreground">
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Loading modules...
                                </div>
                              ) : (
                                <div className="border rounded-md p-2 max-h-48 overflow-y-auto space-y-2">
                                  {modulesData[index]?.length > 0 ? (
                                    modulesData[index].map((module) => (
                                      <div key={module.id || module._id} className="flex items-center space-x-2">
                                        <Checkbox
                                          id={`module-${index}-${module.id || module._id}`}
                                          checked={selectField.value?.includes(module.id || module._id)}
                                          onCheckedChange={(checked: boolean) => {
                                            const currentValue = selectField.value || [];
                                            if (checked) {
                                              selectField.onChange([...currentValue, module.id || module._id]);
                                            } else {
                                              selectField.onChange(
                                                currentValue.filter(id => id !== (module.id || module._id))
                                              );
                                            }
                                          }}
                                        />
                                        <Label
                                          htmlFor={`module-${index}-${module.id || module._id}`}
                                          className="text-sm font-normal cursor-pointer"
                                        >
                                          {module.name} {module.code ? `(${module.code})` : ''}
                                        </Label>
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-sm text-muted-foreground">No modules available</p>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        />
                      </div>
                    )}

                    {/* Subjects (Conditional) */}
                    {shouldShowSubjects(index) && (
                      <div className="space-y-2">
                        <Label htmlFor={`batches.${index}.subjects`}>
                          Subjects {learningModes[index] === 'subject-based' ? '*' : ''}
                        </Label>
                        <Controller
                          name={`batches.${index}.subjects`}
                          control={control}
                          render={({ field: selectField }) => (
                            <div className="space-y-2">
                              {loadingSubjects[index] ? (
                                <div className="flex items-center text-sm text-muted-foreground">
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Loading subjects...
                                </div>
                              ) : (
                                <div className="border rounded-md p-2 max-h-48 overflow-y-auto space-y-2">
                                  {subjectsData[index]?.length > 0 ? (
                                    subjectsData[index].map((subject) => (
                                      <div key={subject.id || subject._id} className="flex items-center space-x-2">
                                        <Checkbox
                                          id={`subject-${index}-${subject.id || subject._id}`}
                                          checked={selectField.value?.includes(subject.id || subject._id)}
                                          onCheckedChange={(checked: boolean) => {
                                            const currentValue = selectField.value || [];
                                            if (checked) {
                                              selectField.onChange([...currentValue, subject.id || subject._id]);
                                            } else {
                                              selectField.onChange(
                                                currentValue.filter(id => id !== (subject.id || subject._id))
                                              );
                                            }
                                          }}
                                        />
                                        <Label
                                          htmlFor={`subject-${index}-${subject.id || subject._id}`}
                                          className="text-sm font-normal cursor-pointer"
                                        >
                                          {subject.name} {subject.code ? `(${subject.code})` : ''}
                                        </Label>
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-sm text-muted-foreground">No subjects available</p>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        />
                      </div>
                    )}
                </div>
              ))}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Controller
                name="notes"
                control={control}
                render={({ field }) => (
                  <Textarea
                    {...field}
                    id="notes"
                    placeholder="Add any additional notes..."
                    rows={4}
                  />
                )}
              />
            </div>

            {/* Library Borrower Request */}
            <div className="flex items-center space-x-2">
              <Controller
                name="libraryBorrowerRequest"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    id="libraryBorrowerRequest"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Label htmlFor="libraryBorrowerRequest">
                Request library borrower privileges
              </Label>
            </div>

            {/* Messages */}
            {message && (
              <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
                {message.type === 'success' ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                <AlertDescription>{message.text}</AlertDescription>
              </Alert>
            )}

            {/* Debug Information Section */}
            {debugInfo && (
              <div className="border-2 rounded-lg p-4 bg-blue-50 border-blue-200 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-base flex items-center gap-2 text-blue-900">
                    🔍 API Request/Response Details
                  </h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    debugInfo.error
                      ? 'bg-red-100 text-red-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {debugInfo.error ? '❌ Failed' : '✅ Success'}
                  </span>
                </div>

                <div className="space-y-3 text-sm">
                  {/* Request URL and Method */}
                  <div className="space-y-1">
                    <div className="font-semibold text-blue-900 text-xs uppercase tracking-wide">
                      Request Endpoint
                    </div>
                    <div className="bg-white p-3 rounded-md border border-blue-200 break-all font-mono text-sm">
                      <span className="inline-block px-2 py-1 bg-blue-600 text-white rounded mr-2 text-xs font-bold">
                        {debugInfo.method}
                      </span>
                      <span className="text-slate-800">{debugInfo.url}</span>
                    </div>
                  </div>

                  {/* Request Body */}
                  <div className="space-y-1">
                    <div className="font-semibold text-blue-900 text-xs uppercase tracking-wide">
                      Request Payload
                    </div>
                    <pre className="bg-white p-3 rounded-md border border-blue-200 overflow-x-auto max-h-64 overflow-y-auto text-xs font-mono leading-relaxed">
{JSON.stringify(debugInfo.requestBody, null, 2)}</pre>
                  </div>

                  {/* Response or Error */}
                  {debugInfo.response && (
                    <div className="space-y-1">
                      <div className="font-semibold text-green-900 text-xs uppercase tracking-wide">
                        ✅ Response Data
                      </div>
                      <pre className="bg-green-50 p-3 rounded-md border border-green-300 overflow-x-auto max-h-64 overflow-y-auto text-xs font-mono text-green-900 leading-relaxed">
{JSON.stringify(debugInfo.response, null, 2)}</pre>
                    </div>
                  )}

                  {debugInfo.error && (
                    <div className="space-y-1">
                      <div className="font-semibold text-red-900 text-xs uppercase tracking-wide">
                        ❌ Error Message
                      </div>
                      <div className="bg-red-50 p-3 rounded-md border border-red-300 text-sm text-red-900 font-medium">
                        {debugInfo.error}
                      </div>
                    </div>
                  )}

                  {/* Timestamp */}
                  <div className="flex items-center gap-2 text-xs text-slate-600 pt-2 border-t border-blue-200">
                    <span className="font-semibold">Timestamp:</span>
                    <span className="font-mono">{new Date(debugInfo.timestamp).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Form Validation Errors */}
            {Object.keys(errors).length > 0 && (
              <Alert variant="destructive">
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-semibold">Please fix the following errors before submitting:</p>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {errors.admissionNumber && (
                        <li>Admission Number: {errors.admissionNumber.message}</li>
                      )}
                      {errors.batches && typeof errors.batches.message === 'string' && (
                        <li>{errors.batches.message}</li>
                      )}
                      {errors.batches && Array.isArray(errors.batches) && (
                        errors.batches.map((batchError, idx) => {
                          if (!batchError) return null;
                          const errorMessages: string[] = [];
                          if (batchError.academicYearId) {
                            errorMessages.push(batchError.academicYearId.message || 'Academic year is required');
                          }
                          if (batchError.batchId) {
                            errorMessages.push(batchError.batchId.message || 'Batch is required');
                          }
                          if (batchError.rollNo) {
                            errorMessages.push(batchError.rollNo.message || 'Roll number error');
                          }
                          if (errorMessages.length === 0) return null;
                          return (
                            <li key={idx}>
                              <span className="font-medium">Batch {idx + 1}:</span> {errorMessages.join(', ')}
                            </li>
                          );
                        })
                      )}
                      {errors.notes && (
                        <li>Notes: {errors.notes.message}</li>
                      )}
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-4 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                onClick={(e) => {
                  console.log('🖱️ [ApproveStudentForm] Submit button clicked');
                  console.log('   Form is valid:', isValid);
                  console.log('   Form errors:', errors);
                  console.log('   Is submitting:', isSubmitting);
                }}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Approve Student
              </Button>
            </div>
          </form>
    </div>
  );
}
