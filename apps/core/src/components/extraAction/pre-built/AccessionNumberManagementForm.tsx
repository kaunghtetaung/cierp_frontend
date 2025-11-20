"use client";

import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Button,
  Input,
  Label,
  Alert,
  AlertDescription,
  IconComponent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui";
import { getLocalizedText } from "@repo/utils";
import type { PreBuiltFormProps } from "../ExtraActionFormRouter";
import {
  getAccessionGroups,
  getAccessionNumbers,
  addAccessionNumber,
  updateAccessionNumber,
  deleteAccessionNumber,
} from "./accession-actions";
import { extractItemId } from "./form-utils";

// Form data interface
interface AccessionNumberFormData {
  accessionNo: string;
  status: string;
  classNo?: string;
  accessionGroup: string;
  remark?: string;
}

// Accession number item interface
interface AccessionNumberItem {
  _id: string;
  accessionNo: string;
  classNo?: string;
  status?: string;
  accessionGroup?: {
    _id: string;
    name: string;
    description?: string;
    status?: string;
  };
  remark?: string;
  createdAt?: string;
}

// Status options
const STATUS_OPTIONS = [
  { value: 'Reserved', label: { en: 'Reserved', mm: 'ကြိုတင်သိမ်းဆည်းထား' } },
  { value: 'In', label: { en: 'In', mm: 'ရှိ' } },
  { value: 'Unuse', label: { en: 'Unuse', mm: 'မသုံး' } },
  { value: 'Damage', label: { en: 'Damage', mm: 'ပျက်စီး' } },
  { value: 'Lost', label: { en: 'Lost', mm: 'ပျောက်ဆုံး' } },
  { value: 'Out', label: { en: 'Out', mm: 'ထွက်သွား' } },
];

// Form validation schema
const createAccessionNumberSchema = (currentLanguage: string) =>
  z.object({
    accessionNo: z.string().min(1,
      currentLanguage === "mm"
        ? "စာရင်းသွင်းနံပါတ် ထည့်ရပါမည်"
        : "Accession number is required"
    ),
    status: z.string().min(1,
      currentLanguage === "mm"
        ? "အခြေအနေ ရွေးချယ်ရပါမည်"
        : "Status is required"
    ),
    classNo: z.string().optional(),
    accessionGroup: z.string().min(1,
      currentLanguage === "mm"
        ? "အုပ်စု ရွေးချယ်ရပါမည်"
        : "Accession group is required"
    ),
    remark: z.string().optional(),
  });

export function AccessionNumberManagementForm({
  action,
  selectedItems,
  currentLanguage,
  onSubmit,
  onCancel,
  hideHeader = false,
}: PreBuiltFormProps) {
  // Extract bibliography ID from selectedItems using utility function
  const bibliographyId = extractItemId(selectedItems);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [submitResult, setSubmitResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  
  const [accessionNumbers, setAccessionNumbers] = useState<AccessionNumberItem[]>([]);
  const [editingItem, setEditingItem] = useState<AccessionNumberItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<AccessionNumberItem | null>(null);
  const [accessionGroups, setAccessionGroups] = useState<Array<{ _id: string; name: string }>>([]);
  const [viewMode, setViewMode] = useState<'table' | 'form'>('table'); // Toggle between table and form view

  // Create validation schema
  const accessionNumberSchema = createAccessionNumberSchema(currentLanguage);

  // Initialize form
  const form = useForm<AccessionNumberFormData>({
    resolver: zodResolver(accessionNumberSchema),
    defaultValues: {
      accessionNo: "",
      status: "In",
      classNo: "",
      accessionGroup: "",
      remark: "",
    },
    mode: "onChange",
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = form;

  // Load accession groups and existing accession numbers
  useEffect(() => {
    const loadData = async () => {
      if (!selectedItems || selectedItems.length === 0) {
        setIsLoading(false);
        return;
      }

      try {
        // Load accession groups first
        const groupsResult = await getAccessionGroups();
        if (groupsResult.success) {
          setAccessionGroups(groupsResult.data || []);
        } else {
          console.error("❌ [AccessionNumberManagementForm] Failed to load groups:", groupsResult.error);
        }

        // Load existing accession numbers
        const result = await getAccessionNumbers(bibliographyId);

        if (result.success) {
          setAccessionNumbers(result.data || []);
        } else {
          console.error("❌ [AccessionNumberManagementForm] Failed to load:", result.error);
        }
      } catch (error) {
        console.error("❌ [AccessionNumberManagementForm] Exception:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [selectedItems]);

  // Handle form submission
  const handleFormSubmit = async (data: AccessionNumberFormData) => {
    if (!selectedItems || selectedItems.length === 0) {
      return;
    }

    setIsSubmitting(true);
    setSubmitResult(null);

    try {
      let result;

      if (editingItem) {
        // Update existing accession number using server action
        const updateData = {
          _id: editingItem._id,
          accessionNo: data.accessionNo,
          status: data.status,
          classNo: data.classNo,
          accessionGroup: data.accessionGroup,
          remark: data.remark,
        };

        result = await updateAccessionNumber(
          bibliographyId,
          editingItem.accessionNo,
          updateData
        );
      } else {
        // Add new accession number using server action
        const addData = {
          accessionNo: data.accessionNo,
          status: data.status,
          classNo: data.classNo,
          accessionGroup: data.accessionGroup,
          remark: data.remark,
        };

        result = await addAccessionNumber(
          bibliographyId,
          addData
        );
      }

      if (!result.success) {
        console.error("❌ [AccessionNumberManagementForm] Operation failed:", result.error);
        throw new Error(result.error || 'Failed to save accession number');
      }

      // Update local state with response data
      if (editingItem) {
        setAccessionNumbers(prev =>
          prev.map(item =>
            item.accessionNo === editingItem.accessionNo
              ? { ...item, ...data, _id: item._id }
              : item
          )
        );
        setEditingItem(null);
      } else {
        const newItem: AccessionNumberItem = {
          _id: result.data?._id || Date.now().toString(),
          accessionNo: data.accessionNo,
          status: data.status,
          classNo: data.classNo,
          accessionGroup: result.data?.accessionGroup || accessionGroups.find(g => g._id === data.accessionGroup),
          remark: data.remark,
          createdAt: result.data?.createdAt || new Date().toISOString(),
        };
        setAccessionNumbers(prev => [...prev, newItem]);
      }

      // Switch back to table view after successful save
      setViewMode('table');

      const successResult = {
        success: true,
        message: editingItem
          ? currentLanguage === "mm"
            ? "စာရင်းသွင်းနံပါတ် အောင်မြင်စွာ ပြင်ဆင်ပြီးပါပြီ"
            : "Accession number updated successfully"
          : currentLanguage === "mm"
            ? "စာရင်းသွင်းနံပါတ် အောင်မြင်စွာ ထည့်သွင်းပြီးပါပြီ"
            : "Accession number added successfully",
      };

      setSubmitResult(successResult);
      reset();

      // Clear success message after 3 seconds
      setTimeout(() => setSubmitResult(null), 3000);
    } catch (error) {
      const errorResult = {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : currentLanguage === "mm"
            ? "စာရင်းသွင်းနံပါတ် သိမ်းဆည်းရာတွင် အမှားအယွင်း ဖြစ်ပွားခဲ့သည်"
            : "An error occurred while saving accession number",
      };
      
      setSubmitResult(errorResult);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle edit
  const handleEdit = (item: AccessionNumberItem) => {
    setEditingItem(item);
    setValue("accessionNo", item.accessionNo);
    setValue("status", item.status || "In");
    setValue("classNo", item.classNo || "");
    setValue("accessionGroup", typeof item.accessionGroup === 'object' ? item.accessionGroup._id : item.accessionGroup || "");
    setValue("remark", item.remark || "");
    setViewMode('form'); // Switch to form view for editing
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingItem(null);
    reset();
    setViewMode('table'); // Switch back to table view
  };

  // Handle delete
  const handleDelete = async () => {
    if (!deletingItem || !selectedItems || selectedItems.length === 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await deleteAccessionNumber(
        selectedItems[0],
        deletingItem.accessionNo
      );

      if (!result.success) {
        console.error("❌ [AccessionNumberManagementForm] Delete failed:", result.error);
        throw new Error(result.error || 'Failed to remove accession number');
      }

      // Update local state - filter by _id to be more precise
      setAccessionNumbers(prev => prev.filter(item => item._id !== deletingItem._id));

      // Close delete modal
      setDeletingItem(null);

      setSubmitResult({
        success: true,
        message: currentLanguage === "mm"
          ? "စာရင်းသွင်းနံပါတ် အောင်မြင်စွာ ဖယ်ရှားပြီးပါပြီ"
          : "Accession number removed successfully"
      });

      // Clear success message after 3 seconds
      setTimeout(() => setSubmitResult(null), 3000);
    } catch (error) {
      console.error("❌ [AccessionNumberManagementForm] Delete exception:", error);
      setSubmitResult({
        success: false,
        message: currentLanguage === "mm"
          ? "စာရင်းသွင်းနံပါတ် ဖယ်ရှားရာတွင် အမှားအယွင်း ဖြစ်ပွားခဲ့သည်"
          : "An error occurred while removing accession number"
      });
    } finally {
      setDeletingItem(null);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {!hideHeader && (
        <div className="text-center pb-4">
          <div className="flex items-center justify-center gap-2 text-lg font-semibold">
            <IconComponent name={action.iconName || "ListPlus"} className="w-5 h-5" />
            {getLocalizedText(action.title, currentLanguage)}
          </div>
          {action.description && (
            <p className="text-sm text-muted-foreground mt-2">
              {getLocalizedText(action.description, currentLanguage)}
            </p>
          )}
        </div>
      )}

      {/* Show result if available */}
      {submitResult && (
        <Alert variant={submitResult.success ? "default" : "destructive"}>
          <IconComponent
            name={submitResult.success ? "CheckCircle" : "AlertCircle"}
            className="w-4 h-4"
          />
          <AlertDescription>{submitResult.message}</AlertDescription>
        </Alert>
      )}

      {/* View Toggle - Show either table or form */}
      {viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="space-y-4">
          {/* Add New Button */}
          <div className="flex justify-end">
            <Button
              onClick={() => {
                setEditingItem(null);
                reset();
                setViewMode('form');
              }}
              size="default"
              variant="default"
            >
              <IconComponent name="Plus" className="w-4 h-4 mr-2" />
              {currentLanguage === "mm" ? "အသစ်ထည့်မည်" : "Add New"}
            </Button>
          </div>

          {/* Existing Accession Numbers Table */}
          {accessionNumbers.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>
                  {currentLanguage === "mm"
                    ? "လက်ရှိ စာရင်းသွင်းနံပါတ်များ"
                    : "Current Accession Numbers"
                  }
                </CardTitle>
                <CardDescription>
                  {currentLanguage === "mm"
                    ? `စုစုပေါင်း ${accessionNumbers.length} ခု`
                    : `Total ${accessionNumbers.length} items`
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>
                          {currentLanguage === "mm" ? "စာရင်းသွင်းနံပါတ်" : "Accession No."}
                        </TableHead>
                        <TableHead>
                          {currentLanguage === "mm" ? "အတန်းနံပါတ်" : "Class No."}
                        </TableHead>
                        <TableHead>
                          {currentLanguage === "mm" ? "အခြေအနေ" : "Status"}
                        </TableHead>
                        <TableHead>
                          {currentLanguage === "mm" ? "အုပ်စု" : "Group"}
                        </TableHead>
                        <TableHead>
                          {currentLanguage === "mm" ? "မှတ်ချက်" : "Remark"}
                        </TableHead>
                        <TableHead className="text-right">
                          {currentLanguage === "mm" ? "လုပ်ဆောင်ချက်" : "Actions"}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {accessionNumbers.map((item) => (
                        <TableRow key={item._id}>
                          <TableCell className="font-medium">
                            {item.accessionNo}
                          </TableCell>
                          <TableCell>{item.classNo || "-"}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded text-xs ${
                              item.status === "In"
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}>
                              {item.status || "-"}
                            </span>
                          </TableCell>
                          <TableCell>{item.accessionGroup?.name || "-"}</TableCell>
                          <TableCell>{item.remark || "-"}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEdit(item)}
                                disabled={isSubmitting}
                              >
                                <IconComponent name="Edit" className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setDeletingItem(item)}
                                disabled={isSubmitting}
                              >
                                <IconComponent name="Trash2" className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Empty State */
            <Card>
              <CardContent className="text-center py-8">
                <IconComponent name="Inbox" className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {currentLanguage === "mm"
                    ? "စာရင်းသွင်းနံပါတ် မရှိသေးပါ"
                    : "No accession numbers yet"
                  }
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        /* FORM VIEW */
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {editingItem
                  ? currentLanguage === "mm"
                    ? "စာရင်းသွင်းနံပါတ် ပြင်ဆင်ခြင်း"
                    : "Edit Accession Number"
                  : currentLanguage === "mm"
                    ? "စာရင်းသွင်းနံပါတ် အသစ်ထည့်ခြင်း"
                    : "Add New Accession Number"
                }
              </CardTitle>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCancelEdit}
              >
                <IconComponent name="ArrowLeft" className="w-4 h-4 mr-2" />
                {currentLanguage === "mm" ? "နောက်သို့" : "Back"}
              </Button>
            </div>
          </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
            {/* First Row: Accession No (4), Class No (4), Status (2), Group (2) */}
            <div className="grid gap-4 grid-cols-12">
              {/* Accession Number - 4 columns */}
              <div className="space-y-2 col-span-12 md:col-span-4">
                <Label htmlFor="accessionNo">
                  {currentLanguage === "mm" ? "စာရင်းသွင်းနံပါတ်" : "Accession Number"}
                  <span className="text-destructive ml-1">*</span>
                </Label>
                <Controller
                  name="accessionNo"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="accessionNo"
                      placeholder={currentLanguage === "mm"
                        ? "နံပါတ် ထည့်ပါ"
                        : "Enter accession number"
                      }
                    />
                  )}
                />
                {errors.accessionNo && (
                  <p className="text-sm text-destructive">{errors.accessionNo.message}</p>
                )}
              </div>

              {/* Class Number - 4 columns */}
              <div className="space-y-2 col-span-12 md:col-span-4">
                <Label htmlFor="classNo">
                  {currentLanguage === "mm" ? "အတန်းနံပါတ်" : "Class Number"}
                </Label>
                <Controller
                  name="classNo"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="classNo"
                      placeholder={currentLanguage === "mm"
                        ? "အတန်းနံပါတ် ထည့်ပါ"
                        : "Enter class number"
                      }
                    />
                  )}
                />
              </div>

              {/* Status - 2 columns */}
              <div className="space-y-2 col-span-12 md:col-span-2">
                <Label htmlFor="status">
                  {currentLanguage === "mm" ? "အခြေအနေ" : "Status"}
                  <span className="text-destructive ml-1">*</span>
                </Label>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger id="status" className="w-full">
                        <SelectValue placeholder={currentLanguage === "mm" ? "အခြေအနေ" : "Status"} />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {getLocalizedText(option.label, currentLanguage)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.status && (
                  <p className="text-sm text-destructive">{errors.status.message}</p>
                )}
              </div>

              {/* Accession Group - 2 columns */}
              <div className="space-y-2 col-span-12 md:col-span-2">
                <Label htmlFor="accessionGroup">
                  {currentLanguage === "mm" ? "အုပ်စု" : "Group"}
                  <span className="text-destructive ml-1">*</span>
                </Label>
                <Controller
                  name="accessionGroup"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger id="accessionGroup" className="w-full">
                        <SelectValue placeholder={currentLanguage === "mm" ? "အုပ်စု" : "Group"} />
                      </SelectTrigger>
                      <SelectContent>
                        {accessionGroups.map(group => (
                          <SelectItem key={group._id} value={group._id}>
                            {group.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.accessionGroup && (
                  <p className="text-sm text-destructive">{errors.accessionGroup.message}</p>
                )}
              </div>
            </div>

            {/* Second Row: Remark - 12 columns (full width) */}
            <div className="space-y-2">
              <Label htmlFor="remark">
                {currentLanguage === "mm" ? "မှတ်ချက်" : "Remark"}
              </Label>
              <Controller
                name="remark"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="remark"
                    placeholder={currentLanguage === "mm"
                      ? "မှတ်ချက် ထည့်ပါ"
                      : "Enter remark"
                    }
                  />
                )}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancelEdit}
                disabled={isSubmitting}
              >
                <IconComponent name="X" className="w-4 h-4 mr-2" />
                {currentLanguage === "mm" ? "မလုပ်တော့" : "Cancel"}
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                variant="default"
              >
                {isSubmitting && <IconComponent name="Loader2" className="w-4 h-4 mr-2 animate-spin" />}
                {isSubmitting
                  ? currentLanguage === "mm"
                    ? "သိမ်းဆည်းနေသည်..."
                    : "Saving..."
                  : editingItem
                    ? currentLanguage === "mm"
                      ? "ပြင်ဆင်မည်"
                      : "Update"
                    : currentLanguage === "mm"
                      ? "ထည့်သွင်းမည်"
                      : "Add"
                }
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      )}

      {/* Close Button */}
      <div className="flex justify-end pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          <IconComponent name="X" className="w-4 h-4 mr-2" />
          {currentLanguage === "mm" ? "ပိတ်မည်" : "Close"}
        </Button>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingItem} onOpenChange={() => setDeletingItem(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {currentLanguage === "mm"
                ? "သေချာပါသလား?"
                : "Are you sure?"
              }
            </DialogTitle>
            <DialogDescription>
              {currentLanguage === "mm"
                ? `"${deletingItem?.accessionNo}" ကို ဖယ်ရှားမည်လား?`
                : `Do you want to remove "${deletingItem?.accessionNo}"?`
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeletingItem(null)}
              disabled={isSubmitting}
            >
              {currentLanguage === "mm" ? "မလုပ်တော့" : "Cancel"}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isSubmitting}
            >
              {isSubmitting && <IconComponent name="Loader2" className="w-4 h-4 mr-2 animate-spin" />}
              {currentLanguage === "mm" ? "ဖယ်ရှားမည်" : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}