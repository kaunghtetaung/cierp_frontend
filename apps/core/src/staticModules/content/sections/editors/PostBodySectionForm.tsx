'use client';

import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@repo/ui';
import { Input, Switch } from '@repo/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui';
import { Settings2, FileText } from 'lucide-react';
import { type PostBodySectionFormData } from './post-body-types';
import { EditorSection } from './_shared/EditorSection';

interface Props {
  form: UseFormReturn<PostBodySectionFormData>;
  onSubmit: (data: PostBodySectionFormData) => void;
  onCancel: () => void;
  saving?: boolean;
  tenantId?: string;
}

/**
 * `postBody` is a placeholder section — it has no body data of its
 * own. The form only exposes the bookkeeping fields (name, status,
 * visibility) so the section can be addressed by the layout. The
 * rest of the editor mostly serves to remind authors what this
 * section does.
 */
export function PostBodySectionForm({ form, onSubmit }: Props) {
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-3 p-3"
      >
        <div className="rounded-md border bg-muted/30 px-4 py-3 flex items-start gap-3">
          <FileText className="h-4 w-4 mt-0.5 text-primary shrink-0" />
          <div className="text-sm leading-relaxed">
            <strong>Post Body Placeholder</strong>
            <p className="text-muted-foreground text-xs mt-1">
              This section has no content of its own. When a post or
              page renders with a template that includes this
              section, the post's Tiptap body (per-language) is
              injected here. Use it inside a template's main column
              alongside sidebar widgets like Category / Tag List.
            </p>
          </div>
        </div>

        <EditorSection
          title="Section settings"
          icon={<Settings2 className="h-3.5 w-3.5" />}
          defaultOpen
        >
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Internal name <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="e.g. Article Body Slot"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isReusable"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2 pt-6">
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="!mt-0">
                    Reusable (recommended)
                  </FormLabel>
                </FormItem>
              )}
            />
          </div>
        </EditorSection>
      </form>
    </Form>
  );
}

export default PostBodySectionForm;
