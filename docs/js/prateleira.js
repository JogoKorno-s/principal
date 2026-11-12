/* =========================================================
   Demo da prateleira (Dia 5 · análise combinatória)
   - troca de produtos por arrastar, clique ou teclado
   - conta os arranjos válidos que o visitante encontra
   - "força bruta": testa as 720 ordens e compara com a fórmula
   ========================================================= */
(function () {
  "use strict";
  var slots = document.getElementById("slots");
  if (!slots) return;

  var semMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var status = document.getElementById("status");
  var achadosEl = document.getElementById("achados");
  var listaEl = document.getElementById("lista-achados");
  var grade = document.getElementById("grade");
  var progresso = document.getElementById("progresso");
  var confere = document.getElementById("confere");

  // Produtos: cor de fundo e cor do texto vêm da paleta oficial
  var PRODUTOS = [
    { id: "C", nome: "Cola Refri", cor: "#8D4925", tinta: "#F4EDE4", faixa: "#5B1F00" },
    { id: "G", nome: "Guaraná Primavera", cor: "#82B875", tinta: "#5B1F00", faixa: "#5B1F00" },
    { id: "A", nome: "Água com gás", cor: "#5C7A8D", tinta: "#FFFFFF", faixa: "#F4EDE4" },
    { id: "S", nome: "Suco de uva", cor: "#5B1F00", tinta: "#F4EDE4", faixa: "#8D4925" },
    { id: "M", nome: "Chá mate", cor: "#E6D3B3", tinta: "#5B1F00", faixa: "#82B875" },
    { id: "L", nome: "Limonada", cor: "#F4EDE4", tinta: "#5B1F00", faixa: "#D96300" }
  ];
  var porId = {}; PRODUTOS.forEach(function (p) { porId[p.id] = p; });

  // começa com as duas marcas coladas, para o visitante ver o problema
  var ordem = ["C", "G", "A", "S", "M", "L"];
  var achados = new Set();
  var pego = null; // índice do produto "na mão" (teclado ou clique)

  function lataSVG(p) {
    return '<svg viewBox="0 0 60 104" aria-hidden="true">' +
      '<path d="M6 12 Q6 4 30 4 Q54 4 54 12 V94 Q54 101 30 101 Q6 101 6 94 Z" fill="' + p.cor + '" stroke="#5B1F00" stroke-width="3"/>' +
      '<ellipse cx="30" cy="12" rx="24" ry="6" fill="none" stroke="#5B1F00" stroke-width="2.5"/>' +
      '<rect x="6" y="78" width="48" height="8" fill="' + p.faixa + '"/>' +
      '<path d="M6 78 H54 M6 86 H54" stroke="#5B1F00" stroke-width="2"/>' +
      '<path d="M13 22 V70" stroke="#F4EDE4" stroke-opacity=".35" stroke-width="4" stroke-linecap="round"/>' +
      "</svg>";
  }

  function nomeCurto(p) {
    return p.nome.replace("Guaraná Primavera", "Guaraná<br>Primavera").replace("Água com gás", "Água<br>com gás").replace("Suco de uva", "Suco<br>de uva");
  }

  function desenha(focarIndice) {
    slots.innerHTML = "";
    ordem.forEach(function (id, i) {
      var p = porId[id];
      var li = document.createElement("li");
      li.className = "gondola__slot";
      li.dataset.i = i;
      li.innerHTML = '<button type="button" class="produto" data-i="' + i + '" style="--tinta:' + p.tinta + '" ' +
        'aria-label="' + p.nome + ', posição ' + (i + 1) + ' de 6" aria-pressed="' + (pego === i) + '">' +
        lataSVG(p) + '<span class="nome" aria-hidden="true">' + nomeCurto(p) + '</span><span class="sigla" aria-hidden="true">' + p.id + "</span></button>" +
        '<span class="pos" aria-hidden="true">' + (i + 1) + "</span>";
      if (pego === i) li.querySelector(".produto").classList.add("pego");
      slots.appendChild(li);
    });
    if (typeof focarIndice === "number") slots.querySelectorAll(".produto")[focarIndice].focus();
  }

  function valido(o) { return Math.abs(o.indexOf("C") - o.indexOf("G")) !== 1; }

  function avalia(anunciarTroca) {
    var ok = valido(ordem);
    status.dataset.ok = ok;
    var chave = ordem.join("");
    var novo = ok && !achados.has(chave);
    if (novo) {
      achados.add(chave);
      achadosEl.textContent = achados.size;
      var li = document.createElement("li");
      li.textContent = String(achados.size).padStart(3, "0") + "  " + ordem.join(" ");
      listaEl.prepend(li);
    }
    var msg;
    if (!ok) {
      msg = "Cola Refri e Guaraná Primavera estão lado a lado. O fornecedor não vai gostar nada disso.";
      var ruins = slots.querySelectorAll(".produto");
      [ordem.indexOf("C"), ordem.indexOf("G")].forEach(function (i) {
        if (!semMovimento) { ruins[i].classList.remove("vizinho-ruim"); void ruins[i].offsetWidth; ruins[i].classList.add("vizinho-ruim"); }
      });
    } else if (achados.size >= 480) {
      msg = "Você achou os 480. Nem o Luís teria tanta paciência.";
    } else if (novo) {
      msg = "Arranjo válido e novo! Esse entrou na conta.";
    } else {
      msg = "Válido, mas esse você já tinha achado. Tenta outro.";
    }
    status.innerHTML = '<svg class="selo" aria-hidden="true"><use href="#' + (ok ? "certo" : "errado") + '"/></svg><span>' + (anunciarTroca ? anunciarTroca + " " : "") + msg + "</span>";
  }

  function troca(i, j) {
    var t = ordem[i]; ordem[i] = ordem[j]; ordem[j] = t;
  }

  /* ---------- teclado e clique ---------- */
  slots.addEventListener("click", function (e) {
    if (arrastou) { arrastou = false; return; }
    var b = e.target.closest(".produto"); if (!b) return;
    var i = +b.dataset.i;
    if (pego === null) {
      pego = i; desenha(i);
      status.dataset.ok = "";
      status.innerHTML = "<span>" + porId[ordem[i]].nome + " na mão. Use as setas ou clique em outra lata para trocar; Espaço solta.</span>";
    } else if (pego === i) {
      pego = null; desenha(i); avalia();
    } else {
      var a = porId[ordem[pego]].nome, bnome = porId[ordem[i]].nome;
      troca(pego, i); pego = null; desenha(i);
      avalia(a + " trocou de lugar com " + bnome + ".");
    }
  });

  slots.addEventListener("keydown", function (e) {
    var b = e.target.closest(".produto"); if (!b) return;
    var i = +b.dataset.i;
    if (e.key === "Escape" && pego !== null) { pego = null; desenha(i); avalia(); return; }
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    var j = e.key === "ArrowLeft" ? i - 1 : i + 1;
    if (j < 0 || j > 5) return;
    if (pego === i) {
      troca(i, j); pego = j; desenha(j);
      status.dataset.ok = "";
      status.innerHTML = "<span>" + porId[ordem[j]].nome + " na posição " + (j + 1) + ". Espaço para soltar.</span>";
    } else {
      slots.querySelectorAll(".produto")[j].focus();
    }
  });

  /* ---------- arrastar com mouse ou dedo ---------- */
  var arrasto = null, arrastou = false, fantasma = null, alvoAtual = null;

  slots.addEventListener("pointerdown", function (e) {
    var b = e.target.closest(".produto"); if (!b || e.button > 0) return;
    arrasto = { i: +b.dataset.i, x: e.clientX, y: e.clientY, botao: b, ativo: false };
    b.setPointerCapture(e.pointerId);
  });

  slots.addEventListener("pointermove", function (e) {
    if (!arrasto) return;
    if (!arrasto.ativo) {
      if (Math.hypot(e.clientX - arrasto.x, e.clientY - arrasto.y) < 6) return;
      arrasto.ativo = true; pego = null;
      fantasma = document.createElement("div");
      fantasma.className = "fantasma";
      fantasma.innerHTML = lataSVG(porId[ordem[arrasto.i]]);
      document.body.appendChild(fantasma);
      arrasto.botao.classList.add("arrastando");
    }
    fantasma.style.left = e.clientX + "px";
    fantasma.style.top = e.clientY + "px";
    var sob = document.elementFromPoint(e.clientX, e.clientY);
    var slot = sob && sob.closest(".gondola__slot");
    if (alvoAtual && alvoAtual !== slot) alvoAtual.classList.remove("alvo");
    alvoAtual = slot;
    if (slot && +slot.dataset.i !== arrasto.i) slot.classList.add("alvo");
  });

  function terminaArrasto(e) {
    if (!arrasto) return;
    if (arrasto.ativo) {
      arrastou = true;
      if (fantasma) fantasma.remove();
      if (alvoAtual) alvoAtual.classList.remove("alvo");
      var destino = alvoAtual ? +alvoAtual.dataset.i : null;
      if (destino !== null && destino !== arrasto.i && e.type === "pointerup") {
        var a = porId[ordem[arrasto.i]].nome, b = porId[ordem[destino]].nome;
        troca(arrasto.i, destino); desenha(destino); avalia(a + " trocou de lugar com " + b + ".");
      } else {
        desenha();
      }
      setTimeout(function () { arrastou = false; }, 0);
    }
    arrasto = null; alvoAtual = null; fantasma = null;
  }
  slots.addEventListener("pointerup", terminaArrasto);
  slots.addEventListener("pointercancel", terminaArrasto);

  /* ---------- embaralhar ---------- */
  document.getElementById("embaralhar").addEventListener("click", function () {
    for (var i = ordem.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); troca(i, j); }
    pego = null; desenha(); avalia("Prateleira embaralhada.");
  });

  /* ---------- força bruta: 720 permutações ---------- */
  function permutacoes(lista) {
    if (lista.length <= 1) return [lista.slice()];
    var saida = [];
    lista.forEach(function (item, i) {
      var resto = lista.slice(0, i).concat(lista.slice(i + 1));
      permutacoes(resto).forEach(function (p) { saida.push([item].concat(p)); });
    });
    return saida;
  }
  var todas = permutacoes(["C", "G", "A", "S", "M", "L"]);
  var celulas = [];
  for (var k = 0; k < todas.length; k++) { var c = document.createElement("i"); grade.appendChild(c); celulas.push(c); }

  var rodando = false;
  document.getElementById("forca").addEventListener("click", function () {
    if (rodando) return;
    rodando = true;
    var botao = this; botao.disabled = true;
    celulas.forEach(function (c) { c.className = ""; });
    var n = 0, validos = 0;
    var porQuadro = semMovimento ? todas.length : 6;
    (function passo() {
      for (var q = 0; q < porQuadro && n < todas.length; q++, n++) {
        var ok = valido(todas[n]);
        if (ok) validos++;
        celulas[n].className = ok ? "v" : "x";
      }
      progresso.textContent = "testadas " + n + " de 720 · válidas " + validos;
      if (n < todas.length) { requestAnimationFrame(passo); return; }
      rodando = false; botao.disabled = false;
      confere.innerHTML = "<strong>A força bruta testou 720 ordens e achou " + validos + ". A fórmula deu 480. Confere.</strong> Você achou " + achados.size + " na mão.";
    })();
  });

  desenha();
  avalia();
})();
