import { TheoryDetail } from '../../../../features/study/theory-detail';
export default async function Page({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; return <TheoryDetail slug={slug} />; }
