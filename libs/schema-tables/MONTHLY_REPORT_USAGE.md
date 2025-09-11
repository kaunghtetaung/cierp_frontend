# Monthly Report Feature Usage

## Overview
The ModuleDataTable now supports monthly report functionality with a built-in month/year selector and enhanced print capabilities.

## How to Use

### 1. Enable Monthly Selector
```tsx
import { ModuleDataTable } from '@repo/schema-tables';

// In your component
<ModuleDataTable
  module={moduleSchema}
  data={monthlyData}
  showMonthlySelector={true}
  selectedYear={2024}
  selectedMonth={12}
  onMonthChange={(year, month) => {
    // Fetch data for the selected month
    fetchMonthlyData(year, month);
  }}
  // ... other props
/>
```

### 2. Month Change Handler
```tsx
const handleMonthChange = async (year: number, month: number) => {
  try {
    // Update your data source
    const monthlyData = await fetchReportData({
      year,
      month,
      // Add any other filters your API needs
    });
    
    // Update your state
    setData(monthlyData);
    setSelectedYear(year);
    setSelectedMonth(month);
  } catch (error) {
    console.error('Failed to fetch monthly data:', error);
  }
};
```

### 3. Print Features
When `showMonthlySelector={true}`, the print functionality automatically includes:
- Module name
- Selected month and year
- "Monthly Report" suffix
- Proper localization (English/Myanmar)

Example print titles:
- English: "User Management - December 2024 Monthly Report"
- Myanmar: "အသုံးပြုသူ စီမံခန့်ခွဲမှု - ဒီဇင်ဘာ 2024 လစဉ်အစီရင်ခံစာ"

### 4. Complete Example
```tsx
import React, { useState, useEffect } from 'react';
import { ModuleDataTable } from '@repo/schema-tables';

export function MonthlyReportPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  const fetchMonthlyData = async (year: number, month: number) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/reports/monthly?year=${year}&month=${month}`);
      const monthlyData = await response.json();
      setData(monthlyData.items || []);
    } catch (error) {
      console.error('Error fetching monthly data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonthlyData(selectedYear, selectedMonth);
  }, [selectedYear, selectedMonth]);

  const handleMonthChange = (year: number, month: number) => {
    setSelectedYear(year);
    setSelectedMonth(month);
    // fetchMonthlyData will be called by useEffect
  };

  return (
    <ModuleDataTable
      module={reportModuleSchema}
      data={data}
      isLoading={loading}
      showMonthlySelector={true}
      selectedYear={selectedYear}
      selectedMonth={selectedMonth}
      onMonthChange={handleMonthChange}
      // Disable pagination for monthly reports (optional)
      // or keep pagination if you have lots of monthly data
    />
  );
}
```

### 5. Backend API Integration
Your API endpoint should support month/year filtering:

```typescript
// Example API route
export async function GET(request: Request) {
  const url = new URL(request.url);
  const year = url.searchParams.get('year');
  const month = url.searchParams.get('month');
  
  // Filter your data by month/year
  const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
  const endDate = new Date(parseInt(year), parseInt(month), 0);
  
  const monthlyData = await database.find({
    createdAt: {
      $gte: startDate,
      $lte: endDate
    }
  });
  
  return Response.json({ items: monthlyData });
}
```

## Features

### Monthly Selector UI
- Year dropdown (current year and 5 years back)
- Month dropdown with localized month names
- Current selection display badge
- Responsive design (stacks on mobile)

### Enhanced Print
- Dynamic print titles with month/year
- Localized month names
- Professional formatting
- All existing print features preserved

### Localization Support
- English and Myanmar language support
- Automatic month name translation
- Localized labels and text

## Props Reference

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `showMonthlySelector` | `boolean` | `false` | Enable/disable monthly selector |
| `onMonthChange` | `(year: number, month: number) => void` | - | Called when month/year changes |
| `selectedYear` | `number` | Current year | Currently selected year |
| `selectedMonth` | `number` | Current month | Currently selected month (1-12) |

## Notes
- Month values are 1-based (1 = January, 12 = December)
- The component automatically handles responsive design
- Print functionality works seamlessly with existing features
- All existing ModuleDataTable props remain available