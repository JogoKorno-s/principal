// VIEW: abertura com as 11 cenas (imagens e vídeos) e legenda letra por letra.

import { el, botao, carregarImagem, criarVideo } from './componentes.js';
import { digitar } from '../controller/dialogo.js';
import { ir, escurecer, clarear } from '../controller/roteador.js';
import { carregarJSON } from '../util/formato.js';
import { mostrarHUD } from './hud.js';

export const abertura = {
  dados: null,
  indice: 0,
  midia: null,
  escrita: null,
  trocando: false,

  async montar(container) {
    mostrarHUD(false);
    this.dados ??= await carregarJSON('data/abertura.json');
    this.indice = 0;
    this.container = container;

    this.camadaMidia = el('div');
    this.texto = el('p', { class: 'legenda__texto' });
    this.botaoContinuar = botao('Continuar ›', () => this.continuar(), 'pequeno');
    this.legenda = el('div', { class: 'legenda' }, this.texto, this.botaoContinuar);
    this.pular = botao('Pular abertura', () => this.irParaFachada(), 'pequeno claro');
    this.pular.classList.add('abertura__pular');

    container.append(this.camadaMidia, this.legenda, this.pular);
    await this.mostrarCena();
  },

  desmontar() {
    this.escrita?.completar();
    this.midia?.pause?.();
  },

  async mostrarCena() {
    const cena = this.dados.cenas[this.indice];

    // Mídia de fundo
    this.midia?.pause?.();
    let novaMidia;
    if (cena.imagem) {
      novaMidia = await carregarImagem(cena.imagem);
      novaMidia.className = 'abertura__midia';
      novaMidia.alt = '';
    } else {
      novaMidia = criarVideo(cena.video, { classe: 'abertura__midia' });
      novaMidia.setAttribute('aria-hidden', 'true');
    }
    this.camadaMidia.replaceChildren(novaMidia);
    this.midia = novaMidia;
    if (novaMidia.play) novaMidia.play().catch(() => { novaMidia.muted = true; novaMidia.play().catch(() => {}); });

    // Tela final: "O destino do Korno's agora está em suas mãos."
    if (cena.final) {
      this.legenda.hidden = true;
      this.pular.hidden = true;
      const iniciar = botao(cena.botao, () => this.irParaFachada(), 'grande');
      this.container.append(el('div', { class: 'abertura__final' }, el('p', {}, cena.texto), iniciar));
      iniciar.focus({ preventScroll: true });
      return;
    }

    this.escrita = digitar(this.texto, cena.texto, this.dados.velocidadeLetraMs);
    this.botaoContinuar.focus({ preventScroll: true });
  },

  async continuar() {
    if (this.trocando) return;
    if (this.escrita?.digitando) { this.escrita.completar(); return; }
    if (this.indice >= this.dados.cenas.length - 1) return;

    this.trocando = true;
    await escurecer();
    this.indice += 1;
    await this.mostrarCena();
    await clarear();
    this.trocando = false;
  },

  irParaFachada() {
    this.escrita?.completar();
    ir('fachada');
  },
};
