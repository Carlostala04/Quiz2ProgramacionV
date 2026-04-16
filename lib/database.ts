import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('lugares.db');

export type Lugar = {
  id: number;
  nombre: string;
  latitud: number;
  longitud: number;
  favorito: number; // 0 = no, 1 = sí
};

export function initDatabase(): void {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS lugares (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      latitud REAL NOT NULL,
      longitud REAL NOT NULL,
      favorito INTEGER NOT NULL DEFAULT 0
    );
  `);
  // Migración: agrega la columna si la tabla ya existía sin ella
  try {
    db.execSync('ALTER TABLE lugares ADD COLUMN favorito INTEGER NOT NULL DEFAULT 0');
  } catch {
    // columna ya existe, ignorar
  }
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

export function toggleFavorito(id: number, favorito: number): void {
  db.runSync('UPDATE lugares SET favorito = ? WHERE id = ?', favorito, id);
}

export function deleteLugar(id: number): void {
  db.runSync('DELETE FROM lugares WHERE id = ?', id);
}