// MINIGAME: combinatória na prateleira de bebidas (Nível 3).
//
//   1ª parte — Entrada: ordem das 6 bebidas na bancada (arrastar troca de lugar)
//              Validação: Cola Refri e Guaraná Primavera não podem ficar lado a lado
//   2ª parte — Entrada: quantas organizações são possíveis
//              Validação: 6! − 2 × 5! = 720 − 240 = 480
//   Resultado: selo ✓ ou "TENTE NOVAMENTE". O botão Dica explica o passo a passo de cada parte.

import { el, botao, selo, pontoNoPalco } from '../view/componentes.js';
import { esperar } from '../util/formato.js';
import { botaoDica } from '../view/dica.js';

const CENTROS = [265, 553, 833, 1113, 1392, 1679];   // centro de cada tapete da bancada (palco 1920)
const BASE = 880;                                     // onde as garrafas apoiam
const TAMANHO = 300;

/** produtos: [{ id, nome, imagem }] na ordem inicial; textos: data/dia3.json → combinatoria */
export function criarCombinatoria({ produtos, textos }) {
  let ordem = [...produtos];
  let fase = 'organizar';
  let erros = 0;
  let raiz, camadaProdutos, texto, acoes, feedback, entrada;

  const lado = (a, b) => Math.abs(ordem.findIndex((p) => p.id === a) - ordem.findIndex((p) => p.id === b)) === 1;

  function desenharProdutos() {
    camadaProdutos.replaceChildren(...ordem.map((p, i) => {
      const img = el('img', {
        class: `combinatoria__produto ${fase === 'organizar' ? 'combinatoria__produto--arrastavel' : ''}`,
        src: p.imagem, alt: p.nome, draggable: 'false',
        style: { left: `${CENTROS[i] - TAMANHO / 2}px`, top: `${BASE - TAMANHO}px`, width: `${TAMANHO}px`, height: `${TAMANHO}px` },
      });
      if (fase === 'organizar') img.addEventListener('pointerdown', (e) => arrastar(e, i, img));
      return img;
    }));
  }

  function arrastar(evento, origem, img) {
    evento.preventDefault();
    const inicio = pontoNoPalco(evento);
    img.classList.add('arrastado');
    const mover = (e) => {
      const p = pontoNoPalco(e);
      img.style.transform = `translate(${p.x - inicio.x}px, ${p.y - inicio.y}px)`;
    };
    const soltar = (e) => {
      window.removeEventListener('pointermove', mover);
      window.removeEventListener('pointerup', soltar);
      const { x } = pontoNoPalco(e);
      const destino = CENTROS.findIndex((c) => Math.abs(c - x) < 140);
      if (destino >= 0 && destino !== origem) {
        [ordem[origem], ordem[destino]] = [ordem[destino], ordem[origem]];
        feedback.replaceChildren();
      }
      desenharProdutos();
    };
    window.addEventListener('pointermove', mover);
    window.addEventListener('pointerup', soltar);
  }

  function mostrarFase(enviar) {
    if (fase === 'organizar') {
      texto.textContent = textos.organizar;
      acoes.replaceChildren(
        botaoDica(textos.dicaOrganizar),
        botao(textos.botaoOrganizar, () => enviar({ fase, ordem: ordem.map((p) => p.id) }), 'grande'));
    } else {
      texto.textContent = textos.pergunta;
      entrada = el('input', {
        class: 'combinatoria__entrada', type: 'text', inputmode: 'numeric', autocomplete: 'off',
        placeholder: textos.placeholder, 'aria-label': textos.placeholder,
        onkeydown: (e) => { if (e.key === 'Enter') enviar({ fase, resposta: entrada.value }); },
        oninput: () => feedback.replaceChildren(),
      });
      acoes.replaceChildren(entrada, botao('Enviar', () => enviar({ fase, resposta: entrada.value }), 'grande'), botaoDica(textos.dicaContar));
      entrada.focus({ preventScroll: true });
    }
    desenharProdutos();
  }

  let enviarGuardado;
  return {
    montar(container, enviar) {
      enviarGuardado = enviar;
      texto = el('p', { class: 'combinatoria__texto' });
      acoes = el('div', { class: 'combinatoria__acoes' });
      feedback = el('div', { class: 'combinatoria__feedback', 'aria-live': 'assertive' });
      camadaProdutos = el('div', { class: 'combinatoria__produtos' });
      raiz = el('div', { class: 'combinatoria', role: 'dialog', 'aria-label': 'Missão das prateleiras' },
        el('div', { class: 'combinatoria__painel' }, texto, acoes, feedback),
        el('img', { class: 'combinatoria__bancada', src: 'assets/ui/bancada.webp', alt: '' }),
        camadaProdutos);
      container.append(raiz);
      mostrarFase(enviar);
    },

    validar(entrada) {
      if (entrada.fase === 'organizar') {
        const [a, b] = textos.rivais;
        return lado(a, b) ? { ok: false, mensagem: textos.erroOrganizar } : { ok: true, mensagem: textos.certoOrganizar };
      }
      const limpo = String(entrada.resposta ?? '').replace(/\D/g, '');
      if (!limpo) return { ok: false, vazio: true, mensagem: textos.vazio };
      return Number(limpo) === textos.resposta ? { ok: true, mensagem: textos.certo } : { ok: false, mensagem: textos.erro };
    },

    async resultado(r, entrada) {
      if (r.vazio) { feedback.replaceChildren(r.mensagem); return false; }
      feedback.replaceChildren(selo(r.ok), ' ', r.mensagem);
      if (!r.ok) {
        if (++erros >= 2) feedback.append(el('p', { class: 'combinatoria__dica' }, textos.lembrete));
        return false;
      }
      if (entrada.fase === 'organizar') {
        await esperar(1200);
        fase = 'contar';
        feedback.replaceChildren();
        mostrarFase(enviarGuardado);
        return false;
      }
      await esperar(1600);
      return true;
    },

    desmontar() { raiz.remove(); },
  };
}
