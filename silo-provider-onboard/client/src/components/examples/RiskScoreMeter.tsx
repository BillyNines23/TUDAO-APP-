import RiskScoreMeter from '../RiskScoreMeter';

export default function RiskScoreMeterExample() {
  return (
    <div className="p-6 space-y-6 max-w-md">
      <RiskScoreMeter score={15} />
      <RiskScoreMeter score={45} />
      <RiskScoreMeter score={75} />
    </div>
  );
}
