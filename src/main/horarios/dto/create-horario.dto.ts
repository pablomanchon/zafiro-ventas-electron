export class CreateHorarioDto {
    vendedorId: number;
    horaIngreso?: Date; 
}

export class MarcarEgresoDto {
    horaEgreso?: Date; 
}