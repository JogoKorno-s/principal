// VIEW: card "NÍVEL X DESBLOQUEADO!" em fundo escuro, com notas de dinheiro voando.

import { el, botao, icones } from './componentes.js';

export function mostrarCardNivel({ titulo, destaque, subtitulo, acoes }) {
  const notas = Array.from({ length: 16 }, (_, i) => el('div', {
    class: 'nota',
    'aria-hidden': 'true',
    style: {
      left: `${(i * 127) % 1880 - 40}px`,
      '--dur': `${3.2 + (i % 5) * 0.55}s`,
      '--atraso': `${-(i * 0.47) % 4}s`,
      '--deriva': `${(i % 2 ? 1 : -1) * (40 + (i * 23) % 120)}px`,
      '--giro0': `${-30 + (i * 37) % 60}deg`,
      '--giro1': `${(i % 2 ? 1 : -1) * (180 + (i * 41) % 200)}deg`,
    },
  }, 'R$'));

  const botoes = acoes.map(({ texto, aoClicar, variante }) => botao(texto, aoClicar, `grande ${variante ?? ''}`));
  const card = el('div', { class: 'card-nivel', role: 'dialog', 'aria-label': `${titulo} ${destaque}` },
    notas,
    el('div', { class: 'card-nivel__placa' },
      el('div', { class: 'card-nivel__estrela', html: icones.estrela }),
      el('h2', { class: 'card-nivel__titulo' }, titulo, el('span', {}, destaque)),
      el('p', { class: 'card-nivel__sub' }, subtitulo),
      el('div', { class: 'card-nivel__acoes' }, botoes)));

  document.getElementById('sobreposicao').append(card);
  setTimeout(() => botoes[0]?.focus({ preventScroll: true }), 950);
  return () => card.remove();
}
