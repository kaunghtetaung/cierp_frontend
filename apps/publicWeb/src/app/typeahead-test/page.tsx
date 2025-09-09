import { BookForm } from '@/lib/components/BookForm';

export default function TypeaheadTestPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">TypeaheadSelect Test Page</h1>
        
        <div className="bg-white rounded-lg shadow-md">
          <BookForm />
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">TypeaheadSelect Features</h3>
          <ul className="space-y-2 text-blue-800">
            <li>✓ Debounced search (300ms default)</li>
            <li>✓ Minimum 2 characters to trigger search</li>
            <li>✓ Loading state while searching</li>
            <li>✓ Keyboard navigation (Arrow keys + Enter)</li>
            <li>✓ Clear selection with X button</li>
            <li>✓ Click outside to close dropdown</li>
            <li>✓ Error state display</li>
            <li>✓ Empty state message when no results</li>
          </ul>
        </div>

        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-900 mb-3">Test Instructions</h3>
          <ol className="space-y-2 text-yellow-800 list-decimal list-inside">
            <li>Type at least 2 characters in any search field</li>
            <li>Wait for search results to appear (debounced)</li>
            <li>Use arrow keys or mouse to select an option</li>
            <li>Submit the form to see validation in action</li>
            <li>Check the console for API calls and form data</li>
          </ol>
        </div>

        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-900 mb-3">API Endpoints</h3>
          <ul className="space-y-1 text-green-800 font-mono text-sm">
            <li>• Authors: /api/authors/ref?search=xxx</li>
            <li>• Publishers: /api/publishers/ref?search=xxx</li>
            <li>• Subjects: /api/subjects/ref?search=xxx</li>
          </ul>
        </div>
      </div>
    </div>
  );
}