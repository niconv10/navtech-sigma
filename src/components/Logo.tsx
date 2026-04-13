import { Link } from "react-router-dom";
import logoColor from "@/assets/sigma-logo-color.svg";
import logoWhite from "@/assets/sigma-logo-white.svg";
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

  // variant="light" → light background (landing navbar, auth pages) → color logo
  // variant="dark"  → dark background (sidebar, dark mode) → white logo
  // no variant      → follow theme
  const useDarkBackground = variant ? variant === "dark" : resolvedMode === "dark";
  const logoSrc = useDarkBackground ? logoWhite : logoColor;

  const logoElement = (
    <img
      src={logoSrc}
      alt="SIGMA"
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
