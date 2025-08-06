/**
 * Wizard form configuration types for multi-step forms
 */

import { MultilingualText } from './module-schema';

// Wizard step configuration
export interface WizardStep {
  stepNumber: number;
  stepKey: string;
  title: MultilingualText;
  description?: MultilingualText;
  fields: string[]; // Array of fieldName references
  optional?: boolean;
  conditionalDisplay?: {
    dependsOnField: string;
    showWhenValue: any;
  };
}

// Wizard navigation configuration
export interface WizardNavigation {
  showStepNumbers: boolean;
  showProgressBar: boolean;
  allowSkipSteps: boolean;
  showStepTitles: boolean;
  allowBackNavigation?: boolean;
  showStepDescription?: boolean;
}

// Wizard validation configuration
export interface WizardValidation {
  validateOnStepChange: boolean;
  requiredStepsToComplete: number[];
  allowPartialSave?: boolean;
  saveOnEachStep?: boolean;
}

// Wizard theme configuration
export interface WizardTheme {
  stepConnectorType: 'line' | 'arrow' | 'dots';
  progressType: 'bar' | 'circle' | 'steps';
  stepLayout: 'horizontal' | 'vertical';
}

// Complete wizard configuration
export interface WizardConfig {
  steps: WizardStep[];
  navigation: WizardNavigation;
  validation: WizardValidation;
  theme?: WizardTheme;
}