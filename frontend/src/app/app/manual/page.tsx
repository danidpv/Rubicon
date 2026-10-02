import Link from 'next/link';
import { ContentList } from '../../../features/study/content-list';
export default function Page() { return <><ContentList section="manual" /><div className="notice"><Link href="/app/manual/consulta">Abrir asistente profesional IA →</Link></div></>; }
