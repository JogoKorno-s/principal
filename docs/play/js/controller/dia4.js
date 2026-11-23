// CONTROLLER: fluxo do Dia 45 (Nível 4 · Moto Entrega).
//
//   video (Belo repondo os congelados) → letreiro "DIA 45" (caixa com o que juntou no período)
//   → faturamento (Luís apresenta o Moto Entrega) → primeiroPedido (cestinha + velocidade + motoboy)
//   → geladeira (Luís) → comprarGeladeira (obrigatória, R$ 250) → geladeiraComprada
//   → abastecerGeladeira (bebidas na geladeira) → geladeiraPronta
//   → novosProdutos (oferta no carrinho, compra opcional) → atendimento (cronômetro e índice)
//   → expediente (clientes com cronômetro + pedidos que chegam sozinhos) → fimDoDia → concluido

import { GameState } from '../model/game-state.js';
import { listaDeNiveis, nivel } from '../model/niveis.js';
import { produtosDoNivel, precoDeVenda } from '../model/produtos.js';
import { comprarNoMercado, definirPrecos, produtosSemPreco, textosDoMercado } from './mercado.js';
import { el, avisar } from '../view/componentes.js';
import { carregarJSON } from '../util/formato.js';
import { falar } from './dialogo.js';
import { escurecer, clarear } from './roteador.js';
import { criarCenaDia1 as criarCena } from '../view/dia1.js';
import { mostrarHUD, mostrarCarrinho, esconderCarrinho, esconderTopoEsquerdo } from '../view/hud.js';
import { mostrarCardNivel } from '../view/card-nivel.js';
import { abrirLinhaTempo, irParaNivel } from '../view/linha-tempo.js';
import { tocarVideo, mostrarLetreiro } from '../view/video.js';
import { mostrarCompraMelhoria } from '../view/entregas.js';
import { atenderSorteado, entreClientes } from './clientes.js';
import {
  ativarMotoEntrega, desativarMotoEntrega, liberarMoto, novoPedido, comecarChegada, pararChegada, esperarEntregas,
} from './entregas.js';
import {
  liberarSecoes, travarSecoes, definirFundoPrincipal, areaComOlho, abrirPrateleiras, fecharSecao, mostrarOlhosDaPrincipal,
} from './secoes.js';

const ORDEM = ['video', 'faturamento', 'primeiroPedido', 'geladeira', 'comprarGeladeira', 'geladeiraComprada',
  'abastecerGeladeira', 'geladeiraPronta', 'novosProdutos', 'compraNovos', 'precosNovos', 'atendimento',
  'expediente', 'fimDoDia', 'concluido'];
const etapa = () => GameState.get().dia4.etapa;
const ir = (proxima) => GameState.atualizarDia4({ etapa: proxima });
const passou = (nome) => ORDEM.indexOf(etapa()) > ORDEM.indexOf(nome);
const ESPACOS_DA_PRATELEIRA = 12;   // na parede esquerda, os espaços 12 em diante são da geladeira

export const dia4 = {
  etapas: ORDEM,   // usado pelo painel de testes
  dados: null,
  cena: null,

  async montar(container) {
    this.dados ??= await carregarJSON('data/dia4.json');
    if (!GameState.get().mercadoLiberado) GameState.liberarMercado();
    this.cena = criarCena(container);
    await this.trocarCenario();
    travarSecoes();
    mostrarHUD(etapa() !== 'video');
    if (passou('video')) ativarMotoEntrega({ indice: passou('novosProdutos') });
  },

  desmontar() {
    esconderCarrinho();
    desativarMotoEntrega();
    esconderTopoEsquerdo();
  },

  async trocarCenario() {
    const src = GameState.get().melhorias?.geladeiraBebidas ? this.dados.cenarioComGeladeira : this.dados.cenario;
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
      ir('faturamento');
    }
    if (etapa() === 'faturamento') {
      // O balão do Moto Entrega aparece quando o Luís fala da parceria
      await falar(camada, falas.faturamento.slice(0, 2));
      ativarMotoEntrega();
      await falar(camada, falas.faturamento.slice(2, 3));
      if (!(GameState.get().dia4.pedidos ?? []).length) {
        novoPedido(this.dados.primeiroPedido);
      }
      await falar(camada, falas.faturamento.slice(3));
      ir('primeiroPedido');
    }
    if (etapa() === 'primeiroPedido') {
      if (!(GameState.get().dia4.pedidos ?? []).length) novoPedido();
      // Para separar o pedido, o jogador anda pelas seções (casinha e olhos da visão principal)
      liberarSecoes(['principal', 'prateleiras', 'congelados']);
      const tirarOlhos = mostrarOlhosDaPrincipal(this.cena.camada);
      liberarMoto(true);
      await esperarEntregas(1);
      liberarMoto(false);
      tirarOlhos();
      travarSecoes();
      ir('geladeira');
    }
    if (etapa() === 'geladeira') { await falar(camada, falas.geladeira); ir('comprarGeladeira'); }
    if (etapa() === 'comprarGeladeira') {
      const oferta = this.dados.compraGeladeira;
      await mostrarCompraMelhoria(oferta);
      // Compra obrigatória: se faltar dinheiro (raro), o caixa fica zerado
      if (!GameState.comprarMelhoria('geladeiraBebidas', oferta.precoCentavos)) {
        GameState.definirDinheiro(0);
        GameState.comprarMelhoria('geladeiraBebidas', 0);
      }
      avisar(oferta.sucesso, 'sucesso');
      await escurecer();
      await this.trocarCenario();
      await clarear();
      ir('geladeiraComprada');
    }
    if (etapa() === 'geladeiraComprada') { await falar(camada, falas.geladeiraComprada); ir('abastecerGeladeira'); }
    if (etapa() === 'abastecerGeladeira') { await this.abastecerGeladeira(); ir('geladeiraPronta'); }
    if (etapa() === 'geladeiraPronta') { await falar(camada, falas.geladeiraPronta); ir('novosProdutos'); }
    if (etapa() === 'novosProdutos') { await falar(camada, falas.novosProdutos); ir('compraNovos'); }
    // Compra opcional: o carrinho fica com a oferta, mas o dia segue (o jogador decide se compra)
    if (etapa() === 'compraNovos' || etapa() === 'precosNovos') { this.oferecerNovos(); ir('atendimento'); }
    if (etapa() === 'atendimento') {
      ativarMotoEntrega({ indice: true });
      await falar(camada, falas.atendimento);
      ir('expediente');
    }
    if (etapa() === 'expediente') { await this.expediente(); ir('fimDoDia'); }
    if (etapa() === 'fimDoDia') {
      await falar(camada, falas.fimDoDia);
      GameState.concluirNivel(this.dados.nivel, listaDeNiveis().length);
      ir('concluido');
    }
    if (passou('fimDoDia')) {
      liberarSecoes(['principal', 'prateleiras', 'congelados']);
      liberarMoto(true);
    }
    this.mostrarCard();
  },

  /**
   * Pulo de 30 dias: o caixa passa a ter o que o mercado juntou (com centavos quebrados),
   * o Belo deixou o estoque reposto e todo produto liberado ganha preço de venda.
   */
  passarOTempo() {
    const { dinheiroNoDia45Centavos, estoqueMinimo } = this.dados;
    const estado = GameState.get();
    if (estado.dinheiroCentavos < dinheiroNoDia45Centavos) GameState.definirDinheiro(dinheiroNoDia45Centavos);
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

  /** Oferta dos produtos novos no carrinho. Abre o mercado digital (com preço de venda) quando o jogador quiser. */
  oferecerNovos() {
    const { aviso, aba, instrucao } = this.dados.compraNovos;
    mostrarCarrinho({
      linhas: aviso,
      aoClicar: async () => {
        esconderCarrinho();
        if (await comprarNoMercado(textosDoMercado(), { aba, instrucao })) await definirPrecos(produtosSemPreco());
      },
    });
  },

  // ----- Missão: pelo menos 1 unidade de cada bebida do estoque dentro da geladeira -----
  abastecerGeladeira() {
    const camada = this.cena.camada;
    const { aviso: textoAviso, area: areaMissao } = this.dados.missaoGeladeira;
    const bebidas = () => produtosDoNivel(this.dados.nivel)
      .filter((p) => p.atacadista === 'bebidas' && (GameState.get().estoque[p.id] ?? 0) > 0);
    const naGeladeira = (id) => Object.entries(GameState.get().expositores['parede-esquerda'] ?? {})
      .some(([k, e]) => Number(k) >= ESPACOS_DA_PRATELEIRA && e.id === id);
    const pronto = () => bebidas().every((p) => naGeladeira(p.id));

    const aviso = el('div', { class: 'missao-aviso missao-aviso--topo', role: 'status' }, textoAviso,
      el('span', { class: 'missao-aviso__alerta', 'aria-hidden': 'true' }, '!'));
    const area = areaComOlho(areaMissao, () => abrirPrateleiras('parede-esquerda'));
    area.classList.add('area-olho--missao');
    camada.append(area);
    document.getElementById('tela').append(aviso);
    liberarSecoes(['principal', 'prateleiras'], { alerta: 'prateleiras' });

    return new Promise((terminar) => {
      const conferir = async () => {
        if (!pronto()) return;
        parar();
        aviso.remove();
        area.remove();
        travarSecoes();
        await escurecer();
        fecharSecao();
        await clarear();
        terminar();
      };
      const parar = GameState.ouvir(conferir);
      conferir();
    });
  },

  // ----- Expediente: clientes com cronômetro e pedidos do Moto Entrega chegando -----
  async expediente() {
    const { clientesSorteados: { quantidade, chanceFalta }, entregasNoExpediente, chegadaDePedidosSegundos, entreClientes: textos } = this.dados;
    const estado = GameState.get().dia4;
    // Meta: as entregas do expediente além da primeira (tutorial)
    const meta = estado.metaEntregas ?? (estado.entregasFeitas ?? 0) + entregasNoExpediente;
    GameState.atualizarDia4({ metaEntregas: meta });
    if (!(estado.pedidos ?? []).length) novoPedido();
    comecarChegada(chegadaDePedidosSegundos);

    let i = GameState.get().dia4.cliente ?? 0;
    const entregasFeitas = () => (GameState.get().dia4.entregasFeitas ?? 0) >= meta;
    while (i < quantidade || !entregasFeitas()) {
      liberarMoto(true);
      if (i < quantidade) {
        await entreClientes(this.cena, textos, { mostrarDica: i === 0 });
        liberarMoto(false);
        await atenderSorteado(this.cena, { chanceFalta, cronometro: true });
        i += 1;
        GameState.atualizarDia4({ cliente: i });
      } else {
        // Clientes atendidos: o dia só acaba depois das entregas
        if (!(GameState.get().dia4.pedidos ?? []).length) novoPedido();
        avisar(textos.faltamEntregas, '', 5000);
        await entreClientes(this.cena, { aviso: textos.faltamEntregas }, { fim: esperarEntregas(meta) });
      }
    }
    liberarMoto(false);
    pararChegada();
  },

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
