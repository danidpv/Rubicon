import { SupportThread } from '../../../../features/support/support';
export default async function Page({ params }: { params: Promise<{ id: string }> }) { return <SupportThread id={(await params).id} />; }
