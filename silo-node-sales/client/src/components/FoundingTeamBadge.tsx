import architectBadge from "@assets/badge-architect.png";
import regentBadge from "@assets/badge-regent.png";
import councilorBadge from "@assets/badge-councilor.png";
import guardianBadge from "@assets/badge-guardian.png";
import oracleBadge from "@assets/badge-oracle.png";

interface FoundingTeamBadgeProps {
  role: "Architect" | "Regent" | "Councilor" | "Guardian" | "Oracle";
  size?: "sm" | "md" | "lg";
}

const badgeImages = {
  Architect: architectBadge,
  Regent: regentBadge,
  Councilor: councilorBadge,
  Guardian: guardianBadge,
  Oracle: oracleBadge,
};

export function FoundingTeamBadge({ role, size = "md" }: FoundingTeamBadgeProps) {
  const sizeClasses = {
    sm: "h-8",
    md: "h-10",
    lg: "h-12",
  };

  return (
    <div className="inline-flex items-center">
      <img
        src={badgeImages[role]}
        alt={`${role} Founding Team Badge`}
        className={`${sizeClasses[size]} w-auto`}
        data-testid={`badge-founding-${role.toLowerCase()}`}
      />
    </div>
  );
}
