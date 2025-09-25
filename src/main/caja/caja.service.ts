// src/caja/caja.service.ts
import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Caja } from './entities/caja.entity';

@Injectable()
export class CajaService {
  private repo: Repository<Caja>;

  constructor(private readonly dataSource: DataSource) {
    this.repo = this.dataSource.getRepository(Caja);
  }

  private async ensureCaja(manager?: EntityManager): Promise<Caja> {
    const r = manager ? manager.getRepository(Caja) : this.repo;
    let caja = await r.findOne({ where: { id: 'main' } });
    if (!caja) {
      caja = r.create({ id: 'main', saldoPesos: '0', saldoUSD: '0' });
      await r.save(caja);
    }
    return caja;
  }

  async getSaldos(): Promise<{ pesos: number; usd: number }> {
    const caja = await this.ensureCaja();
    return {
      pesos: Number(caja.saldoPesos || 0),
      usd: Number(caja.saldoUSD || 0),
    };
  }

  async incrementarPesosTx(monto: number, manager: EntityManager) {
    const r = manager.getRepository(Caja);
    const caja = await this.ensureCaja(manager);
    caja.saldoPesos = (Number(caja.saldoPesos) + monto).toFixed(2);
    await r.save(caja);
  }

  async incrementarUsdTx(monto: number, manager: EntityManager) {
    const r = manager.getRepository(Caja);
    const caja = await this.ensureCaja(manager);
    caja.saldoUSD = (Number(caja.saldoUSD) + monto).toFixed(2);
    await r.save(caja);
  }

  async setSaldoPesos(newSaldo: number) {
    await this.dataSource.transaction(async (manager) => {
      const caja = await this.ensureCaja(manager);
      caja.saldoPesos = Number(newSaldo).toFixed(2);
      await manager.save(caja);
    });
  }

  async setSaldoUsd(newSaldo: number) {
    await this.dataSource.transaction(async (manager) => {
      const caja = await this.ensureCaja(manager);
      caja.saldoUSD = Number(newSaldo).toFixed(2);
      await manager.save(caja);
    });
  }
}
