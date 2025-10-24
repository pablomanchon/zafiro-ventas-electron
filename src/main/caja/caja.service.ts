// src/caja/caja.service.ts
import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Caja } from './entities/caja.entity';
import { CajaMoveDetail } from './entities/cajaMove.entity';
import { CajaMoveDetailDto, CajaMoveDto, toDto, toMoveDetailDto } from './dto/caja-move.dto';

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

  async getMoves(): Promise<CajaMoveDetailDto[]> {
    const cajaMoves = await this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(CajaMoveDetail)
      return await repo.find();
    })
    const cajaMovesDto = cajaMoves.map(c => {
      return Number(c.saldoPesos) > 0 ?
        toMoveDetailDto(c, 'pesos') : toMoveDetailDto(c, 'usd')
    })

    return cajaMovesDto;
  }

  async getMoveById(id: number): Promise<CajaMoveDetailDto> {
    const cajaMove = await this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(CajaMoveDetail)
      return await repo.findOne({ where: { id } })
    })
    if (!cajaMove) throw new Error('No se encuentra el movimiento de caja')
    const cajaMoveDto = Number(cajaMove?.saldoPesos) > 0 ?
      toMoveDetailDto(cajaMove, 'pesos') :
      toMoveDetailDto(cajaMove, 'usd')
    return cajaMoveDto;
  }

  async incrementarPesosTx(monto: number, manager: EntityManager) {
    const r = manager.getRepository(Caja);
    const rMove = manager.getRepository(CajaMoveDetail);
    const detail = rMove.create({ saldoPesos: monto.toString(), moveType: 'in' })
    rMove.save(detail)
    const caja = await this.ensureCaja(manager);
    caja.saldoPesos = (Number(caja.saldoPesos) + monto).toFixed(2);
    await r.save(caja);
  }

  async incrementarUsdTx(monto: number, manager: EntityManager) {
    const r = manager.getRepository(Caja);
    const rMove = manager.getRepository(CajaMoveDetail);
    const detail = rMove.create({ saldoUSD: monto.toString(), moveType: 'in' })
    rMove.save(detail)
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

  /** Aumenta el saldo en pesos o USD (según `moneda`) */
  async aumentarSaldo(moneda: 'pesos' | 'usd', monto: number) {
    await this.dataSource.transaction(async (manager) => {
      const caja = await this.ensureCaja(manager);
      if (moneda === 'pesos') {
        caja.saldoPesos == 'NaN' ? caja.saldoPesos = "0" : null
        caja.saldoPesos = (Number(caja.saldoPesos) + monto).toFixed(2);
      } else {
        caja.saldoUSD == 'NaN' ? caja.saldoUSD = "0" : null
        caja.saldoUSD = (Number(caja.saldoUSD) + monto).toFixed(2);
      }
      console.log(caja)
      await manager.save(caja);
    });
  }

  /** Disminuye el saldo en pesos o USD (según `moneda`) */
  async disminuirSaldo(moneda: 'pesos' | 'usd', monto: number) {
    await this.dataSource.transaction(async (manager) => {
      const caja = await this.ensureCaja(manager);

      if (moneda === 'pesos') {
        const nuevoSaldo = Number(caja.saldoPesos) - monto;
        const rMove = manager.getRepository(CajaMoveDetail);
        const detail = rMove.create({ saldoPesos: monto.toString(), moveType: 'out' })
        rMove.save(detail)
        if (nuevoSaldo < 0) {
          throw new BadRequestException('Saldo en pesos insuficiente.');
        }
        caja.saldoPesos = nuevoSaldo.toFixed(2);
      } else {
        const nuevoSaldo = Number(caja.saldoUSD) - monto;
        const rMove = manager.getRepository(CajaMoveDetail);
        const detail = rMove.create({ saldoUSD: monto.toString(), moveType: 'out' })
        rMove.save(detail)
        if (nuevoSaldo < 0) {
          throw new BadRequestException('Saldo en dólares insuficiente.');
        }
        caja.saldoUSD = nuevoSaldo.toFixed(2);
      }

      await manager.save(caja);
    });
  }
}
