/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "../../libs/ui/components/**/*.{js,ts,jsx,tsx}",
    "../../libs/schema-forms/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    'col-span-1',
    'col-span-2',
    'col-span-4',
    'md:col-span-1',
    'md:col-span-2',
    'md:col-span-4',
    'grid-cols-2',
    'grid-cols-3',
    'grid-cols-4',
    'md:grid-cols-2',
    'md:grid-cols-3',
    'md:grid-cols-4',
    // Switch component classes (default and small sizes)
    'h-6', 'w-11', 'h-5', 'w-5',       // Default switch sizes
    'h-4', 'w-8', 'h-3', 'w-3',        // Small switch sizes
    'translate-x-5', 'translate-x-4', 'translate-x-0',  // Translation distances
    'data-[state=checked]:bg-primary',
    'data-[state=unchecked]:bg-input',
    'data-[state=checked]:translate-x-5',
    'data-[state=checked]:translate-x-4',
    'data-[state=unchecked]:translate-x-0',
    // Layout classes
    'ml-auto',
    'gap-2',
    'whitespace-nowrap',
    'space-x-2',
    // Input component classes
    'h-9',
    'min-w-0',
    'border-input',
    'bg-transparent',
    'px-3',
    'py-1',
    'text-base',
    'md:text-sm',
    'placeholder:text-muted-foreground',
    'focus-visible:border-ring',
    'focus-visible:ring-ring/50',
    'focus-visible:ring-[3px]',
    'aria-invalid:ring-destructive/20',
    'aria-invalid:border-destructive',
    'disabled:opacity-50',
    'disabled:pointer-events-none',
    'disabled:cursor-not-allowed',
    // Guardian mirroring classes
    'bg-muted/70',
    'border-muted-foreground/30',
    'rounded-bl-md',
    'border-l',
    'border-b',
    'z-10',
    // Warning message classes
    'bg-amber-50',
    'border-amber-200',
    'text-amber-600',
    'text-amber-800',
    'mt-0.5',
    'flex-shrink-0',
    // Disabled field styling
    'bg-muted/50',
    'text-muted-foreground',
    'text-muted-foreground/50',
    'opacity-75',
    'border-muted-foreground/40',
    // Loading animations
    'animate-spin'
  ],
  theme: {
    extend: {
      animation: {
        'fadeIn': 'fadeIn 0.5s ease-out',
        'progress': 'progress 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'float-delayed': 'float 8s ease-in-out infinite 2s',
        'spin': 'spin 1s linear infinite',
      },
      keyframes: {
        fadeIn: {
          'from': { opacity: '0', transform: 'translateY(20px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
        progress: {
          '0%': { width: '0%' },
          '50%': { width: '70%' },
          '100%': { width: '100%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        spin: {
          'from': { transform: 'rotate(0deg)' },
          'to': { transform: 'rotate(360deg)' },
        },
      },
    },
  },
}
