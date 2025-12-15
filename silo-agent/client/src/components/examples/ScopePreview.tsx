import ScopePreview from '../ScopePreview';

export default function ScopePreviewExample() {
  return (
    <ScopePreview
      scope="Replace 5 fence panels and reinforce 3 posts on a 50ft wood fence. Includes debris haul-away."
      onAccept={() => console.log('Scope accepted')}
      onEdit={() => console.log('Edit scope')}
      onStartOver={() => console.log('Start over')}
    />
  );
}
