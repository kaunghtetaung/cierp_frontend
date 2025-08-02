'use client'

import { useState, useEffect } from 'react'

/**
 * Mobile breakpoint in pixels
 * Devices with width below this are considered mobile
 */
const MOBILE_BREAKPOINT = 768

/**
 * Hook to detect if the current viewport is mobile-sized
 * 
 * @returns boolean - true if viewport width is below mobile breakpoint
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const isMobile = useIsMobile()
 *   
 *   return (
 *     <div>
 *       {isMobile ? <MobileNavigation /> : <DesktopNavigation />}
 *     </div>
 *   )
 * }
 * ```
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined)

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    
    // Add listener for media query changes
    mql.addEventListener('change', onChange)
    
    // Set initial value
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    
    // Cleanup listener on unmount
    return () => mql.removeEventListener('change', onChange)
  }, [])

  // Return false during SSR/initial render to prevent hydration mismatch
  return !!isMobile
}

/**
 * Hook to detect viewport size with custom breakpoint
 * 
 * @param breakpoint - Custom breakpoint in pixels (default: 768)
 * @returns boolean - true if viewport width is below the breakpoint
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const isSmall = useMediaQuery(640) // Custom breakpoint
 *   
 *   return (
 *     <div>
 *       {isSmall ? 'Small screen' : 'Large screen'}
 *     </div>
 *   )
 * }
 * ```
 */
export function useMediaQuery(breakpoint: number = MOBILE_BREAKPOINT): boolean {
  const [matches, setMatches] = useState<boolean | undefined>(undefined)

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`)
    
    const onChange = () => {
      setMatches(window.innerWidth < breakpoint)
    }
    
    mql.addEventListener('change', onChange)
    setMatches(window.innerWidth < breakpoint)
    
    return () => mql.removeEventListener('change', onChange)
  }, [breakpoint])

  return !!matches
}