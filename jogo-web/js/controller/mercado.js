// CONTROLLER: mercado digital — compra de reposição pelo preço de custo.
// Abre pelo carrinho do HUD. Cada atacadista e cada produto tem um nível para ser desbloqueado.

import { GameState } from '../model/game-state.js';
import { produtos, atacadistas } from '../model/produtos.js';
import { nivelAtual } from '../model/niveis.js';
import { jogar } from './minigame.js';
import { criarAtacadista } from '../minigames/atacadista.js';

let aberto = false;

/** Monta o atacadista com o que o nível atual já liberou. extras: regras do tutorial (estoqueMinimo...). */
export function configMercado(textos, extras = {}) {
  const estado = GameState.get();
  const nivel = nivelAtual(estado);
  const atual = atacadistas().find((a) => a.nivel <= nivel);
  return {
    ...textos,
    ...extras,
    titulo: textos.titulo,
    abas: atacadistas().map((a) => ({ nome: a.nome, ativa: a === atual, bloqueio: a.nivel > nivel ? `Nível ${a.nivel}` : null })),
    produtos: produtos().map((p) => ({
      id: p.id, nome: p.nome, unidade: p.unidade, imagem: p.imagem,
      precoCentavos: p.custoCentavos, estoque: estado.estoque[p.id] ?? 0,
      bloqueio: (p.nivel ?? 1) > nivel ? `Nível ${p.nivel}` : null,
    })),
  };
}

/** Compra no mercado digital. Resolve com true se comprou, false se fechou. */
export async function comprarNoMercado(textos, extras) {
  const r = await jogar(
    criarAtacadista({ config: configMercado(textos, extras), saldo: () => GameState.get().dinheiroCentavos }),
    document.getElementById('sobreposicao'));
  if (!r.ok) return false;
  GameState.gastar(r.total);
  GameState.adicionarEstoque(r.itens);
  return true;
}

let textosPadrao = null;
export function definirTextosMercado(textos) { textosPadrao = textos; }

/** Abertura livre pelo carrinho (depois do tutorial do Dia 2). */
export async function abrirMercado() {
  if (aberto || !textosPadrao) return;
  aberto = true;
  try { await comprarNoMercado(textosPadrao); } finally { aberto = false; }
}
