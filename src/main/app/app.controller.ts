import { Controller, Get } from '@nestjs/common'
import { BackupImportService } from '../importer/backup-import.service'

@Controller('app')
export class AppController {
  constructor(private readonly backupImportService: BackupImportService) {}

  @Get('import-backup')
  async transformData() {
    const baseDir = 'C:/Users/PabloM/Desktop/Programacion/Zafiro-Stock-y-Ventas/public'
    // 👆 usá SIEMPRE / en Windows para evitar escapes

    const result = await this.backupImportService.importAll(baseDir)

    return { message: 'Importación finalizada', result }
  }
}
