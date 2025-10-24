// src/caja/caja.controller.ts
import { Controller, Get, Post, Patch, Body, Param } from '@nestjs/common';
import { CajaService } from './caja.service';

type Moneda = 'pesos' | 'usd';
type MontoBody = { moneda: Moneda; monto: number };

@Controller('caja')
export class CajaController {
  constructor(private readonly cajaService: CajaService) {}

  @Get('saldos')
  async saldos() {
    return this.cajaService.getSaldos();
  }

  @Get('moves')
  async moves() {
    return this.cajaService.getMoves();
  }

   @Get('moves/:id')
    findOne(@Param('id') id: number) {
      return this.cajaService.getMoveById(id);
    }

  // Operación NO idempotente → POST
  @Post('ingresar')
  async ingresar(@Body() body: MontoBody) {
    const moneda = body.moneda;
    const monto = Number(body.monto);
    return this.cajaService.aumentarSaldo(moneda, monto);
  }

  // Operación NO idempotente → POST
  @Post('disminuir')
  async disminuir(@Body() body: MontoBody) {
    const moneda = body.moneda;
    const monto = Number(body.monto);
    return this.cajaService.disminuirSaldo(moneda, monto); // lanza 400 si queda negativo
  }

  // Setters directos de saldo (idempotentes) → PATCH está bien
  @Patch('pesos')
  async setSaldoPesos(@Body() body: { saldo: number }) {
    await this.cajaService.setSaldoPesos(Number(body.saldo));
    return this.cajaService.getSaldos();
  }

  @Patch('usd')
  async setSaldoUsd(@Body() body: { saldo: number }) {
    await this.cajaService.setSaldoUsd(Number(body.saldo));
    return this.cajaService.getSaldos();
  }
}
