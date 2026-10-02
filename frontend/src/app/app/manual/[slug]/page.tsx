import { TheoryDetail } from '../../../../features/study/theory-detail';
export default async function Page({ params }: { params: Promise<{ slug: string }> }) { return <TheoryDetail slug={(await params).slug} manual />; }
