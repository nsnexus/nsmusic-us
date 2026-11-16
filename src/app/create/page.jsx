import { Shell } from '@/components/us/Shell';
import CreateWizard from '@/components/us/CreateWizard';

export const metadata = { title: 'Create your song' };

export default function CreatePage() {
  return (
    <Shell compact>
      <main>
        <CreateWizard />
      </main>
    </Shell>
  );
}
