/* =========================================================
   Página Jogar: embute a exportação web do Godot (play/index.html)
   ========================================================= */
(function () {
  "use strict";
  var tela = document.getElementById("tela-jogo");
  if (!tela) return;
  var breve = document.getElementById("estado-breve");
  var carregando = document.getElementById("carregando");
  var botaoCheia = document.getElementById("tela-cheia");
  var aviso = document.getElementById("aviso-celular");
  var tentar = document.getElementById("tentar-celular");

  var ehCelular = window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 760;

  function carregaJogo() {
    if (tela.querySelector("iframe")) return;
    if (breve) breve.hidden = true;
    carregando.hidden = false;
    var iframe = document.createElement("iframe");
    iframe.src = "play/index.html";
    iframe.title = "Korno's: o jogo";
    iframe.allow = "fullscreen; autoplay; gamepad";
    iframe.setAttribute("allowfullscreen", "");
    iframe.addEventListener("load", function () {
      carregando.hidden = true;
      botaoCheia.disabled = false;
    });
    tela.appendChild(iframe);
  }

  window.kornosJogoDisponivel().then(function (ok) {
    if (!ok) { // fica o estado "Em breve" e a dica vira um convite
      var dica = document.getElementById("dica-jogo");
      if (dica) dica.innerHTML = 'Enquanto o jogo não abre: <a href="matematica.html#demo">treine na prateleira</a> ou <a href="historia.html">veja a abertura animada</a>.';
      return;
    }
    if (ehCelular) {
      aviso.classList.add("visivel");
      if (breve) breve.querySelector("h2").innerHTML = 'O jogo está pronto. <span class="tinta">Mas e o celular?</span>';
      tentar.addEventListener("click", function () { aviso.classList.remove("visivel"); carregaJogo(); });
    } else {
      carregaJogo();
    }
  });

  botaoCheia.addEventListener("click", function () {
    var pede = tela.requestFullscreen || tela.webkitRequestFullscreen;
    if (pede) pede.call(tela);
    var iframe = tela.querySelector("iframe");
    if (iframe) iframe.focus();
  });
})();
