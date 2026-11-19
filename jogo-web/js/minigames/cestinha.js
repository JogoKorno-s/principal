// MINIGAME: separar o pedido do Moto Entrega na cestinha.
//   Entrada: produto arrastado (ou clicado) até a cestinha
//   Validação: o produto está no pedido e ainda não foi separado?
//   Resultado: vai para a cestinha e ganha ✓ na notinha; se errado, volta para a prateleira

import { el, avisar, pontoNoPalco, icones } from '../view/componentes.js';
import { codigoDeBarras } from '../view/entregas.js';
import { esperar } from '../util/formato.js';

// Prateleira da gôndola: 3 andares × 6 produtos (y = onde o produto encosta na madeira)
const ANDARES = [288, 592, 852];
const COLUNAS = [530, 720, 910, 1100, 1290, 1480];
const TAMANHO = 160;
const CESTA = { x: 60, y: 690, largura: 380, altura: 340 };

const CESTA_SVG = `
<svg viewBox="0 0 380 340" aria-hidden="true">
  <path d="M118 175 C 112 40, 222 40, 214 170" fill="none" stroke="#2b2b2b" stroke-width="22" stroke-linecap="round"/>
  <path d="M176 175 C 172 52, 286 52, 276 172" fill="none" stroke="#3a3a3a" stroke-width="22" stroke-linecap="round"/>
  <path d="M28 168 H352 L322 318 Q318 330 304 330 H76 Q62 330 58 318 Z" fill="#e3262d" stroke="#3a0b0b" stroke-width="8" stroke-linejoin="round"/>
  <rect x="16" y="146" width="348" height="40" rx="14" fill="#f2454b" stroke="#3a0b0b" stroke-width="8"/>
  <g fill="#9c1117">
    ${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<rect x="${62 + i * 33}" y="206" width="20" height="40" rx="8"/>`).join('')}
    ${[0, 1, 2, 3, 4, 5, 6].map((i) => `<rect x="${80 + i * 33}" y="262" width="20" height="40" rx="8"/>`).join('')}
  </g>
</svg>`;

/**
 * config: { cenario, textos, numero, pedido: [{ id, nome, imagem }], prateleira: [{ id, nome, imagem }] }
 * prateleira: produtos que aparecem na gôndola (inclui os do pedido)
 */
export function criarCestinha(config) {
  const { textos } = config;
  const faltam = new Set(config.pedido.map((p) => p.id));
  let raiz, dentro, linhas, dica, brilho;
  const itens = [];

  const naCesta = ({ x, y }) => x >= CESTA.x && x <= CESTA.x + CESTA.largura && y >= CESTA.y - 60 && y <= CESTA.y + CESTA.altura;

  function voltar(item) {
    item.el.classList.add('animar');
    item.el.style.left = `${item.x}px`;
    item.el.style.top = `${item.y}px`;
  }

  function arrastavel(item, enviar) {
    let pegada = null;
    let moveu = false;
    const img = item.el;
    img.addEventListener('pointerdown', (e) => {
      if (item.separado || e.button !== 0) return;
      e.preventDefault();
      img.setPointerCapture(e.pointerId);
      const p = pontoNoPalco(e);
      pegada = { dx: p.x - parseFloat(img.style.left), dy: p.y - parseFloat(img.style.top), x: p.x, y: p.y };
      moveu = false;
      img.classList.remove('animar');
      img.classList.add('arrastado');
    });
    img.addEventListener('pointermove', (e) => {
      if (!pegada) return;
      const p = pontoNoPalco(e);
      if (Math.hypot(p.x - pegada.x, p.y - pegada.y) > 8) moveu = true;
      img.style.left = `${p.x - pegada.dx}px`;
      img.style.top = `${p.y - pegada.dy}px`;
      brilho.classList.toggle('perto', naCesta(p));
    });
    const soltar = (e) => {
      if (!pegada) return;
      pegada = null;
      img.classList.remove('arrastado');
      brilho.classList.remove('perto');
      const p = pontoNoPalco(e);
      // Clique sem arrastar também coloca na cestinha
      if (!moveu || naCesta(p)) enviar({ id: item.id });
      else voltar(item);
    };
    img.addEventListener('pointerup', soltar);
    img.addEventListener('pointercancel', soltar);
  }

  return {
    montar(container, enviar) {
      config.prateleira.forEach((p, i) => {
        const x = COLUNAS[i % COLUNAS.length] - TAMANHO / 2;
        const y = ANDARES[Math.floor(i / COLUNAS.length)] - TAMANHO;
        const item = { ...p, x, y, separado: false };
        item.el = el('img', {
          class: 'cestinha__produto', src: p.imagem, alt: p.nome, title: p.nome, draggable: 'false',
          style: { left: `${x}px`, top: `${y}px`, width: `${TAMANHO}px`, height: `${TAMANHO}px` },
        });
        arrastavel(item, enviar);
        itens.push(item);
      });

      linhas = new Map(config.pedido.map((p, i) => [p.id, el('li', { class: 'cestinha__linha' },
        el('span', {}, String(i + 1).padStart(2, '0')),
        el('span', {}, p.nome.toUpperCase()),
        el('span', { class: 'cestinha__check', html: icones.certo, hidden: true }))]));
      const notinha = el('div', { class: 'cestinha__notinha' },
        el('div', { class: 'cestinha__notinha-titulo' }, textos.titulo),
        el('div', { class: 'pontilhado' }),
        el('ol', { class: 'cestinha__lista', 'aria-label': 'Pedido' }, [...linhas.values()]),
        el('div', { class: 'pontilhado' }),
        codigoDeBarras(config.numero, 'pequeno'));

      dentro = el('div', { class: 'cestinha__dentro' });
      brilho = el('div', { class: 'cestinha__cesta', 'aria-label': 'Cestinha', style: {
        left: `${CESTA.x}px`, top: `${CESTA.y}px`, width: `${CESTA.largura}px`, height: `${CESTA.altura}px`,
      } }, dentro, el('div', { class: 'cestinha__frente', html: CESTA_SVG }));
      dica = el('div', { class: 'caixa__dica cestinha__dica' }, textos.dica);

      raiz = el('div', { class: 'cestinha', role: 'region', 'aria-label': 'Separar pedido' },
        el('img', { class: 'cenario', src: config.cenario, alt: 'Gôndola do Korno\'s' }),
        itens.map((i) => i.el), notinha, brilho, dica);
      container.append(raiz);
    },

    validar({ id }) {
      return { ok: faltam.has(id), id };
    },

    async resultado(r) {
      const item = itens.find((i) => i.id === r.id);
      if (!r.ok) {
        avisar(textos.errado.replace('{nome}', item.nome), 'erro');
        item.el.classList.add('errado');
        setTimeout(() => item.el.classList.remove('errado'), 450);
        voltar(item);
        return false;
      }
      faltam.delete(r.id);
      item.separado = true;
      item.el.remove();
      dentro.append(el('img', { class: 'cestinha__na-cesta', src: item.imagem, alt: item.nome }));
      const linha = linhas.get(r.id);
      linha.classList.add('feito');
      linha.querySelector('.cestinha__check').hidden = false;
      if (faltam.size) { dica.textContent = faltam.size === 1 ? textos.faltaUm : textos.faltam.replace('{n}', faltam.size); return false; }
      dica.textContent = textos.pronto;
      await esperar(1200);
      return true;
    },

    desmontar() { raiz.remove(); },
  };
}
