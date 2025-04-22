
import {RepairForm} from '@/components/RepairForm';
import {RepairList} from '@/components/RepairList';
import {Analytics} from '@/components/Analytics';

export default function Home() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Phone Repair Tracker</h1>
      <Analytics />
      <RepairForm />
      <RepairList />
    </div>
  );
}


