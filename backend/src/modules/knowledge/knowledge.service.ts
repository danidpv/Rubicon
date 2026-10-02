import { Injectable } from '@nestjs/common';
import { db } from '../../database/prisma';
export interface RetrievedSource { sourceId: string; title: string; url: string; locator: string; text: string; }
@Injectable()
export class KnowledgeService {
  async retrieve(query: string, professional: boolean): Promise<RetrievedSource[]> {
    const words = query.toLowerCase().split(/\W+/).filter(w => w.length > 3).slice(0, 8); if (!words.length) return [];
    const now = new Date();
    const chunks = await db.knowledgeChunk.findMany({ where: { source: { status: 'APPROVED', reviewedAt: { not: null }, reviewerId: { not: null }, AND: [{ OR: [{ validFrom: null }, { validFrom: { lte: now } }] }, { OR: [{ validTo: null }, { validTo: { gt: now } }] }], type: { in: professional ? ['OFFICIAL_LAW', 'OFFICIAL_REGULATION', 'MUNICIPAL_ORDINANCE'] : ['OFFICIAL_LAW', 'OFFICIAL_REGULATION', 'MUNICIPAL_ORDINANCE', 'EDITORIAL_THEORY', 'EDITORIAL_SOLUTION'] } }, OR: words.map(word => ({ text: { contains: word, mode: 'insensitive' as const } })) }, include: { source: true }, take: 8 });
    return chunks.map(c => ({ sourceId: c.sourceId, title: c.source.title, url: c.source.url, locator: c.article || c.section, text: c.text.slice(0, 6000) }));
  }
}
