// localStorage pode lançar exceção (modo privado, cota cheia, bloqueio de cookies):
// nesses casos o app continua funcionando, só não persiste os dados.

export function readStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw === null ? fallback : JSON.parse(raw)
  } catch {
    return fallback
  }
}

export function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Ignorado de propósito: persistência é um "bônus", não requisito para usar o app.
  }
}
