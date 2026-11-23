// CONTROLLER: troca de telas com fade para o preto.
//
// Cada tela é um objeto { montar(container, parametros), iniciar?(...), desmontar?() }.
// montar() prepara a tela com o fundo preto (pode ser async para carregar imagens);
// iniciar() começa o fluxo da tela (falas, minigames) depois que o fade terminou.

import { GameState } from '../model/game-state.js';
import { esperar } from '../util/formato.js';

const telas = new Map();
let atual = null;
let ocupado = false;

const DURACAO_FADE = 400;
const container = () => document.getElementById('tela');
const fade = () => document.getElementById('fade');

// Telas que não entram no save (o jogador não "continua" a partir delas)
const FORA_DO_SAVE = new Set(['menu']);

export function registrar(nome, tela) {
  telas.set(nome, tela);
}

export async function escurecer() {
  fade().classList.add('ativo');
  await esperar(DURACAO_FADE);
}

export async function clarear() {
  fade().classList.remove('ativo');
  await esperar(DURACAO_FADE);
}

let pendente = null;

export async function ir(nome, parametros = {}) {
  // Clique durante uma troca de tela: guarda o pedido e executa quando a troca terminar.
  if (ocupado) { pendente = [nome, parametros]; return; }
  const tela = telas.get(nome);
  if (!tela) throw new Error(`Tela desconhecida: ${nome}`);
  ocupado = true;

  await escurecer();

  atual?.desmontar?.();
  container().replaceChildren();
  document.getElementById('sobreposicao').replaceChildren();
  document.getElementById('avisos').replaceChildren();
  document.getElementById('notificacoes')?.replaceChildren();

  if (!FORA_DO_SAVE.has(nome)) GameState.irPara(nome);
  atual = tela;
  await tela.montar(container(), parametros);

  await clarear();
  ocupado = false;

  if (pendente) {
    const [proxima, params] = pendente;
    pendente = null;
    ir(proxima, params);
    return;
  }
  tela.iniciar?.(container(), parametros);
}
