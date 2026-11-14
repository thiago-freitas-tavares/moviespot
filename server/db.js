import Database from 'better-sqlite3'
import { fileURLToPath } from 'node:url'

/*
  Banco SQLite em um único arquivo na raiz do projeto (moviespot.db), criado na
  primeira execução. Abra-o no VS Code com a extensão SQLite Viewer para ver a tabela.
*/
const db = new Database(fileURLToPath(new URL('../moviespot.db', import.meta.url)))

// Guarda só o necessário para exibir o card sem depender da API do TMDB.
db.exec(`
  CREATE TABLE IF NOT EXISTS favoritos (
    id           INTEGER PRIMARY KEY,           -- id do filme no TMDB
    title        TEXT    NOT NULL,
    poster_path  TEXT,
    release_date TEXT    NOT NULL DEFAULT '',
    vote_average REAL    NOT NULL DEFAULT 0,
    vote_count   INTEGER NOT NULL DEFAULT 0,
    added_at     INTEGER NOT NULL               -- quando foi favoritado (ms desde 1970)
  )
`)

export default db
