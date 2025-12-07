'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@repo/ui';
import { IconComponent } from '@repo/ui';
import { cn } from '@repo/utils';
import { useLanguage } from '@repo/language';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import html2canvas from 'html2canvas';
import type { StudentDashboardResponse, LabeledCount, PrefilterField } from '@repo/types';

// Print utility function with chart capture
const printContent = async (
  elementId: string,
  title: string,
  tableData?: Array<{ name: string; value: number; color?: string }>,
  filterBy?: StudentDashboardResponse['filterBy']
) => {
  const printElement = document.getElementById(elementId);
  if (!printElement) return;

  // Check if this is a chart view (has SVG/ResponsiveContainer) or progress bars
  const hasChart = printElement.querySelector('svg') !== null;
  const hasProgressBars = printElement.querySelector('.screen-only') !== null;

  let chartImageUrl = '';

  if (hasChart || hasProgressBars) {
    try {
      // Capture the chart/progress bars as an image
      const canvas = await html2canvas(printElement, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
      });
      chartImageUrl = canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Error capturing chart:', error);
    }
  }

  // Build filter HTML if filterBy is provided
  let filterHTML = '';
  if (filterBy) {
    const activeFilters: string[] = [];

    // Map filter keys to display labels
    const filterLabels: Record<string, string> = {
      academicYear: 'Academic Year',
      batch: 'Batch',
      registrationStatus: 'Registration Status',
      stateRegionName: 'State/Region',
      districtName: 'District',
      townshipName: 'Township',
      townName: 'Town/Village',
      gender: 'Gender',
      race: 'Race',
      religion: 'Religion',
      bloodType: 'Blood Type',
    };

    Object.entries(filterBy).forEach(([key, value]) => {
      if (!value) return;

      const label = filterLabels[key] || key;
      let displayValue = '';

      // Handle object values (like academicYear and batch)
      if (typeof value === 'object' && 'name' in value) {
        displayValue = value.name;
      } else if (typeof value === 'string') {
        displayValue = value;
      }

      if (displayValue) {
        activeFilters.push(`<strong>${label}:</strong> ${displayValue}`);
      }
    });

    if (activeFilters.length > 0) {
      filterHTML = `
        <div style="margin-top: 30px; padding: 15px; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 4px;">
          <h3 style="margin: 0 0 10px 0; font-size: 14px; font-weight: 600; color: #374151;">Applied Filters:</h3>
          <div style="font-size: 13px; color: #4b5563; line-height: 1.8;">
            ${activeFilters.join('<br>')}
          </div>
        </div>
      `;
    }
  }

  // Build table HTML if tableData is provided
  let tableHTML = '';
  if (tableData && tableData.length > 0) {
    const total = tableData.reduce((sum, item) => sum + item.value, 0);
    tableHTML = `
      <div style="margin-top: 30px;">
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <thead style="background-color: #f3f4f6;">
            <tr>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: 600;">Name</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: right; font-weight: 600;">Count</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: right; font-weight: 600;">%</th>
            </tr>
          </thead>
          <tbody>
            ${tableData.map((item, index) => `
              <tr style="${index % 2 === 1 ? 'background-color: #f9fafb;' : ''}">
                <td style="border: 1px solid #ddd; padding: 8px;">
                  ${item.color ? `<span style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; background-color: ${item.color}; margin-right: 8px; vertical-align: middle;"></span>` : ''}
                  ${item.name}
                </td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right; font-weight: 500;">${item.value.toLocaleString()}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right; color: #666;">${total > 0 ? ((item.value / total) * 100).toFixed(1) : '0'}%</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot style="background-color: #e5e7eb;">
            <tr>
              <td style="border: 1px solid #ddd; padding: 8px; font-weight: 600;">Total</td>
              <td style="border: 1px solid #ddd; padding: 8px; text-align: right; font-weight: 600;">${total.toLocaleString()}</td>
              <td style="border: 1px solid #ddd; padding: 8px; text-align: right; font-weight: 600;">100%</td>
            </tr>
          </tfoot>
        </table>
      </div>
    `;
  }

  const printWindow = window.open('', '', 'height=800,width=1000');
  if (!printWindow) return;

  printWindow.document.write(`
    <html>
      <head>
        <title>${title}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
            margin: 0;
          }
          h1 {
            font-size: 20px;
            margin-bottom: 20px;
            color: #333;
            text-align: center;
          }
          .chart-container {
            display: flex;
            justify-content: center;
            margin: 20px 0;
          }
          .chart-container img {
            max-width: 100%;
            height: auto;
          }
          @media print {
            body { padding: 10px; }
            @page { margin: 1cm; }
          }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        ${chartImageUrl ? `
          <div class="chart-container">
            <img src="${chartImageUrl}" alt="${title}" />
          </div>
        ` : ''}
        ${tableHTML}
        ${filterHTML}
      </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();

  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 500);
};

// View toggle component for chart/table switch
interface ViewToggleProps {
  view: 'chart' | 'table';
  onViewChange: (view: 'chart' | 'table') => void;
  onPrint: () => void;
  chartType?: 'pie' | 'bar' | 'progress'; // Type of chart to show appropriate icon
}

function ViewToggle({ view, onViewChange, onPrint, chartType = 'pie' }: ViewToggleProps) {
  const chartIcon = chartType === 'bar' ? 'BarChart3' : chartType === 'progress' ? 'BarChart' : 'PieChart';

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1 bg-muted rounded-md p-0.5">
        <button
          type="button"
          onClick={() => onViewChange('chart')}
          className={cn(
            "px-2 py-1 text-xs rounded transition-colors flex items-center gap-1",
            view === 'chart'
              ? "bg-background shadow-sm text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <IconComponent name={chartIcon} className="h-3 w-3" />
          Chart
        </button>
        <button
          type="button"
          onClick={() => onViewChange('table')}
          className={cn(
            "px-2 py-1 text-xs rounded transition-colors flex items-center gap-1",
            view === 'table'
              ? "bg-background shadow-sm text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <IconComponent name="Table" className="h-3 w-3" />
          Table
        </button>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onPrint}
        className="h-7 px-2"
      >
        <IconComponent name="Printer" className="h-3 w-3" />
      </Button>
    </div>
  );
}

// Simple data table for dashboard
interface DashboardTableProps {
  data: Array<{ name: string; value: number; color?: string }>;
  valueLabel?: string;
}

function DashboardTable({ data, valueLabel = 'Count' }: DashboardTableProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="overflow-auto max-h-[300px]">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-background border-b">
          <tr>
            <th className="text-left py-2 px-3 font-medium">Name</th>
            <th className="text-right py-2 px-3 font-medium">{valueLabel}</th>
            <th className="text-right py-2 px-3 font-medium">%</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={index} className="border-b last:border-0 hover:bg-muted/50">
              <td className="py-2 px-3 flex items-center gap-2">
                {item.color && (
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                )}
                <span className="truncate">{item.name}</span>
              </td>
              <td className="text-right py-2 px-3 font-medium">
                {item.value.toLocaleString()}
              </td>
              <td className="text-right py-2 px-3 text-muted-foreground">
                {total > 0 ? ((item.value / total) * 100).toFixed(1) : '0'}%
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot className="sticky bottom-0 bg-muted/30 border-t">
          <tr>
            <td className="py-2 px-3 font-semibold">Total</td>
            <td className="text-right py-2 px-3 font-semibold">
              {total.toLocaleString()}
            </td>
            <td className="text-right py-2 px-3 font-semibold">100%</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

// Progress bar component with print-friendly table fallback
interface ProgressBarData {
  name: string;
  count: number;
}

interface ProgressBarListProps {
  data: ProgressBarData[];
  color: string;
}

function ProgressBarList({ data, color }: ProgressBarListProps) {
  const total = data.reduce((sum, i) => sum + i.count, 0);

  return (
    <>
      {/* Print-friendly table (hidden on screen, visible in print) */}
      <div className="print-only" style={{ display: 'none' }}>
        <DashboardTable
          data={data.map(item => ({
            name: item.name,
            value: item.count,
          }))}
          valueLabel="Students"
        />
      </div>

      {/* Screen-friendly progress bars (visible on screen, hidden in print) */}
      <div className="screen-only space-y-3 max-h-[300px] overflow-y-auto">
        {data.map((item, index) => {
          const percentage = total > 0 ? ((item.count / total) * 100).toFixed(1) : '0';

          return (
            <div key={index} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium truncate">{item.name}</span>
                <span className="text-muted-foreground">{item.count}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${color}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

// Color palettes for charts
const STATUS_COLORS = {
  pending: '#fbbf24',
  approved: '#22c55e',
  rejected: '#ef4444',
  incomplete: '#94a3b8',
  entryByOperator: '#6366f1',
};

const CHART_COLORS = [
  '#3b82f6', // blue
  '#22c55e', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#f97316', // orange
];

interface StudentDashboardProps {
  data: StudentDashboardResponse | null;
  isLoading?: boolean;
  activeFilters?: Record<string, string | string[] | { from: string; to: string } | undefined>;
  filterFields?: PrefilterField[];
}

export function StudentDashboard({ data, isLoading = false, activeFilters = {}, filterFields = [] }: StudentDashboardProps) {
  const { currentLanguage } = useLanguage();

  // View state for each chart section
  const [statusView, setStatusView] = useState<'chart' | 'table'>('chart');
  const [genderView, setGenderView] = useState<'chart' | 'table'>('chart');
  const [academicYearView, setAcademicYearView] = useState<'chart' | 'table'>('chart');
  const [batchView, setBatchView] = useState<'chart' | 'table'>('chart');
  const [regionView, setRegionView] = useState<'chart' | 'table'>('chart');
  const [districtView, setDistrictView] = useState<'chart' | 'table'>('chart');
  const [townshipView, setTownshipView] = useState<'chart' | 'table'>('chart');
  const [townView, setTownView] = useState<'chart' | 'table'>('chart');
  const [bloodTypeView, setBloodTypeView] = useState<'chart' | 'table'>('chart');
  const [religionView, setReligionView] = useState<'chart' | 'table'>('chart');
  const [raceView, setRaceView] = useState<'chart' | 'table'>('chart');

  // Helper to get label from multilingual text
  const getLabel = (item: LabeledCount): string => {
    if (typeof item.label === 'string') return item.label;
    return item.label?.[currentLanguage] || item.label?.en || item.value;
  };

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No dashboard data available
      </div>
    );
  }

  const { summary, byClass, byRegion, byDemographics } = data;

  // Format registration status data for charts
  const statusData = [
    { name: 'Pending', value: summary.byRegistrationStatus.pending, color: STATUS_COLORS.pending },
    { name: 'Approved', value: summary.byRegistrationStatus.approved, color: STATUS_COLORS.approved },
    { name: 'Rejected', value: summary.byRegistrationStatus.rejected, color: STATUS_COLORS.rejected },
    { name: 'Incomplete', value: summary.byRegistrationStatus.incomplete, color: STATUS_COLORS.incomplete },
    { name: 'Entry by Operator', value: summary.byRegistrationStatus.entryByOperator, color: STATUS_COLORS.entryByOperator },
  ].filter(item => item.value > 0);

  // Prepare data for tables
  const genderTableData = byDemographics.byGender.map((item, index) => ({
    name: getLabel(item),
    value: item.count,
    color: CHART_COLORS[index % CHART_COLORS.length],
  }));

  const academicYearTableData = byClass.byAcademicYear.map((item, index) => ({
    name: item.name,
    value: item.count,
    color: CHART_COLORS[index % CHART_COLORS.length],
  }));

  const batchTableData = byClass.byBatch.map((item, index) => ({
    name: item.name,
    value: item.count,
    color: CHART_COLORS[index % CHART_COLORS.length],
  }));

  const regionTableData = byRegion.byStateRegion?.map((item, index) => ({
    name: item.name,
    value: item.count,
    color: CHART_COLORS[index % CHART_COLORS.length],
  })) || [];

  const districtTableData = byRegion.byDistrict?.map((item, index) => ({
    name: item.name,
    value: item.count,
    color: CHART_COLORS[index % CHART_COLORS.length],
  })) || [];

  const townshipTableData = byRegion.byTownship?.map((item, index) => ({
    name: item.name,
    value: item.count,
    color: CHART_COLORS[index % CHART_COLORS.length],
  })) || [];

  const townTableData = byRegion.byTown?.map((item, index) => ({
    name: item.name,
    value: item.count,
    color: CHART_COLORS[index % CHART_COLORS.length],
  })) || [];

  const bloodTypeTableData = byDemographics.byBloodType.map((item, index) => ({
    name: getLabel(item),
    value: item.count,
    color: CHART_COLORS[index % CHART_COLORS.length],
  }));

  const religionTableData = byDemographics.byReligion.map((item, index) => ({
    name: getLabel(item),
    value: item.count,
    color: CHART_COLORS[index % CHART_COLORS.length],
  }));

  const raceTableData = byDemographics.byRace.map((item, index) => ({
    name: getLabel(item),
    value: item.count,
    color: CHART_COLORS[index % CHART_COLORS.length],
  }));

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalStudents.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-600">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.byRegistrationStatus.pending.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-600">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.byRegistrationStatus.approved.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-600">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.byRegistrationStatus.rejected.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Incomplete</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.byRegistrationStatus.incomplete.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-indigo-600">Entry by Operator</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.byRegistrationStatus.entryByOperator.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Registration Status Pie Chart */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Registration Status Distribution</CardTitle>
            <ViewToggle
              view={statusView}
              onViewChange={setStatusView}
              onPrint={() => printContent('status-print-content', 'Registration Status Distribution', statusData, data?.filterBy)}
            />
          </CardHeader>
          <CardContent>
            <div className="h-[300px]" id="status-print-content">
              {statusView === 'chart' ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <DashboardTable data={statusData} valueLabel="Students" />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Gender Distribution */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Gender Distribution</CardTitle>
            <ViewToggle
              view={genderView}
              onViewChange={setGenderView}
              onPrint={() => printContent('gender-print-content', 'Gender Distribution', genderTableData, data?.filterBy)}
            />
          </CardHeader>
          <CardContent>
            <div className="h-[300px]" id="gender-print-content">
              {genderView === 'chart' ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={byDemographics.byGender.map((item) => ({
                        name: getLabel(item),
                        value: item.count,
                      }))}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {byDemographics.byGender.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <DashboardTable data={genderTableData} valueLabel="Students" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2: Academic Year & Batch */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Students by Academic Year */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Students by Academic Year</CardTitle>
            <ViewToggle
              view={academicYearView}
              onViewChange={setAcademicYearView}
              onPrint={() => printContent('academic-year-print-content', 'Students by Academic Year', academicYearTableData, data?.filterBy)}
              chartType="bar"
            />
          </CardHeader>
          <CardContent>
            <div className="h-[300px]" id="academic-year-print-content">
              {byClass.byAcademicYear.length > 0 ? (
                academicYearView === 'chart' ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={byClass.byAcademicYear}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#3b82f6" name="Students" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <DashboardTable data={academicYearTableData} valueLabel="Students" />
                )
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No academic year data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Students by Batch */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Students by Batch</CardTitle>
            <ViewToggle
              view={batchView}
              onViewChange={setBatchView}
              onPrint={() => printContent('batch-print-content', 'Students by Batch', batchTableData, data?.filterBy)}
              chartType="bar"
            />
          </CardHeader>
          <CardContent>
            <div className="h-[300px]" id="batch-print-content">
              {byClass.byBatch.length > 0 ? (
                batchView === 'chart' ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={byClass.byBatch.slice(0, 10)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#22c55e" name="Students" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <DashboardTable data={batchTableData} valueLabel="Students" />
                )
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No batch data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 3: Location Data (State/Region, District, Township, Town) - 2x2 grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Students by State/Region */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">By State/Region</CardTitle>
            <ViewToggle
              view={regionView}
              onViewChange={setRegionView}
              onPrint={() => printContent('region-print-content', 'Students by State/Region', regionTableData, data?.filterBy)}
              chartType="progress"
            />
          </CardHeader>
          <CardContent>
            <div className="h-[300px]" id="region-print-content">
              {byRegion.byStateRegion?.length > 0 ? (
                regionView === 'chart' ? (
                  <ProgressBarList data={byRegion.byStateRegion} color="bg-blue-500" />
                ) : (
                  <DashboardTable data={regionTableData} valueLabel="Students" />
                )
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No state/region data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Students by District */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">By District</CardTitle>
            <ViewToggle
              view={districtView}
              onViewChange={setDistrictView}
              onPrint={() => printContent('district-print-content', 'Students by District', districtTableData, data?.filterBy)}
              chartType="progress"
            />
          </CardHeader>
          <CardContent>
            <div className="h-[300px]" id="district-print-content">
              {byRegion.byDistrict?.length > 0 ? (
                districtView === 'chart' ? (
                  <ProgressBarList data={byRegion.byDistrict} color="bg-green-500" />
                ) : (
                  <DashboardTable data={districtTableData} valueLabel="Students" />
                )
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No district data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Students by Township */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">By Township</CardTitle>
            <ViewToggle
              view={townshipView}
              onViewChange={setTownshipView}
              onPrint={() => printContent('township-print-content', 'Students by Township', townshipTableData, data?.filterBy)}
              chartType="progress"
            />
          </CardHeader>
          <CardContent>
            <div className="h-[300px]" id="township-print-content">
              {byRegion.byTownship?.length > 0 ? (
                townshipView === 'chart' ? (
                  <ProgressBarList data={byRegion.byTownship} color="bg-amber-500" />
                ) : (
                  <DashboardTable data={townshipTableData} valueLabel="Students" />
                )
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No township data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Students by Town/Village Tract */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">By Town/Village</CardTitle>
            <ViewToggle
              view={townView}
              onViewChange={setTownView}
              onPrint={() => printContent('town-print-content', 'Students by Town/Village', townTableData, data?.filterBy)}
              chartType="progress"
            />
          </CardHeader>
          <CardContent>
            <div className="h-[300px]" id="town-print-content">
              {byRegion.byTown?.length > 0 ? (
                townView === 'chart' ? (
                  <ProgressBarList data={byRegion.byTown} color="bg-violet-500" />
                ) : (
                  <DashboardTable data={townTableData} valueLabel="Students" />
                )
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No town/village data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 4: Demographics (Blood Type & Religion) - 2 columns */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Blood Type Distribution */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Blood Type Distribution</CardTitle>
            <ViewToggle
              view={bloodTypeView}
              onViewChange={setBloodTypeView}
              onPrint={() => printContent('blood-type-print-content', 'Blood Type Distribution', bloodTypeTableData, data?.filterBy)}
              chartType="bar"
            />
          </CardHeader>
          <CardContent>
            <div className="h-[300px]" id="blood-type-print-content">
              {byDemographics.byBloodType.length > 0 ? (
                bloodTypeView === 'chart' ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={byDemographics.byBloodType.map(item => ({
                      name: getLabel(item),
                      count: item.count,
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#ef4444" name="Students" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <DashboardTable data={bloodTypeTableData} valueLabel="Students" />
                )
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No blood type data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Religion Distribution */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Religion Distribution</CardTitle>
            <ViewToggle
              view={religionView}
              onViewChange={setReligionView}
              onPrint={() => printContent('religion-print-content', 'Religion Distribution', religionTableData, data?.filterBy)}
            />
          </CardHeader>
          <CardContent>
            <div className="h-[300px]" id="religion-print-content">
              {byDemographics.byReligion.length > 0 ? (
                religionView === 'chart' ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={byDemographics.byReligion.map((item) => ({
                          name: getLabel(item),
                          value: item.count,
                        }))}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                      >
                        {byDemographics.byReligion.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <DashboardTable data={religionTableData} valueLabel="Students" />
                )
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No religion data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Race Distribution (Full Width) */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Race Distribution</CardTitle>
          <ViewToggle
            view={raceView}
            onViewChange={setRaceView}
            onPrint={() => printContent('race-print-content', 'Race Distribution', raceTableData, data?.filterBy)}
            chartType="bar"
          />
        </CardHeader>
        <CardContent>
          <div className="h-[300px]" id="race-print-content">
            {byDemographics.byRace.length > 0 ? (
              raceView === 'chart' ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byDemographics.byRace.slice(0, 15).map(item => ({
                    name: getLabel(item),
                    count: item.count,
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8b5cf6" name="Students" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <DashboardTable data={raceTableData} valueLabel="Students" />
              )
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No race data available
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Skeleton loader for dashboard
function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Summary Cards Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="h-4 w-24 bg-muted rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Skeleton */}
      <div className="grid gap-6 md:grid-cols-2">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-5 w-32 bg-muted rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-[300px] bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-5 w-32 bg-muted rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-[300px] bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}