import { ExamWorkspace } from '../../../../../features/exams/exam-workspace';
export default async function Page({ params }: { params: Promise<{ id: string }> }) { return <ExamWorkspace id={(await params).id} result />; }
