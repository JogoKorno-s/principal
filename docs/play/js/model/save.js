// Persistência do progresso no navegador (localStorage).
// Fechou e abriu: o jogo continua de onde parou.

const CHAVE = 'kornos.save';
const VERSAO = 1;

export function carregar() {
  try {
    const texto = localStorage.getItem(CHAVE);
    if (!texto) return null;
    const dados = JSON.parse(texto);
    if (dados?.versao !== VERSAO) return null; // save de versão antiga: começa do zero
    return dados;
  } catch {
    return null;
  }
}

export function salvar(estado) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify({ ...estado, versao: VERSAO, salvoEm: new Date().toISOString() }));
  } catch {
    // Navegador sem espaço ou em modo privado: o jogo continua, só não salva.
  }
}

export function apagar() {
  try { localStorage.removeItem(CHAVE); } catch { /* nada a fazer */ }
}

export function existe() {
  return carregar() !== null;
}
