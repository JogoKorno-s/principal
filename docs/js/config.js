/* =========================================================
   CONFIGURAÇÃO DO SITE — é só mexer aqui.
   ---------------------------------------------------------
   Depois de colocar a exportação web do Godot na pasta play/,
   o site percebe sozinho (ele procura play/index.html).
   Se quiser forçar, mude jogoWebPublicado para true.
   ========================================================= */
window.KORNOS = {
  // true = mostra o jogo na página Jogar mesmo sem conferir a pasta play/
  jogoWebPublicado: false,

  // Link do download para Windows (GitHub Releases ou itch.io). Vazio = "em breve".
  downloadWindows: "",

  // Página do jogo no itch.io (plano B para jogar). Vazio = escondido.
  itchio: "",

  // Repositórios
  repositorioJogo: "",
  repositorioSite: ""
};
