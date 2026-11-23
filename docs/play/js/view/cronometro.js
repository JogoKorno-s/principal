// VIEW: bolinha de paciência do cliente (cronômetro do caixa, Nível 4 em diante).
// Começa verde e vai esvaziando; na metade fica amarela; no fim fica vermelha e o cliente fica irritado.

import { el } from './componentes.js';

const RAIO = 46;
const VOLTA = 2 * Math.PI * RAIO;
// Carinha do cliente: boca muda conforme a paciência
const BOCAS = {
  verde: 'M38 66 Q55 80 72 66',
  amarelo: 'M38 70 L72 70',
  vermelho: 'M38 76 Q55 62 72 76',
};

/** Cria a bolinha. Devolve { elemento, parar() → segundos }. */
export function criarCronometro(limiteSegundos, textos) {
  const inicio = performance.now();
  const anel = el('div', { class: 'cronometro cronometro--verde', role: 'timer', 'aria-label': textos.rotulo });
  anel.innerHTML = `
    <svg viewBox="0 0 110 110" aria-hidden="true">
      <circle class="cronometro__fundo" cx="55" cy="55" r="${RAIO}"/>
      <circle class="cronometro__barra" cx="55" cy="55" r="${RAIO}" stroke-dasharray="${VOLTA}" stroke-dashoffset="0" transform="rotate(-90 55 55)"/>
      <circle class="cronometro__olho" cx="42" cy="46" r="5"/>
      <circle class="cronometro__olho" cx="68" cy="46" r="5"/>
      <path class="cronometro__boca" d="${BOCAS.verde}"/>
    </svg>`;
  const tempo = el('span', { class: 'cronometro__tempo' }, `${limiteSegundos}s`);
  const aviso = el('span', { class: 'cronometro__aviso', hidden: true }, textos.irritado);
  const elemento = el('div', { class: 'cronometro__caixa' }, el('span', { class: 'cronometro__rotulo' }, textos.rotulo), anel, tempo, aviso);
  const barra = anel.querySelector('.cronometro__barra');
  const boca = anel.querySelector('.cronometro__boca');

  let cor = 'verde';
  const segundos = () => (performance.now() - inicio) / 1000;
  const tique = () => {
    const s = segundos();
    const resto = Math.max(0, limiteSegundos - s);
    barra.setAttribute('stroke-dashoffset', String(VOLTA * (1 - resto / limiteSegundos)));
    tempo.textContent = `${Math.ceil(resto)}s`;
    const nova = s >= limiteSegundos ? 'vermelho' : s >= limiteSegundos / 2 ? 'amarelo' : 'verde';
    if (nova !== cor) {
      anel.classList.replace(`cronometro--${cor}`, `cronometro--${nova}`);
      boca.setAttribute('d', BOCAS[nova]);
      cor = nova;
      aviso.hidden = nova !== 'vermelho';
    }
  };
  const relogio = setInterval(tique, 200);
  tique();

  return {
    elemento,
    parar() { clearInterval(relogio); return Math.round(segundos()); },
  };
}
