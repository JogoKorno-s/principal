# Korno's · versão web

Recriação do jogo em **HTML, CSS e JavaScript puros** (sem framework e sem build), como plano B da versão em Godot (`kornos/`). Só desktop por enquanto (1366×768 até 1920×1080).

## Como rodar

Os módulos JS e os arquivos JSON precisam de um servidor local (abrir o `index.html` direto não funciona):

```
cd jogo-web
python -m http.server
```

Depois abra http://localhost:8000.

Para recomeçar do zero: botão **Reiniciar** no menu.

## O que já tem (primeira entrega)

- **Menu** com o vídeo da fachada, botões Jogar/Continuar e Reiniciar, configurações (⚙) e informações (i).
- **Abertura** com as 11 cenas, legenda letra por letra, botão Continuar, Pular abertura e a tela final com **Iniciar jornada**.
- **Tutorial na fachada** com as falas do Luís (a pose muda conforme a fala).
- **Dia 1**: limpeza com bolinhas numeradas (chão → caixa → prateleiras → teto), compra no Mercado Atacadista (5 arroz, 3 feijão, 4 açúcar; R$ 300,00 → R$ 220,02), prateleira com arrastar e soltar em vagas, falas de fim de dia e o card **NÍVEL 2 DESBLOQUEADO!**.
- **HUD** com carrinho, dinheiro e dia. Clicar no dia abre a **linha do tempo** (dias 1, 2, 15, 45 e 90).
- **Progresso salvo** no navegador (localStorage): fechou e abriu, continua da mesma etapa.

## Organização (MVC · RNF16)

```
index.html            página única; o palco 1920×1080 é escalado para caber na janela
css/
  tokens.css          paleta e fontes do site (docs/css/kornos.css)
  base.css            palco, fade, utilidades
  componentes.css     botões, balão de fala, HUD, painéis, avisos, selos, card de nível
  telas.css           estilos de cada tela
data/                 textos e valores de cada tela, separados do código
  niveis.json  abertura.json  fachada.json  dia1.json
js/
  main.js             ponto de partida
  model/              MODEL: GameState (dados), save (localStorage), regras dos níveis
  controller/         CONTROLLER: roteador de telas, diálogos, interface dos minigames, fluxo do Dia 1
  view/               VIEW: componentes, HUD, menu, abertura, fachada, cena do Dia 1, card, linha do tempo
  minigames/          limpeza, atacadista, prateleira
  util/formato.js     R$ em pt-BR (dinheiro sempre em centavos inteiros)
assets/               artes convertidas do Godot (WebP, WebM e MP4)
ferramentas/          script que converte as artes do Godot
```

### Interface dos minigames (RNF07)

Todo minigame segue **entrada → validação → resultado** (veja `js/controller/minigame.js`):

- `montar(container, enviar)`: monta a tela e chama `enviar(entrada)` quando o jogador age;
- `validar(entrada)`: regra pura, devolve `{ ok, mensagem }`;
- `resultado(r)`: mostra ✓ ou **TENTE NOVAMENTE** e diz se o minigame terminou;
- `desmontar()`.

Para criar um minigame novo (ex.: troco no caixa do Dia 2), copie um dos arquivos de `js/minigames/`, ponha os textos e valores no JSON do dia e chame `jogar(minigame, camada)` no controlador do dia.

## Artes

Só entram como imagem os **cenários**, o **Luís**, os **produtos** e os **vídeos**. Botões, ícones, HUD e cards são feitos em código (nítidos em qualquer resolução). As imagens de botão com texto de `kornos/art/ui/` não são usadas.

Para reconverter as artes depois de mudar algo em `kornos/` (precisa do ffmpeg; no Windows: `winget install Gyan.FFmpeg`), rode a partir da raiz do repositório:

```
bash jogo-web/ferramentas/converter-assets.sh
```
