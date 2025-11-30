interface RiskScoreMeterProps {
  score: number;
  className?: string;
}

export default function RiskScoreMeter({ score, className }: RiskScoreMeterProps) {
  const getColor = (score: number) => {
    if (score <= 20) return { bg: "bg-green-500", text: "text-green-600" };
    if (score <= 60) return { bg: "bg-amber-500", text: "text-amber-600" };
    return { bg: "bg-red-500", text: "text-red-600" };
  };

  const getLabel = (score: number) => {
    if (score <= 20) return "Low Risk";
    if (score <= 60) return "Medium Risk";
    return "High Risk";
  };

  const color = getColor(score);

  return (
    <div className={className} data-testid="risk-score-meter">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">Risk Score</span>
        <span className={`text-sm font-semibold ${color.text}`}>{getLabel(score)}</span>
      </div>
      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
        <div className="absolute inset-0 flex">
          <div className="w-[20%] border-r border-background" />
          <div className="w-[40%] border-r border-background" />
          <div className="w-[40%]" />
        </div>
        <div
          className={`absolute top-0 left-0 h-full ${color.bg} transition-all duration-500`}
          style={{ width: `${score}%` }}
        />
      </div>
      <div className="flex justify-between mt-1 text-xs text-muted-foreground">
        <span>0</span>
        <span>20</span>
        <span>60</span>
        <span>100</span>
      </div>
      <div className="mt-2 text-right">
        <span className="text-2xl font-bold" data-testid="text-risk-score">{score}</span>
        <span className="text-muted-foreground">/100</span>
      </div>
    </div>
  );
}
