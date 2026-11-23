// VIEW + CONTROLE: painel do MODO DE TESTES (só enquanto o jogo está sendo ajustado).
//
// Deixa ir direto para qualquer nível e etapa, para frente ou para trás, sem jogar tudo de novo.
// Liga/desliga em data/niveis.json → "modoTeste": { "ativo": true }.
// O estado montado imita o que o jogador teria naquele ponto: níveis anteriores concluídos,
// estoque dos produtos liberados, preços de venda, dinheiro, prateleiras abastecidas e melhorias.

import { GameState } from '../model/game-state.js';
import { listaDeNiveis, modoTeste } from '../model/niveis.js';
import { produtosDoNivel, precoDeVenda } from '../model/produtos.js';
import { el, botao, modal } from './componentes.js';
import { ir } from '../controller/roteador.js';
import { fecharSecao, travarSecoes, configDoExpositor } from '../controller/secoes.js';
import { espacosDoExpositor } from './expositor.js';

let telas = {};   // { dia1: controlador, ... } — cada um tem a lista "etapas"

/** main.js informa os controladores dos dias (para listar as etapas). */
export function definirTelasDeTeste(mapa) { telas = mapa; }

export const testesAtivos = () => Boolean(modoTeste());

/** Abre o painel: um nível por linha, com a lista de etapas e "Jogar daqui". */
export function abrirPainelTestes() {
  const cfg = modoTeste();
  if (!cfg) return;
  const linhas = listaDeNiveis().map((n) => {
    const etapas = telas[n.tela]?.etapas ?? [];
    const escolha = el('select', { class: 'testes__etapa', 'aria-label': `Etapa do nível ${n.nivel}`, disabled: !etapas.length },
      etapas.map((e) => el('option', { value: e }, e)));
    const jogar = botao(cfg.botao, () => { fechar(); jogarTeste(n, escolha.value); }, 'pequeno');
    jogar.disabled = !etapas.length;
    return el('div', { class: 'testes__linha' },
      el('span', { class: 'testes__nivel' }, `Nível ${n.nivel}`),
      el('span', { class: 'testes__nome' }, `Dia ${n.dia} · ${n.titulo}`),
      escolha, jogar);
  });
  const fechar = modal({
    titulo: cfg.titulo,
    conteudo: [
      el('p', { class: 'testes__explicacao' }, cfg.explicacao),
      el('div', { class: 'testes__lista' }, linhas),
      el('p', { class: 'testes__aviso' }, cfg.aviso),
    ],
  });
}

/** Monta o estado do nível/etapa (sem etapa: do começo) e abre a tela. */
export function jogarTeste(n, etapa) {
  const cfg = modoTeste();
  const etapas = telas[n.tela].etapas;
  etapa ??= etapas[0];
  const passou = (nome) => etapas.includes(nome) && etapas.indexOf(etapa) > etapas.indexOf(nome);

  // Produtos que o jogador já teria: dos níveis anteriores e, no meio do nível, os do próprio nível
  const liberados = n.nivel === 1 ? [] : produtosDoNivel(etapas.indexOf(etapa) > 0 ? n.nivel : n.nivel - 1);
  const estoque = Object.fromEntries(liberados.map((p) => [p.id, cfg.estoquePorProduto]));
  const precos = Object.fromEntries(liberados.map((p) => [p.id, precoDeVenda(p.custoCentavos)]));
  const melhorias = n.nivel > 4 || (n.nivel === 4 && passou('comprarGeladeira')) ? { geladeiraBebidas: true } : {};
  if (n.nivel === 5 && passou('camera')) melhorias.cameraSeguranca = true;
  if (n.nivel === 5 && passou('arame')) melhorias.cercaArame = true;

  fecharSecao();
  travarSecoes();
  GameState.prepararTeste({
    nivel: n.nivel, dia: n.dia, tela: n.tela, etapa,
    dinheiroCentavos: cfg.dinheiroCentavos[n.nivel] ?? 30000,
    estoque, precos, melhorias,
    // A quitanda só vem abastecida depois da missão de abastecer (para dar para testar a missão)
    expositores: n.nivel >= 3 ? abastecer(liberados, { quitanda: n.nivel === 5 && passou('abastecer') }) : {},
  });
  ir(n.tela);
}

/**
 * Prateleiras, freezer e açougue com 2 unidades de cada produto (como se o Belo tivesse abastecido).
 * As bebidas ficam na gôndola (verso); a geladeira de bebidas começa vazia para a missão do Nível 4.
 */
function abastecer(produtos, { quitanda = false } = {}) {
  const destinos = [
    ['parede-direita', (p) => p.local === 'prateleira' && p.atacadista !== 'bebidas'],
    ['gondola-frente', (p) => p.local === 'prateleira' && p.atacadista !== 'bebidas'],
    ['gondola-verso', (p) => p.atacadista === 'bebidas'],
    ['freezer', (p) => p.local === 'freezer'],
    ['acougue', (p) => p.local === 'acougue'],
    ['quitanda-banca', (p) => quitanda && p.local === 'quitanda'],
    ['quitanda-estante', (p) => quitanda && p.local === 'quitanda'],
  ];
  const expositores = {};
  const colocados = new Set();
  for (const [id, aceita] of destinos) {
    const espacos = espacosDoExpositor(configDoExpositor(id));
    const lista = produtos.filter((p) => aceita(p) && !colocados.has(p.id)).slice(0, espacos.length);
    expositores[id] = Object.fromEntries(lista.map((p, k) => [k, { id: p.id, qtd: 2 }]));
    lista.forEach((p) => colocados.add(p.id));
  }
  return expositores;
}
