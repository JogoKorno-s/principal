// CONTROLLER: fluxo do Dia 2 (Nível 2).
//
//   inicio (empresário doa o caixa) → luis → cliente → caixa (troco)
//   → posCaixa → desafios (café, óleo, leite) → compra (reposição) → posCompra
//   → precos (25% de lucro) → posPrecos → clientes (3 vendas) → fimDoDia → concluido (card Nível 3)
//
// A etapa fica salva no GameState, como no Dia 1.

import { GameState } from '../model/game-state.js';
import { listaDeNiveis, nivel } from '../model/niveis.js';
import { produtos, produto, precoDeVenda, totalDaVenda, limiteEstoqueBaixo } from '../model/produtos.js';
import { carregarJSON, esperar } from '../util/formato.js';
import { falar } from './dialogo.js';
import { jogar } from './minigame.js';
import { escurecer, clarear } from './roteador.js';
import { criarCenaDia1 as criarCena } from '../view/dia1.js';
import { mostrarHUD, mostrarCarrinho, esconderCarrinho } from '../view/hud.js';
import { mostrarCardNivel } from '../view/card-nivel.js';
import { abrirLinhaTempo, irParaNivel } from '../view/linha-tempo.js';
import { notificarReposicao } from '../view/estoque.js';
import { criarCaixa } from '../minigames/caixa.js';
import { criarMultiplaEscolha } from '../minigames/multipla-escolha.js';
import { criarAtacadista } from '../minigames/atacadista.js';
import { criarPrecificacao } from '../minigames/precificacao.js';

const ORDEM = ['inicio', 'luis', 'cliente', 'caixa', 'posCaixa', 'desafios', 'compra', 'posCompra',
  'precos', 'posPrecos', 'clientes', 'fimDoDia', 'concluido'];
const etapa = () => GameState.get().dia2.etapa;
const ir = (proxima) => GameState.atualizarDia2({ etapa: proxima });
const passou = (nome) => ORDEM.indexOf(etapa()) > ORDEM.indexOf(nome);
const sobreposicao = () => document.getElementById('sobreposicao');

export const dia2 = {
  dados: null,
  cena: null,

  async montar(container) {
    this.dados ??= await carregarJSON('data/dia2.json');
    if (etapa() === 'posDesafios') ir('compra'); // save de uma versão anterior
    this.cena = criarCena(container);
    await this.cena.trocarFundo(this.fundoDaEtapa());
    mostrarHUD(true);
  },

  desmontar() { esconderCarrinho(); },

  fundoDaEtapa() {
    const { caixaAntigo, caixaNovo, abastecido } = this.dados.cenarios;
    if (etapa() === 'inicio') return caixaAntigo;
    return passou('compra') ? abastecido : caixaNovo;
  },

  async iniciar() {
    const { falas, cenarios } = this.dados;
    const camada = this.cena.camada;

    if (etapa() === 'inicio') {
      await falar(camada, falas.empresario, { nome: 'Empresário', pasta: 'empresario' });
      await this.trocarFundo(cenarios.caixaNovo);
      ir('luis');
    }
    if (etapa() === 'luis') { await falar(camada, falas.luis); ir('cliente'); }
    if (etapa() === 'cliente' || etapa() === 'caixa') {
      await this.atender(this.dados.primeiroCliente, this.dados.primeiroCliente.totalCentavos);
      ir('posCaixa');
    }
    if (etapa() === 'posCaixa') { await falar(camada, falas.posCaixa); ir('desafios'); }
    if (etapa() === 'desafios') { await this.desafios(); ir('compra'); }
    if (etapa() === 'compra') {
      await this.compra();
      await this.trocarFundo(cenarios.abastecido);
      ir('posCompra');
    }
    if (etapa() === 'posCompra') { await falar(camada, falas.posCompra); ir('precos'); }
    if (etapa() === 'precos') { await this.precos(); ir('posPrecos'); }
    if (etapa() === 'posPrecos') { await falar(camada, falas.posPrecos); ir('clientes'); }
    if (etapa() === 'clientes') {
      const { clientes } = this.dados;
      for (let i = GameState.get().dia2.cliente ?? 0; i < clientes.length; i++) {
        await this.atender(clientes[i]);
        GameState.atualizarDia2({ cliente: i + 1 });
      }
      ir('fimDoDia');
    }
    if (etapa() === 'fimDoDia') {
      await falar(camada, falas.fimDoDia);
      GameState.concluirNivel(this.dados.nivel, listaDeNiveis().length);
      ir('concluido');
    }
    this.mostrarCard();
  },

  async trocarFundo(src) {
    await escurecer();
    await this.cena.trocarFundo(src);
    await clarear();
  },

  // ----- Um cliente: chega, fala, passa os produtos no caixa e paga -----
  async atender(cliente, totalFixo) {
    const { caixa, esperaClienteMs } = this.dados;
    await esperar(esperaClienteMs);   // alguns segundos até o cliente entrar
    await falar(this.cena.camada, cliente.falas, { nome: cliente.nome, pasta: cliente.pasta, chegada: true });

    const total = totalFixo ?? totalDaVenda(cliente.produtos, GameState.get().precos);
    const config = {
      ...caixa,
      produtos: cliente.produtos.map((id) => { const p = produto(id); return { id, nome: p.nome, imagem: p.imagem }; }),
      recebidoCentavos: cliente.recebidoCentavos,
      totalCentavos: total,
    };

    await escurecer();
    mostrarHUD(false);
    const fim = jogar(criarCaixa(config), this.cena.camada);
    await clarear();
    await fim;
    GameState.vender(cliente.produtos, total);
    await escurecer();
    mostrarHUD(true);
    await clarear();

    // Aviso de reposição para o que está acabando
    const { estoque } = GameState.get();
    const acabando = [...new Set(cliente.produtos)].filter((id) => (estoque[id] ?? 0) <= limiteEstoqueBaixo());
    if (acabando.length) notificarReposicao(acabando);
  },

  // ----- Três desafios de múltipla escolha, abertos pelo carrinho -----
  desafios() {
    const { desafios, notificacao } = this.dados;
    return new Promise((terminar) => {
      const abrir = async () => {
        esconderCarrinho();
        for (let i = GameState.get().dia2.desafio ?? 0; i < desafios.length; i++) {
          await jogar(criarMultiplaEscolha(desafios[i]), sobreposicao());
          GameState.atualizarDia2({ desafio: i + 1 });
        }
        terminar();
      };
      mostrarCarrinho({ linhas: notificacao, aoClicar: abrir });
    });
  },

  // ----- Reposição: o jogador escolhe quantas unidades de cada produto comprar -----
  async compra() {
    const { estoque } = GameState.get();
    const config = {
      ...this.dados.compra,
      produtos: produtos().map((p) => ({
        id: p.id, nome: p.nome, unidade: p.unidade, imagem: p.imagem,
        precoCentavos: p.custoCentavos, estoque: estoque[p.id] ?? 0,
      })),
    };
    for (;;) {
      const r = await jogar(criarAtacadista({ config, saldo: () => GameState.get().dinheiroCentavos }), sobreposicao());
      if (r.ok) {
        GameState.gastar(r.total);
        GameState.adicionarEstoque(r.itens);
        return;
      }
      // Fechou o painel: reabre pelo carrinho
      await new Promise((reabrir) => mostrarCarrinho({ linhas: ['REPONHA O ESTOQUE!'], aoClicar: () => { esconderCarrinho(); reabrir(); } }));
    }
  },

  // ----- Preço de venda com 25% de lucro -----
  async precos() {
    const itens = produtos().map((p) => ({ ...p, esperadoCentavos: precoDeVenda(p.custoCentavos) }));
    await jogar(criarPrecificacao({ itens, ...this.dados.precos }), sobreposicao());
    GameState.definirPrecos(Object.fromEntries(itens.map((p) => [p.id, p.esperadoCentavos])));
  },

  // ----- Card "NÍVEL 3 DESBLOQUEADO!" -----
  mostrarCard() {
    const { card } = this.dados;
    mostrarCardNivel({
      titulo: card.titulo,
      destaque: card.destaque,
      subtitulo: card.subtitulo,
      acoes: [
        { texto: card.botaoProximo, aoClicar: () => irParaNivel(nivel(card.proximoNivel)) },
        { texto: card.botaoProgresso, aoClicar: () => abrirLinhaTempo(), variante: 'secundario' },
      ],
    });
  },
};
