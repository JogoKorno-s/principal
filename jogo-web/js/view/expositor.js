// VIEW: expositor — prateleira, freezer, geladeira ou açougue visto de perto.
// Cada espaço guarda um só produto, com até "capacidade" unidades (prateleira 4, freezer 5).
// Embaixo fica a bandeja com o que está no estoque e ainda não foi exposto.
// Arrastar da bandeja para um espaço coloca 1 unidade; arrastar do espaço para fora (ou "−") devolve 1.
// Só pode expor o que existe no estoque.

import { GameState } from '../model/game-state.js';
import { produtosDoNivel, produto } from '../model/produtos.js';
import { nivelAtual } from '../model/niveis.js';
import { el, botaoIcone, avisar, pontoNoPalco } from './componentes.js';

const SOBREPOR = 0.62;   // quanto cada unidade aparece ao lado da outra (0 a 1); o JSON pode mudar

/** Lista os espaços do expositor a partir das colunas e linhas do JSON. */
export function espacosDoExpositor(config) {
  const espacos = [];
  config.linhas.forEach(([y, altura]) => {
    for (const x of config.colunas) espacos.push({ x, y, largura: config.largura, altura });
  });
  return espacos;
}

/**
 * Monta o expositor dentro de `container` (que cobre o palco inteiro).
 * Devolve uma função que desmonta (para de ouvir o GameState).
 */
export function montarExpositor(container, { id, config, textos }) {
  const espacos = espacosDoExpositor(config);
  const capacidade = config.capacidade;
  const camadaEspacos = el('div', { class: 'expositor__espacos' });
  const bandeja = el('div', { class: 'expositor__bandeja', 'aria-label': textos.bandeja });
  const raiz = el('div', { class: 'expositor' },
    el('img', { class: 'cenario', src: config.fundo, alt: config.titulo }),
    camadaEspacos,
    el('div', { class: 'expositor__rodape' }, el('span', { class: 'expositor__rotulo' }, textos.bandeja), bandeja));
  container.append(raiz);

  const doEspaco = (k) => GameState.get().expositores[id]?.[k];
  const livre = (pid) => (GameState.get().estoque[pid] ?? 0) - GameState.exposto(pid);

  function colocar(k, pid) {
    const atual = doEspaco(k);
    if (atual && atual.id !== pid) { avisar(textos.outroProduto.replace('{nome}', produto(atual.id).nome.toLowerCase()), 'erro'); return; }
    if (atual && atual.qtd >= capacidade) { avisar(textos.cheio.replace('{n}', capacidade), 'erro'); return; }
    if (livre(pid) <= 0) { avisar(textos.semEstoque.replace('{nome}', produto(pid).nome.toLowerCase()), 'erro'); return; }
    GameState.exporProduto(id, k, pid, +1);
  }

  /** Clique na bandeja: põe no espaço que já tem o produto ou no primeiro vazio. */
  function colocarAutomatico(pid) {
    let k = espacos.findIndex((_, i) => doEspaco(i)?.id === pid && doEspaco(i).qtd < capacidade);
    if (k < 0) k = espacos.findIndex((_, i) => !doEspaco(i));
    if (k < 0) { avisar(textos.cheio.replace('{n}', capacidade), 'erro'); return; }
    colocar(k, pid);
  }

  const espacoNoPonto = ({ x, y }) =>
    espacos.findIndex((e) => x >= e.x && x <= e.x + e.largura && y >= e.y && y <= e.y + e.altura);

  // ----- Arrastar (da bandeja ou de um espaço) -----
  function arrastar(evento, pid, origem) {
    evento.preventDefault();
    const inicio = pontoNoPalco(evento);
    let fantasma = null;
    let alvo = -1;

    const mover = (e) => {
      const p = pontoNoPalco(e);
      if (!fantasma && Math.hypot(p.x - inicio.x, p.y - inicio.y) < 8) return;
      fantasma ??= raiz.appendChild(el('img', { class: 'expositor__fantasma', src: produto(pid).imagem, alt: '' }));
      fantasma.style.left = `${p.x}px`;
      fantasma.style.top = `${p.y}px`;
      alvo = espacoNoPonto(p);
      camadaEspacos.querySelectorAll('.espaco--alvo').forEach((n) => n.classList.remove('espaco--alvo'));
      if (alvo >= 0) camadaEspacos.children[alvo].classList.add('espaco--alvo');
    };
    const soltar = () => {
      window.removeEventListener('pointermove', mover);
      window.removeEventListener('pointerup', soltar);
      if (!fantasma) { if (origem === null) colocarAutomatico(pid); return; }   // foi só um clique
      fantasma.remove();
      if (origem === null) { if (alvo >= 0) colocar(alvo, pid); return; }
      if (alvo === origem) { desenhar(); return; }
      if (alvo >= 0) {
        const destino = doEspaco(alvo);
        if (destino && destino.id !== pid) { avisar(textos.outroProduto.replace('{nome}', produto(destino.id).nome.toLowerCase()), 'erro'); desenhar(); return; }
        if (destino && destino.qtd >= capacidade) { avisar(textos.cheio.replace('{n}', capacidade), 'erro'); desenhar(); return; }
        GameState.exporProduto(id, origem, pid, -1);
        GameState.exporProduto(id, alvo, pid, +1);
      } else {
        GameState.exporProduto(id, origem, pid, -1);   // soltou fora: volta para o estoque
      }
    };
    window.addEventListener('pointermove', mover);
    window.addEventListener('pointerup', soltar);
  }

  function desenharEspaco(e, k) {
    const item = doEspaco(k);
    const caixa = el('div', {
      class: `espaco ${item ? '' : 'espaco--vazio'}`,
      style: { left: `${e.x}px`, top: `${e.y}px`, width: `${e.largura}px`, height: `${e.altura}px` },
    });
    if (!item) return caixa;
    const p = produto(item.id);
    const sobrepor = config.sobrepor ?? SOBREPOR;
    const tamanho = Math.min(e.altura, e.largura / (1 + (capacidade - 1) * sobrepor));
    const passo = tamanho * sobrepor;
    const inicio = (e.largura - (tamanho + (item.qtd - 1) * passo)) / 2;
    for (let i = 0; i < item.qtd; i++) {
      const img = el('img', {
        class: 'espaco__produto', src: p.imagem, alt: i === 0 ? p.nome : '', draggable: 'false',
        style: { width: `${tamanho}px`, height: `${tamanho}px`, left: `${inicio + i * passo}px` },
      });
      img.addEventListener('pointerdown', (ev) => arrastar(ev, item.id, k));
      caixa.append(img);
    }
    caixa.append(
      el('span', { class: 'espaco__qtd' }, `${item.qtd}/${capacidade}`),
      botaoIcone('−', `Devolver um ${p.nome} ao estoque`, () => GameState.exporProduto(id, k, item.id, -1), 'botao-icone--pequeno espaco__tirar'));
    return caixa;
  }

  function desenhar() {
    camadaEspacos.replaceChildren(...espacos.map(desenharEspaco));
    const nivel = nivelAtual(GameState.get());
    const itens = produtosDoNivel(nivel).filter((p) => p.local === config.local && livre(p.id) > 0);
    bandeja.replaceChildren(...(itens.length ? itens.map((p) => {
      const cartao = el('button', { type: 'button', class: 'bandeja__item', title: `Colocar ${p.nome}` },
        el('img', { src: p.imagem, alt: '', draggable: 'false' }),
        el('span', { class: 'bandeja__nome' }, p.nome),
        el('span', { class: 'bandeja__qtd' }, `×${livre(p.id)}`));
      cartao.addEventListener('pointerdown', (ev) => arrastar(ev, p.id, null));
      cartao.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); colocarAutomatico(p.id); } });
      return cartao;
    }) : [el('p', { class: 'bandeja__vazia' }, textos.bandejaVazia)]));
  }

  desenhar();
  const parar = GameState.ouvir(() => desenhar());
  return () => { parar(); raiz.remove(); };
}
