import { Link } from "react-router-dom";
import logoDark from "@/assets/logo-dark.png";
import logoBlack from "@/assets/logo-black.png";
import { useTheme } from "@/hooks/use-theme";

interface LogoProps {
  /** Force a specific variant regardless of theme */
  variant?: "dark" | "light";
  /** Height of the logo in pixels (default: 40) */
  height?: number;
  /** Whether to show full logo or just symbol */
  showText?: boolean;
  /** Whether to link to home/dashboard */
  linkTo?: string | false;
  /** Additional className */
  className?: string;
}

export function Logo({ 
  variant, 
  height = 40, 
  showText = true, 
  linkTo = "/",
  className = ""
}: LogoProps) {
  const { resolvedMode } = useTheme();
  
  // Use variant prop if provided, otherwise use resolved theme
  // Note: "dark" variant = use dark logo (white text for dark backgrounds)
  // "light" variant = use light logo (dark text for light backgrounds)
  const useDarkLogo = variant ? variant === "dark" : resolvedMode === "dark";
  const logoSrc = useDarkLogo ? logoDark : logoBlack;

  const logoElement = (
    <img 
      src={logoSrc} 
      alt="Sigma" 
      style={{ height: `${height}px`, width: "auto" }}
      className={`object-contain ${className}`}
    />
  );

  if (linkTo === false) {
    return logoElement;
  }

  return (
    <Link to={linkTo} className="flex items-center">
      {logoElement}
    </Link>
  );
}
