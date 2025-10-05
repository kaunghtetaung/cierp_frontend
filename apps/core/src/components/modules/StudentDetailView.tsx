'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useLanguage } from '@repo/language'
import { getLocalizedText } from '@repo/utils'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  IconComponent,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@repo/ui'
import type { NavigationMetadata } from '@repo/app-modules'

// Wizard steps configuration from ReactHookStudentWizardForm
const WIZARD_STEPS = {
  personal: {
    title: { en: "Personal Information", mm: "ကိုယ်ရေးကိုယ်တာအချက်အလက်များ" },
    fields: ["nameMyanmar", "nameEnglish", "gender", "ethnicity", "religion", "bloodGroup", "nrcNumber", "dateOfBirth", "placeOfBirth"],
    icon: "User",
  },
  contact: {
    title: { en: "Contact & Address", mm: "ဆက်သွယ်ရေးနှင့် လိပ်စာ" },
    fields: ["phoneNumber", "email", "permanentAddress", "currentAddress", "stateRegionName", "districtName", "townshipName", "townName", "townVillageName", "wardVillageName"],
    icon: "Phone",
  },
  family: {
    title: { en: "Family Information", mm: "မိသားစုအချက်အလက်များ" },
    fields: ["father.nameMyanmar", "father.nameEnglish", "father.nrcNumber", "father.occupation",
             "mother.nameMyanmar", "mother.nameEnglish", "mother.nrcNumber", "mother.occupation",
             "guardian.nameMyanmar", "guardian.nameEnglish", "guardian.nrcNumber", "guardian.occupation",
             "guardian.relationship", "guardian.phoneNumber", "guardian.email", "guardian.address"],
    icon: "Users",
  },
  academic: {
    title: { en: "Academic Background", mm: "ပညာရေးနောက်ခံ" },
    fields: ["previousEducation", "previousSchool", "matriculationRollNo", "matriculationYear", "totalMark", "distinction"],
    icon: "BookOpen",
  },
  current: {
    title: { en: "Current Academic", mm: "လက်ရှိပညာရေး" },
    fields: ["medm", "batches"],
    icon: "GraduationCap",
  },
  additional: {
    title: { en: "Additional Information", mm: "အခြားအချက်အလက်များ" },
    fields: ["hobbies", "skills", "disabilities", "medicalConditions", "specialRequirements"],
    icon: "FileText",
  }
}

// Field label mappings
const FIELD_LABELS: Record<string, { en: string; mm: string }> = {
  nameMyanmar: { en: "Name (Myanmar)", mm: "အမည် (မြန်မာ)" },
  nameEnglish: { en: "Name (English)", mm: "အမည် (အင်္ဂလိပ်)" },
  gender: { en: "Gender", mm: "ကျား/မ" },
  ethnicity: { en: "Ethnicity", mm: "လူမျိုး" },
  religion: { en: "Religion", mm: "ကိုးကွယ်သည့်ဘာသာ" },
  bloodGroup: { en: "Blood Group", mm: "သွေးအုပ်စု" },
  nrcNumber: { en: "NRC Number", mm: "မှတ်ပုံတင်အမှတ်" },
  dateOfBirth: { en: "Date of Birth", mm: "မွေးသက္ကရာဇ်" },
  placeOfBirth: { en: "Place of Birth", mm: "မွေးဖွားရာဇာတိ" },
  phoneNumber: { en: "Phone Number", mm: "ဖုန်းနံပါတ်" },
  email: { en: "Email", mm: "အီးမေးလ်" },
  permanentAddress: { en: "Permanent Address", mm: "အမြဲတမ်းနေရပ်လိပ်စာ" },
  currentAddress: { en: "Current Address", mm: "လက်ရှိနေရပ်လိပ်စာ" },
  stateRegionName: { en: "State/Region", mm: "ပြည်နယ်/တိုင်း" },
  districtName: { en: "District", mm: "ခရိုင်" },
  townshipName: { en: "Township", mm: "မြို့နယ်" },
  townName: { en: "Town", mm: "မြို့" },
  townVillageName: { en: "Town/Village", mm: "မြို့/ကျေးရွာ" },
  wardVillageName: { en: "Ward/Village", mm: "ရပ်ကွက်/ကျေးရွာ" },
  "father.nameMyanmar": { en: "Father Name (Myanmar)", mm: "အဖအမည် (မြန်မာ)" },
  "father.nameEnglish": { en: "Father Name (English)", mm: "အဖအမည် (အင်္ဂလိပ်)" },
  "father.nrcNumber": { en: "Father NRC", mm: "အဖမှတ်ပုံတင်" },
  "father.occupation": { en: "Father Occupation", mm: "အဖအလုပ်အကိုင်" },
  "mother.nameMyanmar": { en: "Mother Name (Myanmar)", mm: "အမိအမည် (မြန်မာ)" },
  "mother.nameEnglish": { en: "Mother Name (English)", mm: "အမိအမည် (အင်္ဂလိပ်)" },
  "mother.nrcNumber": { en: "Mother NRC", mm: "အမိမှတ်ပုံတင်" },
  "mother.occupation": { en: "Mother Occupation", mm: "အမိအလုပ်အကိုင်" },
  "guardian.nameMyanmar": { en: "Guardian Name (Myanmar)", mm: "အုပ်ထိန်းသူအမည် (မြန်မာ)" },
  "guardian.nameEnglish": { en: "Guardian Name (English)", mm: "အုပ်ထိန်းသူအမည် (အင်္ဂလိပ်)" },
  "guardian.nrcNumber": { en: "Guardian NRC", mm: "အုပ်ထိန်းသူမှတ်ပုံတင်" },
  "guardian.occupation": { en: "Guardian Occupation", mm: "အုပ်ထိန်းသူအလုပ်အကိုင်" },
  "guardian.relationship": { en: "Relationship", mm: "တော်စပ်ပုံ" },
  "guardian.phoneNumber": { en: "Guardian Phone", mm: "အုပ်ထိန်းသူဖုန်း" },
  "guardian.email": { en: "Guardian Email", mm: "အုပ်ထိန်းသူအီးမေးလ်" },
  "guardian.address": { en: "Guardian Address", mm: "အုပ်ထိန်းသူလိပ်စာ" },
  previousEducation: { en: "Previous Education", mm: "ယခင်ပညာရေး" },
  previousSchool: { en: "Previous School", mm: "ယခင်တက်ရောက်ခဲ့သောကျောင်း" },
  matriculationRollNo: { en: "Matriculation Roll No", mm: "မေထရစ်ခုံအမှတ်" },
  matriculationYear: { en: "Matriculation Year", mm: "မေထရစ်ခုနှစ်" },
  totalMark: { en: "Total Mark", mm: "စုစုပေါင်းရမှတ်" },
  distinction: { en: "Distinction", mm: "ထူးချွန်မှု" },
  medm: { en: "MEDM", mm: "MEDM" },
  batches: { en: "Batches", mm: "အသင်းအဖွဲ့များ" },
  hobbies: { en: "Hobbies", mm: "ဝါသနာများ" },
  skills: { en: "Skills", mm: "ကျွမ်းကျင်မှုများ" },
  disabilities: { en: "Disabilities", mm: "မသန်စွမ်းမှု" },
  medicalConditions: { en: "Medical Conditions", mm: "ကျန်းမာရေးအခြေအနေ" },
  specialRequirements: { en: "Special Requirements", mm: "အထူးလိုအပ်ချက်များ" },
}

interface StudentDetailViewProps {
  module: any // Accept both ClientModule and ModuleSchema
  itemData: any
  appId: string
  navigation?: NavigationMetadata
}

export function StudentDetailView({ module, itemData, appId, navigation }: StudentDetailViewProps) {
  const router = useRouter()
  const { currentLanguage } = useLanguage()
  const [printingSection, setPrintingSection] = useState<string | null>(null)
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({})

  // Get current sort parameters from URL
  const searchParams = useSearchParams()
  const sortBy = searchParams.get('sortBy') || 'createdAt'
  const sortOrder = searchParams.get('sortOrder') || 'desc'
  const queryString = `?sortBy=${sortBy}&sortOrder=${sortOrder}`

  // Helper function to get nested value
  const getNestedValue = (obj: any, path: string) => {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }

  // Check if guardian is father or mother
  const guardianRelationship = itemData.guardian?.relationship?.toLowerCase() || ''
  const isFatherGuardian = guardianRelationship === 'father' || guardianRelationship === 'အဖေ'
  const isMotherGuardian = guardianRelationship === 'mother' || guardianRelationship === 'အမေ'

  // Check if addresses are same
  const isSameAddress = itemData.currentAddress === itemData.permanentAddress

  // Keyboard shortcuts for navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      if (e.key === 'ArrowLeft' && navigation?.hasPrevious && navigation?.previousId) {
        e.preventDefault()
        router.push(`/${appId}/${module.slug}/${navigation.previousId}/view${queryString}`)
      }

      if (e.key === 'ArrowRight' && navigation?.hasNext && navigation?.nextId) {
        e.preventDefault()
        router.push(`/${appId}/${module.slug}/${navigation.nextId}/view${queryString}`)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [navigation, router, appId, module.slug, queryString])

  // Print section handler
  const handlePrintSection = (sectionKey: string) => {
    const sectionElement = sectionRefs.current[sectionKey]
    if (!sectionElement) return

    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const sectionTitle = getLocalizedText(WIZARD_STEPS[sectionKey as keyof typeof WIZARD_STEPS].title, currentLanguage)

    printWindow.document.write(`
      <html>
        <head>
          <title>${sectionTitle} - ${itemData.nameEnglish || itemData.nameMyanmar}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h2 { color: #333; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background-color: #f5f5f5; font-weight: 600; }
          </style>
        </head>
        <body>
          <h2>${sectionTitle}</h2>
          ${sectionElement.innerHTML}
          <p style="margin-top: 30px; text-align: center; color: #999; font-size: 12px;">
            Printed on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
          </p>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  // Print all handler
  const handlePrintAll = () => {
    window.print()
  }

  // Render field value
  const renderFieldValue = (fieldName: string, value: any) => {
    if (value === null || value === undefined || value === '') {
      return <span className="text-muted-foreground text-sm">{currentLanguage === 'mm' ? 'မရှိပါ' : 'N/A'}</span>
    }

    // Handle arrays
    if (Array.isArray(value)) {
      return value.map((item, idx) => (
        <Badge key={idx} variant="secondary" className="mr-1">{item}</Badge>
      ))
    }

    // Handle dates
    if (fieldName.includes('Date') || fieldName.includes('date')) {
      try {
        return new Date(value).toLocaleDateString()
      } catch {
        return value
      }
    }

    return value
  }

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      {/* Header with Navigation - Hidden in print */}
      <div className="print:hidden flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          {/* Navigation Buttons */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/${appId}/${module.slug}${queryString}`)}
          >
            <IconComponent name="ArrowLeft" className="h-4 w-4 mr-2" />
            {currentLanguage === 'mm' ? 'စာရင်းသို့' : 'Back to List'}
          </Button>

          {navigation && (
            <>
              <Button
                variant="outline"
                size="sm"
                disabled={!navigation.hasPrevious}
                onClick={() => navigation.previousId && router.push(`/${appId}/${module.slug}/${navigation.previousId}/view${queryString}`)}
              >
                <IconComponent name="ChevronLeft" className="h-4 w-4" />
              </Button>

              <span className="text-sm text-muted-foreground">
                {navigation.currentPosition} / {navigation.totalCount}
              </span>

              <Button
                variant="outline"
                size="sm"
                disabled={!navigation.hasNext}
                onClick={() => navigation.nextId && router.push(`/${appId}/${module.slug}/${navigation.nextId}/view${queryString}`)}
              >
                <IconComponent name="ChevronRight" className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>

        {/* Print All Button */}
        <Button onClick={handlePrintAll} variant="default">
          <IconComponent name="Printer" className="h-4 w-4 mr-2" />
          {currentLanguage === 'mm' ? 'ရိုက်နှိပ်မည်' : 'Print All'}
        </Button>
      </div>

      {/* Student Name Header */}
      <Card className="print:shadow-none">
        <CardHeader>
          <CardTitle className="text-2xl">
            {currentLanguage === 'mm' ? itemData.nameMyanmar : itemData.nameEnglish}
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Sections */}
      {Object.entries(WIZARD_STEPS).map(([sectionKey, sectionConfig]) => (
        <StudentSection
          key={sectionKey}
          sectionKey={sectionKey}
          sectionConfig={sectionConfig}
          itemData={itemData}
          currentLanguage={currentLanguage}
          sectionRefs={sectionRefs}
          onPrintSection={handlePrintSection}
          isFatherGuardian={isFatherGuardian}
          isMotherGuardian={isMotherGuardian}
          isSameAddress={isSameAddress}
          renderFieldValue={renderFieldValue}
          getNestedValue={getNestedValue}
        />
      ))}
    </div>
  )
}

// Section Component
interface StudentSectionProps {
  sectionKey: string
  sectionConfig: any
  itemData: any
  currentLanguage: string
  sectionRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>
  onPrintSection: (sectionKey: string) => void
  isFatherGuardian: boolean
  isMotherGuardian: boolean
  isSameAddress: boolean
  renderFieldValue: (fieldName: string, value: any) => React.ReactNode
  getNestedValue: (obj: any, path: string) => any
}

function StudentSection({
  sectionKey,
  sectionConfig,
  itemData,
  currentLanguage,
  sectionRefs,
  onPrintSection,
  isFatherGuardian,
  isMotherGuardian,
  isSameAddress,
  renderFieldValue,
  getNestedValue
}: StudentSectionProps) {

  // Render Academic Background section with table
  if (sectionKey === 'academic') {
    const prevEdu = itemData.previousEducation || {}

    return (
      <Card>
        <Collapsible defaultOpen={true}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CollapsibleTrigger className="flex items-center gap-2 hover:opacity-70">
                <IconComponent name={sectionConfig.icon} className="h-5 w-5" />
                <CardTitle className="text-lg">
                  {getLocalizedText(sectionConfig.title, currentLanguage)}
                </CardTitle>
                <IconComponent name="ChevronDown" className="h-4 w-4 transition-transform" />
              </CollapsibleTrigger>

              <Button
                variant="outline"
                size="sm"
                onClick={() => onPrintSection(sectionKey)}
                className="print:hidden"
              >
                <IconComponent name="Printer" className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CollapsibleContent>
            <CardContent ref={el => sectionRefs.current[sectionKey] = el}>
              <h2 className="hidden print:block text-xl font-bold mb-4">
                {getLocalizedText(sectionConfig.title, currentLanguage)}
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium">
                        {getLocalizedText(FIELD_LABELS.previousSchool, currentLanguage)}
                      </th>
                      <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium">
                        {getLocalizedText(FIELD_LABELS.matriculationRollNo, currentLanguage)}
                      </th>
                      <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium">
                        {getLocalizedText(FIELD_LABELS.matriculationYear, currentLanguage)}
                      </th>
                      <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium">
                        {getLocalizedText(FIELD_LABELS.totalMark, currentLanguage)}
                      </th>
                      <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium">
                        {getLocalizedText(FIELD_LABELS.distinction, currentLanguage)}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-200 px-4 py-2 text-sm">
                        {prevEdu.previousSchool || '-'}
                      </td>
                      <td className="border border-gray-200 px-4 py-2 text-sm">
                        {prevEdu.matriculationRollNo || '-'}
                      </td>
                      <td className="border border-gray-200 px-4 py-2 text-sm">
                        {prevEdu.matriculationYear || '-'}
                      </td>
                      <td className="border border-gray-200 px-4 py-2 text-sm">
                        {prevEdu.totalMark || '-'}
                      </td>
                      <td className="border border-gray-200 px-4 py-2 text-sm">
                        {prevEdu.distinction ? (
                          <Badge variant="default">{currentLanguage === 'mm' ? 'ရှိ' : 'Yes'}</Badge>
                        ) : (
                          <span className="text-muted-foreground">{currentLanguage === 'mm' ? 'မရှိ' : 'No'}</span>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    )
  }

  // Render Current Academic section with Batches table
  if (sectionKey === 'current') {
    const batchesData = Array.isArray(itemData.batches) ? itemData.batches : []

    return (
      <Card>
        <Collapsible defaultOpen={true}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CollapsibleTrigger className="flex items-center gap-2 hover:opacity-70">
                <IconComponent name={sectionConfig.icon} className="h-5 w-5" />
                <CardTitle className="text-lg">
                  {getLocalizedText(sectionConfig.title, currentLanguage)}
                </CardTitle>
                <IconComponent name="ChevronDown" className="h-4 w-4 transition-transform" />
              </CollapsibleTrigger>

              <Button
                variant="outline"
                size="sm"
                onClick={() => onPrintSection(sectionKey)}
                className="print:hidden"
              >
                <IconComponent name="Printer" className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CollapsibleContent>
            <CardContent ref={el => sectionRefs.current[sectionKey] = el}>
              <h2 className="hidden print:block text-xl font-bold mb-4">
                {getLocalizedText(sectionConfig.title, currentLanguage)}
              </h2>

              {/* MEDM Field */}
              <div className="mb-6 p-4 bg-muted/50 rounded-lg">
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  {getLocalizedText(FIELD_LABELS.medm, currentLanguage)}
                </div>
                <div className="text-base font-medium">
                  {renderFieldValue('medm', itemData.medm)}
                </div>
              </div>

              {/* Batches Table */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  {getLocalizedText(FIELD_LABELS.batches, currentLanguage)}
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-200">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium">
                          {currentLanguage === 'mm' ? 'ပညာသင်နှစ်' : 'Academic Year'}
                        </th>
                        <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium">
                          {currentLanguage === 'mm' ? 'အပတ်စဥ်' : 'Batch'}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {batchesData.length > 0 ? (
                        batchesData.map((batch: any, idx: number) => {
                          const academicYear = getNestedValue(batch, 'academicYearId.name') || getNestedValue(batch, 'academicYearId')
                          const batchName = getNestedValue(batch, 'batchId.name') || getNestedValue(batch, 'batchId')

                          return (
                            <tr key={idx}>
                              <td className="border border-gray-200 px-4 py-2 text-sm">
                                {typeof academicYear === 'object' && academicYear?.en
                                  ? getLocalizedText(academicYear, currentLanguage)
                                  : academicYear || '-'}
                              </td>
                              <td className="border border-gray-200 px-4 py-2 text-sm">
                                {typeof batchName === 'object' && batchName?.en
                                  ? getLocalizedText(batchName, currentLanguage)
                                  : batchName || '-'}
                              </td>
                            </tr>
                          )
                        })
                      ) : (
                        <tr>
                          <td colSpan={2} className="border border-gray-200 px-4 py-2 text-sm text-center text-muted-foreground">
                            {currentLanguage === 'mm' ? 'မရှိပါ' : 'No batches'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    )
  }

  // Render Family section with smart guardian logic
  if (sectionKey === 'family') {
    return (
      <Card>
        <Collapsible defaultOpen={true}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CollapsibleTrigger className="flex items-center gap-2 hover:opacity-70">
                <IconComponent name={sectionConfig.icon} className="h-5 w-5" />
                <CardTitle className="text-lg">
                  {getLocalizedText(sectionConfig.title, currentLanguage)}
                </CardTitle>
                <IconComponent name="ChevronDown" className="h-4 w-4 transition-transform" />
              </CollapsibleTrigger>

              <Button
                variant="outline"
                size="sm"
                onClick={() => onPrintSection(sectionKey)}
                className="print:hidden"
              >
                <IconComponent name="Printer" className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CollapsibleContent>
            <CardContent ref={el => sectionRefs.current[sectionKey] = el}>
              <h2 className="hidden print:block text-xl font-bold mb-4">
                {getLocalizedText(sectionConfig.title, currentLanguage)}
              </h2>

              <div className="space-y-6">
                {/* Father - Hide if father is guardian */}
                {!isFatherGuardian && itemData.father && (
                  <div className="border-b pb-4">
                    <h3 className="font-semibold text-base mb-3">
                      {currentLanguage === 'mm' ? 'အဖအချက်အလက်' : 'Father Information'}
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <Field
                        label={currentLanguage === 'mm' ? 'အမည်' : 'Name'}
                        value={currentLanguage === 'mm' ? itemData.father.nameMyanmar : itemData.father.nameEnglish}
                      />
                      <Field
                        label={getLocalizedText(FIELD_LABELS['father.nrcNumber'], currentLanguage)}
                        value={itemData.father.nrcNumber}
                      />
                      <Field
                        label={getLocalizedText(FIELD_LABELS['father.occupation'], currentLanguage)}
                        value={itemData.father.occupation}
                      />
                    </div>
                  </div>
                )}

                {/* Mother - Hide if mother is guardian */}
                {!isMotherGuardian && itemData.mother && (
                  <div className="border-b pb-4">
                    <h3 className="font-semibold text-base mb-3">
                      {currentLanguage === 'mm' ? 'အမိအချက်အလက်' : 'Mother Information'}
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <Field
                        label={currentLanguage === 'mm' ? 'အမည်' : 'Name'}
                        value={currentLanguage === 'mm' ? itemData.mother.nameMyanmar : itemData.mother.nameEnglish}
                      />
                      <Field
                        label={getLocalizedText(FIELD_LABELS['mother.nrcNumber'], currentLanguage)}
                        value={itemData.mother.nrcNumber}
                      />
                      <Field
                        label={getLocalizedText(FIELD_LABELS['mother.occupation'], currentLanguage)}
                        value={itemData.mother.occupation}
                      />
                    </div>
                  </div>
                )}

                {/* Guardian */}
                {itemData.guardian && (
                  <div>
                    <h3 className="font-semibold text-base mb-3">
                      {currentLanguage === 'mm' ? 'အုပ်ထိန်းသူအချက်အလက်' : 'Guardian Information'}
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <Field
                        label={currentLanguage === 'mm' ? 'အမည်' : 'Name'}
                        value={currentLanguage === 'mm' ? itemData.guardian.nameMyanmar : itemData.guardian.nameEnglish}
                      />
                      <Field
                        label={getLocalizedText(FIELD_LABELS['guardian.nrcNumber'], currentLanguage)}
                        value={itemData.guardian.nrcNumber}
                      />
                      <Field
                        label={getLocalizedText(FIELD_LABELS['guardian.occupation'], currentLanguage)}
                        value={itemData.guardian.occupation}
                      />
                      <Field
                        label={getLocalizedText(FIELD_LABELS['guardian.relationship'], currentLanguage)}
                        value={itemData.guardian.relationship}
                      />
                      <Field
                        label={getLocalizedText(FIELD_LABELS['guardian.phoneNumber'], currentLanguage)}
                        value={itemData.guardian.phoneNumber}
                      />
                      <Field
                        label={getLocalizedText(FIELD_LABELS['guardian.email'], currentLanguage)}
                        value={itemData.guardian.email}
                      />
                      <Field
                        label={getLocalizedText(FIELD_LABELS['guardian.address'], currentLanguage)}
                        value={itemData.guardian.address}
                        className="col-span-2"
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    )
  }

  // Render Personal section - show only name based on current language
  if (sectionKey === 'personal') {
    return (
      <Card>
        <Collapsible defaultOpen={true}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CollapsibleTrigger className="flex items-center gap-2 hover:opacity-70">
                <IconComponent name={sectionConfig.icon} className="h-5 w-5" />
                <CardTitle className="text-lg">
                  {getLocalizedText(sectionConfig.title, currentLanguage)}
                </CardTitle>
                <IconComponent name="ChevronDown" className="h-4 w-4 transition-transform" />
              </CollapsibleTrigger>

              <Button
                variant="outline"
                size="sm"
                onClick={() => onPrintSection(sectionKey)}
                className="print:hidden"
              >
                <IconComponent name="Printer" className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CollapsibleContent>
            <CardContent ref={el => sectionRefs.current[sectionKey] = el}>
              <h2 className="hidden print:block text-xl font-bold mb-4">
                {getLocalizedText(sectionConfig.title, currentLanguage)}
              </h2>

              <div className="grid grid-cols-3 gap-4">
                {/* Show only name based on current language */}
                <Field
                  label={currentLanguage === 'mm' ? 'အမည်' : 'Name'}
                  value={currentLanguage === 'mm' ? itemData.nameMyanmar : itemData.nameEnglish}
                />
                <Field
                  label={getLocalizedText(FIELD_LABELS.gender, currentLanguage)}
                  value={renderFieldValue('gender', itemData.gender)}
                />
                <Field
                  label={getLocalizedText(FIELD_LABELS.ethnicity, currentLanguage)}
                  value={renderFieldValue('ethnicity', itemData.ethnicity)}
                />
                <Field
                  label={getLocalizedText(FIELD_LABELS.religion, currentLanguage)}
                  value={renderFieldValue('religion', itemData.religion)}
                />
                <Field
                  label={getLocalizedText(FIELD_LABELS.bloodGroup, currentLanguage)}
                  value={renderFieldValue('bloodGroup', itemData.bloodGroup)}
                />
                <Field
                  label={getLocalizedText(FIELD_LABELS.nrcNumber, currentLanguage)}
                  value={renderFieldValue('nrcNumber', itemData.nrcNumber)}
                />
                <Field
                  label={getLocalizedText(FIELD_LABELS.dateOfBirth, currentLanguage)}
                  value={renderFieldValue('dateOfBirth', itemData.dateOfBirth)}
                />
                <Field
                  label={getLocalizedText(FIELD_LABELS.placeOfBirth, currentLanguage)}
                  value={renderFieldValue('placeOfBirth', itemData.placeOfBirth)}
                />
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    )
  }

  // Render Contact section - combined with address information
  if (sectionKey === 'contact') {
    return (
      <Card>
        <Collapsible defaultOpen={true}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CollapsibleTrigger className="flex items-center gap-2 hover:opacity-70">
                <IconComponent name={sectionConfig.icon} className="h-5 w-5" />
                <CardTitle className="text-lg">
                  {getLocalizedText(sectionConfig.title, currentLanguage)}
                </CardTitle>
                <IconComponent name="ChevronDown" className="h-4 w-4 transition-transform" />
              </CollapsibleTrigger>

              <Button
                variant="outline"
                size="sm"
                onClick={() => onPrintSection(sectionKey)}
                className="print:hidden"
              >
                <IconComponent name="Printer" className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CollapsibleContent>
            <CardContent ref={el => sectionRefs.current[sectionKey] = el}>
              <h2 className="hidden print:block text-xl font-bold mb-4">
                {getLocalizedText(sectionConfig.title, currentLanguage)}
              </h2>

              <div className="space-y-4">
                {/* Contact Fields - 3 columns */}
                <div className="grid grid-cols-3 gap-4">
                  <Field
                    label={getLocalizedText(FIELD_LABELS.phoneNumber, currentLanguage)}
                    value={renderFieldValue('phoneNumber', itemData.phoneNumber)}
                  />
                  <Field
                    label={getLocalizedText(FIELD_LABELS.email, currentLanguage)}
                    value={renderFieldValue('email', itemData.email)}
                  />
                </div>

                {/* Address Fields - Permanent and Current in 2 columns same row */}
                <div className="grid grid-cols-2 gap-4">
                  <Field
                    label={getLocalizedText(FIELD_LABELS.permanentAddress, currentLanguage)}
                    value={renderFieldValue('permanentAddress', itemData.permanentAddress)}
                  />
                  {!isSameAddress && (
                    <Field
                      label={getLocalizedText(FIELD_LABELS.currentAddress, currentLanguage)}
                      value={renderFieldValue('currentAddress', itemData.currentAddress)}
                    />
                  )}
                  {isSameAddress && (
                    <div className="flex items-center text-sm text-muted-foreground italic">
                      {currentLanguage === 'mm'
                        ? '* လက်ရှိနေရပ်လိပ်စာနှင့် အမြဲတမ်းနေရပ်လိပ်စာ တူညီပါသည်'
                        : '* Current address is same as permanent address'}
                    </div>
                  )}
                </div>

                {/* Location Fields - 3 columns */}
                <div className="grid grid-cols-3 gap-4">
                  <Field
                    label={getLocalizedText(FIELD_LABELS.stateRegionName, currentLanguage)}
                    value={renderFieldValue('stateRegionName', itemData.stateRegionName)}
                  />
                  <Field
                    label={getLocalizedText(FIELD_LABELS.districtName, currentLanguage)}
                    value={renderFieldValue('districtName', itemData.districtName)}
                  />
                  <Field
                    label={getLocalizedText(FIELD_LABELS.townshipName, currentLanguage)}
                    value={renderFieldValue('townshipName', itemData.townshipName)}
                  />
                  <Field
                    label={getLocalizedText(FIELD_LABELS.townName, currentLanguage)}
                    value={renderFieldValue('townName', itemData.townName)}
                  />
                  <Field
                    label={getLocalizedText(FIELD_LABELS.townVillageName, currentLanguage)}
                    value={renderFieldValue('townVillageName', itemData.townVillageName)}
                  />
                  <Field
                    label={getLocalizedText(FIELD_LABELS.wardVillageName, currentLanguage)}
                    value={renderFieldValue('wardVillageName', itemData.wardVillageName)}
                  />
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    )
  }

  // Default section rendering for additional info
  return (
    <Card>
      <Collapsible defaultOpen={true}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CollapsibleTrigger className="flex items-center gap-2 hover:opacity-70">
              <IconComponent name={sectionConfig.icon} className="h-5 w-5" />
              <CardTitle className="text-lg">
                {getLocalizedText(sectionConfig.title, currentLanguage)}
              </CardTitle>
              <IconComponent name="ChevronDown" className="h-4 w-4 transition-transform" />
            </CollapsibleTrigger>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onPrintSection(sectionKey)}
              className="print:hidden"
            >
              <IconComponent name="Printer" className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent ref={el => sectionRefs.current[sectionKey] = el}>
            <h2 className="hidden print:block text-xl font-bold mb-4">
              {getLocalizedText(sectionConfig.title, currentLanguage)}
            </h2>

            <div className="grid grid-cols-2 gap-4">
              {sectionConfig.fields.map((fieldName: string) => {
                const value = getNestedValue(itemData, fieldName)
                return (
                  <Field
                    key={fieldName}
                    label={getLocalizedText(FIELD_LABELS[fieldName], currentLanguage)}
                    value={renderFieldValue(fieldName, value)}
                  />
                )
              })}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}

// Field Component
interface FieldProps {
  label: string
  value: React.ReactNode
  className?: string
}

function Field({ label, value, className = '' }: FieldProps) {
  return (
    <div className={className}>
      <div className="text-sm font-medium text-muted-foreground mb-1">{label}</div>
      <div className="text-base">{value}</div>
    </div>
  )
}
