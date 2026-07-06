import { cn } from "@/lib/utils";
import fitTrackLogo from "../../images/Vernex FitTrack Logo.png";
import vernexLogo from "../../images/Vernex logogo.jpg.png";

interface BrandLogoProps {
  kind?: "fittrack" | "vernex";
  className?: string;
}

const BrandLogo = ({ kind = "fittrack", className }: BrandLogoProps) => (
  <img
    src={kind === "fittrack" ? fitTrackLogo : vernexLogo}
    alt={kind === "fittrack" ? "FitTrack" : "VERNEX"}
    className={cn(
      "block object-contain",
      kind === "fittrack" && "scale-[1.18]",
      className,
    )}
  />
);

export default BrandLogo;
