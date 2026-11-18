// VIEW: linha do tempo de progresso — dias 1, 2, 15, 45 e 90.
// Estados: concluído, desbloqueado e bloqueado.

import { GameState } from '../model/game-state.js';
import { listaDeNiveis, statusDoNivel, nivelAtual } from '../model/niveis.js';
import { el, botaoIcone, icones } from './componentes.js';
import { ir } from '../controller/roteador.js';

// Posição de cada marco no palco (zigue-zague da esquerda para a direita)
const PONTOS = [[220, 560], [590, 360], [960, 580], [1330, 360], [1700, 560]];
const ESTRADA = 'M -60 660 C 80 640, 140 590, 220 560 S 470 360, 590 360 S 840 580, 960 580 S 1210 360, 1330 360 S 1580 560, 1700 560 S 1900 640, 1990 660';

const TEXTO_ESTADO = {
  concluido: 'CONCLUÍDO',
  desbloqueado: 'DESBLOQUEADO · clique para jogar',
  bloqueado: 'BLOQUEADO',
};

let aberta = null;

/** Começa um nível desbloqueado: atualiza o dia no HUD e troca de tela. */
export function irParaNivel(n) {
  GameState.comecarNivel(n.nivel, n.dia);
  ir(n.tela);
}

export function abrirLinhaTempo() {
  if (aberta) return;
  const estado = GameState.get();
  const atual = nivelAtual(estado);
  const info = el('div', { class: 'linha-tempo__info', role: 'status' }, 'Clique em um nível para ver os detalhes');

  const marcos = listaDeNiveis().map((n, i) => {
    const status = statusDoNivel(estado, n.nivel);
    const [x, y] = PONTOS[i];
    const conteudo = status === 'concluido' ? icones.certo : status === 'bloqueado' ? icones.cadeado : String(n.nivel);
    const botao = el('button', {
      type: 'button',
      class: 'marco__botao',
      'aria-label': `Nível ${n.nivel}, dia ${n.dia}: ${n.titulo}. ${TEXTO_ESTADO[status]}`,
      html: conteudo,
      onclick: () => clicar(n, status),
    });
    return el('div', { class: `marco marco--${status}`, style: { left: `${x}px`, top: `${y - 85}px` } },
      n.nivel === atual ? el('span', { class: 'marco__aqui' }, 'VOCÊ ESTÁ AQUI') : null,
      botao,
      el('div', { class: 'marco__info' },
        el('div', { class: 'marco__dia' }, `NÍVEL ${n.nivel} · DIA ${n.dia}`),
        el('div', { class: 'marco__nome' }, n.titulo),
        el('div', { class: 'marco__estado' }, TEXTO_ESTADO[status])));
  });

  function clicar(n, status) {
    if (status === 'bloqueado') {
      info.textContent = `Nível ${n.nivel} bloqueado! Conclua o nível ${n.nivel - 1} para desbloquear.`;
    } else if (status === 'concluido') {
      info.textContent = `Nível ${n.nivel} concluído! Ótimo trabalho.`;
    } else if (!n.tela) {
      info.textContent = `O Dia ${n.dia} ainda está em construção na versão web.`;
    } else if (GameState.get().tela === n.tela) {
      fechar();
    } else {
      fechar();
      irParaNivel(n);
    }
  }

  const raiz = el('div', { class: 'linha-tempo', role: 'dialog', 'aria-label': 'Sua jornada' },
    el('div', {
      class: 'linha-tempo__estrada', 'aria-hidden': 'true',
      html: `<svg viewBox="0 0 1920 1080" width="100%" height="100%">
             <path d="${ESTRADA}" fill="none" stroke="#5B1F00" stroke-width="104" stroke-linecap="round"/>
             <path d="${ESTRADA}" fill="none" stroke="#E6D3B3" stroke-width="88" stroke-linecap="round"/>
             <path d="${ESTRADA}" fill="none" stroke="#8D4925" stroke-width="6" stroke-dasharray="28 26"/></svg>`,
    }),
    el('h2', { class: 'linha-tempo__titulo' }, 'Sua jornada no Korno\'s'),
    botaoIcone(icones.fechar, 'Fechar', () => fechar(), 'linha-tempo__fechar'),
    marcos,
    info);

  function fechar() {
    raiz.remove();
    aberta = null;
  }
  raiz.addEventListener('keydown', (e) => { if (e.key === 'Escape') fechar(); });

  document.getElementById('sobreposicao').append(raiz);
  aberta = raiz;
  raiz.querySelector('.linha-tempo__fechar').focus({ preventScroll: true });
}
