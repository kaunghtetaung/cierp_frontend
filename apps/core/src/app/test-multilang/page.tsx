"use client";

import React from "react";
import { ReactHookForm } from "@/components/forms/ReactHookForm";
import { sampleMultilangModule } from "@/lib/sample-multilang-module";
import { useLanguage } from "@repo/language";

export default function TestMultilangPage() {
  const { currentLanguage } = useLanguage();

  const handleFormSubmit = async (formData: FormData) => {
    console.log('Form submitted with data:', formData);
    
    // Log all form data entries
    const entries = Array.from(formData.entries());
    console.log('Form entries:', entries);
    
    // Show success message with toast instead of alert
    console.log(`Form submitted successfully! Language: ${currentLanguage}`);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              {currentLanguage === 'mm' 
                ? 'ဘာသာပေါင်းများစွာ ပုံစံ စမ်းသပ်ခြင်း'
                : 'Multilanguage Form Test'
              }
            </h1>
            <p className="text-muted-foreground">
              {currentLanguage === 'mm'
                ? 'ဤစာမျက်နှာသည် အင်္ဂလိပ်နှင့် မြန်မာ ဘာသာနှစ်ခု ပံ့ပိုးသော ပုံစံများကို စမ်းသပ်ရန်အတွက် ဖြစ်သည်။ ခေါင်းစီးတွင်ရှိ ဘာသာစကား ရွေးခြင်းကို အသုံးပြုပါ။'
                : 'This page is for testing forms with English and Myanmar language support. Use the language selector in the header to switch languages.'
              }
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-card border rounded-lg p-6">
          <ReactHookForm
            module={sampleMultilangModule}
            action="create"
            moduleSlug="multilang-test"
            currentLanguage={currentLanguage}
          />
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-muted/50 rounded-lg p-6">
          <h3 className="font-semibold mb-3">
            {currentLanguage === 'mm' ? 'လမ်းညွှန်ချက်များ:' : 'Instructions:'}
          </h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></span>
              {currentLanguage === 'mm' 
                ? 'ခေါင်းစဉ်နှင့် အကြောင်းအရာ လုပ်ကွက်များသည် ဘာသာနှစ်ခု ပံ့ပိုးထားသည်။'
                : 'Title and Description fields support multilanguage input.'
              }
            </li>
            <li className="flex items-start gap-2">
              <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></span>
              {currentLanguage === 'mm'
                ? 'အင်္ဂလိပ်နှင့် မြန်မာ tab များကို နှိပ်ပြီး အရေးအသားများကို ထည့်သွင်းပါ။'
                : 'Click on English and Myanmar tabs to enter content in both languages.'
              }
            </li>
            <li className="flex items-start gap-2">
              <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></span>
              {currentLanguage === 'mm'
                ? 'ပုံစံကို တင်သွင်းပြီးနောက် console ထဲတွင် ဒေတာများကို စစ်ဆေးပါ။'
                : 'Check the console for form data after submitting the form.'
              }
            </li>
            <li className="flex items-start gap-2">
              <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></span>
              {currentLanguage === 'mm'
                ? 'ဘာသာစကားကို ပြောင်းလဲခြင်းသည် ပုံစံ၏ လက်ရှိ အရေးအသားများကို ပြောင်းလဲမည်။'
                : 'Switching language will change the form labels and interface text.'
              }
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}