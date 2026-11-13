import { exportBackup } from './backup';
import { diaryToday } from './dates';
import { setMeta } from './db';
import { download } from './download';

/** Downloads a backup file and remembers when, for the reminder. */
export async function downloadBackup() {
  download(await exportBackup(), `daymark-backup-${diaryToday()}.json`);
  await setMeta('lastBackup', Date.now());
}
