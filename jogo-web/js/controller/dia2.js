// CONTROLLER: fluxo do Dia 2 (Nível 2).
//
//   inicio (empresário doa o caixa) → luis → cliente → caixa (troco)
//   → posCaixa → desafios (café, óleo, leite) → compra (reposição) → posCompra
//   → precos (25% de lucro) → posPrecos → clientes (3 sorteados) → fimDoDia → concluido (card Nível 3)
//
// Entre um cliente e outro o jogador pode olhar as prateleiras, o computador (vendas) e usar a casinha.
//
// A etapa fica salva no GameState, como no Dia 1.

import { GameState } from '../model/game-state.js';
import { listaDeNiveis, nivel } from '../model/niveis.js';
import { produtosDoNivel } from '../model/produtos.js';
import { comprarNoMercado, definirPrecos } from './mercado.js';
import { carregarJSON } from '../util/formato.js';
import { falar } from './dialogo.js';
import { jogar } from './minigame.js';
import { escurecer, clarear } from './roteador.js';
import { criarCenaDia1 as criarCena } from '../view/dia1.js';
import { mostrarHUD, mostrarCarrinho, esconderCarrinho } from '../view/hud.js';
import { mostrarCardNivel } from '../view/card-nivel.js';
import { abrirLinhaTempo, irParaNivel } from '../view/linha-tempo.js';
import { criarMultiplaEscolha } from '../minigames/multipla-escolha.js';
import { atenderRoteiro, atenderSorteado, entreClientes } from './clientes.js';
import { travarSecoes, definirFundoPrincipal } from './secoes.js';

const ORDEM = ['inicio', 'luis', 'cliente', 'caixa', 'posCaixa', 'desafios', 'compra', 'posCompra',
  'precos', 'posPrecos', 'clientes', 'fimDoDia', 'concluido'];
const etapa = () => GameState.get().dia2.etapa;
const ir = (proxima) => GameState.atualizarDia2({ etapa: proxima });
const passou = (nome) => ORDEM.indexOf(etapa()) > ORDEM.indexOf(nome);
const sobreposicao = () => document.getElementById('sobreposicao');

export const dia2 = {
  etapas: ORDEM,   // usado pelo painel de testes
  dados: null,
  cena: null,

  async montar(container) {
    this.dados ??= await carregarJSON('data/dia2.json');
    if (etapa() === 'posDesafios') ir('compra'); // save de uma versão anterior
    if (passou('compra') && !GameState.get().mercadoLiberado) GameState.liberarMercado();
    this.cena = criarCena(container);
    await this.cena.trocarFundo(this.fundoDaEtapa());
    definirFundoPrincipal(this.fundoDaEtapa());
    travarSecoes();
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
      await atenderRoteiro(this.cena, this.dados.primeiroCliente);
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
      const { quantidade, chanceFalta } = this.dados.clientesSorteados;
      for (let i = GameState.get().dia2.cliente ?? 0; i < quantidade; i++) {
        await entreClientes(this.cena, this.dados.entreClientes, { mostrarDica: i === 0 });
        await atenderSorteado(this.cena, { chanceFalta });
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
    definirFundoPrincipal(src);
    await clarear();
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

  // ----- Mercado digital (tutorial): o Luís apresenta e o jogador repõe o estoque -----
  async compra() {
    await falar(this.cena.camada, this.dados.falas.compraIntro);
    const { compra } = this.dados;
    const regras = {}; // sem estoque mínimo: o jogador decide quanto repor
    // O jogador abre o mercado pelo carrinho, para aprender onde ele fica
    await new Promise((abrir) => mostrarCarrinho({ linhas: compra.aviso, aoClicar: () => { esconderCarrinho(); abrir(); } }));
    // Fechou o painel sem comprar: reabre pelo carrinho
    while (!(await comprarNoMercado(compra, regras))) {
      await new Promise((reabrir) => mostrarCarrinho({ linhas: ['REPONHA O ESTOQUE!'], aoClicar: () => { esconderCarrinho(); reabrir(); } }));
    }
    GameState.liberarMercado();
    esconderCarrinho();   // a partir daqui o carrinho sempre abre o mercado digital
  },

  // ----- Preço de venda: o jogador escolhe, com pelo menos 25% de lucro -----
  async precos() {
    const ids = produtosDoNivel(this.dados.nivel).map((p) => p.id);
    await definirPrecos(ids, this.dados.precos);
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
