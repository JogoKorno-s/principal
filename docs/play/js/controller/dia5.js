// CONTROLLER: fluxo do Dia 90 (Nível 5 · Segurança e quitanda).
//
//   video (reportagem sobre os assaltos) → letreiro "DIA 90" → seguranca (Luís)
//   → camera (trigonometria: tan 30° = 4 ÷ x) → cameraInstalada (cenário com a câmera)
//   → perimetro (múltipla escolha com o mapa) → arame (quantos rolos comprar) → cercaInstalada
//   → quitanda (Luís) → compraQuitanda (mercado digital, aba Hortifruti) → precosQuitanda
//   → irParaQuitanda (casinha → Quitanda) → naQuitanda → abastecer → abastecido
//   → expediente (clientes com cronômetro + Moto Entrega) → fimDoDia → concluido

import { GameState } from '../model/game-state.js';
import { listaDeNiveis } from '../model/niveis.js';
import { produtosDoNivel, precoDeVenda } from '../model/produtos.js';
import { comprarNoMercado, definirPrecos, produtosSemPreco, textosDoMercado } from './mercado.js';
import { jogar } from './minigame.js';
import { el, avisar } from '../view/componentes.js';
import { carregarJSON } from '../util/formato.js';
import { falar } from './dialogo.js';
import { escurecer, clarear } from './roteador.js';
import { criarCenaDia1 as criarCena } from '../view/dia1.js';
import { mostrarHUD, mostrarCarrinho, esconderCarrinho, esconderTopoEsquerdo } from '../view/hud.js';
import { mostrarCardNivel } from '../view/card-nivel.js';
import { abrirLinhaTempo } from '../view/linha-tempo.js';
import { tocarVideo, mostrarLetreiro } from '../view/video.js';
import { criarTrigonometria } from '../minigames/trigonometria.js';
import { criarMultiplaEscolha } from '../minigames/multipla-escolha.js';
import { criarArame } from '../minigames/arame.js';
import { atenderSorteado, entreClientes } from './clientes.js';
import {
  ativarMotoEntrega, desativarMotoEntrega, liberarMoto, novoPedido, comecarChegada, pararChegada, esperarEntregas,
} from './entregas.js';
import {
  liberarSecoes, travarSecoes, definirFundoPrincipal, esperarSecao, secaoAberta, abrirQuitanda, camadaDaSecao, fecharSecao,
} from './secoes.js';

const ORDEM = ['video', 'seguranca', 'camera', 'cameraInstalada', 'perimetro', 'arame', 'cercaInstalada',
  'quitanda', 'compraQuitanda', 'precosQuitanda', 'irParaQuitanda', 'naQuitanda', 'abastecer', 'abastecido',
  'expediente', 'fimDoDia', 'concluido'];
const etapa = () => GameState.get().dia5.etapa;
const ir = (proxima) => GameState.atualizarDia5({ etapa: proxima });
const passou = (nome) => ORDEM.indexOf(etapa()) > ORDEM.indexOf(nome);
const SECOES_LIVRES = ['principal', 'prateleiras', 'congelados', 'quitanda'];
const sobreposicao = () => document.getElementById('sobreposicao');

export const dia5 = {
  etapas: ORDEM,   // usado pelo painel de testes
  dados: null,
  cena: null,

  async montar(container) {
    this.dados ??= await carregarJSON('data/dia5.json');
    if (!GameState.get().mercadoLiberado) GameState.liberarMercado();
    this.cena = criarCena(container);
    await this.trocarCenario();
    travarSecoes();
    mostrarHUD(etapa() !== 'video');
    if (passou('video')) ativarMotoEntrega({ indice: true });
  },

  desmontar() {
    esconderCarrinho();
    desativarMotoEntrega();
    esconderTopoEsquerdo();
  },

  async trocarCenario() {
    const src = GameState.get().melhorias?.cameraSeguranca ? this.dados.cenarioComCamera : this.dados.cenario;
    await this.cena.trocarFundo(src);
    definirFundoPrincipal(src);
  },

  async iniciar() {
    const { falas } = this.dados;
    const camada = this.cena.camada;

    if (etapa() === 'video') {
      mostrarHUD(false);
      await tocarVideo(camada, this.dados.video.base, { legenda: this.dados.video.legenda, textoPular: this.dados.pularVideo });
      await mostrarLetreiro(camada, this.dados.letreiro);
      this.passarOTempo();
      mostrarHUD(true);
      ativarMotoEntrega({ indice: true });
      ir('seguranca');
    }
    if (etapa() === 'seguranca') { await falar(camada, falas.seguranca); ir('camera'); }
    if (etapa() === 'camera') {
      await jogar(criarTrigonometria(this.dados.camera), sobreposicao());
      GameState.comprarMelhoria('cameraSeguranca', 0);
      await escurecer();
      await this.trocarCenario();
      await clarear();
      ir('cameraInstalada');
    }
    if (etapa() === 'cameraInstalada') { await falar(camada, falas.cameraInstalada); ir('perimetro'); }
    if (etapa() === 'perimetro') {
      await jogar(criarMultiplaEscolha(this.dados.perimetro, { botaoTexto: this.dados.botaoPerimetro }), sobreposicao());
      await falar(camada, falas.perimetroCerto);
      ir('arame');
    }
    if (etapa() === 'arame') {
      const { arame } = this.dados;
      const r = await jogar(criarArame({ ...arame, saldo: () => GameState.get().dinheiroCentavos }), sobreposicao());
      GameState.comprarMelhoria('cercaArame', r.total ?? 0);
      avisar(arame.sucesso, 'sucesso');
      ir('cercaInstalada');
    }
    if (etapa() === 'cercaInstalada') { await falar(camada, falas.cercaInstalada); ir('quitanda'); }
    if (etapa() === 'quitanda') { await falar(camada, falas.quitanda); ir('compraQuitanda'); }
    if (etapa() === 'compraQuitanda') { await this.comprar(this.dados.compraQuitanda); ir('precosQuitanda'); }
    if (etapa() === 'precosQuitanda') {
      if (produtosSemPreco().length) {
        await falar(camada, falas.precosQuitanda);
        await definirPrecos(produtosSemPreco());
      }
      ir('irParaQuitanda');
    }
    if (etapa() === 'irParaQuitanda') {
      await falar(camada, falas.irParaQuitanda);
      liberarSecoes(['quitanda'], { alerta: 'quitanda' });
      await esperarSecao('quitanda');
      travarSecoes();
      ir('naQuitanda');
    }
    if (etapa() === 'naQuitanda') {
      if (secaoAberta() !== 'quitanda') abrirQuitanda();
      await falar(camadaDaSecao(), falas.naQuitanda);
      ir('abastecer');
    }
    if (etapa() === 'abastecer') { await this.abastecer(); ir('abastecido'); }
    if (etapa() === 'abastecido') {
      if (secaoAberta() !== 'quitanda') abrirQuitanda();
      await falar(camadaDaSecao(), falas.abastecido);
      await escurecer();
      fecharSecao();
      await clarear();
      ir('expediente');
    }
    if (etapa() === 'expediente') {
      if (!GameState.get().dia5.cliente) await falar(camada, falas.expediente);
      await this.expediente();
      ir('fimDoDia');
    }
    if (etapa() === 'fimDoDia') {
      await falar(camada, falas.fimDoDia);
      GameState.concluirNivel(this.dados.nivel, listaDeNiveis().length);
      ir('concluido');
    }
    if (passou('fimDoDia')) {
      liberarSecoes(SECOES_LIVRES);
      liberarMoto(true);
    }
    this.mostrarCard();
  },

  /**
   * Pulo de 45 dias: o caixa passa a ter o que o mercado juntou, o Belo deixou o estoque
   * reposto e todo produto já liberado ganha preço de venda.
   */
  passarOTempo() {
    const { dinheiroNoDia90Centavos, estoqueMinimo } = this.dados;
    const estado = GameState.get();
    if (estado.dinheiroCentavos < dinheiroNoDia90Centavos) GameState.definirDinheiro(dinheiroNoDia90Centavos);
    const repor = {};
    const precos = {};
    for (const p of produtosDoNivel(this.dados.nivel - 1)) {
      const falta = estoqueMinimo - (estado.estoque[p.id] ?? 0);
      if (falta > 0) repor[p.id] = falta;
      if (!estado.precos[p.id]) precos[p.id] = precoDeVenda(p.custoCentavos);
    }
    GameState.adicionarEstoque(repor);
    if (Object.keys(precos).length) GameState.definirPrecos(precos);
  },

  // ----- Compra guiada: notificação no carrinho → mercado digital na aba Hortifruti -----
  async comprar({ aviso, aba, instrucao }) {
    const extras = { aba, instrucao };
    await new Promise((abrir) => mostrarCarrinho({ linhas: aviso, aoClicar: () => { esconderCarrinho(); abrir(); } }));
    while (!(await comprarNoMercado(textosDoMercado(), extras))) {
      await new Promise((abrir) => mostrarCarrinho({ linhas: aviso, aoClicar: () => { esconderCarrinho(); abrir(); } }));
    }
    esconderCarrinho();
  },

  // ----- Quitanda: pelo menos N produtos diferentes expostos (ou todos, se comprou menos que N) -----
  abastecer() {
    if (secaoAberta() !== 'quitanda') abrirQuitanda();
    liberarSecoes(['quitanda'], { alerta: 'quitanda' });
    const daQuitanda = () => produtosDoNivel(this.dados.nivel)
      .filter((p) => p.local === 'quitanda' && (GameState.get().estoque[p.id] ?? 0) > 0);
    const pronto = () => {
      const lista = daQuitanda();
      const expostos = lista.filter((p) => GameState.exposto(p.id) >= 1).length;
      return expostos >= Math.min(this.dados.minimoNaQuitanda, lista.length);
    };
    const aviso = el('div', { class: 'missao-aviso missao-aviso--topo', role: 'status' }, this.dados.abastecerAviso);
    document.getElementById('tela').append(aviso);
    return new Promise((terminar) => {
      const conferir = () => {
        if (!pronto()) return;
        parar();
        aviso.remove();
        travarSecoes();
        terminar();
      };
      const parar = GameState.ouvir(conferir);
      conferir();
    });
  },

  // ----- Expediente: clientes com cronômetro e pedidos do Moto Entrega chegando -----
  async expediente() {
    const { clientesSorteados: { quantidade, chanceFalta }, entregasNoExpediente, chegadaDePedidosSegundos, entreClientes: textos } = this.dados;
    const estado = GameState.get();
    const meta = estado.dia5.metaEntregas ?? (estado.dia4.entregasFeitas ?? 0) + entregasNoExpediente;
    GameState.atualizarDia5({ metaEntregas: meta });
    liberarSecoes(SECOES_LIVRES);
    if (!(estado.dia4.pedidos ?? []).length) novoPedido();
    comecarChegada(chegadaDePedidosSegundos);

    let i = GameState.get().dia5.cliente ?? 0;
    const entregasFeitas = () => (GameState.get().dia4.entregasFeitas ?? 0) >= meta;
    while (i < quantidade || !entregasFeitas()) {
      liberarMoto(true);
      if (i < quantidade) {
        await entreClientes(this.cena, textos, { mostrarDica: i === 0 });
        liberarMoto(false);
        await atenderSorteado(this.cena, { chanceFalta, cronometro: true });
        i += 1;
        GameState.atualizarDia5({ cliente: i });
      } else {
        if (!(GameState.get().dia4.pedidos ?? []).length) novoPedido();
        avisar(textos.faltamEntregas, '', 5000);
        await entreClientes(this.cena, { aviso: textos.faltamEntregas }, { fim: esperarEntregas(meta) });
      }
    }
    liberarMoto(false);
    pararChegada();
    travarSecoes();
  },

  /** Último nível: o card de parabéns deixa o jogador continuar no mercado ou ver a linha do tempo. */
  mostrarCard() {
    const { card } = this.dados;
    const fechar = mostrarCardNivel({
      titulo: card.titulo,
      destaque: card.destaque,
      subtitulo: card.subtitulo,
      acoes: [
        { texto: card.botaoContinuar, aoClicar: () => { fechar(); this.jogoLivre(); } },
        { texto: card.botaoProgresso, aoClicar: () => abrirLinhaTempo(), variante: 'secundario' },
      ],
    });
  },

  /** Depois do fim: mercado aberto, com clientes um atrás do outro. */
  async jogoLivre() {
    liberarSecoes(SECOES_LIVRES);
    liberarMoto(true);
    const { clientesSorteados: { chanceFalta }, entreClientes: textos } = this.dados;
    const camadaAtual = this.cena.camada;
    // Enquanto o jogador continuar nesta tela, chegam clientes
    while (camadaAtual.isConnected) {
      await entreClientes(this.cena, textos, {});
      if (!camadaAtual.isConnected) break;
      await atenderSorteado(this.cena, { chanceFalta, cronometro: true });
    }
  },
};

