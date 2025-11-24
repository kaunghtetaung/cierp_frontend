"use client";

import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Button,
  Input,
  Label,
  Textarea,
  Alert,
  AlertDescription,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import type { PreBuiltFormProps } from "../ExtraActionFormRouter";
import { approveBorrower } from "./borrower-actions";
import { extractItemId } from "./form-utils";
import { isDebugEnabled } from "@/lib/env";

// Validation schema based on backend ApproveBorrowerDto
const approveBorrowerSchema = z.object({
  libraryCardNumber: z.string().min(1, "Library card number is required"),
  borrowerType: z.enum(['student', 'staff', 'guest'], {
    errorMap: () => ({ message: "Borrower type is required" })
  }),
  status: z.enum(['active']).default('active'),
  borrowerGroup: z.enum(['post_graduate', 'under_graduate', 'teaching_staff', 'other_staff', 'external'], {
    errorMap: () => ({ message: "Borrower group is required" })
  }),
  membershipEndDate: z.string().optional(),
  notes: z.string().optional(),
});

type ApproveBorrowerFormData = z.infer<typeof approveBorrowerSchema>;

interface BorrowerData {
  _id?: string;
  id?: string;
  libraryCardNumber?: string;
  borrowerType?: 'student' | 'staff' | 'guest';
  borrowerGroup?: string;
  status?: string;
  studentRecordId?: {
    _id: string;
    nameEnglish: string;
    nameMyanmar: string;
    admissionNumber: string;
  };
  userId?: {
    _id: string;
    displayName: string;
    email: string;
  };
}

export function ApproveBorrowerForm({
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

  // Extract borrower data from selectedItems
  const borrowerData: BorrowerData | null = selectedItems && selectedItems.length > 0
    ? (typeof selectedItems[0] === 'string' ? null : selectedItems[0] as BorrowerData)
    : null;

  const borrowerId = extractItemId(selectedItems);

  console.log('📦 [ApproveBorrowerForm] Component initialized', {
    selectedItems,
    borrowerData,
    borrowerId,
    hasFullData: !!borrowerData,
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ApproveBorrowerFormData>({
    resolver: zodResolver(approveBorrowerSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: {
      libraryCardNumber: borrowerData?.libraryCardNumber || "",
      borrowerType: borrowerData?.borrowerType || "student",
      status: "active",
      borrowerGroup: (borrowerData?.borrowerGroup as any) || "under_graduate",
      membershipEndDate: "",
      notes: "",
    },
  });

  const onSubmit = async (formData: ApproveBorrowerFormData) => {
    setIsSubmitting(true);
    setMessage(null);
    setDebugInfo(null);

    console.log('================================');
    console.log('📝 [ApproveBorrowerForm] FORM SUBMISSION STARTED');
    console.log('================================');
    console.log('📚 Borrower ID:', borrowerId);
    console.log('📋 Form Data:', JSON.stringify(formData, null, 2));
    console.log('🎯 Selected Items:', selectedItems);
    console.log('📊 Borrower Data:', borrowerData);
    console.log('================================');

    try {
      if (!borrowerId) {
        throw new Error("Borrower ID is required");
      }

      console.log('🚀 [ApproveBorrowerForm] Calling server action approveBorrower()');
      console.log('   Borrower ID:', borrowerId);
      console.log('   Request Data:', formData);

      const result = await approveBorrower(borrowerId, formData);

      // Set debug info
      const debugData = result.debugInfo || {
        url: result.debugInfo?.url || 'Server action: approveBorrower',
        method: result.debugInfo?.method || 'POST',
        requestBody: formData,
        response: result.success ? result.data : null,
        error: result.success ? null : result.error,
        timestamp: new Date().toISOString(),
      };
      setDebugInfo(debugData);

      console.log('================================');
      console.log('📥 [ApproveBorrowerForm] SERVER ACTION RESPONSE');
      console.log('================================');
      console.log('✅ Success:', result.success);
      console.log('📦 Response Data:', JSON.stringify(result.data, null, 2));
      console.log('❌ Error:', result.error || 'None');
      console.log('🔍 Full Result:', result);
      console.log('================================');

      if (result.success) {
        console.log('✅ [ApproveBorrowerForm] Action succeeded, letting parent handle toast');

        // Convert to FormData for parent onSubmit
        const submitData = new FormData();
        submitData.append('borrowerId', borrowerId);
        submitData.append('result', JSON.stringify(result));

        console.log('================================');
        console.log('✅ [ApproveBorrowerForm] SUCCESS - Calling parent onSubmit');
        console.log('================================');
        console.log('📤 FormData entries:', Array.from(submitData.entries()));
        console.log('================================');

        // Call parent onSubmit - it will handle success toast, refresh, and closing
        await onFormSubmit(submitData);

        console.log('🎉 [ApproveBorrowerForm] Parent onSubmit completed successfully');
      } else {
        console.log('================================');
        console.error('❌ [ApproveBorrowerForm] FAILURE - Server returned error');
        console.error('================================');
        console.error('Error message:', result.error);
        console.error('Full result:', result);
        console.error('================================');
        setMessage({ type: 'error', text: result.error || 'Failed to approve borrower' });
      }
    } catch (error) {
      console.error('❌ [ApproveBorrowerForm] Submission error:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to approve borrower'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Borrower Information Display */}
        {borrowerData && (
          <div className="bg-slate-50 p-4 rounded-md border space-y-2">
            <h3 className="font-semibold text-sm text-slate-700">Borrower Information</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {borrowerData.studentRecordId && (
                <>
                  <div>
                    <span className="text-slate-600">Name (English):</span>
                    <span className="ml-2 font-medium">{borrowerData.studentRecordId.nameEnglish}</span>
                  </div>
                  <div>
                    <span className="text-slate-600">Name (Myanmar):</span>
                    <span className="ml-2 font-medium">{borrowerData.studentRecordId.nameMyanmar}</span>
                  </div>
                  <div>
                    <span className="text-slate-600">Admission No:</span>
                    <span className="ml-2 font-medium">{borrowerData.studentRecordId.admissionNumber}</span>
                  </div>
                </>
              )}
              {borrowerData.userId && (
                <>
                  <div>
                    <span className="text-slate-600">Display Name:</span>
                    <span className="ml-2 font-medium">{borrowerData.userId.displayName}</span>
                  </div>
                  <div>
                    <span className="text-slate-600">Email:</span>
                    <span className="ml-2 font-medium">{borrowerData.userId.email}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* First Row: Library Card Number, Borrower Type, Borrower Group */}
        <div className="grid grid-cols-3 gap-4">
          {/* Library Card Number */}
          <div className="space-y-2 w-full">
            <Label htmlFor="libraryCardNumber">
              {currentLanguage === 'mm' ? 'စာကြည့်တိုက်ကတ်နံပါတ်' : 'Library Card Number'} *
            </Label>
            <Controller
              name="libraryCardNumber"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  id="libraryCardNumber"
                  placeholder="LIB2025000001"
                  className="w-full"
                />
              )}
            />
            {errors.libraryCardNumber && (
              <p className="text-sm text-destructive">{errors.libraryCardNumber.message}</p>
            )}
          </div>

          {/* Borrower Type */}
          <div className="space-y-2 w-full">
            <Label htmlFor="borrowerType">
              {currentLanguage === 'mm' ? 'ငှားသူအမျိုးအစား' : 'Borrower Type'} *
            </Label>
            <Controller
              name="borrowerType"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={currentLanguage === 'mm' ? 'ရွေးပါ' : 'Select'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">
                      {currentLanguage === 'mm' ? 'ကျောင်းသား' : 'Student'}
                    </SelectItem>
                    <SelectItem value="staff">
                      {currentLanguage === 'mm' ? 'ဝန်ထမ်း' : 'Staff'}
                    </SelectItem>
                    <SelectItem value="guest">
                      {currentLanguage === 'mm' ? 'ဧည့်သည်' : 'Guest'}
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.borrowerType && (
              <p className="text-sm text-destructive">{errors.borrowerType.message}</p>
            )}
          </div>

          {/* Borrower Group */}
          <div className="space-y-2 w-full">
            <Label htmlFor="borrowerGroup">
              {currentLanguage === 'mm' ? 'ငှားသူအုပ်စု' : 'Borrower Group'} *
            </Label>
            <Controller
              name="borrowerGroup"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={currentLanguage === 'mm' ? 'ရွေးပါ' : 'Select'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="post_graduate">
                      {currentLanguage === 'mm' ? 'ဘွဲ့လွန်' : 'Post Graduate'}
                    </SelectItem>
                    <SelectItem value="under_graduate">
                      {currentLanguage === 'mm' ? 'ဘွဲ့ရ' : 'Under Graduate'}
                    </SelectItem>
                    <SelectItem value="teaching_staff">
                      {currentLanguage === 'mm' ? 'ဆရာဆရာမ' : 'Teaching Staff'}
                    </SelectItem>
                    <SelectItem value="other_staff">
                      {currentLanguage === 'mm' ? 'အခြားဝန်ထမ်း' : 'Other Staff'}
                    </SelectItem>
                    <SelectItem value="external">
                      {currentLanguage === 'mm' ? 'ပြင်ပ' : 'External'}
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.borrowerGroup && (
              <p className="text-sm text-destructive">{errors.borrowerGroup.message}</p>
            )}
          </div>
        </div>

        {/* Second Row: Status and Membership End Date */}
        <div className="grid grid-cols-2 gap-4">
          {/* Status (Read-only) */}
          <div className="space-y-2 w-full">
            <Label htmlFor="status">
              {currentLanguage === 'mm' ? 'အခြေအနေ' : 'Status'}
            </Label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} disabled>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">
                      {currentLanguage === 'mm' ? 'အသုံးပြုနေသော' : 'Active'}
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            <p className="text-xs text-muted-foreground">
              {currentLanguage === 'mm' ? 'အတည်ပြုပြီးနောက် အခြေအနေကို Active သို့ပြောင်းလဲမည်' : 'Status will be set to Active upon approval'}
            </p>
          </div>

          {/* Membership End Date */}
          <div className="space-y-2 w-full">
            <Label htmlFor="membershipEndDate">
              {currentLanguage === 'mm' ? 'အသင်းဝင်သက်တမ်းကုန်ရက်' : 'Membership End Date'}
            </Label>
            <Controller
              name="membershipEndDate"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  id="membershipEndDate"
                  type="date"
                  className="w-full"
                  placeholder={currentLanguage === 'mm' ? 'သက်တမ်းမကုန်ဆုံးရန် ဗလာထားပါ' : 'Leave empty for no expiration'}
                />
              )}
            />
            <p className="text-xs text-muted-foreground">
              {currentLanguage === 'mm' ? 'သက်တမ်းမကုန်ဆုံးရန် ဗလာထားပါ' : 'Leave empty for no expiration'}
            </p>
          </div>
        </div>

        {/* Approval Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes">
            {currentLanguage === 'mm' ? 'အတည်ပြုမှတ်ချက်' : 'Approval Notes'}
          </Label>
          <Controller
            name="notes"
            control={control}
            render={({ field }) => (
              <Textarea
                {...field}
                id="notes"
                rows={3}
                placeholder={currentLanguage === 'mm'
                  ? 'အတည်ပြုမှတ်ချက်များ ထည့်ပါ...'
                  : 'Enter any notes about this approval...'}
              />
            )}
          />
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

        {/* Debug Information Section - Only show in development */}
        {isDebugEnabled() && debugInfo && (
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
                  {Object.entries(errors).map(([key, error]) => (
                    <li key={key}>
                      <span className="font-medium">{key}:</span> {error.message}
                    </li>
                  ))}
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
            {currentLanguage === 'mm' ? 'မလုပ်တော့' : 'Cancel'}
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            onClick={(e) => {
              console.log('🖱️ [ApproveBorrowerForm] Submit button clicked');
              console.log('   Form errors:', errors);
              console.log('   Is submitting:', isSubmitting);
            }}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting
              ? (currentLanguage === 'mm' ? 'အတည်ပြုနေသည်...' : 'Approving...')
              : (currentLanguage === 'mm' ? 'အတည်ပြုမည်' : 'Approve Borrower')}
          </Button>
        </div>
      </form>
    </div>
  );
}
