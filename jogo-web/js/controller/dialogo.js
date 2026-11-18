// CONTROLLER: falas com texto letra por letra e troca de pose do Luís.

import { el, botao } from '../view/componentes.js';

/**
 * Escreve o texto letra por letra dentro de `elemento`.
 * O texto inteiro já ocupa o espaço desde o início (a parte que falta fica invisível),
 * então o balão não muda de tamanho enquanto as letras aparecem.
 * Retorna { pronto: Promise, completar() }.
 */
export function digitar(elemento, texto, velocidadeMs = 35) {
  const visivel = el('span');
  const falta = el('span', { class: 'falta', 'aria-hidden': 'true' }, texto);
  elemento.replaceChildren(visivel, falta);
  elemento.setAttribute('aria-label', texto);

  const letras = Array.from(texto); // respeita acentos e emojis
  let i = 0;
  let timer;
  let terminar;
  const pronto = new Promise((r) => { terminar = r; });

  const mostrar = (n) => {
    visivel.textContent = letras.slice(0, n).join('');
    falta.textContent = letras.slice(n).join('');
  };

  const completar = () => {
    clearInterval(timer);
    i = letras.length;
    mostrar(i);
    terminar();
  };

  timer = setInterval(() => {
    i += 1;
    mostrar(i);
    if (i >= letras.length) completar();
  }, velocidadeMs);

  return { pronto, completar, get digitando() { return i < letras.length; } };
}

/**
 * Mostra uma sequência de falas e resolve quando o jogador passa a última.
 * falas: [{ texto, pose, resposta? }] — "resposta" vira o texto do botão (fala do Belo, "Sim"...)
 * pasta: personagem em assets/ (luis, empresario...)
 */
export function falar(container, falas, { nome = 'Luís', pasta = 'luis', velocidadeMs = 35, chegada = false } = {}) {
  const caminhoPose = (pose) => `assets/${pasta}/${pose}.webp`;
  for (const { pose } of falas) if (pose) new Image().src = caminhoPose(pose);

  return new Promise((resolver) => {
    let indice = 0;
    let escrita = null;

    const personagem = el('img', { class: 'dialogo__personagem', alt: '', src: chegada ? caminhoPose(falas[0].pose) : null });
    const texto = el('p', { class: 'balao__texto' });
    const acoes = el('div', { class: 'balao__acoes' });
    const balao = el('div', { class: 'balao' },
      el('span', { class: 'balao__nome' }, nome),
      texto,
      acoes);
    // chegada: o personagem entra andando pela direita antes de falar
    const camada = el('div', { class: `dialogo ${chegada ? 'dialogo--chegada' : ''}` }, personagem, balao);
    container.append(camada);

    function mostrar() {
      const fala = falas[indice];
      if (fala.pose) {
        personagem.src = caminhoPose(fala.pose);
        personagem.alt = `${nome} (${fala.pose})`;
        personagem.hidden = false;
      } else {
        personagem.hidden = true;
      }
      // Botões do jogador: "Continuar", uma resposta ou várias (ex.: "Sim" e "Claro")
      const opcoes = fala.respostas ?? [fala.resposta ?? 'Continuar ›'];
      acoes.replaceChildren(...opcoes.map((t) => botao(t, avancar, 'pequeno')));
      escrita = digitar(texto, fala.texto, velocidadeMs);
      acoes.firstChild.focus({ preventScroll: true });
    }

    function avancar() {
      // 1º clique durante a digitação: mostra a fala inteira
      if (escrita?.digitando) { escrita.completar(); return; }
      indice += 1;
      if (indice < falas.length) { mostrar(); return; }
      camada.remove();
      resolver();
    }

    if (chegada) setTimeout(mostrar, 1100);
    else mostrar();
  });
}
