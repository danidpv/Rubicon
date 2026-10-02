import { PublicShell } from '../../components/layout/public-shell';
import { PageHeader } from '../../components/ui/common';
import { Plans } from '../../features/billing/plans';
export default function Page() { return <PublicShell><div className="public-section"><PageHeader eyebrow="TU PREPARACIÓN, A TU MEDIDA" title="Elige lo que necesitas." description="Planes de demostración. La facturación local permite probar el acceso sin realizar cobros." /><Plans /></div></PublicShell>; }
