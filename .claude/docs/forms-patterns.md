# Form Patterns and Common Pitfalls

## Multi-Step Wizard Forms - Critical Issues and Solutions

### Problem: Auto-Submit on Step Navigation (React Hook Form + State Updates)

**Issue Discovered**: January 2025
**Context**: Student Registration Wizard (6-step form)
**Severity**: Critical - Causes unintended form submission

#### The Problem

When implementing multi-step forms with conditional button rendering based on current step, a **race condition occurs with React's batching** that causes automatic form submission when navigating to the last step.

**Symptoms**:
- Form automatically submits when arriving at the final step
- Submission happens even though user didn't click the Submit button
- Only occurs when navigating FROM second-to-last step TO last step
- Console shows submit event with a button as the submitter

**Root Cause**:
1. User clicks "Next" button (type="button") on step N-1
2. State updates: `currentStep` changes from N-1 to N (final step)
3. Component re-renders with new state
4. Conditional rendering changes from Next button to Submit button
5. **React batches the state update with the click event**
6. The original button click is somehow re-processed in the new render context
7. Form submission event fires automatically

#### Code Example - The Bug

```typescript
export function MultiStepWizard() {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = async () => {
    if (currentStep < TOTAL_STEPS - 1) {
      const isValid = await trigger(fields);
      if (isValid) {
        setCurrentStep(currentStep + 1); // ⚠️ This triggers re-render
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Form fields */}

      {currentStep < TOTAL_STEPS - 1 ? (
        <Button type="button" onClick={handleNext}>Next</Button>
      ) : (
        <Button type="submit">Submit</Button> // ⚠️ Auto-submits!
      )}
    </form>
  );
}
```

**What happens**:
- Click "Next" on step 4 (of 6 steps, 0-indexed)
- `currentStep` becomes 5
- Condition `5 < 5` is false
- Submit button renders
- **Form auto-submits** without user clicking Submit button

#### The Solution - Use a Ref Guard

**Strategy**: Use a ref to explicitly control when submission is allowed.

```typescript
export function MultiStepWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const canSubmitRef = useRef(false); // ✅ Guard flag

  const handleNext = async () => {
    if (currentStep < TOTAL_STEPS - 1) {
      const isValid = await trigger(fields);
      if (isValid) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  return (
    <form onSubmit={(e) => {
      // ✅ Check guard before allowing submission
      if (!canSubmitRef.current) {
        console.log("🛑 Blocking spurious submit");
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      handleSubmit(onSubmit)(e);
    }}>
      {/* Form fields */}

      {currentStep < TOTAL_STEPS - 1 ? (
        <Button type="button" onClick={handleNext}>Next</Button>
      ) : (
        <Button
          type="submit"
          onClick={() => {
            canSubmitRef.current = true; // ✅ Set guard on click
          }}
        >
          Submit
        </Button>
      )}
    </form>
  );
}
```

**Why this works**:
1. `canSubmitRef` starts as `false`
2. When Next button clicked and step changes, ref is still `false`
3. Any spurious submit events are blocked by the guard
4. Only when Submit button's `onClick` fires does ref become `true`
5. Submission is only allowed after explicit Submit button click

#### Additional Preventive Measures

**1. Prevent Enter Key Submission in Input Fields**

```typescript
const handleInputKeyDown = (fieldName: string) => (
  e: React.KeyboardEvent<HTMLInputElement>
) => {
  if (e.key === "Enter") {
    e.preventDefault(); // Prevent form submit on Enter
  }

  if (e.key === "Escape") {
    e.preventDefault();
    setValue(fieldName, "");
  }
};

<input
  {...register("fieldName")}
  onKeyDown={handleInputKeyDown("fieldName")}
/>
```

**2. Ensure Button Types are Explicit**

```typescript
// ❌ Wrong - Implicit type
<Button onClick={handleNext}>Next</Button>

// ✅ Correct - Explicit type="button"
<Button type="button" onClick={handleNext}>Next</Button>
```

**3. Use Detailed Console Logging for Debugging**

```typescript
<form
  onSubmit={(e) => {
    console.log("🔔 Form submit event fired");
    console.log("🔔 Current step:", currentStep);
    console.log("🔔 canSubmitRef:", canSubmitRef.current);
    console.log("🔔 Event submitter:", e.nativeEvent.submitter);
    console.trace(); // Stack trace to see what triggered it

    if (!canSubmitRef.current) {
      console.log("🛑 Blocking submission");
      e.preventDefault();
      return false;
    }

    handleSubmit(onSubmit)(e);
  }}
>
```

#### Checklist for Multi-Step Forms

When implementing multi-step wizard forms:

- [ ] Use `useRef` guard to control submission explicitly
- [ ] Add `type="button"` to all navigation buttons (Next, Previous)
- [ ] Add `type="submit"` only to the final Submit button
- [ ] Set guard ref to `true` in Submit button's `onClick`
- [ ] Check guard in form's `onSubmit` handler
- [ ] Prevent Enter key from submitting on all input fields
- [ ] Add detailed console logging during development
- [ ] Test navigation from second-to-last to last step specifically
- [ ] Verify Submit button is the only way to trigger submission

#### Related Patterns

**Tab-Based Forms with Internal Navigation**

For forms with tabs that have their own Next/Previous buttons (like FamilyInfoStep):

```typescript
// Internal tab navigation buttons must also be type="button"
<button
  type="button" // ✅ Prevents form submission
  onClick={handleTabNext}
  disabled={activeTab === lastTab}
>
  Next
</button>
```

**Nested Forms**

Never nest forms. Use fieldsets or divs for grouping instead.

```typescript
// ❌ Wrong
<form>
  <form>...</form>
</form>

// ✅ Correct
<form>
  <fieldset>...</fieldset>
  <fieldset>...</fieldset>
</form>
```

#### Files Modified to Fix This Issue

1. `apps/publicWeb/src/app/(register)/profileSetup/student/components/StudentRegistrationWizard.tsx`
   - Added `canSubmitRef` guard
   - Updated form onSubmit handler to check ref
   - Updated Submit button to set ref on click

2. All step components (PersonalInfoStep, AddressInfoStep, FamilyInfoStep, etc.)
   - Added Enter key prevention to all input handlers
   - Ensured all navigation buttons have `type="button"`

#### Testing Strategy

To test for this issue:

```typescript
// Add comprehensive logging
console.log("▶️ [handleNext] Called - Current step:", currentStep);
console.log("🔔 [FORM] Form onSubmit fired");
console.log("🔔 [FORM] canSubmitRef:", canSubmitRef.current);
console.log("🖱️ [SUBMIT BUTTON] Clicked");

// Test cases:
// 1. Navigate through all steps using Next button
// 2. Verify no auto-submit on arriving at last step
// 3. Verify Submit button works correctly
// 4. Press Enter in input fields - should not submit
// 5. Check console for any 🛑 blocked submission messages
```

#### Summary

**The Golden Rules**:
1. **Always use a ref guard** for multi-step form submissions
2. **Never rely on state alone** to control submission
3. **Explicit is better than implicit** - always set button types
4. **Prevent Enter key** from submitting in wizard forms
5. **Log everything** during development to catch issues early

This pattern applies to:
- Multi-step registration forms
- Wizard-style data entry
- Tabbed forms with submit on last tab
- Any form with conditional submit button rendering

**Remember**: React's batching and re-rendering can cause unexpected form submission events when state changes affect button rendering. Always use a ref guard as a safety mechanism.
