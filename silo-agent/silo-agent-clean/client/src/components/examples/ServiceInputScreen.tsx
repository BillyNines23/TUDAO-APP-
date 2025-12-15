import ServiceInputScreen from '../ServiceInputScreen';

export default function ServiceInputScreenExample() {
  return (
    <ServiceInputScreen
      onSubmit={(desc) => console.log('Submitted:', desc)}
      isProcessing={false}
    />
  );
}
