// CONTROLLER: fluxo do Dia 2 (Nível 2).
//
//   inicio (empresário doa o caixa) → luis → cliente → caixa (troco)
//   → posCaixa → desafios (café, óleo, leite) → compra (reposição) → posCompra
//   → precos (25% de lucro) → posPrecos → clientes (3 vendas) → fimDoDia → concluido (card Nível 3)
//
// A etapa fica salva no GameState, como no Dia 1.

import { GameState } from '../model/game-state.js';
import { listaDeNiveis, nivel } from '../model/niveis.js';
import { produtos, produto, precoDeVenda, precoMaximoPercentual, totalDaVenda, limiteEstoqueBaixo } from '../model/produtos.js';
import { comprarNoMercado } from './mercado.js';
import { criarPrateleira } from '../minigames/prateleira.js';
import { el, botao, avisar } from '../view/componentes.js';
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
    this.geometria ??= await carregarJSON('data/dia1.json');   // vagas da prateleira
    if (etapa() === 'posDesafios') ir('compra'); // save de uma versão anterior
    if (passou('compra') && !GameState.get().mercadoLiberado) GameState.liberarMercado();
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
        await this.entreClientes(clientes[i]);
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
    // O cliente paga com a menor nota que cobre o total (ou com o valor fixo do roteiro)
    const recebido = cliente.recebidoCentavos ?? this.dados.notasDinheiro.find((n) => n >= total) ?? total;
    const config = {
      ...caixa,
      produtos: cliente.produtos.map((id) => { const p = produto(id); return { id, nome: p.nome, imagem: p.imagem }; }),
      recebidoCentavos: recebido,
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

  // ----- Mercado digital (tutorial): o Luís apresenta e o jogador repõe o estoque -----
  async compra() {
    await falar(this.cena.camada, this.dados.falas.compraIntro);
    const { compra } = this.dados;
    const regras = { estoqueMinimo: compra.estoqueMinimo, mensagemEstoque: compra.mensagemEstoque };
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
    const { precos } = GameState.get();
    const itens = produtos().map((p) => ({
      ...p,
      minimoCentavos: precoDeVenda(p.custoCentavos),
      maximoCentavos: p.custoCentavos * (1 + precoMaximoPercentual() / 100),
      atualCentavos: precos[p.id],
    }));
    const r = await jogar(criarPrecificacao({ itens, ...this.dados.precos }), sobreposicao());
    GameState.definirPrecos(r.precos);
  },

  // ----- Entre um cliente e outro: ver a prateleira ou chamar o próximo -----
  entreClientes(proximo) {
    const textos = this.dados.entreClientes;
    return new Promise((seguir) => {
      const barra = el('div', { class: 'entre-clientes' },
        botao(textos.verPrateleira, () => this.verPrateleira(), 'grande secundario'),
        botao(textos.proximo, () => {
          const { estoque } = GameState.get();
          const falta = proximo.produtos.find((id) => (estoque[id] ?? 0) < proximo.produtos.filter((x) => x === id).length);
          if (falta) {
            avisar(textos.faltaEstoque.replace('{nome}', produto(falta).nome.toLowerCase()), 'erro', 4500);
            notificarReposicao([falta]);
            return;
          }
          barra.remove();
          seguir();
        }, 'grande'));
      this.cena.camada.append(barra);
    });
  },

  async verPrateleira() {
    const [{ prateleira }, { estoque, prateleira: salvas }] = [this.geometria, GameState.get()];
    // Até 4 unidades de cada produto aparecem na prateleira (3 fileiras de 8 vagas)
    const itens = produtos().flatMap((p) =>
      Array.from({ length: Math.min(4, estoque[p.id] ?? 0) }, (_, k) => ({ id: `${p.id}${k + 1}`, tipo: p.id, imagem: p.imagem })));
    const minigame = criarPrateleira({
      config: { ...prateleira, produtos: itens, dica: this.dados.entreClientes.dicaPrateleira },
      fundo: this.dados.cenarios.prateleira ?? 'assets/cenarios/prateleira.webp',
      estoque, salvas,
      aoSalvar: (posicoes) => GameState.salvarPrateleira(posicoes),
      aoVoltar: () => escurecer(),
    });
    await escurecer();
    mostrarHUD(false);
    const fim = jogar(minigame, this.cena.camada);
    await clarear();
    await fim;
    mostrarHUD(true);
    await clarear();
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
