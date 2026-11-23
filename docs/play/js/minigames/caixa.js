// MINIGAME: caixa eletrônico.
// 1) Entrada: cada produto arrastado até o leitor · Validação: caiu no leitor? · Resultado: bip vermelho
//    Quando todos passam no leitor, a tela mostra o valor recebido e o total.
// 2) Entrada: troco digitado · Validação: é igual a recebido − total? · Resultado: ✓ ou "TENTE NOVAMENTE"

import { el, botao, selo, bip, pontoNoPalco } from '../view/componentes.js';
import { reais, esperar } from '../util/formato.js';
import { criarCronometro } from '../view/cronometro.js';
import { botaoDica, passosCom } from '../view/dica.js';

/** "R$ 26,50", "26,5", "26.50" -> 2650 (centavos). Retorna null se não for número. */
export function lerValor(texto) {
  let s = String(texto ?? '').replace(/[^\d,.-]/g, '');
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  const n = Number.parseFloat(s);
  return Number.isFinite(n) ? Math.round(n * 100) : null;
}

// Onde os produtos ficam no balcão, à esquerda do monitor (até 3 produtos)
const POSICOES = [{ x: 10, y: 560 }, { x: 115, y: 560 }, { x: 220, y: 560 }];
const TAMANHO = 200;

/**
 * config: { cenario, ticket, leitor: {x,y,largura,altura}, mensagens,
 *           produtos: [{ id, nome, imagem }], recebidoCentavos, totalCentavos,
 *           cronometro?: { limiteSegundos, rotulo, irritado }, aoTerminar?({ segundos, erros }) }
 * Com cronômetro, a bolinha de paciência aparece no topo e o tempo é medido até o troco certo.
 */
export function criarCaixa(config) {
  const { leitor } = config;
  const itens = config.produtos.map((p, i) => ({ ...p, ...POSICOES[i], bipado: false, el: null }));
  let raiz, brilho, campos, entrada, resultadoEl, dica, relogio;
  let erros = 0;

  const dentroDoLeitor = (x, y) =>
    x >= leitor.x && x <= leitor.x + leitor.largura && y >= leitor.y && y <= leitor.y + leitor.altura;
  const faltam = () => itens.filter((i) => !i.bipado).length;

  function posicionar(item, x, y, animar) {
    item.el.classList.toggle('animar', animar);
    item.el.style.left = `${x}px`;
    item.el.style.top = `${y}px`;
  }

  function arrastavel(item, enviar) {
    let pegada = null;
    const img = item.el;
    img.addEventListener('pointerdown', (e) => {
      if (item.bipado || e.button !== 0) return;
      e.preventDefault();
      img.setPointerCapture(e.pointerId);
      const p = pontoNoPalco(e);
      pegada = { dx: p.x - parseFloat(img.style.left), dy: p.y - parseFloat(img.style.top) };
      img.classList.remove('animar');
      img.classList.add('arrastado');
    });
    img.addEventListener('pointermove', (e) => {
      if (!pegada) return;
      const p = pontoNoPalco(e);
      posicionar(item, p.x - pegada.dx, p.y - pegada.dy, false);
      brilho.classList.toggle('perto', dentroDoLeitor(p.x, p.y));
    });
    const soltar = (e) => {
      if (!pegada) return;
      pegada = null;
      img.classList.remove('arrastado');
      brilho.classList.remove('perto');
      const p = pontoNoPalco(e);
      enviar({ tipo: 'bip', id: item.id, x: p.x, y: p.y });
    };
    img.addEventListener('pointerup', soltar);
    img.addEventListener('pointercancel', soltar);
  }

  return {
    montar(container, enviar) {
      const enviarResposta = () => enviar({ tipo: 'troco', valor: entrada.value });

      brilho = el('div', {
        class: 'caixa__leitor', 'aria-hidden': 'true',
        style: { left: `${leitor.x}px`, top: `${leitor.y}px`, width: `${leitor.largura}px`, height: `${leitor.altura}px` },
      });

      // Notinha "PEDIDO" por cima do cenário, escrita como cupom: "1 Arroz", "1 Feijão"...
      const contagem = new Map();
      for (const p of config.produtos) contagem.set(p.nome, (contagem.get(p.nome) ?? 0) + 1);
      const ticket = el('div', { class: 'caixa__ticket' },
        el('img', { class: 'caixa__ticket-papel', src: config.ticket, alt: '' }),
        el('ul', { class: 'caixa__ticket-itens', 'aria-label': 'Pedido' },
          [...contagem].map(([nome, n]) => el('li', {}, el('b', {}, String(n)), ` ${nome}`))));

      entrada = el('input', {
        class: 'caixa__entrada', type: 'text', inputmode: 'decimal', autocomplete: 'off',
        placeholder: 'Digite sua resposta', 'aria-label': 'Troco',
        onkeydown: (e) => { if (e.key === 'Enter') enviarResposta(); },
      });
      const enviarBtn = botao('Enviar', enviarResposta);
      enviarBtn.classList.add('caixa__enviar');
      resultadoEl = el('div', { class: 'caixa__resultado', 'aria-live': 'assertive' });

      // Valores ficam escondidos até todos os produtos passarem no leitor
      campos = el('div', { class: 'caixa__campos', hidden: true },
        el('output', { class: 'caixa__valor caixa__valor--recebido' }, reais(config.recebidoCentavos)),
        el('output', { class: 'caixa__valor caixa__valor--total' }, reais(config.totalCentavos)),
        entrada, enviarBtn, resultadoEl,
        config.dica ? botaoDica(() => ({
          titulo: config.dica.titulo,
          passos: passosCom(config.dica.passos, { recebido: reais(config.recebidoCentavos), total: reais(config.totalCentavos) }),
        })) : null);

      for (const item of itens) {
        item.el = el('img', {
          class: 'caixa__produto', src: item.imagem, alt: item.nome, draggable: 'false',
          style: { width: `${TAMANHO}px`, height: `${TAMANHO}px` },
        });
        posicionar(item, item.x, item.y, false);
        arrastavel(item, enviar);
      }

      dica = el('div', { class: 'caixa__dica' }, config.mensagens.dica);
      relogio = config.cronometro ? criarCronometro(config.cronometro.limiteSegundos, config.cronometro) : null;
      raiz = el('div', { class: 'caixa', role: 'region', 'aria-label': 'Caixa eletrônico' },
        el('img', { class: 'cenario', src: config.cenario, alt: 'Caixa eletrônico do Korno\'s' }),
        ticket, brilho, campos, itens.map((i) => i.el), dica, relogio?.elemento);
      container.append(raiz);
    },

    validar(e) {
      if (e.tipo === 'bip') return { ok: dentroDoLeitor(e.x, e.y), etapa: 'bip' };
      const valor = lerValor(e.valor);
      if (valor === null) return { ok: false, vazio: true, mensagem: config.mensagens.vazio };
      return { ok: valor === config.recebidoCentavos - config.totalCentavos, valor };
    },

    async resultado(r, e) {
      if (r.etapa === 'bip') {
        const item = itens.find((i) => i.id === e.id);
        if (!r.ok) { posicionar(item, item.x, item.y, true); return false; }
        item.bipado = true;
        bip();
        item.el.classList.add('bipado');
        posicionar(item, leitor.x + leitor.largura / 2 - TAMANHO / 2, leitor.y - TAMANHO * 0.55, true);
        brilho.classList.remove('ativo');
        void brilho.offsetWidth;
        brilho.classList.add('ativo');
        if (faltam() > 0) {
          dica.textContent = config.mensagens.faltam.replace('{n}', faltam());
          return false;
        }
        dica.textContent = config.mensagens.calcule;
        campos.hidden = false;
        entrada.focus({ preventScroll: true });
        return false;
      }
      if (r.vazio) { resultadoEl.replaceChildren(r.mensagem); return false; }
      resultadoEl.replaceChildren(selo(r.ok));
      if (!r.ok) { erros += 1; entrada.select(); return false; }
      entrada.disabled = true;
      if (relogio) config.aoTerminar?.({ segundos: relogio.parar(), erros });
      await esperar(1300);
      return true;
    },

    desmontar() { relogio?.parar(); raiz.remove(); },
  };
}
