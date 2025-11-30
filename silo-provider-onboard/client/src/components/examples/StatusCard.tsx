import StatusCard from '../StatusCard';

export default function StatusCardExample() {
  return (
    <div className="p-6 space-y-4 max-w-2xl">
      <StatusCard status="submitted" submittedDate="October 28, 2025" />
      <StatusCard status="approved" tier="Standard" submittedDate="October 28, 2025" reviewedDate="October 30, 2025" />
    </div>
  );
}
