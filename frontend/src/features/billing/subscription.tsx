'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, post } from '../../services/api';
import type { Access } from '../../types/api';
import { PageHeader, ErrorNotice } from '../../components/ui/common';
import { Plans } from './plans';
export function Subscription() {
  const client = useQueryClient(); const access = useQuery({ queryKey: ['access'], queryFn: () => api<Access>('subscriptions/me') });
  const checkout = useMutation({ mutationFn: (planCode: string) => post<{ url: string; mock: boolean }>('subscriptions/checkout', { planCode }), onSuccess: r => { if (r.mock) client.invalidateQueries(); else window.location.assign(r.url); } });
  const portal = useMutation({ mutationFn: () => post<{ url: string; mock: boolean }>('subscriptions/portal'), onSuccess: r => { if (!r.mock) window.location.assign(r.url); } });
  return <><PageHeader eyebrow="TU ACCESO A LA PLATAFORMA" title="Mi suscripción" description={`Plan actual: ${access.data?.plan?.name ?? 'Cargando…'} · ${access.data?.status ?? ''}`} action={access.data?.provider === 'stripe' && <button className="button secondary" onClick={() => portal.mutate()} disabled={portal.isPending}>Gestionar facturación</button>} /><ErrorNotice error={checkout.error ?? access.error ?? portal.error} />{access.data?.provider === 'mock' && <p className="notice">Modo de demostración. Puedes cambiar de plan para probar los permisos; no se realiza ningún cobro. Tu historial se conserva.</p>}{checkout.isSuccess && checkout.data.mock && <p className="notice success" role="status">Plan actualizado. Los accesos ya están disponibles según el plan elegido.</p>}<Plans onSelect={code => checkout.mutate(code)} busy={checkout.isPending} /></>;
}
