import express from 'express'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import db from './db.js'

/*
  API dos favoritos. Em desenvolvimento, o Vite repassa as chamadas a /api para esta
  porta (proxy em vite.config.js): para o navegador, site e API têm o mesmo endereço,
  então não é preciso liberar CORS. Em produção (Render), este servidor também entrega o site.
*/
// A hospedagem informa a porta na variável PORT; localmente, 3001.
const PORT = process.env.PORT ?? 3001
const DIST = fileURLToPath(new URL('../dist', import.meta.url))

const listAll = db.prepare(`
  SELECT id, title, poster_path, release_date, vote_average, vote_count, added_at AS addedAt
  FROM favoritos
  ORDER BY added_at DESC
`)
const insert = db.prepare(`
  INSERT INTO favoritos (id, title, poster_path, release_date, vote_average, vote_count, added_at)
  VALUES (@id, @title, @poster_path, @release_date, @vote_average, @vote_count, @addedAt)
  ON CONFLICT (id) DO NOTHING
`)
const removeOne = db.prepare('DELETE FROM favoritos WHERE id = ?')
const removeAll = db.prepare('DELETE FROM favoritos')

// Vários filmes de uma vez (o "Desfazer" de "Limpar lista") entram juntos ou nenhum entra.
const insertMany = db.transaction((movies) => movies.forEach((movie) => insert.run(movie)))

/** Aceita só os campos da tabela, com tipos válidos; devolve null se o filme for inválido. */
function toRow(movie) {
  if (!Number.isInteger(movie?.id) || movie.id <= 0 || typeof movie.title !== 'string' || !movie.title) return null
  return {
    id: movie.id,
    title: movie.title,
    poster_path: typeof movie.poster_path === 'string' ? movie.poster_path : null,
    release_date: typeof movie.release_date === 'string' ? movie.release_date : '',
    vote_average: Number(movie.vote_average) || 0,
    vote_count: Number.parseInt(movie.vote_count, 10) || 0,
    addedAt: Number.isInteger(movie.addedAt) ? movie.addedAt : Date.now(),
  }
}

const app = express()
app.use(express.json())

app.get('/api/favoritos', (req, res) => {
  res.json(listAll.all())
})

// Recebe um filme ou uma lista de filmes.
app.post('/api/favoritos', (req, res) => {
  const rows = [req.body].flat().map(toRow)
  if (rows.length === 0 || rows.includes(null)) {
    return res.status(400).json({ error: 'Filme inválido: id e título são obrigatórios.' })
  }
  insertMany(rows)
  res.status(201).end()
})

app.delete('/api/favoritos/:id', (req, res) => {
  removeOne.run(Number(req.params.id))
  res.status(204).end()
})

app.delete('/api/favoritos', (req, res) => {
  removeAll.run()
  res.status(204).end()
})

/*
  Site já compilado (pasta dist, gerada pelo `npm run build`). Endereços que não são
  arquivos nem API, como /favoritos, recebem o index.html e o React Router mostra a página.
*/
if (existsSync(DIST)) {
  app.use(express.static(DIST))
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api')) return next()
    res.sendFile('index.html', { root: DIST })
  })
}

// Qualquer falha inesperada (ex.: banco travado) vira um erro 500 em JSON.
app.use((error, req, res, next) => {
  console.error(error)
  if (res.headersSent) return next(error)
  res.status(500).json({ error: 'Erro interno no servidor de favoritos.' })
})

app.listen(PORT, () => {
  console.log(`Servidor do MovieSpot na porta ${PORT} (API em /api/favoritos)`)
})
