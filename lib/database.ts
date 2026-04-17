import * as SQLite from 'expo-sqlite';

/**
 * Abre o crea la base de datos SQLite llamada 'lugares.db'.
 * Se utiliza openDatabaseSync para operaciones síncronas.
 */
const db = SQLite.openDatabaseSync('lugares.db');

/**
 * Definición del tipo de objeto para un Lugar.
 */
export type Lugar = {
  id: number;
  nombre: string;
  latitud: number;
  longitud: number;
  foto: string | null;
  favorito: number; // Representación numérica: 1 = favorito, 0 = normal
};

/**
 * Inicializa la base de datos creando la tabla 'lugares' si no existe.
 * También realiza migraciones seguras para añadir columnas 'foto' y 'favorito'
 * en caso de que la tabla ya exista pero no las tenga.
 */
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

  // Intenta añadir columnas adicionales para asegurar la compatibilidad con versiones previas
  const addColumns = [
    'ALTER TABLE lugares ADD COLUMN foto TEXT;',
    'ALTER TABLE lugares ADD COLUMN favorito INTEGER DEFAULT 0;',
  ];
  for (const sql of addColumns) {
    try {
      db.execSync(sql);
    } catch {
      // Si la columna ya existe, el error es ignorado de forma segura
    }
  }
}

/**
 * Inserta un nuevo registro de lugar en la base de datos.
 * @param nombre Nombre descriptivo del lugar.
 * @param latitud Coordenada de latitud.
 * @param longitud Coordenada de longitud.
 * @param foto URI de la imagen asociada (opcional).
 */
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

/**
 * Actualiza la URI de la foto de un lugar existente.
 * @param id Identificador único del lugar.
 * @param foto Nueva URI de la foto o null para eliminarla.
 */
export function updateFoto(id: number, foto: string | null): void {
  db.runSync('UPDATE lugares SET foto = ? WHERE id = ?', foto, id);
}

/**
 * Cambia el estado de favorito de un lugar.
 * @param id Identificador único del lugar.
 * @param favorito Nuevo valor (1 para favorito, 0 para normal).
 */
export function toggleFavorito(id: number, favorito: number): void {
  db.runSync('UPDATE lugares SET favorito = ? WHERE id = ?', favorito, id);
}

/**
 * Recupera todos los lugares guardados.
 * Ordena los resultados primero por favoritos y luego por ID descendente.
 * @returns Un arreglo de objetos de tipo Lugar.
 */
export function getLugares(): Lugar[] {
  return db.getAllSync<Lugar>('SELECT * FROM lugares ORDER BY favorito DESC, id DESC');
}

/**
 * Elimina un lugar de la base de datos.
 * @param id Identificador único del lugar a borrar.
 */
export function deleteLugar(id: number): void {
  db.runSync('DELETE FROM lugares WHERE id = ?', id);
}
