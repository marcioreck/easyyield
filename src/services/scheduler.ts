import cron from 'node-cron'
import { createBackup } from './backup'

// Agenda backup diário às 23:00
export function scheduleBackups() {
  cron.schedule('0 23 * * *', async () => {
    console.log('Iniciando backup agendado...')
    try {
      const result = await createBackup()
      if (result.success) {
        console.log(`Backup concluído: ${result.fileName}`)
      } else {
        console.error('Erro no backup:', result.error)
      }
    } catch (error) {
      console.error('Erro ao executar backup:', error)
    }
  })
}