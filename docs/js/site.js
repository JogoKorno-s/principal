/* =========================================================
   KORNO'S · comportamentos comuns a todas as páginas
   ========================================================= */
(function () {
  "use strict";
  var cfg = window.KORNOS || {};
  var semMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Menu (placas de corredor) no celular ---------- */
  var botaoMenu = document.querySelector(".menu-botao");
  var listaMenu = document.getElementById("corredores");
  if (botaoMenu && listaMenu) {
    botaoMenu.addEventListener("click", function () {
      var aberto = listaMenu.classList.toggle("aberto");
      botaoMenu.setAttribute("aria-expanded", aberto ? "true" : "false");
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && listaMenu.classList.contains("aberto")) {
        listaMenu.classList.remove("aberto");
        botaoMenu.setAttribute("aria-expanded", "false");
        botaoMenu.focus();
      }
    });
  }

  /* ---------- O jogo já foi publicado? ----------
     Verdadeiro se config.jogoWebPublicado = true OU se existir play/index.html. */
  var raiz = document.documentElement.getAttribute("data-raiz") || "";
  var checagem = null;
  window.kornosJogoDisponivel = function () {
    if (checagem) return checagem;
    if (cfg.jogoWebPublicado) { checagem = Promise.resolve(true); return checagem; }
    if (location.protocol === "file:") { checagem = Promise.resolve(false); return checagem; }
    checagem = fetch(raiz + "play/index.html", { method: "HEAD", cache: "no-store" })
      .then(function (r) { return r.ok; })
      .catch(function () { return false; });
    return checagem;
  };

  /* ---------- Placa ABERTO / FECHADO ---------- */
  var placas = document.querySelectorAll("[data-placa]");
  if (placas.length) {
    window.kornosJogoDisponivel().then(function (ok) {
      placas.forEach(function (placa) {
        placa.setAttribute("data-estado", ok ? "aberto" : "breve");
        var verso = placa.querySelector(".placa__face--verso");
        if (verso) {
          verso.innerHTML = ok
            ? "<b>ABERTO</b><small>pode entrar!</small>"
            : "<b>EM&nbsp;OBRA</b><small>abre em breve</small>";
        }
        placa.setAttribute("aria-label", ok ? "Jogar no navegador" : "Jogar no navegador (em breve)");
        if (ok && !semMovimento) {
          placa.addEventListener("click", function (e) {
            if (e.metaKey || e.ctrlKey || e.shiftKey) return;
            e.preventDefault();
            placa.classList.add("virada");
            setTimeout(function () { location.href = placa.href; }, 520);
          });
        }
      });
    });
  }

  /* ---------- Etiqueta "Baixar para Windows" e links do itch.io ---------- */
  document.querySelectorAll("[data-download-windows]").forEach(function (el) {
    var valor = el.querySelector(".tag-preco__valor");
    if (cfg.downloadWindows) {
      var a = document.createElement("a");
      a.className = el.className; a.href = cfg.downloadWindows; a.innerHTML = el.innerHTML;
      el.replaceWith(a);
      var v = a.querySelector(".tag-preco__valor"); if (v) v.textContent = "GRÁTIS";
    } else if (valor) {
      valor.textContent = "EM BREVE";
    }
  });
  document.querySelectorAll("[data-link]").forEach(function (el) {
    var url = cfg[el.getAttribute("data-link")];
    if (url) { el.href = url; el.hidden = false; }
    else if (el.hasAttribute("data-esconder-vazio")) { el.hidden = true; }
  });

  /* ---------- Monitor com capturas (página inicial) ---------- */
  var monitor = document.querySelector("[data-monitor]");
  if (monitor) {
    var fotos = monitor.querySelectorAll(".monitor__tela img");
    var legenda = monitor.querySelector("[data-legenda]");
    var botaoPausa = monitor.querySelector("[data-pausa]");
    var atual = 0, timer = null;
    var mostra = function (i) {
      fotos[atual].classList.remove("ativa");
      atual = (i + fotos.length) % fotos.length;
      fotos[atual].classList.add("ativa");
      if (legenda) legenda.textContent = fotos[atual].getAttribute("data-legenda");
    };
    var tocando = function (sim) {
      clearInterval(timer); timer = null;
      if (sim) timer = setInterval(function () { mostra(atual + 1); }, 4500);
      if (botaoPausa) {
        botaoPausa.setAttribute("aria-label", sim ? "Pausar capturas" : "Tocar capturas");
        botaoPausa.querySelector("use").setAttribute("href", raiz + "img/icones.svg#" + (sim ? "pausa" : "tocar"));
      }
    };
    monitor.querySelector("[data-anterior]").addEventListener("click", function () { mostra(atual - 1); tocando(false); });
    monitor.querySelector("[data-proximo]").addEventListener("click", function () { mostra(atual + 1); tocando(false); });
    if (botaoPausa) botaoPausa.addEventListener("click", function () { tocando(!timer); });
    tocando(!semMovimento);
  }

  /* ---------- Cupom que "imprime" quando aparece ---------- */
  if (!semMovimento && "IntersectionObserver" in window) {
    document.querySelectorAll("[data-imprime]").forEach(function (cupom) {
      var r = cupom.getBoundingClientRect();
      if (r.top < window.innerHeight) return; // já está na tela: não esconde nada
      cupom.classList.add("vai-imprimir");
      var obs = new IntersectionObserver(function (entradas) {
        entradas.forEach(function (en) {
          if (en.isIntersecting) {
            cupom.classList.add("imprimindo");
            cupom.addEventListener("animationend", function () { cupom.classList.remove("vai-imprimir", "imprimindo"); }, { once: true });
            obs.disconnect();
          }
        });
      }, { threshold: 0, rootMargin: "0px 0px -15% 0px" });
      // o cupom recortado tem área visível zero, então observamos uma "moldura" em volta dele
      var moldura = document.createElement("div");
      cupom.parentNode.insertBefore(moldura, cupom);
      moldura.appendChild(cupom);
      obs.observe(moldura);
    });
  }

  /* ---------- Comparador antes / depois ---------- */
  document.querySelectorAll("[data-compara]").forEach(function (box) {
    var input = box.querySelector("input");
    var atualiza = function () { box.style.setProperty("--corte", input.value + "%"); };
    input.addEventListener("input", atualiza);
    atualiza();
  });

  /* ---------- Trilho dos dias: marca o dia que está na tela ---------- */
  var trilho = document.querySelector("[data-trilho]");
  if (trilho && "IntersectionObserver" in window) {
    var links = trilho.querySelectorAll("a[href^='#']");
    var marca = function (id) {
      links.forEach(function (a) {
        if (a.getAttribute("href") === "#" + id) {
          a.setAttribute("aria-current", "true");
          a.scrollIntoView({ block: "nearest", inline: "nearest" });
        } else { a.removeAttribute("aria-current"); }
      });
    };
    var spy = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) { if (en.isIntersecting) marca(en.target.id); });
    }, { rootMargin: "-40% 0px -55% 0px" });
    links.forEach(function (a) {
      var alvo = document.getElementById(a.getAttribute("href").slice(1));
      if (alvo) spy.observe(alvo);
    });
  }

  /* ---------- Cenas em vídeo ----------
     Tocam sozinhas (sem som) quando aparecem na tela e pausam quando saem.
     Se a pessoa pausar, fica pausado. Com "reduzir movimento", nada toca sozinho. */
  document.querySelectorAll("[data-cena-video]").forEach(function (video) {
    var botao = video.parentNode.querySelector("[data-video-botao]");
    var nome = botao ? botao.getAttribute("aria-label").replace(/^(Pausar|Tocar) /, "") : "";
    var pausadoPelaPessoa = semMovimento;
    var mostraIcone = function () {
      if (!botao) return;
      var tocando = !video.paused;
      botao.setAttribute("aria-label", (tocando ? "Pausar " : "Tocar ") + nome);
      botao.querySelector("use").setAttribute("href", raiz + "img/icones.svg#" + (tocando ? "pausa" : "tocar"));
    };
    video.addEventListener("play", mostraIcone);
    video.addEventListener("pause", mostraIcone);
    mostraIcone();
    if (botao) botao.addEventListener("click", function () {
      if (video.paused) { pausadoPelaPessoa = false; video.play(); }
      else { pausadoPelaPessoa = true; video.pause(); }
    });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entradas) {
        entradas.forEach(function (en) {
          if (en.isIntersecting && !pausadoPelaPessoa) { video.play().catch(function () {}); }
          else if (!en.isIntersecting && !video.paused) { video.pause(); }
        });
      }, { threshold: 0.5 }).observe(video);
    }
  });
})();
