import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('lugares.db');

export type Lugar = {
  id: number;
  nombre: string;
  latitud: number;
  longitud: number;
  foto: string | null;
};

export function initDatabase(): void {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS lugares (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      latitud REAL NOT NULL,
      longitud REAL NOT NULL,
      foto TEXT
    );
  `);
  try {
    db.execSync('ALTER TABLE lugares ADD COLUMN foto TEXT;');
  } catch {
    // columna ya existe
  }
}

export function insertLugar(nombre: string, latitud: number, longitud: number, foto: string | null = null): void {
  db.runSync(
    'INSERT INTO lugares (nombre, latitud, longitud, foto) VALUES (?, ?, ?, ?)',
    nombre, latitud, longitud, foto
  );
}

export function updateFoto(id: number, foto: string | null): void {
  db.runSync('UPDATE lugares SET foto = ? WHERE id = ?', foto, id);
}

export function getLugares(): Lugar[] {
  return db.getAllSync<Lugar>('SELECT * FROM lugares ORDER BY id DESC');
}

export function deleteLugar(id: number): void {
  db.runSync('DELETE FROM lugares WHERE id = ?', id);
}
