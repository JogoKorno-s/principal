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
    estoque: { arroz: 0, feijao: 0, acucar: 0, leite: 0, oleo: 0, cafe: 0 },
    precos: {},                  // preço de venda em centavos: { arroz: 1570 }
    mercadoLiberado: false,      // carrinho do HUD abre o mercado digital
    prateleira: {},              // "arroz1" -> "F3:0" (minigame do Dia 1)
    expositores: {},             // { freezer: { 3: { id: 'pizza', qtd: 2 } } } — produtos expostos
    vendasHoje: {},              // { arroz: { qtd: 2, receita: 3140 } }
    dia1: { etapa: 'inicio', limpeza: 0 },
    dia2: { etapa: 'inicio' },
    dia3: { etapa: 'videos' },
    dia4: { etapa: 'video' },
    melhorias: {},               // { geladeiraBebidas: true } — compras para o mercado
    atendimentos: [],            // notas (0 a 100) dos últimos clientes com cronômetro
  };
}

let estado = estadoInicial();

/** Depois de uma venda, o expositor não pode mostrar mais do que existe no estoque. */
function tirarDosExpositores(id) {
  let sobra = GameState.exposto(id) - (estado.estoque[id] ?? 0);
  for (const espacos of Object.values(estado.expositores)) {
    for (const [chave, e] of Object.entries(espacos)) {
      if (sobra <= 0) return;
      if (e.id !== id) continue;
      const tirar = Math.min(sobra, e.qtd);
      e.qtd -= tirar;
      sobra -= tirar;
      if (e.qtd === 0) delete espacos[chave];
    }
  }
}
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
    const inicial = estadoInicial(saldoInicial);
    estado = salvo ? { ...inicial, ...salvo, estoque: { ...inicial.estoque, ...salvo.estoque } } : inicial;
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

  ganhar(centavos) {
    estado.dinheiroCentavos += centavos;
    avisar('dinheiro');
  },

  /**
   * Venda no caixa: tira os produtos do estoque, soma o valor no caixa
   * e anota nas vendas de hoje. receitas: valor de cada item (mesma ordem de ids).
   */
  vender(ids, totalCentavos, receitas = []) {
    ids.forEach((id, i) => {
      estado.estoque[id] = Math.max(0, (estado.estoque[id] ?? 0) - 1);
      const venda = estado.vendasHoje[id] ?? { qtd: 0, receita: 0 };
      estado.vendasHoje[id] = { qtd: venda.qtd + 1, receita: venda.receita + (receitas[i] ?? 0) };
      tirarDosExpositores(id);
    });
    estado.dinheiroCentavos += totalCentavos;
    avisar('dinheiro');
  },

  /** Total exposto de um produto somando prateleiras, freezers e açougue. */
  exposto(id) {
    let total = 0;
    for (const espacos of Object.values(estado.expositores)) {
      for (const e of Object.values(espacos)) if (e.id === id) total += e.qtd;
    }
    return total;
  },

  /** Coloca (delta > 0) ou tira (delta < 0) unidades de um espaço do expositor. */
  exporProduto(expositor, espaco, id, delta) {
    const espacos = (estado.expositores[expositor] ??= {});
    const atual = espacos[espaco] ?? { id, qtd: 0 };
    const qtd = atual.qtd + delta;
    if (qtd <= 0) delete espacos[espaco];
    else espacos[espaco] = { id, qtd };
    avisar('expositor');
  },

  liberarMercado() {
    estado.mercadoLiberado = true;
    avisar('mercado');
  },

  definirPrecos(precos) {
    estado.precos = { ...estado.precos, ...precos };
    avisar('precos');
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

  atualizarDia2(dados) {
    estado.dia2 = { ...estado.dia2, ...dados };
    avisar('dia2');
  },

  atualizarDia3(dados) {
    estado.dia3 = { ...estado.dia3, ...dados };
    avisar('dia3');
  },

  atualizarDia4(dados) {
    estado.dia4 = { ...estado.dia4, ...dados };
    avisar('dia4');
  },

  /** Pula no tempo (Dia 45): o caixa passa a ter o que o mercado juntou nesse período. */
  definirDinheiro(centavos) {
    estado.dinheiroCentavos = centavos;
    avisar('dinheiro');
  },

  /** Compra de uma melhoria (ex.: geladeira de bebidas). */
  comprarMelhoria(id, centavos) {
    if (centavos > estado.dinheiroCentavos) return false;
    estado.dinheiroCentavos -= centavos;
    estado.melhorias = { ...estado.melhorias, [id]: true };
    avisar('dinheiro');
    return true;
  },

  /** Nota de um atendimento com cronômetro (guarda os 10 últimos). */
  registrarAtendimento(nota) {
    estado.atendimentos = [...(estado.atendimentos ?? []), nota].slice(-10);
    avisar('atendimento');
  },

  /**
   * MODO DE TESTES: monta um estado pronto para jogar o nível `nivel` a partir da `etapa`.
   * Os níveis anteriores ficam concluídos; o estoque, os preços, o dinheiro e as melhorias
   * vêm prontos (montados pelo painel de testes). Apaga o progresso atual.
   */
  prepararTeste({ nivel, dia, tela, etapa, dinheiroCentavos, estoque, precos, expositores, melhorias }) {
    const novo = estadoInicial(saldoInicial);
    for (let n = 1; n < nivel; n++) novo[`dia${n}`] = { ...novo[`dia${n}`], etapa: 'concluido' };
    novo[`dia${nivel}`] = { etapa };
    Object.assign(novo, {
      tela, dia, nivelAtual: nivel,
      maiorNivelDesbloqueado: Math.max(nivel, estado.maiorNivelDesbloqueado ?? 1),
      niveisConcluidos: Array.from({ length: nivel - 1 }, (_, i) => i + 1),
      mercadoLiberado: nivel >= 3,
      dinheiroCentavos,
      estoque: { ...novo.estoque, ...estoque },
      precos, expositores, melhorias,
    });
    estado = novo;
    avisar('reiniciar');
  },

  /** Entra num nível: atualiza o número do dia no HUD. */
  comecarNivel(n, dia) {
    if (estado.dia !== dia) estado.vendasHoje = {};   // dia novo, vendas zeradas
    estado.nivelAtual = n;
    estado.dia = dia;
    avisar('dia');
  },

  concluirNivel(n, totalDeNiveis) {
    if (!estado.niveisConcluidos.includes(n)) estado.niveisConcluidos.push(n);
    estado.maiorNivelDesbloqueado = Math.max(estado.maiorNivelDesbloqueado, Math.min(n + 1, totalDeNiveis));
    avisar('nivel');
  },
};
