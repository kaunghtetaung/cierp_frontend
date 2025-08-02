import type { ModuleSchema } from '@repo/types';

// Sample module schema with multilanguage fields for testing
export const sampleMultilangModule: ModuleSchema = {
  id: 999,
  name: {
    en: 'Content Management',
    mm: 'အကြောင်းအရာ စီမံခန့်ခွဲမှု'
  },
  slug: 'content',
  serviceName: 'content-service',
  description: {
    en: 'Manage multilanguage content items',
    mm: 'ဘာသာပေါင်းများစွာ အကြောင်းအရာများကို စီမံခန့်ခွဲပါ'
  },
  iconName: 'FileText',
  formLayout: 'grid',
  formFields: [
    {
      fieldName: 'title',
      fieldType: 'text',
      label: {
        en: 'Title',
        mm: 'ခေါင်းစဉ်'
      },
      placeHolder: 'Enter title',
      validationRule: {
        required: true,
        minLength: 3,
        maxLength: 100,
        errorMessage: {
          en: 'Title must be between 3-100 characters',
          mm: 'ခေါင်းစဉ်သည် စာလုံး ၃ လုံးမှ ၁၀၀ လုံးအတွင်း ဖြစ်ရမည်'
        }
      },
      readonly: false,
      hidden: false,
      isMultilanguage: true // This field supports multilanguage input
    },
    {
      fieldName: 'description',
      fieldType: 'textArea',
      label: {
        en: 'Description',
        mm: 'အကြောင်းအရာ'
      },
      placeHolder: 'Enter description',
      validationRule: {
        required: true,
        minLength: 10,
        maxLength: 500,
        errorMessage: {
          en: 'Description must be between 10-500 characters',
          mm: 'အကြောင်းအရာသည် စာလုံး ၁၀ လုံးမှ ၅၀၀ လုံးအတွင်း ဖြစ်ရမည်'
        }
      },
      readonly: false,
      hidden: false,
      rows: 5,
      isMultilanguage: true // This field supports multilanguage input
    },
    {
      fieldName: 'category',
      fieldType: 'select',
      label: {
        en: 'Category',
        mm: 'အမျိုးအစား'
      },
      validationRule: {
        required: true,
        errorMessage: {
          en: 'Please select a category',
          mm: 'အမျိုးအစားတစ်ခုကို ရွေးချယ်ပါ'
        }
      },
      readonly: false,
      hidden: false,
      options: [
        {
          value: 'news',
          label: { en: 'News', mm: 'သတင်းများ' }
        },
        {
          value: 'article',
          label: { en: 'Article', mm: 'ဆောင်းပါး' }
        },
        {
          value: 'announcement',
          label: { en: 'Announcement', mm: 'ကြားညာချက်' }
        }
      ]
    },
    {
      fieldName: 'publishDate',
      fieldType: 'date',
      label: {
        en: 'Publish Date',
        mm: 'ထုတ်ဝေရက်စွဲ'
      },
      validationRule: {
        required: true,
        errorMessage: {
          en: 'Publish date is required',
          mm: 'ထုတ်ဝေရက်စွဲ လိုအပ်သည်'
        }
      },
      readonly: false,
      hidden: false
    },
    {
      fieldName: 'isActive',
      fieldType: 'boolean',
      label: {
        en: 'Active Status',
        mm: 'သုံးနေသော အခြေအနေ'
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
    }
  ],
  dataTableSchema: {
    layout: 'withCheckbox',
    columns: [
      {
        fieldName: 'title',
        label: { en: 'Title', mm: 'ခေါင်းစဉ်' },
        sortable: true,
        filterable: true,
        type: 'text'
      },
      {
        fieldName: 'category',
        label: { en: 'Category', mm: 'အမျိုးအစား' },
        sortable: true,
        filterable: true,
        type: 'text'
      },
      {
        fieldName: 'publishDate',
        label: { en: 'Publish Date', mm: 'ထုတ်ဝေရက်စွဲ' },
        sortable: true,
        filterable: false,
        type: 'date'
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
      },
      extraActions: [
        {
          actionKey: 'publish',
          type: 'modal',
          label: { en: 'Publish Content', mm: 'အကြောင်းအရာ ထုတ်ဝေရန်' },
          icon: 'Send',
          permission: 'publish',
          endpoint: '/api/content/publish',
          confirmMessage: {
            en: 'Are you sure you want to publish this content?',
            mm: 'ဤအကြောင်းအရာကို ထုတ်ဝေလိုသေချာပါသလား?'
          }
        }
      ]
    },
    pagination: {
      enabled: true,
      defaultLimit: 10,
      allowedLimits: [5, 10, 25, 50, 100]
    },
    sorting: {
      enabled: true,
      defaultSort: {
        field: 'publishDate',
        direction: 'desc'
      }
    },
    filtering: {
      enabled: true,
      searchFields: ['title', 'description']
    }
  },
  extraActionForms: [
    {
      actionKey: 'publish',
      title: { en: 'Publish Content', mm: 'အကြောင်းအရာ ထုတ်ဝေရန်' },
      description: {
        en: 'Publish selected content items to make them visible to users',
        mm: 'ရွေးချယ်ထားသော အကြောင်းအရာများကို အသုံးပြုသူများ မြင်နိုင်စေရန် ထုတ်ဝေပါ'
      },
      iconName: 'Send',
      endpoint: '/api/content/publish',
      method: 'POST',
      formType: 'modal',
      formName: 'publishForm',
      requiresSelection: true,
      buttonStyle: 'primary',
      permission: 'publish',
      confirmMessage: {
        en: 'This will make the selected content visible to users. Continue?',
        mm: '၎င်းသည် ရွေးချယ်ထားသော အကြောင်းအရာကို အသုံးပြုသူများ မြင်နိုင်စေမည်။ ဆက်လက်လုပ်ပါသလား?'
      }
    }
  ],
  moduleAccessPolicy: {
    resourceIdField: 'id',
    hasOrganizationField: true,
    organizationIdFieldName: 'organizationId',
    hasDepartmentField: false,
    departmentIdFieldName: '',
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
        unaccessibleFields: ['organizationId'],
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
        unaccessibleFields: ['organizationId'],
        invisibleFields: [],
        relatedDataOnly: true,
        accessDenied: false
      },
      public: {
        operation: {
          create: false,
          read: { allow: true, restrictInvisibleFields: true },
          update: { allow: false, restrictUnaccessibleFields: true },
          softDelete: false,
          hardDelete: false,
          readSoftDeleted: { allow: false, IsResourceBase: false },
          restoreSoftDeleted: { allow: false, IsResourceBase: false },
          schema: { allow: false, IsResourceBase: false }
        },
        unaccessibleFields: ['organizationId'],
        invisibleFields: ['organizationId'],
        relatedDataOnly: false,
        accessDenied: false
      }
    }
  }
};