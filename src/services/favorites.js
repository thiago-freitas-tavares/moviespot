/**
 * Cliente da API de favoritos (server/index.js), que guarda a lista no banco SQLite.
 * As falhas viram erros com `kind: 'favorites'`, que o ErrorMessage traduz em uma
 * mensagem compreensível com "Tentar novamente" (Nielsen #9).
 */

const BASE_URL = '/api/favoritos'

function favoritesError(message) {
  return Object.assign(new Error(message), { kind: 'favorites' })
}

async function request(path, { signal, method = 'GET', body } = {}) {
  let response
  try {
    response = await fetch(BASE_URL + path, {
      method,
      signal,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch (error) {
    if (error.name === 'AbortError') throw error
    throw favoritesError('Não foi possível se comunicar com o servidor de favoritos.')
  }

  // O proxy do Vite responde 5xx quando o servidor está desligado.
  if (!response.ok) throw favoritesError(`O servidor de favoritos respondeu com erro (código ${response.status}).`)
  return response.status === 200 ? response.json() : null
}

export function getFavorites(options) {
  return request('', options)
}

/** @param {object|object[]} movies um filme ou uma lista (para desfazer "Limpar lista") */
export function saveFavorites(movies) {
  return request('', { method: 'POST', body: movies })
}

export function deleteFavorite(id) {
  return request(`/${id}`, { method: 'DELETE' })
}

export function deleteAllFavorites() {
  return request('', { method: 'DELETE' })
}
