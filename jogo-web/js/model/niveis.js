// MODEL: regras de progressão dos níveis (linha do tempo).

let dados = null;

export function definirNiveis(json) { dados = json; }

export function listaDeNiveis() { return dados.niveis; }

export function nivel(n) { return dados.niveis[n - 1]; }

/** "concluido" | "desbloqueado" | "bloqueado" */
export function statusDoNivel(estado, n) {
  if (estado.niveisConcluidos.includes(n)) return 'concluido';
  if (n <= estado.maiorNivelDesbloqueado) return 'desbloqueado';
  return 'bloqueado';
}

/** Nível em que o jogador está agora: o primeiro desbloqueado e ainda não concluído. */
export function nivelAtual(estado) {
  for (const { nivel: n } of dados.niveis) {
    if (statusDoNivel(estado, n) === 'desbloqueado') return n;
  }
  return dados.niveis.length;
}

/** Configuração do modo de testes (null quando desligado em data/niveis.json). */
export function modoTeste() { return ['localhost','127.0.0.1','[::1]',''].includes(location.hostname) && dados.modoTeste?.ativo ? dados.modoTeste : null; }
