import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('lugares.db');

export type Lugar = {
  id: number;
  nombre: string;
  latitud: number;
  longitud: number;
  foto: string | null;
  favorito: number; // 1 = favorito, 0 = normal
};

export function initDatabase(): void {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS lugares (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      latitud REAL NOT NULL,
      longitud REAL NOT NULL,
      foto TEXT,
      favorito INTEGER DEFAULT 0
    );
  `);

  // Migraciones seguras para bases de datos existentes
  const addColumns = [
    'ALTER TABLE lugares ADD COLUMN foto TEXT;',
    'ALTER TABLE lugares ADD COLUMN favorito INTEGER DEFAULT 0;',
  ];
  for (const sql of addColumns) {
    try {
      db.execSync(sql);
    } catch {
      // columna ya existe
    }
  }
}

export function insertLugar(
  nombre: string,
  latitud: number,
  longitud: number,
  foto: string | null = null
): void {
  db.runSync(
    'INSERT INTO lugares (nombre, latitud, longitud, foto, favorito) VALUES (?, ?, ?, ?, 0)',
    nombre,
    latitud,
    longitud,
    foto
  );
}

export function updateFoto(id: number, foto: string | null): void {
  db.runSync('UPDATE lugares SET foto = ? WHERE id = ?', foto, id);
}

export function toggleFavorito(id: number, favorito: number): void {
  db.runSync('UPDATE lugares SET favorito = ? WHERE id = ?', favorito, id);
}

export function getLugares(): Lugar[] {
  return db.getAllSync<Lugar>('SELECT * FROM lugares ORDER BY favorito DESC, id DESC');
}

export function deleteLugar(id: number): void {
  db.runSync('DELETE FROM lugares WHERE id = ?', id);
}
