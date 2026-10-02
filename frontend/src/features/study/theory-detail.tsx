'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import Link from 'next/link';
import { api, post } from '../../services/api';
import type { ContentSummary } from '../../types/api';
import { DemoNotice, PageHeader, ErrorNotice, Loading, ActionLink } from '../../components/ui/common';
export interface ContentDetail extends ContentSummary { body: string; completed: boolean; data: { checklist: string[]; theorySlug?: string; questions: { id: string; prompt: string; options: string[] }[] }; sources: { source: { id: string; title: string; url: string; status: string } }[]; }
export function TheoryDetail({ slug, manual = false }: { slug: string; manual?: boolean }) {
  const client = useQueryClient(); const endpoint = manual ? 'manual' : 'theory';
  const query = useQuery({ queryKey: [endpoint, slug], queryFn: () => api<ContentDetail>(`${endpoint}/${slug}`) });
  const complete = useMutation({ mutationFn: () => post(`theory/${slug}/complete`), onSuccess: () => client.invalidateQueries({ queryKey: [endpoint, slug] }) });
  if (query.isPending) return <Loading />;
  if (!query.data) return <><ErrorNotice error={query.error} /><ActionLink href="/app/suscripcion">Ver mi plan</ActionLink></>;
  const c = query.data;
  return <><Link href={manual ? '/app/manual' : '/app/temario'}>← Volver al listado</Link><PageHeader eyebrow={manual ? 'CONSULTA PROFESIONAL · FICHA DEMO' : 'TEORÍA APLICADA'} title={c.title} description={`${c.minutes} min de lectura · Versión ${c.version}`} /><DemoNotice /><div className="two-columns"><article className="panel prose"><ReactMarkdown>{c.body}</ReactMarkdown>{manual && <><h2>Lista de comprobación demo</h2>{c.data.checklist.map(item => <label className="check" key={item}><input type="checkbox" />{item}</label>)}<p className="notice">Consultar instrucciones y protocolos internos vigentes del cuerpo cuando corresponda.</p></>}</article><aside className="stack"><section className="panel"><h2>{manual ? 'Fuentes y alcance' : 'De la teoría a la práctica'}</h2><p className="muted">{c.summary}</p>{!manual && <><button className="button" onClick={() => complete.mutate()} disabled={complete.isPending || c.completed}>{c.completed ? 'Ficha estudiada ✓' : 'Marcar como estudiada'}</button><ErrorNotice error={complete.error} /><div style={{ marginTop: 18 }}><ActionLink href="/app/supuestos" secondary>Practicar un supuesto</ActionLink></div></>}{c.sources.map(({ source }) => <p key={source.id}><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a><small className="muted"> · {source.status}</small></p>)}</section><section className="panel"><h3>Una duda concreta, un paso adelante</h3><p className="muted">Consulta el método con el Tutor IA o envía tu pregunta al equipo.</p><Link href="/app/soporte">Consulta al equipo →</Link></section></aside></div></>;
}
