// CONTROLLER: fluxo do Dia 2 (Nível 2).
//
//   inicio (empresário doa o caixa) → luis → cliente → caixa (troco)
//   → posCaixa (Luís + "COMPRE PÓ DE CAFÉ!") → desafios (café, óleo, leite) → posDesafios → clientes
//
// A etapa fica salva no GameState, como no Dia 1.

import { GameState } from '../model/game-state.js';
import { carregarJSON, esperar } from '../util/formato.js';
import { falar } from './dialogo.js';
import { jogar } from './minigame.js';
import { escurecer, clarear } from './roteador.js';
import { criarCenaDia1 as criarCena } from '../view/dia1.js';
import { mostrarHUD, mostrarCarrinho, esconderCarrinho } from '../view/hud.js';
import { avisar } from '../view/componentes.js';
import { criarCaixa } from '../minigames/caixa.js';
import { criarMultiplaEscolha } from '../minigames/multipla-escolha.js';

const etapa = () => GameState.get().dia2.etapa;
const ir = (proxima) => GameState.atualizarDia2({ etapa: proxima });

export const dia2 = {
  dados: null,
  cena: null,

  async montar(container) {
    this.dados ??= await carregarJSON('data/dia2.json');
    this.cena = criarCena(container);
    const { caixaAntigo, caixaNovo } = this.dados.cenarios;
    await this.cena.trocarFundo(etapa() === 'inicio' ? caixaAntigo : caixaNovo);
    mostrarHUD(true);
  },

  desmontar() { esconderCarrinho(); },

  async iniciar() {
    const { falas, cenarios } = this.dados;
    const camada = this.cena.camada;

    if (etapa() === 'inicio') {
      await falar(camada, falas.empresario, { nome: 'Empresário', pasta: 'empresario' });
      await escurecer();
      await this.cena.trocarFundo(cenarios.caixaNovo, 'Caixa novo do supermercado');
      ir('luis');
      await clarear();
    }

    if (etapa() === 'luis') {
      await falar(camada, falas.luis);
      ir('cliente');
    }

    if (etapa() === 'cliente') {
      await esperar(this.dados.esperaClienteMs);   // alguns segundos até o cliente entrar
      await falar(camada, falas.cliente, { nome: 'Cliente', pasta: 'senhor', chegada: true });
      ir('caixa');
    }

    if (etapa() === 'caixa') {
      await this.caixa();
      ir('posCaixa');
    }

    if (etapa() === 'posCaixa') {
      await falar(camada, falas.posCaixa);
      ir('desafios');
    }

    if (etapa() === 'desafios') {
      await this.desafios();
      ir('posDesafios');
    }

    if (etapa() === 'posDesafios') {
      await falar(camada, falas.posDesafios);
      ir('clientes');
    }

    // Próxima entrega: mais clientes no caixa e o card "NÍVEL 3 DESBLOQUEADO!"
    avisar(this.dados.mensagemEmBreve, '', 6000);
  },

  // ----- Caixa eletrônico: arrastar o produto até o leitor e calcular o troco -----
  async caixa() {
    const { caixa } = this.dados;
    await escurecer();
    mostrarHUD(false);
    const fim = jogar(criarCaixa(caixa), this.cena.camada);
    await clarear();
    await fim;
    // O cliente pagou: o caixa recebe o valor da compra
    GameState.ganhar(caixa.totalCentavos);
    await escurecer();
    mostrarHUD(true);
    await clarear();
  },

  // ----- Três desafios de múltipla escolha, abertos pelo carrinho -----
  desafios() {
    const { desafios, notificacao } = this.dados;
    return new Promise((terminar) => {
      const abrir = async () => {
        esconderCarrinho();
        const camada = document.getElementById('sobreposicao');
        for (let i = GameState.get().dia2.desafio ?? 0; i < desafios.length; i++) {
          await jogar(criarMultiplaEscolha(desafios[i]), camada);
          GameState.atualizarDia2({ desafio: i + 1 });
        }
        terminar();
      };
      mostrarCarrinho({ linhas: notificacao, aoClicar: abrir });
    });
  },
};
