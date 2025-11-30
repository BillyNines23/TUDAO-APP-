import DocumentUploadCard from '../DocumentUploadCard';

export default function DocumentUploadCardExample() {
  return (
    <div className="p-6 max-w-2xl space-y-4">
      <DocumentUploadCard
        type="EIN"
        label="EIN/IRS Letter"
        description="Official letter from the IRS confirming your EIN"
        required
      />
      <DocumentUploadCard
        type="LICENSE"
        label="Trade License"
        description="State-issued trade license with expiration date"
        required
      />
    </div>
  );
}
