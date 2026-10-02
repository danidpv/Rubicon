'use client';
import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, post, patch } from '../../services/api';
import { PageHeader, Loading, ErrorNotice, ActionLink } from '../../components/ui/common';
import type { ContentDetail } from '../study/theory-detail';
import { McqForm } from '../../components/cases/mcq-form';
import { EvaluationView, type McqResult, type CombinedResult } from '../../components/cases/evaluation';
interface ExamAttempt { id: string; status: string; expiresAt: string; serverNow: string; development: string; answers: Record<string, number | null>; snapshot: { title: string; body: string; format: string; data: ContentDetail['data'] }; score: number | null; result: McqResult | CombinedResult | null; }
export function ExamWorkspace({ id, result = false }: { id: string; result?: boolean }) {
  const [attemptId, setAttemptId] = useState(''); const [seconds, setSeconds] = useState(0); const [answers, setAnswers] = useState<Record<string, number | null>>({}); const [development, setDevelopment] = useState(''); const pending = useRef<Promise<unknown>>(Promise.resolve()); const [error, setError] = useState<Error | null>(null); const router = useRouter();
  useEffect(() => { setAttemptId(new URLSearchParams(window.location.search).get('intento') ?? ''); }, []);
  const template = useQuery({ queryKey: ['exam', id], queryFn: () => api<ContentDetail>(`exams/${id}`) });
  const attempt = useQuery({ queryKey: ['exam-attempt', attemptId], queryFn: () => api<ExamAttempt>(`exam-attempts/${attemptId}`), enabled: !!attemptId, refetchInterval: q => ['QUEUED', 'PROCESSING'].includes(q.state.data?.status ?? '') ? 2000 : false });
  useEffect(() => { if (attempt.data) { setAnswers(attempt.data.answers); setDevelopment(attempt.data.development ?? ''); } }, [attempt.data]);
  useEffect(() => { const a = attempt.data; if (!a || a.status !== 'DRAFT') return; const end = Date.now() + new Date(a.expiresAt).getTime() - new Date(a.serverNow).getTime(); const update = () => { const remaining = Math.max(0, Math.ceil((end - Date.now()) / 1000)); setSeconds(remaining); if (!remaining) void attempt.refetch(); }; update(); const timer = setInterval(update, 1000); return () => clearInterval(timer); }, [attempt.data]);
  const start = useMutation({ mutationFn: () => post<{ id: string }>(`exams/${id}/start`), onSuccess: a => { setAttemptId(a.id); router.replace(`/app/examenes/${id}?intento=${a.id}`); } });
  const submit = useMutation({ mutationFn: async () => { await pending.current; if (seconds > 0) await patch(`exam-attempts/${attemptId}/answers`, { answers, development }); await post(`exam-attempts/${attemptId}/submit`); }, onSuccess: async () => { await attempt.refetch(); router.push(`/app/examenes/${id}/resultado?intento=${attemptId}`); } });
  const save = (value: Record<string, number | null>, text = development) => { setAnswers(value); pending.current = pending.current.catch(() => undefined).then(() => patch(`exam-attempts/${attemptId}/answers`, { answers: value, development: text })); pending.current.catch(e => setError(e)); };
  useEffect(() => { if (!attempt.data || attempt.data.status !== 'DRAFT' || development === attempt.data.development) return; const timer = setTimeout(() => save(answers, development), 1000); return () => clearTimeout(timer); }, [development, attempt.data]);
  if (template.isPending) return <Loading />;
  if (!template.data) return <><ErrorNotice error={template.error} /><ActionLink href="/app/suscripcion">Ver mi plan</ActionLink></>;
  const c = template.data; const a = attempt.data;
  if (a && ['QUEUED', 'PROCESSING'].includes(a.status)) return <><PageHeader title={c.title} /><p className="notice" role="status">Examen entregado. Estamos preparando la evaluación de desarrollo.</p></>;
  if (a?.status === 'FAILED') return <p className="notice error">No se ha podido completar la evaluación. Tus respuestas están guardadas. Consulta al equipo.</p>;
  return <><Link href="/app/examenes">← Exámenes</Link><PageHeader eyebrow="SIMULACRO PRÁCTICO · DEMOSTRACIÓN" title={c.title} description="El servidor controla el tiempo. Las soluciones aparecen después de entregar." /><ErrorNotice error={error ?? start.error ?? submit.error ?? attempt.error} />{a?.status === 'COMPLETED' && a.result ? <EvaluationView score={a.score ?? 0} evaluation={a.result} /> : !a ? <section className="panel"><h2>Antes de empezar</h2><p>{c.body}</p><p>{c.minutes} minutos · {c.data.questions.length} preguntas</p>{result ? <p>No hay un intento seleccionado. Abre un examen desde el listado.</p> : <button className="button" onClick={() => start.mutate()} disabled={start.isPending}>Comenzar examen</button>}</section> : <section className="panel"><div className="section-heading"><h2>Tu examen</h2><strong role="timer">{Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}</strong></div><p>{a.snapshot.body}</p><>{a.snapshot.format !== 'MCQ' && <label>Respuesta de desarrollo<textarea className="answer-editor" value={development} onChange={e => setDevelopment(e.target.value)} disabled={seconds === 0 || submit.isPending} maxLength={30000} /></label>}</><McqForm questions={a.snapshot.data.questions} answers={answers} onChange={save} disabled={seconds === 0 || submit.isPending} /><button className="button" onClick={() => submit.mutate()} disabled={submit.isPending}>Entregar examen</button><p className="fine muted" style={{ marginTop: 12 }}>Cada selección se guarda en el servidor.</p></section>}</>;
}
