import TierBadge from '../TierBadge';

export default function TierBadgeExample() {
  return (
    <div className="flex flex-wrap gap-3 p-6">
      <TierBadge tier="Preferred" />
      <TierBadge tier="Standard" />
      <TierBadge tier="Probationary" />
    </div>
  );
}
