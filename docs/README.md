# Site do Korno's

Site oficial do **Korno's**, jogo educativo de matemática feito em Godot 4 pelo Grupo 07 do curso técnico em Desenvolvimento de Sistemas do IFSP.

O site é **HTML, CSS e JavaScript puros**. Não tem framework, não tem `npm install` e não tem etapa de build: o que está nos arquivos é exatamente o que vai para o ar.

---

## Estrutura de pastas

```
index.html          Página inicial (a fachada)
jogar.html          O jogo embutido
historia.html       A abertura e os personagens
matematica.html     Os 5 minigames + a demo da prateleira
bastidores.html     GDD, arquitetura, roteiro, antes e depois
resultados.html     Dados do playtest
equipe.html         O cupom com a equipe
documentos.html     PDFs e repositórios
404.html            Página de "corredor não encontrado"

css/kornos.css      TODO o visual do site (cores e fontes no começo do arquivo)
js/config.js        Links e chaves que vocês vão mudar (download, itch.io, repositórios)
js/site.js          Menu, placa ABERTO/FECHADO, cupom que imprime, comparador
js/prateleira.js    A demo interativa da prateleira
js/jogar.js         Carrega o jogo na página Jogar
img/                Imagens em WebP + icones.svg + favicon.svg
video/              Cenas animadas da abertura (.webm, .mp4 e capa .webp)
play/               Aqui vai a exportação web do Godot
docs/               PDFs e documentos
```

---

## Ver o site no seu computador

Abrir o `index.html` com dois cliques funciona para a maior parte das coisas, mas o jogo e os ícones precisam de um servidor local. Na pasta do site, rode:

```bash
python -m http.server 8000
```

Depois abra <http://localhost:8000> no navegador. (No VS Code, a extensão **Live Server** faz a mesma coisa.)

---

## Publicar no GitHub Pages

1. Crie um repositório na conta ou organização do grupo (ex.: `kornos`).
2. Envie todos os arquivos desta pasta para a raiz do repositório:
   ```bash
   git init
   git add .
   git commit -m "Site do Korno's"
   git branch -M main
   git remote add origin https://github.com/SEU-USUARIO/kornos.git
   git push -u origin main
   ```
3. No GitHub, vá em **Settings → Pages**.
4. Em **Build and deployment → Source**, escolha **Deploy from a branch**.
5. Em **Branch**, escolha `main` e a pasta `/ (root)`. Clique em **Save**.
6. Espere 1 ou 2 minutos. O endereço aparece no topo da mesma tela, algo como `https://SEU-USUARIO.github.io/kornos/`.

Todos os links do site são relativos, então ele funciona em qualquer endereço.

---

## Colocar o jogo no site (exportação web do Godot)

### 1. Exportar do Godot

1. No Godot: **Projeto → Exportar… → Adicionar… → Web**. Se pedir, baixe os *export templates*.
2. Na predefinição Web, em **Variant**, **desligue "Thread Support"**.
   > Isso é obrigatório. Com threads ligadas, o jogo precisa de cabeçalhos especiais (COOP/COEP) que o GitHub Pages **não envia**, e a tela fica preta. Sem threads, ele roda normalmente. (Precisa do Godot 4.3 ou mais novo.)
3. Em **Export Path**, coloque `.../kornos-site/play/index.html`. **O nome tem que ser `index.html`.**
4. Clique em **Exportar Projeto** (desmarque "Exportar com Debug").

A pasta `play/` vai ficar com `index.html`, `index.js`, `index.wasm`, `index.pck` e outros arquivos. Pode apagar o `LEIA-ME.txt`.

### 2. Publicar

Faça commit e push da pasta `play/`. Pronto: o site percebe sozinho que `play/index.html` existe e:
- a página **Jogar** troca o "Em breve" pelo jogo, com tela de carregamento e botão de tela cheia;
- a placa da página inicial passa a virar de **FECHADO** para **ABERTO**.

Se quiser forçar o modo "publicado" (por exemplo, para testar), mude `jogoWebPublicado: true` em `js/config.js`.

> O arquivo `.wasm` costuma ter uns 35 a 40 MB. O GitHub aceita arquivos de até 100 MB, então não tem problema.

### Plano B: itch.io

Se o jogo não rodar no GitHub Pages:
1. Crie uma página em <https://itch.io> → **Upload new project** → *Kind of project*: **HTML**.
2. Compacte o **conteúdo** da pasta `play/` num `.zip` (o `index.html` precisa estar na raiz do zip) e envie.
3. Marque **This file will be played in the browser** e, em *Embed options*, ligue **SharedArrayBuffer support** se tiverem exportado com threads.
4. Cole o link em `js/config.js` → `itchio`. Um botão "Jogar no itch.io" aparece na página Jogar.

### Versão para Windows

Exporte a predefinição **Windows Desktop**, compacte o `.exe` (e o `.pck`, se existir) num `.zip` e publique em **Releases** do repositório do jogo ou no itch.io. Cole o link em `js/config.js` → `downloadWindows`. A etiqueta "Baixar para Windows" troca "EM BREVE" por "GRÁTIS" sozinha.

---

## Como trocar textos

Abra o `.html` da página num editor (VS Code, Notepad++…) e edite o texto entre as tags. Por exemplo, a frase principal da página inicial está em `index.html`, procure por `Herdou um mercado`.

**Procure por `[PREENCHER`** em todos os arquivos (no VS Code: `Ctrl+Shift+F`). Cada ocorrência é um conteúdo que só vocês têm. Quando preencher, apague o `<span class="preencher">…</span>` inteiro e deixe só o texto.

O cabeçalho (placas de corredor) e o rodapé se repetem em todas as páginas. Se mudar um, mude nos outros também (`Ctrl+Shift+H` no VS Code substitui em todos os arquivos de uma vez).

### Equipe

Em `equipe.html`, cada pessoa é um bloco `<div class="cupom-item">`. Troque o papel e os links. Para a foto:
1. Salve a foto em `img/equipe/` (ex.: `img/equipe/luis.webp`), em retrato 3×4.
2. Troque `<div class="cupom-item__foto" aria-hidden="true">LC</div>` por:
   ```html
   <div class="cupom-item__foto"><img src="img/equipe/luis.webp" alt="Foto de Luis Carlos" width="300" height="400" loading="lazy"></div>
   ```
   A foto fica em preto e branco automaticamente, como impressão de cupom.

### Resultados do playtest

Em `resultados.html`, troque cada `[__ %]` e `[__ min __ s]` da tabela pelos números.

---

## Como trocar imagens

1. **Converta para WebP** antes de colocar no site. Pode ser em <https://squoosh.app> (qualidade 75–80) ou com o comando `cwebp -q 80 foto.png -o foto.webp`.
2. Tamanho máximo recomendado: 1600 px de largura para telas do jogo e 800 px para a versão menor.
3. Salve em `img/` com nome sem espaço e sem acento (`dia3-moto.webp`).
4. No HTML, troque o `src` e **sempre escreva um `alt`** descrevendo o que aparece na imagem, para quem usa leitor de tela.

Imagens que existem hoje e de onde vieram:

| Arquivo | O que é |
|---|---|
| `fachada-1920.webp`, `fachada-960.webp` | Fachada do Korno's (arte do jogo) |
| `logo-kornos.webp`, `logo-kornos-1200.webp` | Logo oficial, fundo transparente |
| `cena-casamento*.webp` | Cena 1 da abertura (versão atual) |
| `cena-nascimento*.webp` | Cena 2 da abertura (nascimento do Enzo) |
| `cena-velorio*.webp` | Cena 8 da abertura (velório do avô José) |
| `casamento-versao1.webp` | Cena 1, primeira versão (dos slides) |
| `dia1-mercado-abandonado*.webp` | Tela do Dia 1, antes da limpeza |
| `dia1-luis-atacadista*.webp` | Tela do Dia 1, Luís avisando da promoção |
| `dia2-cliente-arroz*.webp` | Tela do Dia 2, primeiro cliente |
| `retrato-*.webp` | Recortes dos personagens a partir das telas |
| `prototipo-*.webp` | Páginas dos slides de Matemática Computacional |

### GIF ou vídeo de gameplay

Quando tiverem uma gravação, prefiram **vídeo** a GIF: um `.mp4` ou `.webm` curto (10–20 s, sem som) pesa 10× menos. Para colocar no lugar das capturas da página inicial, troque o bloco `<div class="monitor__tela">…</div>` em `index.html` por:

```html
<div class="monitor__tela">
  <video src="img/gameplay.webm" poster="img/dia1-mercado-abandonado-800.webp" autoplay muted loop playsinline aria-label="Gameplay do Korno's: descreva aqui o que acontece no vídeo"></video>
</div>
```

---

## Vídeos das cenas (página A história)

Os vídeos ficam em `video/`. Cada cena tem três arquivos: `.webm` (mais leve), `.mp4` (para Safari e iPhone) e `.webp` (a capa, que aparece antes de tocar). Eles tocam sozinhos e sem som quando aparecem na tela, e o botão no canto pausa.

Para colocar uma cena nova (ex.: cena 4), converta o vídeo original com o [ffmpeg](https://ffmpeg.org):

```bash
ffmpeg -i original.mp4 -an -vf scale=960:-2 -c:v libx264 -crf 27 -preset slow -movflags +faststart -pix_fmt yuv420p video/cena04-nome.mp4
ffmpeg -i original.mp4 -an -vf scale=960:-2 -c:v libvpx-vp9 -b:v 0 -crf 38 video/cena04-nome.webm
ffmpeg -ss 1.5 -i original.mp4 -frames:v 1 -vf scale=960:-2 video/cena04-nome.webp
```

Depois, em `historia.html`, copie um bloco `<figure class="cena cena--…">` que já tenha vídeo, troque os três nomes de arquivo, a legenda e o `aria-label` (descrição do que acontece na cena, para quem usa leitor de tela).

---

## Cores e fontes

No começo de `css/kornos.css` estão as variáveis `--bege`, `--laranja` etc. É a paleta oficial do GDD. Não acrescentem cores novas.

- **Laranja (`--laranja`)** só pode ser usado em **texto grande** (títulos, preços, botões grandes) ou como fundo. Em texto pequeno ele não tem contraste suficiente.
- **Fontes:** *Fredoka* (títulos, preços e números — combina com o "SUPERMERCADO" do logo) e *Recursive* (texto e, com o eixo `MONO`, a fonte do cupom fiscal). As duas vêm do Google Fonts.

## Acessibilidade (não quebrem!)

- Toda imagem precisa de `alt`.
- Tudo funciona com teclado (`Tab`, `Enter`, `Espaço`, setas). Testem navegando sem o mouse.
- Quem ativa "reduzir movimento" no sistema não vê animações. Isso já está no CSS.
