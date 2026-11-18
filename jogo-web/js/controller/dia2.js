// CONTROLLER: fluxo do Dia 2 (Nível 2).
//
//   inicio (empresário doa o caixa) → luis (caixa novo) → clientes
//
// A etapa fica salva no GameState, como no Dia 1.

import { GameState } from '../model/game-state.js';
import { carregarJSON } from '../util/formato.js';
import { falar } from './dialogo.js';
import { escurecer, clarear } from './roteador.js';
import { criarCenaDia1 as criarCena } from '../view/dia1.js';
import { mostrarHUD } from '../view/hud.js';
import { avisar } from '../view/componentes.js';

const etapa = () => GameState.get().dia2.etapa;

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

  async iniciar() {
    const { falas, cenarios } = this.dados;
    const camada = this.cena.camada;

    if (etapa() === 'inicio') {
      await falar(camada, falas.empresario, { nome: 'Empresário', pasta: 'empresario' });
      await escurecer();
      await this.cena.trocarFundo(cenarios.caixaNovo, 'Caixa novo do supermercado');
      GameState.atualizarDia2({ etapa: 'luis' });
      await clarear();
    }

    if (etapa() === 'luis') {
      await falar(camada, falas.luis);
      GameState.atualizarDia2({ etapa: 'clientes' });
    }

    // Próxima entrega: primeiro cliente e o caixa eletrônico (troco)
    avisar(this.dados.mensagemEmBreve, '', 6000);
  },
};
