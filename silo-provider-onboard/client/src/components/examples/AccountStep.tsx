import AccountStep from '../steps/AccountStep';

export default function AccountStepExample() {
  return (
    <div className="p-6 bg-background min-h-screen">
      <AccountStep onNext={(data) => console.log("Next:", data)} />
    </div>
  );
}
