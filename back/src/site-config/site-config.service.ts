import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma.service'

@Injectable()
export class SiteConfigService {
  constructor(private prisma: PrismaService) {}

  async getAll(): Promise<Record<string, string>> {
    const rows = await this.prisma.siteConfig.findMany()
    return Object.fromEntries(rows.map(r => [r.key, r.value]))
  }

  async patch(data: Record<string, string>): Promise<Record<string, string>> {
    await Promise.all(
      Object.entries(data).map(([key, value]) =>
        this.prisma.siteConfig.upsert({
          where: { key },
          update: { value },
          create: { key, value },
        }),
      ),
    )
    return this.getAll()
  }
}
