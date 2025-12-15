import ChooseActionScreen from '../ChooseActionScreen';

export default function ChooseActionScreenExample() {
  return (
    <ChooseActionScreen
      onRequestService={() => console.log('Request Service clicked')}
      onBecomeProvider={() => console.log('Become Provider clicked')}
    />
  );
}
