// CONTROLLER: mercado digital — compra de reposição pelo preço de custo.
// Abre pelo carrinho do HUD. Cada atacadista (aba) e cada produto tem um nível para ser desbloqueado.
// Depois de comprar um produto que ainda não tem preço de venda, o jogador define o preço (25% de lucro).

import { GameState } from '../model/game-state.js';
import { produtos, produtosDoNivel, atacadistas, precoDeVenda, precoMaximoPercentual } from '../model/produtos.js';
import { nivelAtual } from '../model/niveis.js';
import { jogar } from './minigame.js';
import { criarAtacadista } from '../minigames/atacadista.js';
import { criarPrecificacao } from '../minigames/precificacao.js';

let aberto = false;
let textosPadrao = null;
const sobreposicao = () => document.getElementById('sobreposicao');

/**
 * Monta o atacadista com o que o nível atual já liberou.
 * extras: regras do tutorial e das missões.
 *   aba: id do atacadista que abre primeiro
 *   exigir: [{ aba | ids, minimo, cada?, mensagem }] — ex.: pelo menos 1 de cada bebida
 */
export function configMercado(textos, extras = {}) {
  const estado = GameState.get();
  const nivel = nivelAtual(estado);
  const liberados = atacadistas().filter((a) => a.nivel <= nivel);
  const ativa = extras.aba ?? liberados[0]?.id;
  return {
    ...textos,
    ...extras,
    titulo: textos.titulo,
    abas: atacadistas().map((a) => ({ id: a.id, nome: a.nome, ativa: a.id === ativa, bloqueio: a.nivel > nivel ? `Nível ${a.nivel}` : null })),
    produtos: produtos()
      // produtos de níveis muito à frente ficam escondidos; os do próximo nível aparecem com cadeado
      .filter((p) => (p.nivel ?? 1) <= nivel + 1)
      .map((p) => ({
        id: p.id, nome: p.nome, unidade: p.unidade, imagem: p.imagem, aba: p.atacadista ?? 'geral',
        precoCentavos: p.custoCentavos, estoque: estado.estoque[p.id] ?? 0,
        bloqueio: (p.nivel ?? 1) > nivel ? `Nível ${p.nivel}` : null,
      }))
      // os liberados aparecem primeiro; os com cadeado ficam no fim da aba
      .sort((a, b) => Number(Boolean(a.bloqueio)) - Number(Boolean(b.bloqueio))),
  };
}

/** Compra no mercado digital. Resolve com true se comprou, false se fechou. */
export async function comprarNoMercado(textos, extras) {
  const r = await jogar(
    criarAtacadista({ config: configMercado(textos, extras), saldo: () => GameState.get().dinheiroCentavos }),
    sobreposicao());
  if (!r.ok) return false;
  GameState.gastar(r.total);
  GameState.adicionarEstoque(r.itens);
  return true;
}

/** Preço de venda de uma lista de produtos (mínimo 25% de lucro, máximo o dobro do custo). */
export async function definirPrecos(ids, textos) {
  const { precos } = GameState.get();
  const itens = produtos().filter((p) => ids.includes(p.id)).map((p) => ({
    ...p,
    minimoCentavos: precoDeVenda(p.custoCentavos),
    maximoCentavos: p.custoCentavos * (1 + precoMaximoPercentual() / 100),
    atualCentavos: precos[p.id],
  }));
  if (!itens.length) return;
  const r = await jogar(criarPrecificacao({ itens, ...(textos ?? textosPadrao.precos) }), sobreposicao());
  GameState.definirPrecos(r.precos);
}

/** Produtos liberados que estão no estoque e ainda não têm preço de venda. */
export function produtosSemPreco() {
  const { estoque, precos } = GameState.get();
  return produtosDoNivel(nivelAtual(GameState.get()))
    .filter((p) => (estoque[p.id] ?? 0) > 0 && !precos[p.id])
    .map((p) => p.id);
}

export function definirTextosMercado(textos) { textosPadrao = textos; }
export const textosDoMercado = () => textosPadrao;

/** Abertura livre pelo carrinho (depois do tutorial do Dia 2). */
export async function abrirMercado() {
  if (aberto || !textosPadrao) return;
  aberto = true;
  try {
    if (await comprarNoMercado(textosPadrao)) await definirPrecos(produtosSemPreco());
  } finally { aberto = false; }
}
