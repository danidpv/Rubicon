'use client';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { api } from '../../services/api';
import type { Plan } from '../../types/api';
import { ErrorNotice, Loading } from '../../components/ui/common';
const labels: Record<string, string> = { TEMARIO_PRACTICO: 'Temario práctico', SUPUESTOS: 'Supuestos, exámenes y corrección', MANUAL_PROFESIONAL: 'Manual profesional' };
export function Plans({ onSelect, busy = false }: { onSelect?: (code: string) => void; busy?: boolean }) { const query = useQuery({ queryKey: ['plans'], queryFn: () => api<Plan[]>('plans') }); return <><ErrorNotice error={query.error} />{query.isPending && <Loading />}<div className="plans-grid">{query.data?.map(p => <article className={`plan ${p.code === 'OPOSITOR' ? 'featured' : ''}`} key={p.id}>{p.code === 'OPOSITOR' && <span className="plan-caption">TEORÍA + PRÁCTICA</span>}<h3>{p.name}</h3><p className="price">{(p.priceCents / 100).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}<small>/ mes</small></p><ul>{(p.modules.length ? p.modules.map(m => labels[m]) : ['Método y fichas de prueba', 'Un desarrollo y tres preguntas', 'Tutor IA limitado y soporte']).map(m => <li key={m}><Check size={16} />{m}</li>)}</ul>{onSelect ? <button className="button secondary" disabled={busy} onClick={() => onSelect(p.code)}>Elegir {p.name}</button> : <Link href="/registro" className="button secondary">Empezar con {p.name}</Link>}</article>)}</div></>; }
