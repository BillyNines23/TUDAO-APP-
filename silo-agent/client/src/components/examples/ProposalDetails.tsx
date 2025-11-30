import ProposalDetails from '../ProposalDetails';

export default function ProposalDetailsExample() {
  return (
    <ProposalDetails
      vendorName="Mike's Fence Works"
      scope="Replace 5 fence panels and reinforce 3 posts on a 50ft wood fence. Includes debris haul-away."
      cost={480}
      timeWindow="Thursday 9AM"
      onSubmit={() => console.log('Request submitted')}
      onBack={() => console.log('Back to vendors')}
    />
  );
}
