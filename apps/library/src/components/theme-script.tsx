/**
 * Theme script to prevent FOUC (Flash of Unstyled Content)
 * This runs before React hydrates to set the initial theme
 */
export function ThemeScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          (function() {
            function getSystemTheme() {
              return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            }
            
            function applyTheme(theme) {
              const root = document.documentElement;
              let shouldBeDark;
              
              if (theme === 'system') {
                shouldBeDark = getSystemTheme() === 'dark';
              } else {
                shouldBeDark = theme === 'dark';
              }
              
              if (shouldBeDark) {
                root.classList.add('dark');
              } else {
                root.classList.remove('dark');
              }
            }
            
            // Initialize theme immediately
            try {
              const savedTheme = localStorage.getItem('theme') || 'system';
              applyTheme(savedTheme);
            } catch (e) {
              // Fallback to system preference if localStorage fails
              applyTheme('system');
            }
          })();
        `,
      }}
    />
  );
}