# Korno's · versão web

O jogo em **HTML, CSS e JavaScript puros** (sem framework e sem build). Roda no navegador do computador e do celular (com a tela deitada).

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
- **Dia 2**: caixa com troco, desafios de porcentagem, mercado digital, preço de venda com 25% de lucro e clientes sorteados.
- **Dia 15 (Nível 3)**: vídeos dos contratos, compra de bebidas, combinatória na bancada (480), seção de congelados (freezer, geladeira e açougue) e clientes que às vezes pedem o que acabou.
- **Dia 45 (Nível 4)**: vídeo do Belo e pulo para o Dia 45, Moto Entrega (pedidos que chegam durante o dia; o jogador anda pelas seções pegando os produtos na cestinha e responde a velocidade média), geladeira de bebidas (8 espaços, até 3 de cada), produtos novos (compra opcional), cronômetro de 40 s no caixa e índice de atendimento.
- **Som**: "tic" nos botões, bip do leitor no caixa e música de fundo. Em **Configurações** (engrenagem do menu) o jogador liga e desliga a **música** e os **sons dos botões** (fica salvo no navegador, separado do progresso). A música é o arquivo `assets/audio/musica.mp3`: é só colocar o arquivo com esse nome. Os vídeos tocam sem som.
- **Preço de venda automático**: na primeira vez o jogador calcula os preços na mão; nas próximas aparece o atalho discreto **Preencher com 25% de lucro** (ele ainda pode editar os valores).
- **Notificações de estoque** somem sozinhas depois de 8 segundos (no máximo 3 na tela; passar o mouse ou o dedo por cima segura o aviso).
- **Compras livres**: só o Dia 1 exige 1 de cada produto (arroz, feijão e açúcar) e a missão dos congelados exige 1 congelado e 1 do açougue. No resto, o jogador compra o que quiser.
- **Dicas**: cada desafio de matemática (troco, porcentagem, preço com 25% de lucro, combinatória e velocidade média) tem um botão **Dica** com o passo a passo usando os números do exercício.
- **Modo de testes**: botão **Testes** no menu e na linha do tempo. Vai direto para qualquer nível e etapa, com estoque, preços e dinheiro prontos. Só aparece no servidor local (`localhost`); no site publicado ele não existe.
- **Celular e tablet**: o jogo sempre aparece deitado: com o celular em pé ele é desenhado girado (funciona mesmo com a rotação automática desligada ou no navegador do WhatsApp/Instagram); com a rotação ligada, ele ocupa a tela deitada normalmente. Arrastar funciona com o dedo, os olhos das prateleiras ficam sempre visíveis, os textos dizem "toque" em vez de "clique" e há um botão **Tela cheia** (Android). No iPhone, "Compartilhar → Adicionar à Tela de Início" abre o jogo sem as barras do navegador.
- **Casinha** (canto inferior direito): leva para a Tela inicial, a Visão principal, as Prateleiras (4 vistas) e os Congelados. Seções de níveis futuros aparecem com cadeado.
- **Expositores**: cada espaço guarda um produto, com limite de unidades (prateleira 4, freezer 5). Só dá para expor o que está no estoque.
- **Computador do caixa** (olho): vendas do dia, custo e lucro.

## Organização (MVC · RNF16)

```
index.html            página única; o palco 1920×1080 é escalado para caber na janela
css/
  tokens.css          paleta e fontes do site (docs/css/kornos.css)
  base.css            palco, fade, utilidades
  componentes.css     botões, balão de fala, HUD, painéis, avisos, selos, card de nível
  telas.css           estilos de cada tela
  mercado.css         casinha, seções, expositores, combinatória, vendas
  entregas.css        Moto Entrega, cestinha, cronômetro do caixa, índice de atendimento, geladeira
  dicas.css           botão Dica, passo a passo e painel do modo de testes
  celular.css         aviso para girar a tela, tela cheia e ajustes de toque
data/                 textos e valores de cada tela, separados do código
  niveis.json  abertura.json  fachada.json  dia1.json  dia2.json  dia3.json  dia4.json  entregas.json
  produtos.json       catálogo: custo, atacadista, nível em que libera e onde fica exposto
  mercado.json        seções da casinha, posição dos olhos e dos espaços de cada expositor
  clientes.json       elenco de clientes, frases de pedido e de produto em falta
js/
  main.js             ponto de partida
  model/              MODEL: GameState (dados), save (localStorage), regras dos níveis
  controller/         CONTROLLER: roteador de telas, diálogos, interface dos minigames, fluxo do Dia 1
  view/               VIEW: componentes, HUD, menu, abertura, fachada, cena do Dia 1, card, linha do tempo
  minigames/          limpeza, atacadista, prateleira, caixa, múltipla escolha, precificação, combinatória
  util/formato.js     R$ em pt-BR (dinheiro sempre em centavos inteiros)
assets/               artes do jogo (WebP, WebM e MP4) e ícones do app
manifest.webmanifest  permite instalar o jogo no celular (tela cheia, deitado)
ferramentas/          script que converteu as artes originais (pasta kornos/art); não vai para o site
```

### Interface dos minigames (RNF07)

Todo minigame segue **entrada → validação → resultado** (veja `js/controller/minigame.js`):

- `montar(container, enviar)`: monta a tela e chama `enviar(entrada)` quando o jogador age;
- `validar(entrada)`: regra pura, devolve `{ ok, mensagem }`;
- `resultado(r)`: mostra ✓ ou **TENTE NOVAMENTE** e diz se o minigame terminou;
- `desmontar()`.

Para criar um minigame novo (ex.: troco no caixa do Dia 2), copie um dos arquivos de `js/minigames/`, ponha os textos e valores no JSON do dia e chame `jogar(minigame, camada)` no controlador do dia.

## Artes

Só entram como imagem os **cenários**, os **personagens**, os **produtos**, a **casinha** e os **vídeos**. Botões, ícones, HUD e cards são feitos em código (nítidos em qualquer resolução).

Para converter artes novas (precisa do ffmpeg; no Windows: `winget install Gyan.FFmpeg`), rode a partir da raiz do repositório:

```
bash jogo-web/ferramentas/converter-assets.sh
```
