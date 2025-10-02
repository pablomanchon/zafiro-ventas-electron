// src/caja/caja.controller.ts
import { Controller, Get, Patch, Body } from '@nestjs/common';
import { CajaService } from './caja.service';

@Controller('caja')
export class CajaController {
  constructor(private readonly cajaService: CajaService) {}

  @Get('saldos')
  async saldos() {
    return this.cajaService.getSaldos();
  }

  @Patch('pesos')
  async setSaldoPesos(@Body() body: { saldo: number }) {
    await this.cajaService.setSaldoPesos(body.saldo);
    return this.cajaService.getSaldos();
  }

  @Patch('usd')
  async setSaldoUsd(@Body() body: { saldo: number }) {
    await this.cajaService.setSaldoUsd(body.saldo);
    return this.cajaService.getSaldos();
  }
}
