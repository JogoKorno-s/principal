// CONTROLLER: fluxo do Dia 1 (Nível 1).
//
//   inicio → limpeza → posLimpeza → compra → fimDoDia → prateleira → concluido
//
// A etapa fica salva no GameState: se o jogador fechar o navegador,
// volta exatamente para a etapa em que estava.

import { GameState } from '../model/game-state.js';
import { listaDeNiveis, nivel } from '../model/niveis.js';
import { carregarJSON } from '../util/formato.js';
import { falar } from './dialogo.js';
import { jogar } from './minigame.js';
import { escurecer, clarear } from './roteador.js';
import { criarCenaDia1 } from '../view/dia1.js';
import { mostrarHUD, mostrarCarrinho, esconderCarrinho, esconderOferta } from '../view/hud.js';
import { mostrarCardNivel } from '../view/card-nivel.js';
import { abrirLinhaTempo, irParaNivel } from '../view/linha-tempo.js';
import { avisar, limparAvisos } from '../view/componentes.js';
import { criarLimpeza } from '../minigames/limpeza.js';
import { criarAtacadista } from '../minigames/atacadista.js';
import { criarPrateleira } from '../minigames/prateleira.js';
import { travarSecoes } from './secoes.js';

const ORDEM = ['inicio', 'limpeza', 'posLimpeza', 'compra', 'fimDoDia', 'prateleira', 'concluido'];
const etapa = () => GameState.get().dia1.etapa;
const passou = (nome) => ORDEM.indexOf(etapa()) > ORDEM.indexOf(nome);

export const dia1 = {
  etapas: ORDEM,   // usado pelo painel de testes
  dados: null,
  cena: null,

  async montar(container) {
    this.dados ??= await carregarJSON('data/dia1.json');
    this.cena = criarCenaDia1(container);
    await this.cena.trocarFundo(this.fundoDaEtapa());
    travarSecoes();   // no Dia 1 só a Tela inicial fica liberada na casinha
    mostrarHUD(true);
  },

  desmontar() {
    esconderCarrinho();
  },

  fundoDaEtapa() {
    const { cenarios } = this.dados;
    if (passou('compra')) return cenarios.abastecido;
    if (passou('limpeza')) return cenarios.limpeza.at(-1);
    return cenarios.limpeza[GameState.get().dia1.limpeza];
  },

  /** Depois do fade de entrada: continua da etapa salva. */
  async iniciar() {
    const { falas } = this.dados;
    const camada = this.cena.camada;

    if (etapa() === 'inicio') {
      await falar(camada, falas.inicio);
      GameState.atualizarDia1({ etapa: 'limpeza' });
    }

    if (etapa() === 'limpeza') {
      await this.limpeza();
      limparAvisos();
      GameState.atualizarDia1({ etapa: 'posLimpeza' });
    }

    if (etapa() === 'posLimpeza') {
      await falar(camada, falas.posLimpeza);
      GameState.atualizarDia1({ etapa: 'compra' });
    }

    if (etapa() === 'compra') {
      await this.compra();
      await escurecer();
      await this.cena.trocarFundo(this.dados.cenarios.abastecido, 'Supermercado abastecido');
      GameState.atualizarDia1({ etapa: 'fimDoDia' });
      await clarear();
    }

    if (etapa() === 'fimDoDia') {
      await falar(camada, falas.fimDoDia);
      GameState.atualizarDia1({ etapa: 'prateleira' });
    }

    if (etapa() === 'prateleira') {
      await this.prateleira();
      GameState.concluirNivel(this.dados.nivel, listaDeNiveis().length);
      GameState.atualizarDia1({ etapa: 'concluido' });
    }

    this.mostrarCard();
  },

  // ----- Limpeza -----
  limpeza() {
    const { cenarios, limpeza } = this.dados;
    const minigame = criarLimpeza({
      config: limpeza,
      inicio: GameState.get().dia1.limpeza,
      aoLimpar: async (n, removerBolinha) => {
        await escurecer();
        await this.cena.trocarFundo(cenarios.limpeza[n]);
        removerBolinha();
        GameState.atualizarDia1({ limpeza: n });
        await clarear();
      },
    });
    return jogar(minigame, this.cena.camada);
  },

  // ----- Compra no atacadista (o painel pode ser fechado e reaberto pelo carrinho) -----
  compra() {
    const { compra } = this.dados;
    return new Promise((terminar) => {
      const abrir = async () => {
        esconderOferta();
        const minigame = criarAtacadista({ config: compra, saldo: () => GameState.get().dinheiroCentavos });
        const r = await jogar(minigame, document.getElementById('sobreposicao'));
        if (!r.ok) { mostrarCarrinho({ linhas: compra.oferta, aoClicar: abrir }); return; }
        GameState.gastar(r.total);
        GameState.adicionarEstoque(r.itens);
        esconderCarrinho();
        terminar();
      };
      mostrarCarrinho({ linhas: compra.oferta, aoClicar: abrir });
    });
  },

  // ----- Prateleira -----
  async prateleira() {
    const { prateleira, cenarios } = this.dados;
    avisar(prateleira.dicaMercado, '', 5000);
    await this.cena.esperarCliqueNaPrateleira(prateleira.areaNoMercado);

    const estado = GameState.get();
    const minigame = criarPrateleira({
      config: prateleira,
      fundo: cenarios.prateleira,
      estoque: estado.estoque,
      salvas: estado.prateleira,
      aoSalvar: (posicoes) => GameState.salvarPrateleira(posicoes),
      aoVoltar: () => escurecer(),
    });

    await escurecer();
    mostrarHUD(false);
    const fim = jogar(minigame, this.cena.camada);
    await clarear();
    await fim;            // o jogador clicou em Voltar (a tela já está escura)
    mostrarHUD(true);
    await clarear();
  },

  // ----- Card "NÍVEL 2 DESBLOQUEADO!" -----
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
