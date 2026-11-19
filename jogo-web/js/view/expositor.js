// VIEW: expositor — prateleira, freezer, geladeira ou açougue visto de perto.
// Cada espaço guarda um só produto, com até "capacidade" unidades (prateleira 4, freezer 5).
// Embaixo fica a bandeja com o que está no estoque e ainda não foi exposto.
// Arrastar da bandeja para um espaço coloca 1 unidade; arrastar do espaço para fora (ou "−") devolve 1.
// Só pode expor o que existe no estoque.
// Separando um pedido do Moto Entrega: clicar num produto exposto coloca 1 unidade na cestinha.
//
// Um expositor pode ter grupos de espaços diferentes na mesma imagem (ex.: prateleira + geladeira
// de bebidas). Cada grupo diz o que aceita (local ou atacadista) e quantas unidades cabem.

import { GameState } from '../model/game-state.js';
import { produtosDoNivel, produto } from '../model/produtos.js';
import { nivelAtual } from '../model/niveis.js';
import { el, botaoIcone, avisar, pontoNoPalco } from './componentes.js';
import { separando, pegarProduto, reservado, ouvirSeparacao } from '../model/separacao.js';

const SOBREPOR = 0.62;   // quanto cada unidade aparece ao lado da outra (0 a 1); o JSON pode mudar

/**
 * Lista os espaços do expositor a partir das colunas e linhas do JSON.
 * colunas: [x, ...] com "largura" do grupo, ou [[x, largura], ...].
 */
export function espacosDoExpositor(config) {
  const espacos = [];
  for (const grupo of config.grupos ?? [config]) {
    const local = grupo.local ?? (grupo.atacadista ? null : config.local);
    const aceita = (p) => (!local || p.local === local) && (!grupo.atacadista || p.atacadista === grupo.atacadista);
    grupo.linhas.forEach(([y, altura]) => {
      for (const coluna of grupo.colunas) {
        const [x, largura] = Array.isArray(coluna) ? coluna : [coluna, grupo.largura];
        espacos.push({
          x, y, largura, altura, aceita,
          capacidade: grupo.capacidade ?? config.capacidade,
          sobrepor: grupo.sobrepor ?? config.sobrepor ?? SOBREPOR,
          grupo: grupo.nome ?? null,
        });
      }
    });
  }
  return espacos;
}

/**
 * Monta o expositor dentro de `container` (que cobre o palco inteiro).
 * Devolve uma função que desmonta (para de ouvir o GameState).
 */
export function montarExpositor(container, { id, config, textos }) {
  const espacos = espacosDoExpositor(config);
  const camadaEspacos = el('div', { class: 'expositor__espacos' });
  const bandeja = el('div', { class: 'expositor__bandeja', 'aria-label': textos.bandeja });
  const raiz = el('div', { class: 'expositor' },
    el('img', { class: 'cenario', src: config.fundo, alt: config.titulo }),
    camadaEspacos,
    el('div', { class: 'expositor__rodape' }, el('span', { class: 'expositor__rotulo' }, textos.bandeja), bandeja));
  container.append(raiz);

  const doEspaco = (k) => GameState.get().expositores[id]?.[k];
  const livre = (pid) => (GameState.get().estoque[pid] ?? 0) - GameState.exposto(pid) - reservado(pid);
  const naoAceita = (k, pid) => {
    if (espacos[k].aceita(produto(pid))) return false;
    avisar(espacos[k].grupo === 'geladeira' ? textos.soBebidas : textos.naoCabe, 'erro');
    return true;
  };

  function colocar(k, pid) {
    const atual = doEspaco(k);
    const capacidade = espacos[k].capacidade;
    if (naoAceita(k, pid)) return;
    if (atual && atual.id !== pid) { avisar(textos.outroProduto.replace('{nome}', produto(atual.id).nome.toLowerCase()), 'erro'); return; }
    if (atual && atual.qtd >= capacidade) { avisar(textos.cheio.replace('{n}', capacidade), 'erro'); return; }
    if (livre(pid) <= 0) { avisar(textos.semEstoque.replace('{nome}', produto(pid).nome.toLowerCase()), 'erro'); return; }
    GameState.exporProduto(id, k, pid, +1);
  }

  /**
   * Clique na bandeja: põe no espaço que já tem o produto ou no primeiro vazio que aceita.
   * Espaços de grupo especial (ex.: geladeira de bebidas) têm preferência.
   */
  function colocarAutomatico(pid) {
    const p = produto(pid);
    const ordem = [...espacos.keys()].sort((a, b) => Number(Boolean(espacos[b].grupo)) - Number(Boolean(espacos[a].grupo)));
    let k = ordem.find((i) => doEspaco(i)?.id === pid && doEspaco(i).qtd < espacos[i].capacidade) ?? -1;
    if (k < 0) k = ordem.find((i) => !doEspaco(i) && espacos[i].aceita(p)) ?? -1;
    if (k < 0) { avisar(textos.cheio.replace('{n}', Math.max(...espacos.map((e) => e.capacidade))), 'erro'); return; }
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
      if (!fantasma) {   // foi só um clique
        if (origem === null) colocarAutomatico(pid);
        else if (separando()) pegarParaCestinha(origem, pid);
        return;
      }
      fantasma.remove();
      if (origem === null) { if (alvo >= 0) colocar(alvo, pid); return; }
      if (alvo === origem) { desenhar(); return; }
      if (alvo >= 0) {
        const destino = doEspaco(alvo);
        if (naoAceita(alvo, pid)) { desenhar(); return; }
        if (destino && destino.id !== pid) { avisar(textos.outroProduto.replace('{nome}', produto(destino.id).nome.toLowerCase()), 'erro'); desenhar(); return; }
        if (destino && destino.qtd >= espacos[alvo].capacidade) { avisar(textos.cheio.replace('{n}', espacos[alvo].capacidade), 'erro'); desenhar(); return; }
        GameState.exporProduto(id, origem, pid, -1);
        GameState.exporProduto(id, alvo, pid, +1);
      } else {
        GameState.exporProduto(id, origem, pid, -1);   // soltou fora: volta para o estoque
      }
    };
    window.addEventListener('pointermove', mover);
    window.addEventListener('pointerup', soltar);
  }

  /** Pedido do Moto Entrega: tira 1 unidade da exposição e põe na cestinha. */
  function pegarParaCestinha(k, pid) {
    const nome = produto(pid).nome;
    const r = pegarProduto(pid);
    if (r === 'foraDoPedido') { avisar(textos.foraDoPedido.replace('{nome}', nome), 'erro'); return; }
    if (r === 'jaPegou') { avisar(textos.jaPegou.replace('{nome}', nome), 'erro'); return; }
    GameState.exporProduto(id, k, pid, -1);
    avisar(textos.pegou.replace('{nome}', nome), 'sucesso', 1600);
  }

  function desenharEspaco(e, k) {
    const item = doEspaco(k);
    const caixa = el('div', {
      class: `espaco ${item ? '' : 'espaco--vazio'} ${e.grupo ? `espaco--${e.grupo}` : ''}`,
      style: { left: `${e.x}px`, top: `${e.y}px`, width: `${e.largura}px`, height: `${e.altura}px` },
    });
    if (!item) return caixa;
    const p = produto(item.id);
    const tamanho = Math.min(e.altura, e.largura / (1 + (e.capacidade - 1) * e.sobrepor));
    const passo = tamanho * e.sobrepor;
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
      el('span', { class: 'espaco__qtd' }, `${item.qtd}/${e.capacidade}`),
      botaoIcone('−', `Devolver um ${p.nome} ao estoque`, () => GameState.exporProduto(id, k, item.id, -1), 'botao-icone--pequeno espaco__tirar'));
    return caixa;
  }

  function desenhar() {
    raiz.classList.toggle('expositor--separando', separando());
    camadaEspacos.replaceChildren(...espacos.map(desenharEspaco));
    const nivel = nivelAtual(GameState.get());
    const itens = produtosDoNivel(nivel).filter((p) => espacos.some((e) => e.aceita(p)) && livre(p.id) > 0);
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
  const pararSeparacao = ouvirSeparacao(() => desenhar());
  return () => { parar(); pararSeparacao(); raiz.remove(); };
}
