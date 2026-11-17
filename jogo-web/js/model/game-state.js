// MODEL: todos os dados do jogo ficam aqui (RNF16 · MVC).
// As telas só leem o estado e pedem mudanças por meio destas funções;
// cada mudança salva o progresso e avisa quem estiver ouvindo (HUD, por exemplo).

import * as save from './save.js';

function estadoInicial(saldoInicialCentavos = 30000) {
  return {
    tela: 'abertura',            // onde o jogador está (para continuar depois)
    dinheiroCentavos: saldoInicialCentavos,
    dia: 1,
    nivelAtual: 1,
    maiorNivelDesbloqueado: 1,
    niveisConcluidos: [],
    estoque: { arroz: 0, feijao: 0, acucar: 0 },
    prateleira: {},              // "arroz1" -> "F3:0"
    dia1: { etapa: 'inicio', limpeza: 0 },
  };
}

let estado = estadoInicial();
let saldoInicial = 30000;
const ouvintes = new Set();

function avisar(mudanca) {
  save.salvar(estado);
  for (const fn of ouvintes) fn(estado, mudanca);
}

export const GameState = {
  /** Lê o save, se houver. Retorna true quando havia progresso salvo. */
  iniciar(saldoInicialCentavos) {
    saldoInicial = saldoInicialCentavos;
    const salvo = save.carregar();
    estado = salvo ? { ...estadoInicial(saldoInicial), ...salvo } : estadoInicial(saldoInicial);
    return Boolean(salvo);
  },

  get() { return estado; },

  temProgresso() { return save.existe(); },

  /** Apaga o save e volta ao começo. */
  reiniciar() {
    save.apagar();
    estado = estadoInicial(saldoInicial);
    for (const fn of ouvintes) fn(estado, 'reiniciar');
  },

  ouvir(fn) { ouvintes.add(fn); return () => ouvintes.delete(fn); },

  // ----- Mudanças -----

  irPara(tela) {
    estado.tela = tela;
    avisar('tela');
  },

  gastar(centavos) {
    if (centavos > estado.dinheiroCentavos) return false;
    estado.dinheiroCentavos -= centavos;
    avisar('dinheiro');
    return true;
  },

  adicionarEstoque(itens) {
    for (const [produto, qtd] of Object.entries(itens)) {
      estado.estoque[produto] = (estado.estoque[produto] ?? 0) + qtd;
    }
    avisar('estoque');
  },

  salvarPrateleira(posicoes) {
    estado.prateleira = { ...posicoes };
    avisar('prateleira');
  },

  atualizarDia1(dados) {
    estado.dia1 = { ...estado.dia1, ...dados };
    avisar('dia1');
  },

  concluirNivel(n, totalDeNiveis) {
    if (!estado.niveisConcluidos.includes(n)) estado.niveisConcluidos.push(n);
    estado.maiorNivelDesbloqueado = Math.max(estado.maiorNivelDesbloqueado, Math.min(n + 1, totalDeNiveis));
    avisar('nivel');
  },
};
