import * as React from "react"

/**
 * Custom hook for tracking media query matches.
 * @param query The media query string (e.g., "(min-width: 768px)")
 * @returns Boolean indicating if the media query matches.
 */
export function useMediaQuery(query: string): boolean {
  const [value, setValue] = React.useState<boolean>(false)

  React.useEffect(() => {
    function onChange(event: MediaQueryListEvent) {
      setValue(event.matches)
    }

    // Ensure window is defined (for SSR compatibility)
    if (typeof window === "undefined") {
      return;
    }

    const result = matchMedia(query)
    // Set initial value
    setValue(result.matches);
    // Add listener for changes
    result.addEventListener("change", onChange)

    // Cleanup listener on unmount
    return () => result.removeEventListener("change", onChange)
  }, [query])

  return value
} 