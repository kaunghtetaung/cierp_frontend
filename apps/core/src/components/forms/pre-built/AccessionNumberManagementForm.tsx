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
} from "@repo/ui";
import { getLocalizedText } from "@repo/utils";
import type { PreBuiltFormProps } from "../ExtraActionFormRouter";
import {
  getAccessionNumbers,
  addAccessionNumber,
  updateAccessionNumber,
  deleteAccessionNumber,
} from "./accession-actions";

// Form data interface
interface AccessionNumberFormData {
  accessionNumber: string;
  location?: string;
  notes?: string;
}

// Accession number item interface
interface AccessionNumberItem {
  id: string;
  accessionNumber: string;
  location?: string;
  notes?: string;
  createdAt?: string;
}

// Form validation schema
const createAccessionNumberSchema = (currentLanguage: string) =>
  z.object({
    accessionNumber: z.string().min(1, 
      currentLanguage === "mm" 
        ? "စာရင်းသွင်းနံပါတ် ထည့်ရပါမည်"
        : "Accession number is required"
    ),
    location: z.string().optional(),
    notes: z.string().optional(),
  });

export function AccessionNumberManagementForm({
  action,
  selectedItems,
  currentLanguage,
  onSubmit,
  onCancel,
  hideHeader = false,
}: PreBuiltFormProps) {
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [submitResult, setSubmitResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  
  const [accessionNumbers, setAccessionNumbers] = useState<AccessionNumberItem[]>([]);
  const [editingItem, setEditingItem] = useState<AccessionNumberItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<AccessionNumberItem | null>(null);

  // Create validation schema
  const accessionNumberSchema = createAccessionNumberSchema(currentLanguage);

  // Initialize form
  const form = useForm<AccessionNumberFormData>({
    resolver: zodResolver(accessionNumberSchema),
    defaultValues: {
      accessionNumber: "",
      location: "",
      notes: "",
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

  // Load existing accession numbers
  useEffect(() => {
    const loadAccessionNumbers = async () => {
      if (!selectedItems || selectedItems.length === 0) {
        setIsLoading(false);
        return;
      }

      try {
        // Fetch existing accession numbers using server action
        const result = await getAccessionNumbers(selectedItems[0]);
        
        if (result.success) {
          setAccessionNumbers(result.data || []);
        } else {
          console.error("Failed to load accession numbers:", result.error);
        }
      } catch (error) {
        console.error("Failed to load accession numbers:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAccessionNumbers();
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
        result = await updateAccessionNumber(
          selectedItems[0],
          editingItem.accessionNumber,
          {
            accessionNumber: data.accessionNumber,
            location: data.location,
            notes: data.notes,
          }
        );
      } else {
        // Add new accession number using server action
        result = await addAccessionNumber(
          selectedItems[0],
          {
            accessionNumber: data.accessionNumber,
            location: data.location,
            notes: data.notes,
          }
        );
      }

      if (!result.success) {
        throw new Error(result.error || 'Failed to save accession number');
      }

      // Update local state with response data
      if (editingItem) {
        setAccessionNumbers(prev => 
          prev.map(item => 
            item.accessionNumber === editingItem.accessionNumber 
              ? { ...item, ...data, id: item.id }
              : item
          )
        );
        setEditingItem(null);
      } else {
        const newItem: AccessionNumberItem = {
          id: result.data?.id || Date.now().toString(),
          accessionNumber: data.accessionNumber,
          location: data.location,
          notes: data.notes,
          createdAt: result.data?.createdAt || new Date().toISOString(),
        };
        setAccessionNumbers(prev => [...prev, newItem]);
      }
      
      // Optionally notify parent component about successful save
      // This allows the parent to refresh data if needed
      if (action.formType === 'modal') {
        // For modal forms, we might want to keep it open to allow multiple additions
        // But still call onSubmit to notify parent
        const formData = new FormData();
        formData.append("success", "true");
        formData.append("action", editingItem ? "update" : "add");
        onSubmit(formData);
      }

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
    setValue("accessionNumber", item.accessionNumber);
    setValue("location", item.location || "");
    setValue("notes", item.notes || "");
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingItem(null);
    reset();
  };

  // Handle delete
  const handleDelete = async () => {
    if (!deletingItem || !selectedItems || selectedItems.length === 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Delete accession number using server action
      const result = await deleteAccessionNumber(
        selectedItems[0],
        deletingItem.accessionNumber
      );

      if (!result.success) {
        throw new Error(result.error || 'Failed to remove accession number');
      }

      // Update local state
      setAccessionNumbers(prev => prev.filter(item => item.accessionNumber !== deletingItem.accessionNumber));
      
      setSubmitResult({
        success: true,
        message: currentLanguage === "mm"
          ? "စာရင်းသွင်းနံပါတ် အောင်မြင်စွာ ဖယ်ရှားပြီးပါပြီ"
          : "Accession number removed successfully"
      });

      // Clear success message after 3 seconds
      setTimeout(() => setSubmitResult(null), 3000);
    } catch (error) {
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

      {/* Add/Edit Form */}
      <Card>
        <CardHeader>
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
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Accession Number */}
              <div className="space-y-2">
                <Label htmlFor="accessionNumber">
                  {currentLanguage === "mm" ? "စာရင်းသွင်းနံပါတ်" : "Accession Number"}
                  <span className="text-destructive ml-1">*</span>
                </Label>
                <Controller
                  name="accessionNumber"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="accessionNumber"
                      placeholder={currentLanguage === "mm" 
                        ? "နံပါတ် ထည့်ပါ"
                        : "Enter accession number"
                      }
                    />
                  )}
                />
                {errors.accessionNumber && (
                  <p className="text-sm text-destructive">{errors.accessionNumber.message}</p>
                )}
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location">
                  {currentLanguage === "mm" ? "တည်နေရာ" : "Location"}
                </Label>
                <Controller
                  name="location"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="location"
                      placeholder={currentLanguage === "mm" 
                        ? "တည်နေရာ ထည့်ပါ"
                        : "Enter location"
                      }
                    />
                  )}
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">
                {currentLanguage === "mm" ? "မှတ်ချက်" : "Notes"}
              </Label>
              <Controller
                name="notes"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="notes"
                    placeholder={currentLanguage === "mm" 
                      ? "မှတ်ချက် ထည့်ပါ"
                      : "Enter notes"
                    }
                  />
                )}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              {editingItem && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelEdit}
                  disabled={isSubmitting}
                >
                  {currentLanguage === "mm" ? "မလုပ်တော့" : "Cancel"}
                </Button>
              )}
              <Button
                type="submit"
                disabled={isSubmitting}
                variant={editingItem ? "default" : "primary"}
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

      {/* Existing Accession Numbers Table */}
      {accessionNumbers.length > 0 && (
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
                      {currentLanguage === "mm" ? "စာရင်းသွင်းနံပါတ်" : "Accession Number"}
                    </TableHead>
                    <TableHead>
                      {currentLanguage === "mm" ? "တည်နေရာ" : "Location"}
                    </TableHead>
                    <TableHead>
                      {currentLanguage === "mm" ? "မှတ်ချက်" : "Notes"}
                    </TableHead>
                    <TableHead className="text-right">
                      {currentLanguage === "mm" ? "လုပ်ဆောင်ချက်" : "Actions"}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accessionNumbers.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.accessionNumber}
                      </TableCell>
                      <TableCell>{item.location || "-"}</TableCell>
                      <TableCell>{item.notes || "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(item)}
                            disabled={isSubmitting || editingItem?.id === item.id}
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
      )}

      {/* Empty State */}
      {!isLoading && accessionNumbers.length === 0 && (
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {currentLanguage === "mm" 
                ? "သေချာပါသလား?"
                : "Are you sure?"
              }
            </DialogTitle>
            <DialogDescription>
              {currentLanguage === "mm"
                ? `"${deletingItem?.accessionNumber}" ကို ဖယ်ရှားမည်လား?`
                : `Do you want to remove "${deletingItem?.accessionNumber}"?`
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