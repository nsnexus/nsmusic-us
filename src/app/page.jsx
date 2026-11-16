import { Shell } from '@/components/us/Shell';
import CreateWizard from '@/components/us/CreateWizard';

// Igual ao site brasileiro: a página inicial já é o passo a passo de criação.
// A apresentação completa da marca fica em /how-it-works.
export default function Home() {
  return (
    <Shell compact>
      <main>
        <CreateWizard />
      </main>
    </Shell>
  );
}
