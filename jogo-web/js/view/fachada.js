// VIEW: tutorial na fachada — falas do Luís e botão para entrar no mercado.

import { el, botao, carregarImagem } from './componentes.js';
import { falar } from '../controller/dialogo.js';
import { ir } from '../controller/roteador.js';
import { carregarJSON } from '../util/formato.js';
import { mostrarHUD } from './hud.js';

export const fachada = {
  dados: null,

  async montar(container) {
    this.dados ??= await carregarJSON('data/fachada.json');
    const fundo = await carregarImagem(this.dados.cenario);
    fundo.className = 'cenario';
    fundo.alt = "Fachada do supermercado Korno's";
    container.append(fundo);
    mostrarHUD(true);
  },

  // Chamado pelo roteador depois do fade de entrada
  async iniciar(container) {
    await falar(container, this.dados.falas);
    const entrar = botao(this.dados.botaoEntrar, () => ir('dia1'), 'grande');
    entrar.classList.add('fachada__entrar');
    container.append(entrar);
    entrar.focus({ preventScroll: true });
  },
};
