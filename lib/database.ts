import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('lugares.db');

export type Lugar = {
  id: number;
  nombre: string;
  latitud: number;
  longitud: number;
};

export function initDatabase(): void {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS lugares (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      latitud REAL NOT NULL,
      longitud REAL NOT NULL
    );
  `);
}

export function insertLugar(nombre: string, latitud: number, longitud: number): void {
  db.runSync(
    'INSERT INTO lugares (nombre, latitud, longitud) VALUES (?, ?, ?)',
    nombre,
    latitud,
    longitud
  );
}

export function getLugares(): Lugar[] {
  return db.getAllSync<Lugar>('SELECT * FROM lugares ORDER BY id DESC');
}

export function deleteLugar(id: number): void {
  db.runSync('DELETE FROM lugares WHERE id = ?', id);
}