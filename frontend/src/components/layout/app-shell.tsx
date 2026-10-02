'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BookOpen, LayoutDashboard, FilePenLine, ClipboardCheck, ChartNoAxesCombined, RotateCcw, Sparkles, MessagesSquare, Library, Settings, LogOut, ShieldCheck, ArrowUpRight } from 'lucide-react';
import { api, post, ApiError } from '../../services/api';
import type { User, Access } from '../../types/api';
import { Brand, Loading, ErrorNotice } from '../ui/common';
const nav = [{ href: '/app', label: 'Mi estudio', icon: LayoutDashboard }, { href: '/app/temario', label: 'Temario práctico', icon: BookOpen }, { href: '/app/supuestos', label: 'Supuestos', icon: FilePenLine }, { href: '/app/examenes', label: 'Exámenes', icon: ClipboardCheck }, { href: '/app/progreso', label: 'Mi evolución', icon: ChartNoAxesCombined }, { href: '/app/errores', label: 'Banco de errores', icon: RotateCcw }, { href: '/app/ia', label: 'Tutor IA', icon: Sparkles }, { href: '/app/manual', label: 'Manual profesional', icon: Library }, { href: '/app/soporte', label: 'Consulta al equipo', icon: MessagesSquare }];
export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname(); const router = useRouter(); const client = useQueryClient();
  const me = useQuery({ queryKey: ['me'], queryFn: () => api<User>('auth/me'), refetchInterval: 60000 });
  const access = useQuery({ queryKey: ['access'], queryFn: () => api<Access>('subscriptions/me'), enabled: !!me.data });
  useEffect(() => { if (me.error instanceof ApiError && me.error.status === 401) router.replace('/login'); }, [me.error, router]);
  if (me.isPending) return <Loading />;
  if (!me.data) return <ErrorNotice error={me.error} />;
  return <div className="app-layout"><a className="skip-link" href="#contenido">Saltar al contenido</a><aside className="sidebar"><Brand /><div className="workspace-label">ESPACIO DE APRENDIZAJE</div><nav aria-label="Estudio">{nav.map(({ href, label, icon: Icon }, i) => <Link key={href} href={href} className={`${path === href || (href !== '/app' && path.startsWith(href)) ? 'active' : ''} ${i === 6 ? 'nav-divider' : ''}`} aria-current={path === href ? 'page' : undefined}><Icon size={19} />{label}</Link>)}{me.data.role !== 'USER' && <Link href="/admin"><ShieldCheck size={19} />Administración</Link>}</nav><div className="sidebar-bottom"><Link href="/app/suscripcion" className="plan-link"><span><small>TU PLAN</small><strong>{access.data?.plan?.name ?? 'Cuenta'}</strong></span><ArrowUpRight size={18} /></Link><Link href="/app/cuenta"><Settings size={17} />Mi cuenta</Link><button onClick={async () => { await post('auth/logout'); client.clear(); router.push('/login'); }}><LogOut size={17} />Cerrar sesión</button></div></aside><div className="app-body"><header className="app-topbar"><div><span className="desktop-only">Preparación de supuestos prácticos</span><span className="mobile-only">SP Local IA</span><span className="top-separator">/</span><span>Andalucía</span></div><Link href="/app/cuenta" className="user-link"><span className="avatar">{me.data.name.slice(0, 1)}</span><span>{me.data.name.split(' ')[0]}</span></Link></header><main id="contenido" className="app-main">{children}</main><footer className="app-footer">Paso a paso. Caso a caso. <span>SP Local IA · Espacio de estudio</span></footer></div></div>;
}
