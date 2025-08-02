"use client";

import React, { useState } from "react";
import { SimpleForm } from "@/components/forms/SimpleForm";
import { sampleMultilangModule } from "@/lib/sample-multilang-module";
import { Button } from "@/components/ui/button";
import { IconComponent } from "@repo/ui/components/icons";

export default function TestMultilangPage() {
  const [currentLanguage, setCurrentLanguage] = useState<'en' | 'mm'>('en');

  const handleFormSubmit = async (formData: FormData) => {
    console.log('Form submitted with data:', formData);
    
    // Log all form data entries
    const entries = Array.from(formData.entries());
    console.log('Form entries:', entries);
    
    // Show success message
    alert(`Form submitted successfully! Check console for form data. Language: ${currentLanguage}`);
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
                ? 'ဤစာမျက်နှာသည် အင်္ဂလိပ်နှင့် မြန်မာ ဘာသာနှစ်ခု ပံ့ပိုးသော ပုံစံများကို စမ်းသပ်ရန်အတွက် ဖြစ်သည်။'
                : 'This page is for testing forms with English and Myanmar language support.'
              }
            </p>
          </div>

          {/* Language Switcher */}
          <div className="flex items-center gap-2">
            <Button
              variant={currentLanguage === 'en' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentLanguage('en')}
            >
              <IconComponent name="Globe" className="w-4 h-4 mr-1" />
              English
            </Button>
            <Button
              variant={currentLanguage === 'mm' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentLanguage('mm')}
            >
              <IconComponent name="Languages" className="w-4 h-4 mr-1" />
              မြန်မာ
            </Button>
          </div>
        </div>

        {/* Form */}
        <div className="bg-card border rounded-lg p-6">
          <SimpleForm
            module={sampleMultilangModule}
            action="create"
            serverAction={handleFormSubmit}
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