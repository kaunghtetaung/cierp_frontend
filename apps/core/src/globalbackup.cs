
@custom-variant dark (&:is(.dark *));

/* Base styles - Set default text color at root level */
:root {

  --sidebar-width: 16rem;
  --sidebar-width-mobile: 18rem;
  --sidebar-width-icon: 3rem;
  --sidebar: hsl(0 0% 98%);
  --sidebar-foreground: hsl(240 5.3% 26.1%);
  --sidebar-primary: hsl(240 5.9% 10%);
  --sidebar-primary-foreground: hsl(0 0% 98%);
  --sidebar-accent: hsl(240 4.8% 95.9%);
  --sidebar-accent-foreground: hsl(240 5.9% 10%);
  --sidebar-border: hsl(220 13% 91%);
  --sidebar-ring: hsl(217.2 91.2% 59.8%);

}

* {
  border-color: theme(colors.border);
}

body {
  color: theme(colors.foreground);
  background: theme(colors.background);
  font-feature-settings: "rlig" 1, "calt" 1;
}

@theme {
  /* Catalyst Light theme - using Tailwind zinc palette */
  --color-background: hsl(0 0% 100%);
  --color-foreground: hsl(240 10% 3.9%);
  --color-card: hsl(0 0% 100%);
  --color-card-foreground: hsl(240 10% 3.9%);
  --color-popover: hsl(0 0% 100%);
  --color-popover-foreground: hsl(240 10% 3.9%);
  --color-primary: hsl(240 5.9% 10%);
  --color-primary-foreground: hsl(0 0% 98%);
  --color-secondary: hsl(240 4.8% 95.9%);
  --color-secondary-foreground: hsl(240 5.9% 10%);
  --color-muted: hsl(240 4.8% 95.9%);
  --color-muted-foreground: hsl(240 3.8% 46.1%);
  --color-accent: hsl(240 4.8% 95.9%);
  --color-accent-foreground: hsl(240 5.9% 10%);
  --color-destructive: hsl(0 84.2% 60.2%);
  --color-destructive-foreground: hsl(0 0% 98%);
  --color-success: hsl(142.1 76.2% 36.3%);
  --color-success-foreground: hsl(0 0% 98%);
  --color-warning: hsl(32.1 94.6% 43.7%);
  --color-warning-foreground: hsl(0 0% 98%);
  --color-info: hsl(221.2 83.2% 53.3%);
  --color-info-foreground: hsl(0 0% 98%);
  --color-border: hsl(240 5.9% 90%);
  --color-input: hsl(240 5.9% 90%);
  --color-ring: hsl(240 5.9% 10%);
  --color-danger: hsl(0 84.2% 60.2%);

  /* Catalyst Light theme - Sidebar variables */
  --color-sidebar: hsl(0 0% 100%);
  --color-sidebar-foreground: hsl(240 10% 3.9%);
  --color-sidebar-primary: hsl(240 5.9% 10%);
  --color-sidebar-primary-foreground: hsl(0 0% 98%);
  --color-sidebar-accent: hsl(240 4.8% 95.9%);
  --color-sidebar-accent-foreground: hsl(240 5.9% 10%);
  --color-sidebar-border: hsl(240 5.9% 90%);
  --color-sidebar-ring: hsl(240 5.9% 10%);

  /* Border radius */
  --radius: 0.5rem;
 ;
 /* Default sidebar width */
  /* Catalyst gradients */
  --gradient-primary: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  --gradient-secondary: linear-gradient(135deg, var(--color-secondary), var(--color-muted));
  --gradient-success: linear-gradient(135deg, var(--color-success), var(--color-info));
  --gradient-warm: linear-gradient(135deg, var(--color-warning), var(--color-accent));
  --gradient-cool: linear-gradient(135deg, var(--color-info), var(--color-primary));
  --gradient-hero: radial-gradient(ellipse at top, var(--color-primary), var(--color-accent));
}

/* Catalyst Dark theme - Primary colors */
.dark {
  --color-background: hsl(240, 52%, 9%);
  --color-foreground: hsl(0 0% 98%);
  --color-card: hsl(240 10% 3.9%);
  --color-card-foreground: hsl(0 0% 98%);
  --color-popover: hsl(240 10% 3.9%);
  --color-popover-foreground: hsl(0 0% 98%);
  --color-primary: hsl(0 0% 98%);
  --color-primary-foreground: hsl(240 5.9% 10%);
  --color-secondary: hsl(240 3.7% 15.9%);
  --color-secondary-foreground: hsl(0 0% 98%);
  --color-muted: hsl(240 3.7% 15.9%);
  --color-muted-foreground: hsl(240 5% 64.9%);
  --color-accent: hsl(240 3.7% 15.9%);
  --color-accent-foreground: hsl(0 0% 98%);
  --color-destructive: hsl(0 62.8% 30.6%);
  --color-destructive-foreground: hsl(0 0% 98%);
  --color-border: hsl(240 3.7% 15.9%);
  --color-input: hsl(240 3.7% 15.9%);
  --color-ring: hsl(240 4.9% 83.9%);

  /* Catalyst Sidebar dark theme */
  --color-sidebar: hsl(240, 56%, 29%);
  --color-sidebar-foreground: hsl(0 0% 98%);
  --color-sidebar-primary: hsl(240 5.9% 10%);
  --color-sidebar-primary-foreground: hsl(0 0% 98%);
  --color-sidebar-accent: hsl(240 3.7% 15.9%);
  --color-sidebar-accent-foreground: hsl(0 0% 98%);
  --color-sidebar-border: hsl(240 3.7% 15.9%);
  --color-sidebar-ring: hsl(240 4.9% 83.9%);
  --sidebar: hsl(240 5.9% 10%);
  --sidebar-foreground: hsl(240 4.8% 95.9%);
  --sidebar-primary: hsl(224.3 76.3% 48%);
  --sidebar-primary-foreground: hsl(0 0% 100%);
  --sidebar-accent: hsl(240 3.7% 15.9%);
  --sidebar-accent-foreground: hsl(240 4.8% 95.9%);
  --sidebar-border: hsl(240 3.7% 15.9%);
  --sidebar-ring: hsl(217.2 91.2% 59.8%);
}

/* Gradient utility classes */
.bg-gradient-primary {
  background: var(--gradient-primary);
}

.bg-gradient-secondary {
  background: var(--gradient-secondary);
}

.bg-gradient-success {
  background: var(--gradient-success);
}

.bg-gradient-warm {
  background: var(--gradient-warm);
}

.bg-gradient-cool {
  background: var(--gradient-cool);
}

.bg-gradient-hero {
  background: var(--gradient-hero);
}

@theme inline {

  --color-sidebar: var(--sidebar);

  --color-sidebar-foreground: var(--sidebar-foreground);

  --color-sidebar-primary: var(--sidebar-primary);

  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);

  --color-sidebar-accent: var(--sidebar-accent);

  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);

  --color-sidebar-border: var(--sidebar-border);

  --color-sidebar-ring: var(--sidebar-ring);

}

@layer base {
  * {
    @apply border-border outline-ring/50;

  }
  body {
    @apply bg-background text-foreground;

  }

}
