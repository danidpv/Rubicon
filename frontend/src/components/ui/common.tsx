import Link from 'next/link';
import { AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
export function Brand() { return <Link className="brand" href="/"><span className="brand-icon"><ShieldCheck size={23} /></span><span>SP Local <b>IA</b><small>EL CRITERIO SE ENTRENA</small></span></Link>; }
export function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: React.ReactNode }) { return <header className="page-header"><div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h1>{title}</h1>{description && <p className="muted">{description}</p>}</div>{action}</header>; }
export function ErrorNotice({ error }: { error: Error | null | undefined }) { return error ? <div className="notice error" role="alert"><AlertCircle size={18} /><span>{error.message}</span></div> : null; }
export function Loading() { return <p className="loading" role="status">Cargando tu espacio de estudio…</p>; }
export function Empty({ title, description }: { title: string; description: string }) { return <div className="empty"><h3>{title}</h3><p className="muted">{description}</p></div>; }
export function DemoNotice() { return <div className="notice">Contenido de demostración. La revisión jurídica está pendiente; comprueba las fuentes oficiales vigentes.</div>; }
export function ActionLink({ href, children, secondary = false }: { href: string; children: React.ReactNode; secondary?: boolean }) { return <Link className={`button ${secondary ? 'secondary' : ''}`} href={href}>{children}<ArrowRight size={17} /></Link>; }
