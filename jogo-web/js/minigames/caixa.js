// MINIGAME: caixa eletrônico.
// 1) Entrada: produto arrastado até o leitor · Validação: caiu no leitor? · Resultado: bip vermelho e valores na tela
// 2) Entrada: troco digitado · Validação: é igual a recebido − total? · Resultado: ✓ ou "TENTE NOVAMENTE"

import { el, botao, selo, bip, pontoNoPalco } from '../view/componentes.js';
import { reais, esperar } from '../util/formato.js';

/** "R$ 26,50", "26,5", "26.50" -> 2650 (centavos). Retorna null se não for número. */
export function lerValor(texto) {
  let s = String(texto).replace(/[^\d,.-]/g, '');
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  const n = Number.parseFloat(s);
  return Number.isFinite(n) ? Math.round(n * 100) : null;
}

/**
 * config: dados de data/dia2.json → caixa
 *   { cenario, produto: { imagem, nome, x, y, tamanho }, leitor: {x,y,largura,altura},
 *     recebidoCentavos, totalCentavos, mensagens }
 */
export function criarCaixa(config) {
  const { produto, leitor } = config;
  let raiz, item, brilho, campos, entrada, resultadoEl, enviarResposta, dica;
  let bipado = false;

  const dentroDoLeitor = (x, y) =>
    x >= leitor.x && x <= leitor.x + leitor.largura && y >= leitor.y && y <= leitor.y + leitor.altura;

  function voltarProduto() {
    item.classList.add('animar');
    item.style.left = `${produto.x}px`;
    item.style.top = `${produto.y}px`;
  }

  function arrastavel(enviar) {
    let pegada = null;
    item.addEventListener('pointerdown', (e) => {
      if (bipado || e.button !== 0) return;
      e.preventDefault();
      item.setPointerCapture(e.pointerId);
      const p = pontoNoPalco(e);
      pegada = { dx: p.x - parseFloat(item.style.left), dy: p.y - parseFloat(item.style.top) };
      item.classList.remove('animar');
      item.classList.add('arrastado');
    });
    item.addEventListener('pointermove', (e) => {
      if (!pegada) return;
      const p = pontoNoPalco(e);
      item.style.left = `${p.x - pegada.dx}px`;
      item.style.top = `${p.y - pegada.dy}px`;
      brilho.classList.toggle('perto', dentroDoLeitor(p.x, p.y));
    });
    const soltar = (e) => {
      if (!pegada) return;
      pegada = null;
      item.classList.remove('arrastado');
      brilho.classList.remove('perto');
      const p = pontoNoPalco(e);
      enviar({ tipo: 'bip', x: p.x, y: p.y });
    };
    item.addEventListener('pointerup', soltar);
    item.addEventListener('pointercancel', soltar);
  }

  return {
    montar(container, enviar) {
      enviarResposta = () => enviar({ tipo: 'troco', valor: entrada.value });

      item = el('img', {
        class: 'caixa__produto', src: produto.imagem, alt: produto.nome, draggable: 'false',
        style: { left: `${produto.x}px`, top: `${produto.y}px`, width: `${produto.tamanho}px`, height: `${produto.tamanho}px` },
      });
      brilho = el('div', {
        class: 'caixa__leitor', 'aria-hidden': 'true',
        style: { left: `${leitor.x}px`, top: `${leitor.y}px`, width: `${leitor.largura}px`, height: `${leitor.altura}px` },
      });

      entrada = el('input', {
        class: 'caixa__entrada', type: 'text', inputmode: 'decimal', autocomplete: 'off',
        placeholder: 'Digite sua resposta', 'aria-label': 'Troco',
        onkeydown: (e) => { if (e.key === 'Enter') enviarResposta(); },
      });
      const enviarBtn = botao('Enviar', enviarResposta);
      enviarBtn.classList.add('caixa__enviar');
      resultadoEl = el('div', { class: 'caixa__resultado', 'aria-live': 'assertive' });

      // Valores ficam escondidos até o produto passar no leitor
      campos = el('div', { class: 'caixa__campos', hidden: true },
        el('output', { class: 'caixa__valor caixa__valor--recebido' }, reais(config.recebidoCentavos)),
        el('output', { class: 'caixa__valor caixa__valor--total' }, reais(config.totalCentavos)),
        entrada, enviarBtn, resultadoEl);

      dica = el('div', { class: 'caixa__dica' }, config.mensagens.dica);
      raiz = el('div', { class: 'caixa', role: 'region', 'aria-label': 'Caixa eletrônico' },
        el('img', { class: 'cenario', src: config.cenario, alt: 'Caixa eletrônico do Korno\'s' }),
        brilho, campos, item, dica);
      container.append(raiz);
      arrastavel(enviar);
    },

    validar(e) {
      if (e.tipo === 'bip') return { ok: dentroDoLeitor(e.x, e.y), etapa: 'bip' };
      const valor = lerValor(e.valor);
      if (valor === null) return { ok: false, vazio: true, mensagem: config.mensagens.vazio };
      const certo = config.recebidoCentavos - config.totalCentavos;
      return { ok: valor === certo, valor };
    },

    async resultado(r) {
      if (r.etapa === 'bip') {
        if (!r.ok) { voltarProduto(); return false; }
        bipado = true;
        bip();
        item.classList.add('bipado');
        item.style.left = `${leitor.x + leitor.largura / 2 - produto.tamanho / 2}px`;
        item.style.top = `${leitor.y - produto.tamanho * 0.55}px`;
        brilho.classList.add('ativo');
        dica.textContent = config.mensagens.calcule;
        campos.hidden = false;
        entrada.focus({ preventScroll: true });
        return false;
      }
      if (r.vazio) { resultadoEl.replaceChildren(r.mensagem); return false; }
      resultadoEl.replaceChildren(selo(r.ok));
      if (!r.ok) { entrada.select(); return false; }
      entrada.disabled = true;
      await esperar(1300);
      return true;
    },

    desmontar() { raiz.remove(); },
  };
}
