// VIEW: botão "Dica" dos desafios de matemática e a janela com o passo a passo.
//
// passos: [{ texto, conta? }] — "conta" aparece destacada (ex.: "18 ÷ 0,5 = ?").
// A dica explica o caminho com os números do próprio exercício, mas deixa a última conta para o jogador.

import { el, botao } from './componentes.js';

const LAMPADA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.7.5 1.1 1.3 1.1 2.2h5c0-.9.4-1.7 1.1-2.2A6 6 0 0 0 12 3Z" fill="#ffd23f"/></svg>';

/** Abre a janela da dica. Resolve quando fechar. */
export function mostrarDica({ titulo = 'Como resolver', passos = [], rodape = '' }) {
  return new Promise((fechou) => {
    const fechar = () => { fundo.remove(); fechou(); };
    const lista = el('ol', { class: 'dica__passos' }, passos.map((p, i) => el('li', { class: 'dica__passo' },
      el('span', { class: 'dica__numero' }, String(i + 1)),
      el('div', {},
        el('p', { class: 'dica__texto' }, p.texto),
        p.conta ? el('div', { class: 'dica__conta' }, p.conta) : null))));
    const painel = el('div', { class: 'painel dica', role: 'dialog', 'aria-modal': 'true', 'aria-label': titulo },
      el('h2', { class: 'painel__titulo dica__titulo' }, el('span', { class: 'dica__lampada', html: LAMPADA }), titulo),
      lista,
      rodape ? el('p', { class: 'dica__rodape' }, rodape) : null,
      el('div', { class: 'modal__acoes' }, botao('Entendi!', fechar)));
    const fundo = el('div', { class: 'fundo-escuro dica__fundo' }, painel);
    fundo.addEventListener('keydown', (e) => { if (e.key === 'Escape') fechar(); });
    document.getElementById('sobreposicao').append(fundo);
    painel.querySelector('.modal__acoes button').focus({ preventScroll: true });
  });
}

/** Botão amarelo "Dica". `conteudo` pode ser um objeto ou uma função que devolve { titulo, passos }. */
export function botaoDica(conteudo, texto = 'Dica') {
  return el('button', {
    type: 'button', class: 'botao-dica', title: 'Ver como resolver',
    onclick: () => mostrarDica(typeof conteudo === 'function' ? conteudo() : conteudo),
  }, el('span', { html: LAMPADA }), texto);
}

/** Troca {chave} pelos valores: preencherDica("{km} ÷ {h}", { km: 18, h: '0,5' }) */
export function preencherDica(texto, valores) {
  return String(texto).replace(/\{(\w+)\}/g, (_, k) => (k in valores ? valores[k] : `{${k}}`));
}

/** Aplica preencherDica em todos os passos. */
export function passosCom(passos, valores) {
  return passos.map((p) => ({ texto: preencherDica(p.texto, valores), conta: p.conta ? preencherDica(p.conta, valores) : null }));
}
