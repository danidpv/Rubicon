import { AdminRouter } from '../../../features/admin/admin-router';
export default async function Page({ params }: { params: Promise<{ segments?: string[] }> }) { return <AdminRouter segments={(await params).segments ?? []} />; }
