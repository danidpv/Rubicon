import { CaseWorkspace } from '../../../../features/cases/case-workspace';
export default async function Page({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; return <CaseWorkspace slug={slug} />; }
