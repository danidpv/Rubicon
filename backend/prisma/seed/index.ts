import { createHash } from 'node:crypto';
import { db } from '../../src/database/prisma';
import { units, questions, rubric } from './content';
const plans = [
  { code: 'GRATIS', name: 'Gratis', priceCents: 0, modules: [] },
  { code: 'TEMARIO', name: 'Temario práctico', priceCents: 1490, modules: ['TEMARIO_PRACTICO'] },
  { code: 'SUPUESTOS', name: 'Supuestos', priceCents: 1990, modules: ['SUPUESTOS'] },
  { code: 'MANUAL', name: 'Manual profesional', priceCents: 990, modules: ['MANUAL_PROFESIONAL'] },
  { code: 'OPOSITOR', name: 'Pack Opositor', priceCents: 2790, modules: ['TEMARIO_PRACTICO', 'SUPUESTOS'] },
  { code: 'FORMACION_MANUAL', name: 'Formación + Manual', priceCents: 2190, modules: ['TEMARIO_PRACTICO', 'MANUAL_PROFESIONAL'] },
  { code: 'TOTAL', name: 'Total', priceCents: 3290, modules: ['TEMARIO_PRACTICO', 'SUPUESTOS', 'MANUAL_PROFESIONAL'] }
];
async function seed() {
  for (const p of plans) await db.plan.upsert({ where: { code: p.code }, update: {}, create: p });
  const sources = [ ['LO 4/2015', 'BOE-A-2015-3442'], ['RDL 6/2015', 'BOE-A-2015-11722'], ['RDL 8/2004', 'BOE-A-2004-18911'], ['LO 2/1986', 'BOE-A-1986-6859'], ['Ley de Enjuiciamiento Criminal', 'BOE-A-1882-6036'] ];
  for (const [title, reference] of sources) await db.knowledgeSource.upsert({ where: { reference }, update: {}, create: { title, reference, url: `https://www.boe.es/buscar/act.php?id=${reference}`, type: 'OFFICIAL_LAW', authority: 'BOE', jurisdiction: 'España', status: 'REVIEW', checksum: createHash('sha256').update(reference).digest('hex'), body: 'Referencia demo. Texto y vigencia pendientes de revisión editorial.' } });
  for (const [i, unit] of units.entries()) {
    await db.content.upsert({ where: { slug: unit.slug }, update: {}, create: { ...unit, kind: 'THEORY', free: i < 2, status: 'PUBLISHED', data: {}, sourceAttribution: 'Contenido pedagógico original basado en el HTML V3 aportado por el usuario.' } });
    if (i > 0) await db.content.upsert({ where: { slug: `manual-${unit.slug}` }, update: {}, create: { ...unit, slug: `manual-${unit.slug}`, kind: 'MANUAL', status: 'PUBLISHED', data: { checklist: ['Verificar fuente y vigencia.', 'Comprobar ámbito y competencia.', 'Documentar hechos y límites.'] }, sourceAttribution: 'Ficha demo original. No es un protocolo oficial.' } });
  }
  const cases = [
    ['persona-sin-documentacion', 'Persona sin documentación', 'SEGURIDAD_CIUDADANA', 'Durante una intervención por una posible infracción en vía pública, una persona manifiesta que no porta documentación. Las comprobaciones iniciales no permiten determinar su identidad. Explica qué hechos necesitas valorar, la actuación que propones, sus fundamentos, límites y documentación.', 'identificacion'],
    ['turismo-sin-seguro', 'Turismo sin seguro', 'TRAFICO', 'Durante un control en vía urbana, una consulta indica que un turismo no tiene seguro obligatorio vigente. Explica qué comprobarías y cómo diferenciarías obligación, medidas, consecuencias y competencia sancionadora.', 'vehiculo-sin-seguro'],
    ['colision-urbana', 'Siniestro en casco urbano', 'TRAFICO', 'Se produce una colisión en casco urbano con daños y una persona lesionada. Ordena la respuesta, justifica la competencia funcional y explica qué aspectos documentales destacarías.', 'siniestro-vial']
  ];
  for (const [i, [slug, title, category, body, theorySlug]] of cases.entries()) await db.content.upsert({ where: { slug }, update: {}, create: { slug, title, category, body, summary: 'Supuesto original de desarrollo · respuesta razonada y corrección por competencias.', kind: 'CASE', status: 'PUBLISHED', minutes: 25, free: i === 0, data: { rubric, theorySlug, modelAnswer: 'Organiza la respuesta en hechos, fundamento verificado, competencia, procedimiento, garantías y documentación. Expresa los límites de la información disponible.' }, sourceAttribution: 'Enunciado original de la demo HTML V3 aportada.' } });
  await db.content.upsert({ where: { slug: 'metodo-tipo-test' }, update: {}, create: { slug: 'metodo-tipo-test', title: 'Decisiones que construyen una buena respuesta', summary: 'Un mismo contexto práctico, ocho preguntas sobre método.', category: 'METODO', body: 'Estás redactando un supuesto con datos observados, manifestaciones de terceros y una norma municipal pendiente de localizar. Decide cómo construir una respuesta rigurosa.', kind: 'CASE', format: 'MCQ', status: 'PUBLISHED', free: true, data: { questions, theorySlug: 'metodo-universal' }, sourceAttribution: 'Preguntas pedagógicas originales.' } });
  for (let i = 0; i < 2; i++) await db.content.upsert({ where: { slug: `examen-metodo-${i + 1}` }, update: {}, create: { slug: `examen-metodo-${i + 1}`, title: i === 0 ? 'Simulacro práctico · Método y criterio' : 'Simulacro práctico · Revisión de la actuación', summary: 'Examen original de demostración, sin asociación a una convocatoria oficial.', body: 'Responde sin consultar material. Las respuestas incorrectas penalizan 0,25 puntos sobre el valor de un acierto. Las preguntas en blanco no penalizan.', kind: 'EXAM', format: 'MCQ', category: 'METODO', minutes: 15, status: 'PUBLISHED', data: { questions: i === 0 ? questions : [...questions].reverse(), penalty: 0.25, passScore: 50 }, sourceAttribution: 'Simulacro original; no reproduce un examen oficial.' } });
  const all = await db.content.findMany();
  for (const content of all) {
    const reference = /identifica|documentacion/.test(content.slug) ? 'BOE-A-2015-3442' : /seguro/.test(content.slug) ? 'BOE-A-2004-18911' : /siniestro|colision/.test(content.slug) ? 'BOE-A-1986-6859' : /atestado/.test(content.slug) ? 'BOE-A-1882-6036' : null;
    if (reference) { const source = await db.knowledgeSource.findUniqueOrThrow({ where: { reference } }); await db.contentSource.upsert({ where: { contentId_sourceId: { contentId: content.id, sourceId: source.id } }, update: {}, create: { contentId: content.id, sourceId: source.id } }); }
  }
  for (const c of all) await db.contentRevision.upsert({ where: { contentId_version: { contentId: c.id, version: c.version } }, update: {}, create: { contentId: c.id, version: c.version, snapshot: JSON.parse(JSON.stringify(c)) } });
  process.stdout.write('Seed reproducible completado. No se han creado usuarios ni contraseñas.\n');
}
seed().finally(() => db.$disconnect());
