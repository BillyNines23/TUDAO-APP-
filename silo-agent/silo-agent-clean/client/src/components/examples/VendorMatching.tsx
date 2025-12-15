import VendorMatching from '../VendorMatching';

const sampleVendors = [
  {
    id: "1",
    name: "Mike's Fence Works",
    rating: 4.9,
    reviewCount: 127,
    pastJobs: "Completed 45+ fence installations and repairs. Specializes in wood and vinyl fencing.",
    priceRange: 2,
    verified: true
  },
  {
    id: "2",
    name: "ProFence Solutions",
    rating: 4.8,
    reviewCount: 89,
    pastJobs: "Expert in commercial and residential fencing. 10+ years experience with all fence types.",
    priceRange: 3,
    verified: true
  },
  {
    id: "3",
    name: "Budget Fence Repair",
    rating: 4.7,
    reviewCount: 156,
    pastJobs: "Fast, affordable fence repairs. Over 200 completed jobs in your area.",
    priceRange: 1,
    verified: true
  },
  {
    id: "4",
    name: "Elite Fencing Co.",
    rating: 4.9,
    reviewCount: 203,
    pastJobs: "Premium fence installation and repair. Licensed and insured with 15+ years experience.",
    priceRange: 3,
    verified: true
  }
];

export default function VendorMatchingExample() {
  return (
    <VendorMatching
      vendors={sampleVendors}
      onSelectVendor={(id) => console.log('Selected vendor:', id)}
    />
  );
}
