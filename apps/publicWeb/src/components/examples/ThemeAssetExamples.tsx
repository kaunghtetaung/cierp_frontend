/**
 * Theme Asset Usage Examples
 *
 * This file demonstrates various ways to use theme-specific assets.
 * Copy these examples to your components as needed.
 */

import {
  getThemeAsset,
  getSharedAsset,
  getThemeBackground,
  getThemeSvgPattern,
  getAsset
} from '@/lib/theme-assets';

/**
 * Example 1: Simple Image Component
 */
export function LogoExample() {
  return (
    <img
      src={getThemeAsset('images/logos/logo.png')}
      alt="Company Logo"
      className="h-10 w-auto"
    />
  );
}

/**
 * Example 2: Background Image Section
 */
export function HeroWithBackground() {
  return (
    <section
      className="min-h-screen bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: getThemeBackground('backgrounds/hero.jpg') }}
    >
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-white">Welcome</h1>
        <p className="text-xl text-white/90 mt-4">
          Hero section with theme-specific background
        </p>
      </div>
    </section>
  );
}

/**
 * Example 3: SVG Pattern Background
 */
export function PatternSection() {
  return (
    <div
      className="py-12 bg-repeat"
      style={{
        backgroundImage: getThemeSvgPattern('patterns/dots.svg'),
        backgroundSize: '30px 30px'
      }}
    >
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold">Section with Pattern</h2>
        <p>Content with SVG pattern background</p>
      </div>
    </div>
  );
}

/**
 * Example 4: Type-Safe Asset Loading
 */
export function TypeSafeAssets() {
  const heroPath = getAsset('backgrounds', 'hero');
  const logoPath = getAsset('logos', 'main');
  const dotsPattern = getAsset('patterns', 'dots');

  return (
    <div>
      <img src={logoPath} alt="Logo" />
      <div style={{ backgroundImage: `url('${heroPath}')` }}>
        Hero background
      </div>
      <div style={{ backgroundImage: `url('${dotsPattern}')` }}>
        Pattern background
      </div>
    </div>
  );
}

/**
 * Example 5: Shared Assets (Cross-Theme)
 */
export function SharedAssetExample() {
  return (
    <img
      src={getSharedAsset('images/common-icon.png')}
      alt="Common Icon"
      className="w-6 h-6"
    />
  );
}

/**
 * Example 6: Multiple Backgrounds Combined
 */
export function ComplexBackground() {
  return (
    <div
      className="min-h-[400px] bg-cover bg-center relative"
      style={{
        backgroundImage: `
          ${getThemeSvgPattern('patterns/dots.svg')},
          ${getThemeBackground('backgrounds/gradient.jpg')}
        `,
        backgroundBlendMode: 'overlay'
      }}
    >
      <div className="container mx-auto px-4 py-16 relative z-10">
        <h2 className="text-3xl font-bold">Layered Backgrounds</h2>
        <p>SVG pattern over gradient background</p>
      </div>
    </div>
  );
}

/**
 * Example 7: Responsive Logo
 */
export function ResponsiveLogo() {
  const mainLogo = getAsset('logos', 'main');
  const iconLogo = getAsset('logos', 'icon');

  return (
    <div>
      {/* Full logo on desktop */}
      <img
        src={mainLogo}
        alt="Logo"
        className="hidden md:block h-10 w-auto"
      />
      {/* Icon only on mobile */}
      <img
        src={iconLogo}
        alt="Logo"
        className="md:hidden h-10 w-10"
      />
    </div>
  );
}

/**
 * Example 8: Card with Pattern
 */
export function PatternCard() {
  return (
    <div
      className="rounded-lg p-6 shadow-lg bg-white"
      style={{
        backgroundImage: getThemeSvgPattern('patterns/grid.svg'),
        backgroundSize: '40px 40px',
        backgroundPosition: 'top right',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <h3 className="text-xl font-bold mb-2">Card Title</h3>
      <p className="text-gray-600">Card content with subtle pattern</p>
    </div>
  );
}

/**
 * Example 9: Specific Theme Asset
 */
export function SpecificThemeAsset() {
  // Force a specific theme regardless of current theme
  const crystalLogo = getThemeAsset('images/logos/logo.png', 'crystal');
  const defaultLogo = getThemeAsset('images/logos/logo.png', 'default');

  return (
    <div className="flex gap-4">
      <div>
        <p>Default Theme:</p>
        <img src={defaultLogo} alt="Default Logo" className="h-10" />
      </div>
      <div>
        <p>Crystal Theme:</p>
        <img src={crystalLogo} alt="Crystal Logo" className="h-10" />
      </div>
    </div>
  );
}

/**
 * Example 10: Next.js Image Component with Theme Assets
 */
import Image from 'next/image';

export function OptimizedThemeImage() {
  const heroSrc = getThemeAsset('images/backgrounds/hero.jpg');

  return (
    <div className="relative w-full h-[500px]">
      <Image
        src={heroSrc}
        alt="Hero"
        fill
        className="object-cover"
        priority
        sizes="100vw"
      />
      <div className="relative z-10 container mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-white">Optimized Image</h1>
      </div>
    </div>
  );
}
