// CONTROLLER: fluxo do Dia 15 (Nível 3 · Expansão).
//
//   videos (contratos Cola Refri e Guaraná Primavera) → contrato (Luís) → compraBebidas → precosBebidas
//   → missao (Sim/Claro) → combinatoria (bebidas na bancada, 480) → posCombinatoria
//   → congelados (Luís) → compraCongelados → precosCongelados → irParaSecao (casinha → Congelados)
//   → naSecao → abastecer (freezer, geladeira e açougue) → abastecido
//   → clientes (sorteados, às vezes pedem o que acabou) → fimDoDia → concluido (card Nível 4)

import { GameState } from '../model/game-state.js';
import { listaDeNiveis, nivel } from '../model/niveis.js';
import { produto, produtosDoNivel } from '../model/produtos.js';
import { comprarNoMercado, definirPrecos, produtosSemPreco, textosDoMercado } from './mercado.js';
import { el } from '../view/componentes.js';
import { carregarJSON } from '../util/formato.js';
import { falar } from './dialogo.js';
import { jogar } from './minigame.js';
import { escurecer, clarear } from './roteador.js';
import { criarCenaDia1 as criarCena } from '../view/dia1.js';
import { mostrarHUD, mostrarCarrinho, esconderCarrinho } from '../view/hud.js';
import { mostrarCardNivel } from '../view/card-nivel.js';
import { abrirLinhaTempo, irParaNivel } from '../view/linha-tempo.js';
import { tocarVideo } from '../view/video.js';
import { criarCombinatoria } from '../minigames/combinatoria.js';
import { atenderSorteado, entreClientes } from './clientes.js';
import {
  liberarSecoes, travarSecoes, esperarSecao, definirFundoPrincipal, areaComOlho,
  secaoAberta, abrirCongelados, camadaDaSecao, fecharSecao,
} from './secoes.js';

const ORDEM = ['videos', 'contrato', 'compraBebidas', 'precosBebidas', 'missao', 'combinatoria', 'posCombinatoria',
  'congelados', 'compraCongelados', 'precosCongelados', 'irParaSecao', 'naSecao', 'abastecer', 'abastecido',
  'clientes', 'fimDoDia', 'concluido'];
const etapa = () => GameState.get().dia3.etapa;
const ir = (proxima) => GameState.atualizarDia3({ etapa: proxima });
const passou = (nome) => ORDEM.indexOf(etapa()) > ORDEM.indexOf(nome);

export const dia3 = {
  etapas: ORDEM,   // usado pelo painel de testes
  dados: null,
  cena: null,

  async montar(container) {
    this.dados ??= await carregarJSON('data/dia3.json');
    if (!GameState.get().mercadoLiberado) GameState.liberarMercado();
    this.cena = criarCena(container);
    await this.cena.trocarFundo(this.dados.cenario);
    definirFundoPrincipal(this.dados.cenario);
    travarSecoes();
    mostrarHUD(etapa() !== 'videos');
    // Voltou do menu no meio da missão dos congelados: reabre a seção
    if (['naSecao', 'abastecer'].includes(etapa())) abrirCongelados();
  },

  desmontar() { esconderCarrinho(); },

  async iniciar() {
    const { falas } = this.dados;
    const camada = this.cena.camada;

    if (etapa() === 'videos') {
      mostrarHUD(false);
      for (const v of this.dados.videos) await tocarVideo(camada, v.base, { legenda: v.legenda, textoPular: this.dados.pularVideo });
      mostrarHUD(true);
      ir('contrato');
    }
    if (etapa() === 'contrato') { await falar(camada, falas.contrato); ir('compraBebidas'); }
    if (etapa() === 'compraBebidas') { await this.comprar(this.dados.compraBebidas); ir('precosBebidas'); }
    if (etapa() === 'precosBebidas') {
      await falar(camada, falas.precosBebidas);
      await definirPrecos(produtosSemPreco());
      ir('missao');
    }
    if (etapa() === 'missao') { await falar(camada, falas.missao); ir('combinatoria'); }
    if (etapa() === 'combinatoria') { await this.missaoPrateleira(); ir('posCombinatoria'); }
    if (etapa() === 'posCombinatoria') { await falar(camada, falas.posCombinatoria); ir('congelados'); }
    if (etapa() === 'congelados') { await falar(camada, falas.congelados); ir('compraCongelados'); }
    if (etapa() === 'compraCongelados') { await this.comprar(this.dados.compraCongelados); ir('precosCongelados'); }
    if (etapa() === 'precosCongelados') { await definirPrecos(produtosSemPreco()); ir('irParaSecao'); }
    if (etapa() === 'irParaSecao') {
      await falar(camada, falas.irParaSecao);
      liberarSecoes(['congelados'], { alerta: 'congelados' });
      await esperarSecao('congelados');
      travarSecoes();
      ir('naSecao');
    }
    if (etapa() === 'naSecao') {
      if (secaoAberta() !== 'congelados') abrirCongelados();
      await falar(camadaDaSecao(), falas.naSecao);
      ir('abastecer');
    }
    if (etapa() === 'abastecer') { await this.abastecer(); ir('abastecido'); }
    if (etapa() === 'abastecido') {
      if (secaoAberta() !== 'congelados') abrirCongelados();
      await falar(camadaDaSecao(), falas.abastecido);
      await escurecer();
      fecharSecao();
      await clarear();
      ir('clientes');
    }
    if (etapa() === 'clientes') {
      const { quantidade, chanceFalta } = this.dados.clientesSorteados;
      const inicio = GameState.get().dia3.cliente ?? 0;
      if (inicio === 0) await falar(camada, falas.clientes);
      for (let i = inicio; i < quantidade; i++) {
        await entreClientes(this.cena, this.dados.entreClientes, { mostrarDica: i === 0 });
        await atenderSorteado(this.cena, { chanceFalta });
        GameState.atualizarDia3({ cliente: i + 1 });
      }
      ir('fimDoDia');
    }
    if (etapa() === 'fimDoDia') {
      await falar(camada, falas.fimDoDia);
      GameState.concluirNivel(this.dados.nivel, listaDeNiveis().length);
      ir('concluido');
    }
    if (passou('fimDoDia')) liberarSecoes(['principal', 'prateleiras', 'congelados']);
    this.mostrarCard();
  },

  // ----- Compra guiada: notificação no carrinho → mercado digital na aba certa -----
  async comprar({ aviso, aba, instrucao, exigir }) {
    const extras = { aba, instrucao, exigir };
    await new Promise((abrir) => mostrarCarrinho({ linhas: aviso, aoClicar: () => { esconderCarrinho(); abrir(); } }));
    while (!(await comprarNoMercado(textosDoMercado(), extras))) {
      await new Promise((abrir) => mostrarCarrinho({ linhas: aviso, aoClicar: () => { esconderCarrinho(); abrir(); } }));
    }
    esconderCarrinho();
  },

  // ----- "FAÇA SUA MISSÃO!" na prateleira → combinatória -----
  async missaoPrateleira() {
    const camada = this.cena.camada;
    const { missaoAviso, areaMissao, combinatoria } = this.dados;
    await new Promise((abrir) => {
      const aviso = el('div', { class: 'missao-aviso', role: 'status' },
        missaoAviso, el('span', { class: 'missao-aviso__alerta', 'aria-hidden': 'true' }, '!'));
      const area = areaComOlho(areaMissao, () => { aviso.remove(); area.remove(); abrir(); });
      area.classList.add('area-olho--missao');
      camada.append(area, aviso);
    });
    const itens = combinatoria.produtos.map((id) => { const p = produto(id); return { id, nome: p.nome, imagem: p.imagem }; });
    await escurecer();
    const fim = jogar(criarCombinatoria({ produtos: itens, textos: combinatoria }), camada);
    await clarear();
    await fim;
  },

  // ----- Colocar pelo menos 1 unidade de cada congelado e carne comprados -----
  abastecer() {
    if (secaoAberta() !== 'congelados') abrirCongelados();
    liberarSecoes(['congelados'], { alerta: 'congelados' });
    const precisa = () => produtosDoNivel(this.dados.nivel)
      .filter((p) => ['freezer', 'acougue'].includes(p.local) && (GameState.get().estoque[p.id] ?? 0) > 0);
    const pronto = () => precisa().every((p) => GameState.exposto(p.id) >= 1);
    const [linha1, linha2] = this.dados.abastecerAviso;
    const aviso = el('div', { class: 'missao-aviso missao-aviso--topo', role: 'status' }, `${linha1} ${linha2}`);
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
