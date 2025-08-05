// Example: How to use CSS variables in your React components

import React from 'react';

// Example 1: Using CSS variables directly in style prop
export function DirectCSSVariableExample() {
  return (
    <div
      style={{
        backgroundColor: 'var(--color-primary)',
        color: 'var(--color-primary-foreground)',
        padding: '1rem',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--color-border)',
      }}
    >
      This div uses CSS variables directly from :root
    </div>
  );
}

// Example 2: Using CSS variables in CSS modules or styled components
export function StyledComponentExample() {
  return (
    <div className="themed-component">
      <h2 className="themed-title">Themed Title</h2>
      <p className="themed-text">This uses CSS classes with CSS variables</p>
      <button className="themed-button">Themed Button</button>
    </div>
  );
}

// Example 3: Using Tailwind classes (which reference @theme variables)
export function TailwindExample() {
  return (
    <div className="bg-primary text-primary-foreground p-4 rounded-lg border border-border">
      <h2 className="text-lg font-semibold mb-2">Tailwind Example</h2>
      <p className="text-muted-foreground mb-4">
        This uses Tailwind classes that reference your @theme variables
      </p>
      <div className="flex gap-2">
        <div className="bg-success text-success-foreground px-3 py-1 rounded">
          Success
        </div>
        <div className="bg-warning text-warning-foreground px-3 py-1 rounded">
          Warning
        </div>
        <div className="bg-destructive text-destructive-foreground px-3 py-1 rounded">
          Error
        </div>
        <div className="bg-info text-info-foreground px-3 py-1 rounded">
          Info
        </div>
      </div>
    </div>
  );
}

// Example 4: Custom CSS using the variables
// Add this to your CSS file:
/*
.themed-component {
  background: var(--color-card);
  color: var(--color-card-foreground);
  padding: 1.5rem;
  border-radius: var(--radius);
  border: 1px solid var(--color-border);
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.themed-title {
  color: var(--color-primary);
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.themed-text {
  color: var(--color-muted-foreground);
  margin-bottom: 1rem;
}

.themed-button {
  background: var(--color-primary);
  color: var(--color-primary-foreground);
  padding: 0.5rem 1rem;
  border-radius: var(--radius);
  border: none;
  cursor: pointer;
  transition: opacity 0.2s;
}

.themed-button:hover {
  opacity: 0.9;
}

/* Using gradients */
.gradient-bg {
  background: var(--gradient-primary);
}

.hero-gradient {
  background: var(--gradient-hero);
}
*/

// Example 5: Reading CSS variables in JavaScript
export function JSCSSVariableExample() {
  const [primaryColor, setPrimaryColor] = React.useState('');

  React.useEffect(() => {
    // Get CSS variable value in JavaScript
    const root = document.documentElement;
    const primary = getComputedStyle(root).getPropertyValue('--color-primary').trim();
    setPrimaryColor(primary);
  }, []);

  const changePrimaryColor = () => {
    // Dynamically change CSS variable
    const root = document.documentElement;
    const newColor = 'hsl(220, 91%, 45%)'; // Blue
    root.style.setProperty('--color-primary', newColor);
  };

  return (
    <div className="p-4">
      <p>Current primary color: {primaryColor}</p>
      <button 
        onClick={changePrimaryColor}
        className="bg-primary text-primary-foreground px-4 py-2 rounded mt-2"
      >
        Change Primary Color to Blue
      </button>
    </div>
  );
}

// Example 6: Theme-aware component
export function ThemeAwareComponent() {
  return (
    <div className="p-6 space-y-4">
      {/* Card with theme colors */}
      <div className="bg-card text-card-foreground p-4 rounded-lg border border-border shadow-sm">
        <h3 className="text-lg font-semibold text-primary mb-2">Theme Card</h3>
        <p className="text-muted-foreground">
          This card automatically adapts to light and dark themes
        </p>
      </div>

      {/* Status indicators */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <div className="bg-success text-success-foreground p-3 rounded text-center">
          Success
        </div>
        <div className="bg-warning text-warning-foreground p-3 rounded text-center">
          Warning
        </div>
        <div className="bg-destructive text-destructive-foreground p-3 rounded text-center">
          Error
        </div>
        <div className="bg-info text-info-foreground p-3 rounded text-center">
          Info
        </div>
      </div>

      {/* Interactive elements */}
      <div className="flex gap-2">
        <button className="bg-primary text-primary-foreground px-4 py-2 rounded hover:opacity-90">
          Primary Button
        </button>
        <button className="bg-secondary text-secondary-foreground px-4 py-2 rounded hover:opacity-90">
          Secondary Button
        </button>
      </div>
    </div>
  );
}