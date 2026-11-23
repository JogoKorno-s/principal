// MINIGAME: prateleira ampliada. Os produtos arrastados encaixam nas vagas (como ímã)
// e a vaga de cada um fica salva.
// Entrada: produto solto num ponto · Validação: o ponto cai numa vaga? · Resultado: encaixa, troca ou volta.

import { el, botao, pontoNoPalco } from '../view/componentes.js';

/**
 * config:   dados de data/dia1.json → prateleira
 * fundo:    imagem da prateleira
 * estoque:  { arroz: 5, feijao: 3, acucar: 4 } — só aparecem os produtos comprados
 * salvas:   posições salvas { "arroz1": "F3:0" }
 * aoSalvar: recebe as novas posições para gravar no GameState
 * aoVoltar: chamado antes de fechar (o controlador faz o fade)
 */
export function criarPrateleira({ config, fundo, estoque, salvas, aoSalvar, aoVoltar }) {
  const { largura: LP, altura: AP } = config.tamanhoProduto;
  const ocupadas = new Map();   // "F1:3" -> id do produto
  const vagaDe = new Map();     // id do produto -> "F1:3"
  const elementos = new Map();  // id -> <img>
  const vagasEl = new Map();    // "F1:3" -> <div class="vaga">
  let raiz;

  // ----- Geometria das vagas (coordenadas do palco 1920×1080) -----

  const fileira = (id) => config.fileiras.find((f) => f.id === id);

  function vagaNoPonto(x, y) {
    const m = config.margemSoltar;
    for (const f of config.fileiras) {
      const dentro = x >= f.x && x <= f.x + f.largura && y >= f.y - m && y <= f.y + f.altura + m / 2;
      if (!dentro) continue;
      const i = Math.min(f.vagas - 1, Math.max(0, Math.floor((x - f.x) / (f.largura / f.vagas))));
      return `${f.id}:${i}`;
    }
    return null;
  }

  function existe(chave) {
    const [id, i] = (chave ?? '').split(':');
    const f = fileira(id);
    return Boolean(f) && Number(i) < f.vagas;
  }

  /** Vaga livre mais próxima na mesma fileira; se a fileira estiver cheia, a primeira livre. */
  function livreMaisProxima(chave) {
    if (chave) {
      const [id, i] = chave.split(':');
      const f = fileira(id);
      for (let d = 1; d < f.vagas; d++) {
        for (const j of [Number(i) + d, Number(i) - d]) {
          if (j >= 0 && j < f.vagas && !ocupadas.has(`${id}:${j}`)) return `${id}:${j}`;
        }
      }
    }
    return primeiraLivre();
  }

  function primeiraLivre() {
    for (const f of config.fileiras) {
      for (let i = 0; i < f.vagas; i++) if (!ocupadas.has(`${f.id}:${i}`)) return `${f.id}:${i}`;
    }
    return null;
  }

  /** Produto "em pé" no fundo da vaga, centralizado */
  function posicaoNaVaga(chave) {
    const [id, i] = chave.split(':');
    const f = fileira(id);
    const larguraVaga = f.largura / f.vagas;
    return { x: f.x + larguraVaga * (Number(i) + 0.5) - LP / 2, y: f.y + f.altura - AP };
  }

  function colocar(produtoId, chave, animar) {
    const anterior = vagaDe.get(produtoId);
    if (anterior && ocupadas.get(anterior) === produtoId) ocupadas.delete(anterior);
    ocupadas.set(chave, produtoId);
    vagaDe.set(produtoId, chave);
    const img = elementos.get(produtoId);
    const { x, y } = posicaoNaVaga(chave);
    img.classList.toggle('animar', animar);
    img.style.left = `${x}px`;
    img.style.top = `${y}px`;
  }

  const salvar = () => aoSalvar(Object.fromEntries(vagaDe));

  function destacar(chave) {
    for (const [k, v] of vagasEl) v.classList.toggle('destaque', k === chave);
  }

  // ----- Arrastar -----

  function tornarArrastavel(img, produtoId, enviar) {
    let pegada = null;

    img.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      img.setPointerCapture(e.pointerId);
      const p = pontoNoPalco(e);
      pegada = { dx: p.x - parseFloat(img.style.left), dy: p.y - parseFloat(img.style.top) };
      img.classList.remove('animar');
      img.classList.add('arrastado');
      raiz.classList.add('arrastando');
      destacar(vagaNoPonto(p.x, p.y));
    });

    img.addEventListener('pointermove', (e) => {
      if (!pegada) return;
      const p = pontoNoPalco(e);
      img.style.left = `${p.x - pegada.dx}px`;
      img.style.top = `${p.y - pegada.dy}px`;
      destacar(vagaNoPonto(p.x, p.y));
    });

    const soltar = (e) => {
      if (!pegada) return;
      pegada = null;
      img.classList.remove('arrastado');
      raiz.classList.remove('arrastando');
      destacar(null);
      const p = pontoNoPalco(e);
      enviar({ tipo: 'soltar', produtoId, x: p.x, y: p.y });
    };
    img.addEventListener('pointerup', soltar);
    img.addEventListener('pointercancel', soltar);
  }

  return {
    montar(container, enviar) {
      const fileiras = config.fileiras.map((f) => {
        const linha = el('div', {
          class: 'fileira',
          style: { left: `${f.x}px`, top: `${f.y}px`, width: `${f.largura}px`, height: `${f.altura}px` },
        });
        for (let i = 0; i < f.vagas; i++) {
          const vaga = el('div', { class: 'vaga' });
          vagasEl.set(`${f.id}:${i}`, vaga);
          linha.append(vaga);
        }
        return linha;
      });

      // Só aparecem os produtos que estão no estoque (arroz1..arroz5 etc.)
      const contagem = {};
      const visiveis = config.produtos.filter((p) => {
        contagem[p.tipo] = (contagem[p.tipo] ?? 0) + 1;
        return contagem[p.tipo] <= (estoque[p.tipo] ?? 0);
      });

      const camadaProdutos = el('div');
      for (const p of visiveis) {
        const img = el('img', { class: 'produto', src: p.imagem ?? `assets/produtos/${p.tipo}.webp`, alt: p.tipo, draggable: 'false' });
        elementos.set(p.id, img);
        tornarArrastavel(img, p.id, enviar);
        camadaProdutos.append(img);
      }

      raiz = el('div', { class: 'prateleira', role: 'region', 'aria-label': 'Prateleira' },
        el('img', { class: 'cenario', src: fundo, alt: 'Prateleira do mercado' }),
        fileiras,
        camadaProdutos,
        el('div', { class: 'prateleira__dica' }, config.dica));
      const voltar = botao('‹ Voltar', () => enviar({ tipo: 'voltar' }), 'pequeno claro');
      voltar.classList.add('prateleira__voltar');
      raiz.append(voltar);
      container.append(raiz);

      // 1º: vagas salvas · 2º: vaga onde o produto estava no editor · 3º: primeira livre
      const pendentes = [];
      for (const p of visiveis) {
        const chave = salvas[p.id];
        if (existe(chave) && !ocupadas.has(chave)) colocar(p.id, chave, false);
        else pendentes.push(p);
      }
      for (const p of pendentes) {
        let chave = p.x == null ? null : vagaNoPonto(p.x + LP / 2, p.y + AP / 2);
        if (!chave || ocupadas.has(chave)) chave = livreMaisProxima(chave);
        if (chave) colocar(p.id, chave, false);
      }
      salvar();
      voltar.focus({ preventScroll: true });
    },

    validar(entrada) {
      if (entrada.tipo === 'voltar') return { ok: true, fim: true };
      const vaga = vagaNoPonto(entrada.x, entrada.y);
      return { ok: Boolean(vaga), vaga };
    },

    async resultado(r, entrada) {
      if (r.fim) { await aoVoltar?.(); return true; }
      const atual = vagaDe.get(entrada.produtoId);
      if (!r.ok) {             // soltou fora da prateleira: volta para a vaga
        colocar(entrada.produtoId, atual, true);
        return false;
      }
      const outro = ocupadas.get(r.vaga);
      if (outro && outro !== entrada.produtoId) colocar(outro, atual, true); // vaga ocupada: troca
      colocar(entrada.produtoId, r.vaga, true);
      salvar();
      return false;
    },

    desmontar() { raiz.remove(); },
  };
}
