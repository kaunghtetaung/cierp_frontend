import type { ModuleSchema, FormField } from '@repo/types';

// Define form fields first
const personalInfoFields: FormField[] = [
  {
    fieldName: 'firstName',
    fieldType: 'text',
    label: {
      en: 'First Name',
      mm: 'အမည်'
    },
    placeHolder: 'Enter your first name',
    validationRule: {
      required: true,
      minLength: 2,
      maxLength: 50,
      errorMessage: {
        en: 'First name must be between 2-50 characters',
        mm: 'အမည်သည် စာလုံး ၂ လုံးမှ ၅၀ လုံးအတွင်း ဖြစ်ရမည်'
      }
    },
    readonly: false,
    hidden: false,
    isMultiLang: false
  },
  {
    fieldName: 'lastName',
    fieldType: 'text',
    label: {
      en: 'Last Name',
      mm: 'မိသားစုအမည်'
    },
    placeHolder: 'Enter your last name',
    validationRule: {
      required: true,
      minLength: 2,
      maxLength: 50,
      errorMessage: {
        en: 'Last name must be between 2-50 characters',
        mm: 'မိသားစုအမည်သည် စာလုံး ၂ လုံးမှ ၅၀ လုံးအတွင်း ဖြစ်ရမည်'
      }
    },
    readonly: false,
    hidden: false,
    isMultiLang: false
  },
  {
    fieldName: 'bio',
    fieldType: 'textArea',
    label: {
      en: 'Bio',
      mm: 'ကိုယ်ရေးအကျဉ်း'
    },
    placeHolder: 'Tell us about yourself',
    validationRule: {
      required: false,
      minLength: 10,
      maxLength: 200,
      errorMessage: {
        en: 'Bio must be between 10-200 characters',
        mm: 'ကိုယ်ရေးအကျဉ်းသည် စာလုံး ၁၀ လုံးမှ ၂၀၀ လუံးအတွင်း ဖြစ်ရမည်'
      }
    },
    readonly: false,
    hidden: false,
    rows: 4,
    isMultiLang: true
  }
];

const contactInfoFields: FormField[] = [
  {
    fieldName: 'email',
    fieldType: 'email',
    label: {
      en: 'Email Address',
      mm: 'အီးမေးလ်လိပ်စာ'
    },
    placeHolder: 'Enter your email',
    validationRule: {
      required: true,
      pattern: '^[^@]+@[^@]+\\.[^@]+$',
      errorMessage: {
        en: 'Please enter a valid email address',
        mm: 'မှန်ကန်သော အီးမေးလ်လိပ်စာ ထည့်ပါ'
      }
    },
    readonly: false,
    hidden: false,
    isMultiLang: false
  },
  {
    fieldName: 'phoneNumber',
    fieldType: 'text',
    label: {
      en: 'Phone Number',
      mm: 'ဖုန်းနံပါတ်'
    },
    placeHolder: 'Enter your phone number',
    validationRule: {
      required: true,
      pattern: '^[0-9+\\-\\s()]+$',
      errorMessage: {
        en: 'Please enter a valid phone number',
        mm: 'မှန်ကန်သော ဖုန်းနံပါတ် ထည့်ပါ'
      }
    },
    readonly: false,
    hidden: false,
    isMultiLang: false
  },
  {
    fieldName: 'organizationId',
    fieldType: 'select',
    label: {
      en: 'Organization',
      mm: 'အဖွဲ့အစည်း'
    },
    placeHolder: 'Select organization',
    validationRule: {
      required: true,
      errorMessage: {
        en: 'Please select an organization',
        mm: 'အဖွဲ့အစည်းတစ်ခုကို ရွေးချယ်ပါ'
      }
    },
    readonly: false,
    hidden: false,
    isMultiLang: false
  },
  {
    fieldName: 'departmentId',
    fieldType: 'select',
    label: {
      en: 'Department',
      mm: 'ဌာန'
    },
    placeHolder: 'Select department',
    validationRule: {
      required: true,
      errorMessage: {
        en: 'Please select a department',
        mm: 'ဌာနတစ်ခုကို ရွေးချယ်ပါ'
      }
    },
    readonly: false,
    hidden: false,
    isMultiLang: false
  },
  {
    fieldName: 'startDate',
    fieldType: 'date',
    label: {
      en: 'Start Date',
      mm: 'စတင်သည့်ရက်'
    },
    validationRule: {
      required: true,
      errorMessage: {
        en: 'Start date is required',
        mm: 'စတင်သည့်ရက် လိုအပ်သည်'
      }
    },
    readonly: false,
    hidden: false,
    isMultiLang: false
  }
];

const preferencesFields: FormField[] = [
  {
    fieldName: 'isActive',
    fieldType: 'boolean',
    label: {
      en: 'Active Account',
      mm: 'တက်ကြွသော အကောင့်'
    },
    validationRule: {
      required: false,
      errorMessage: {
        en: 'Invalid status',
        mm: 'မမှန်ကန်သော အခြေအနေ'
      }
    },
    readonly: false,
    hidden: false
  },
  {
    fieldName: 'notifications',
    fieldType: 'boolean',
    label: {
      en: 'Email Notifications',
      mm: 'အီးမေးလ် အကြောင်းကြားချက်များ'
    },
    validationRule: {
      required: false,
      errorMessage: {
        en: 'Invalid notification setting',
        mm: 'မမှန်ကန်သော အကြောင်းကြားချက် ဆက်တင်'
      }
    },
    readonly: false,
    hidden: false
  }
];

// Sample enhanced wizard form module
export const sampleWizardModule: ModuleSchema = {
  id: 998,
  name: {
    en: 'User Registration',
    mm: 'အသုံးပြုသူ မှတ်ပုံတင်ခြင်း'
  },
  slug: 'user-registration',
  serviceName: 'user-service',
  description: {
    en: 'Multi-step user registration wizard form with enhanced UI and local storage',
    mm: 'အဆင့်ပေါင်းများစွာ အသုံးပြုသူ မှတ်ပုံတင်သည့် ပုံစံ - ပိုမိုကောင်းမွန်သော အင်တာဖေ့စ်နှင့် ဒေသန္တရဉ်ဆောင်မှု'
  },
  iconName: 'UserPlus',
  formLayout: 'wizard-vertical',
  wizardConfig: {
    steps: [
      {
        stepNumber: 1,
        stepKey: 'personal-info',
        title: {
          en: 'Personal Information',
          mm: 'ကိုယ်ရေးအချက်အလက်များ'
        },
        description: {
          en: 'Enter your basic personal details and bio',
          mm: 'သင့်၏ အခြေခံကိုယ်ရေးအချက်အလက်နှင့် အကျဉ်းချုပ်ကို ထည့်သွင်းပါ'
        },
        fields: ['firstName', 'lastName', 'bio']
      },
      {
        stepNumber: 2,
        stepKey: 'contact-info',
        title: {
          en: 'Contact & Work Details',
          mm: 'ဆက်သွယ်ရေးနှင့် အလုပ်အချက်အလက်များ'
        },
        description: {
          en: 'Provide your contact information and work preferences',
          mm: 'သင့်ဆက်သွယ်ရေးအချက်အလက်နှင့် အလုပ်ရွေးချယ်မှုများကို ပေးပါ'
        },
        fields: ['email', 'phoneNumber', 'organizationId', 'departmentId', 'startDate']
      },
      {
        stepNumber: 3,
        stepKey: 'preferences',
        title: {
          en: 'Account Preferences',
          mm: 'အကောင့်ရွေးချယ်မှုများ'
        },
        description: {
          en: 'Configure your account settings and notifications',
          mm: 'သင့်အကောင့်ဆက်တင်များနှင့် အကြောင်းကြားချက်များကို ပြင်ဆင်ပါ'
        },
        fields: ['isActive', 'notifications']
      }
    ],
    navigation: {
      showStepNumbers: true,
      showProgressBar: true,
      allowSkipSteps: false,
      showStepTitles: true,
      allowBackNavigation: true,
      showStepDescription: true
    },
    validation: {
      validateOnStepChange: true,
      requiredStepsToComplete: [1, 2],
      allowPartialSave: true,
      saveOnEachStep: false
    },
    theme: {
      stepConnectorType: 'line',
      progressType: 'bar',
      stepLayout: 'horizontal'
    }
  },
  formFields: [...personalInfoFields, ...contactInfoFields, ...preferencesFields],
  dataTableSchema: {
    layout: 'withCheckbox',
    columns: [
      {
        fieldName: 'firstName',
        label: { en: 'First Name', mm: 'အမည်' },
        sortable: true,
        filterable: true,
        type: 'text'
      },
      {
        fieldName: 'lastName',
        label: { en: 'Last Name', mm: 'မိသားစုအမည်' },
        sortable: true,
        filterable: true,
        type: 'text'
      },
      {
        fieldName: 'email',
        label: { en: 'Email', mm: 'အီးမေးလ်' },
        sortable: true,
        filterable: true,
        type: 'text'
      },
      {
        fieldName: 'department',
        label: { en: 'Department', mm: 'ဌာန' },
        sortable: true,
        filterable: true,
        type: 'text'
      },
      {
        fieldName: 'isActive',
        label: { en: 'Status', mm: 'အခြေအနေ' },
        sortable: true,
        filterable: true,
        type: 'boolean'
      }
    ],
    actions: {
      view: {
        type: 'modal',
        label: { en: 'View', mm: 'ကြည့်ရှုရန်' },
        icon: 'Eye',
        permission: 'read'
      },
      edit: {
        type: 'modal',
        label: { en: 'Edit', mm: 'တည်းဖြတ်ရန်' },
        icon: 'Edit',
        permission: 'update'
      },
      delete: {
        type: 'api',
        label: { en: 'Delete', mm: 'ဖျက်ရန်' },
        icon: 'Trash',
        permission: 'delete'
      }
    },
    pagination: {
      enabled: true,
      defaultLimit: 10,
      allowedLimits: [5, 10, 25, 50]
    },
    sorting: {
      enabled: true,
      defaultSort: {
        field: 'firstName',
        direction: 'asc'
      }
    },
    filtering: {
      enabled: true,
      searchFields: ['firstName', 'lastName', 'email']
    }
  },
  extraActionForms: [],
  moduleAccessPolicy: {
    resourceIdField: 'id',
    hasOrganizationField: false,
    organizationIdFieldName: '',
    hasDepartmentField: true,
    departmentIdFieldName: 'departmentId',
    accessPolicy: {
      systemAdmin: {
        operation: {
          create: true,
          read: { allow: true, restrictInvisibleFields: false },
          update: { allow: true, restrictUnaccessibleFields: false },
          softDelete: true,
          hardDelete: true,
          readSoftDeleted: { allow: true, IsResourceBase: false },
          restoreSoftDeleted: { allow: true, IsResourceBase: false },
          schema: { allow: true, IsResourceBase: false }
        },
        unaccessibleFields: [],
        invisibleFields: [],
        relatedDataOnly: false,
        accessDenied: false
      },
      organizationAdmin: {
        operation: {
          create: true,
          read: { allow: true, restrictInvisibleFields: true },
          update: { allow: true, restrictUnaccessibleFields: true },
          softDelete: true,
          hardDelete: false,
          readSoftDeleted: { allow: true, IsResourceBase: true },
          restoreSoftDeleted: { allow: true, IsResourceBase: true },
          schema: { allow: true, IsResourceBase: true }
        },
        unaccessibleFields: [],
        invisibleFields: [],
        relatedDataOnly: true,
        accessDenied: false
      },
      organizationMember: {
        operation: {
          create: true,
          read: { allow: true, restrictInvisibleFields: true },
          update: { allow: true, restrictUnaccessibleFields: true },
          softDelete: false,
          hardDelete: false,
          readSoftDeleted: { allow: false, IsResourceBase: true },
          restoreSoftDeleted: { allow: false, IsResourceBase: true },
          schema: { allow: true, IsResourceBase: true }
        },
        unaccessibleFields: [],
        invisibleFields: [],
        relatedDataOnly: true,
        accessDenied: false
      },
      public: {
        operation: {
          create: false,
          read: { allow: false, restrictInvisibleFields: true },
          update: { allow: false, restrictUnaccessibleFields: true },
          softDelete: false,
          hardDelete: false,
          readSoftDeleted: { allow: false, IsResourceBase: false },
          restoreSoftDeleted: { allow: false, IsResourceBase: false },
          schema: { allow: false, IsResourceBase: false }
        },
        unaccessibleFields: [],
        invisibleFields: [],
        relatedDataOnly: false,
        accessDenied: true
      }
    }
  }
};