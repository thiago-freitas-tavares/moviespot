# MovieSpot

Catálogo de filmes em **React** que consome a API pública do **TMDB** (The Movie Database), com foco em
usabilidade (heurísticas de Nielsen) e acessibilidade (WCAG 2.2, nível AA).

Projeto acadêmico: A3 de _Usabilidade, desenvolvimento web, mobile e jogos_ (2026).

## Como rodar

Pré-requisito: Node.js 22 ou superior.

```bash
npm install
cp .env.example .env      # no Windows: copy .env.example .env
```

Abra o `.env` e preencha **uma** das credenciais (gratuitas em <https://www.themoviedb.org/settings/api>):

| Variável            | O que colar                                                             |
| ------------------- | ----------------------------------------------------------------------- |
| `VITE_TMDB_TOKEN`   | Token de leitura da API (_API Read Access Token_, `eyJ…`). Recomendado. |
| `VITE_TMDB_API_KEY` | Chave da API v3 (32 caracteres)                                         |

```bash
npm run dev       # site (http://localhost:5173) + API de favoritos (porta 3001), juntos
npm run build     # build de produção em dist/
npm run preview   # serve o build localmente, também com a API de favoritos
npm run server    # só a API de favoritos
npm run lint      # ESLint + regras de acessibilidade (jsx-a11y)
```

Os favoritos ficam no banco SQLite `moviespot.db`, criado na raiz do projeto na primeira vez que a API roda. Para ver a tabela no VS Code, abra o arquivo com a extensão SQLite Viewer.

## Publicação (Render)

O projeto é publicado como um **Web Service** no [Render](https://render.com), ligado a este repositório: cada `git push` gera uma nova versão. Em produção, o mesmo servidor entrega o site (pasta `dist`) e a API de favoritos, na porta que o Render informa pela variável `PORT`.

- **Build command:** `npm install && npm run build`
- **Start command:** `npm run server`
- **Versão do Node:** a do campo `engines` do `package.json` (22 ou superior).

No plano gratuito, o serviço "dorme" após 15 minutos sem acesso (o primeiro acesso depois disso leva cerca de 1 minuto) e os arquivos são apagados quando ele reinicia. Por isso, o banco de favoritos volta vazio de tempos em tempos.

## Tecnologias

- React 19 + Vite
- React Router 8 (modo declarativo, rotas com carregamento sob demanda)
- Tailwind CSS 4 (tokens de cor em CSS para os temas claro e escuro)
- Express 5 (servidor da API de favoritos)
- better-sqlite3 (banco de dados SQLite dos favoritos)
- ESLint 9 + `eslint-plugin-jsx-a11y` (análise estática de acessibilidade)

## Funcionalidades

- **Início** (`/`): busca por título enquanto o usuário digita, filtros de gênero, ano e ordenação e buscas recentes. Sem busca, mostra faixas de filmes em alta, nos cinemas, populares, mais bem avaliados e em breve. Com busca ou filtro, os resultados aparecem no lugar das faixas, 24 por página. Busca, filtros e página ficam guardados no endereço (`?q=&genero=&ano=&ordem=&pagina=`).
- **Detalhes do filme** (`/filme/:id`): pôster, sinopse, nota, classificação indicativa, elenco, trailer em janela e recomendações.
- **Favoritos** (`/favoritos?ordem=`): lista salva no banco SQLite, sem cadastro (uma lista única para quem usa o app), com ordenação, remoção com desfazer e limpeza com confirmação.
- **Ajuda** (`/ajuda`): como usar, atalhos de teclado, preferências, recursos de acessibilidade e perguntas frequentes.
- **Página não encontrada** (qualquer outro endereço, ex.: `/teste`): erro 404 com caminhos de volta.

## Estrutura

```
server/
├── index.js                 # API de favoritos (Express) e, em produção, entrega do site
└── db.js                    # Banco SQLite (better-sqlite3) e criação da tabela
src/
├── App.jsx                  # Rotas + providers de estado global
├── services/tmdb.js         # Cliente da API do TMDB: autenticação, cache, erros tipados
├── services/favorites.js    # Cliente da API de favoritos
├── context/                 # Estado global (Context API): favoritos, notificações, preferências
├── hooks/                   # useAsync (loading/erro/retry), useDebounce, useDocumentTitle…
├── components/
│   ├── layout/              # Layout (foco entre rotas, atalho "/"), Header, Footer
│   ├── movies/              # MovieCard, MovieGrid, MovieRow, Poster, Rating, TrailerDialog…
│   └── ui/                  # Dialog, ConfirmDialog, ErrorMessage, EmptyState, Pagination, Toaster…
├── pages/                   # Uma página por rota
└── utils/                   # Formatação pt-BR e localStorage seguro
```

## Implementação em React

- **Rotas:** `App.jsx` define rotas aninhadas com carregamento sob demanda (`lazy` + `Suspense`) e a rota `*` para a página 404. A página de detalhes lê o parâmetro `:id`, e o Início lê busca e filtros da query string.
- **Estado local:** `useState` e `useReducer` nas páginas. Busca, filtros e página ficam **na URL** (`useSearchParams`), então voltar, recarregar ou compartilhar o link mantém o estado.
- **Estado global:** Context API em `context/`: favoritos (reducer carregado da API de favoritos, com atualização otimista e nova consulta quando a aba volta a ficar ativa), notificações e preferências (tema e atalho de teclado, guardados no `localStorage`).
- **Consumo de API:** duas APIs.
  - TMDB: `services/tmdb.js` + `hooks/useAsync.js`, com cancelamento de requisições (`AbortController`) e cache de 5 minutos. O TMDB devolve 20 filmes por página; a função `paginate` junta as duas páginas da API que cobrem cada página de 24 do app. A busca do TMDB não aceita filtros, então texto + filtros usa os 100 resultados mais relevantes e aplica gênero e ordenação no próprio app.
  - Favoritos: `services/favorites.js` chama a API própria em `server/index.js` (`GET`, `POST` e `DELETE` em `/api/favoritos`), que grava no SQLite. Em desenvolvimento, o Vite repassa `/api` para a porta 3001 (proxy em `vite.config.js`), então site e API têm o mesmo endereço para o navegador e não é preciso liberar CORS.
- **Tratamento de erros:** `TmdbError` classifica as falhas (sem internet, 401, 404, 429, 5xx), e `ErrorMessage` mostra um texto amigável com "Tentar novamente". Se o servidor de favoritos estiver fora do ar, a página Favoritos mostra "Favoritos indisponíveis", e uma ação que não pôde ser salva é desfeita na tela com um aviso. Um `ErrorBoundary` evita que um erro de renderização derrube o site, e uma faixa avisa quando a internet cai.
- **Loading:** esqueletos no formato final do conteúdo (`MovieGridSkeleton` nos resultados e em Favoritos, faixas do `MovieRow`, `DetailsSkeleton`) com `role="status"`, e `PageLoader` enquanto o código de uma página é baixado.

## Usabilidade: heurísticas de Nielsen

Cada heurística segue o formato **problema → evidência → melhoria aplicada**. As evidências vêm da revisão do protótipo durante o desenvolvimento, de testes de teclado e de layout feitos no Chrome e do comportamento da API do TMDB.

### 1. Visibilidade do status do sistema

- **Problema:** a API leva alguns instantes para responder. Sem retorno visual, o usuário não sabe se o site está carregando, quantos filmes encontrou ou se uma ação, como favoritar, funcionou.
- **Evidência:** toda busca, lista e página de filme depende de uma chamada ao TMDB. Além disso, a busca por texto do TMDB não aceita filtro de gênero nem ordenação. Quando o texto é combinado com um gênero ou com uma ordenação diferente de "Relevância", o app analisa só os 100 resultados mais relevantes e aplica o filtro sobre eles, um limite que o usuário não teria como perceber.
- **Melhoria aplicada:** esqueletos no formato dos cards durante o carregamento; linha de status como "55 filmes encontrados para “amor” · Drama · Relevância · página 1 de 3"; aviso abaixo dessa linha quando o limite de 100 resultados é aplicado ("Gênero e ordenação foram aplicados aos 100 resultados mais relevantes para “amor”…"); notificação ao adicionar ou remover um favorito; item ativo do menu sublinhado e em negrito; quantidade de filmes salvos no topo da página Favoritos ("2 filmes salvos."); faixa "sem internet" quando a conexão cai.
- **Onde verificar:** Início (buscar "amor" e escolher o gênero Drama), qualquer card (favoritar) e página Favoritos.

### 2. Correspondência entre o sistema e o mundo real

- **Problema:** por padrão, os dados do TMDB vêm em inglês, com datas no formato da API, valores sem formatação e termos técnicos.
- **Evidência:** a API devolve campos como `release_date: "2024-03-01"`, `budget: 165000000` e `status: "Released"`.
- **Melhoria aplicada:** a API é chamada em português do Brasil (`language=pt-BR`, `region=BR`); datas por extenso ("1 de março de 2024"); duração em "2h 16min"; valores em "US$ 165.000.000"; situação e idioma traduzidos ("Lançado", "Inglês"); classificação indicativa brasileira com as cores oficiais (L, 10, 12, 14, 16 e 18) e o texto "Não recomendado para menores de 14 anos".
- **Onde verificar:** página de detalhes de qualquer filme.

### 3. Controle e liberdade do usuário

- **Problema:** remover um favorito por engano, ficar preso em uma busca com vários filtros ou perder o lugar ao voltar de um filme obrigaria o usuário a refazer tudo.
- **Evidência:** no Início, os resultados de uma busca ocupam o lugar das listas de filmes, e uma busca pode combinar texto, gênero, ano e ordenação; sem uma saída rápida, seria preciso desfazer cada um, um por um, para ver as listas de novo. O coração de favorito fica sobre o pôster, onde um clique acidental é fácil. E quem abre um filme a partir da página 3 de uma busca espera voltar exatamente para ela.
- **Melhoria aplicada:** "Desfazer" na notificação após qualquer remoção; botão "Voltar para as listas", que limpa busca e filtros de uma vez; "✕" para limpar a busca e botão "Limpar filtros"; botão "Voltar" nos detalhes, que retorna à mesma busca e página de antes; a tecla Esc fecha o trailer, a janela de confirmação de "Limpar lista" (em Favoritos) e o menu de navegação em telas pequenas; o atalho "/" pode ser desligado.
- **Onde verificar:** Início (buscar e usar "Voltar para as listas"), Favoritos (remover e desfazer) e detalhes ("Voltar").

### 4. Consistência e padrões

- **Problema:** botões, campos e cards com aparência diferente em cada página obrigariam o usuário a reaprender a interface.
- **Evidência:** o app tem cinco telas e quatro tipos de botão (principal, secundário, discreto e de perigo). Sem um padrão comum, cada tela tenderia a variar.
- **Melhoria aplicada:** estilos compartilhados em `components/ui/styles.js`; o mesmo card de filme no Início, nos resultados, em Favoritos e nas recomendações; o coração significa favorito em todo o app; links sempre sublinhados; o mesmo cabeçalho e rodapé em todas as páginas.
- **Onde verificar:** comparar Início, resultados de busca, Favoritos e detalhes.

### 5. Prevenção de erros

- **Problema:** apagar a lista inteira de favoritos com um clique acidental, buscar com uma letra só (milhares de resultados sem sentido) ou digitar um ano inválido.
- **Evidência:** o botão "Limpar lista" remove todos os filmes de uma vez, e a busca do TMDB aceita qualquer texto, inclusive uma única letra.
- **Melhoria aplicada:** confirmação antes de limpar a lista, com o foco inicial em "Cancelar" (um Enter acidental não apaga nada); mínimo de 2 caracteres na busca, com mensagem explicando; ano escolhido em uma lista, sem digitação; espera de meio segundo após a digitação antes de buscar, para não mostrar resultados de palavras incompletas; ordenações que não funcionam com texto aparecem desabilitadas e explicadas ("indisponível na busca por texto").
- **Onde verificar:** Favoritos ("Limpar lista"), campo de busca (digitar uma letra) e filtro "Ordenar por".

### 6. Reconhecimento em vez de memorização

- **Problema:** o usuário precisaria lembrar o que já buscou, onde estava, quais filtros aplicou e quais atalhos existem.
- **Evidência:** na revisão do projeto, recursos sem indicação na tela, como o link "Pular para o conteúdo principal", passaram despercebidos.
- **Melhoria aplicada:** buscas recentes clicáveis; trilha de navegação ("Início › nome do filme"); filtros sempre visíveis e resumidos na linha de status; busca e filtros guardados no endereço; a dica "Espaço: favoritar" aparece no card ao receber o foco; os botões "Lista anterior" e "Pular lista" aparecem ao receber o foco; textos da Ajuda reescritos para dizer quando e como cada recurso aparece.
- **Onde verificar:** Início (buscas recentes, navegação por Tab) e detalhes (trilha).

### 7. Flexibilidade e eficiência de uso

- **Problema:** navegando só pelo teclado, passar de uma faixa do Início para a seguinte exigia cerca de 40 Tabs.
- **Evidência:** contagem no Chrome: cada faixa tem 20 filmes e cada filme tinha duas paradas de Tab (o card e o coração).
- **Melhoria aplicada:** uma parada de Tab por filme, com Espaço para favoritar o filme em foco; botões "Pular lista" e "Lista anterior" que saltam de faixa em faixa com Enter (1 Enter em vez de cerca de 20 Tabs); atalho "/" que leva à busca de qualquer página; setas ‹ › para rolar as faixas com o mouse, para quem não tem rolagem horizontal; links compartilháveis com busca e filtros; gêneros clicáveis nos detalhes, que abrem a busca daquele gênero.
- **Onde verificar:** Início, usando só o teclado.

### 8. Estética e design minimalista

- **Problema:** o protótipo tinha duas páginas com o mesmo objetivo (Início e Explorar), um banner de destaque, um botão "Buscar" desnecessário e um menu com atalho e contador. Além disso, a primeira página de resultados terminava com espaços vazios.
- **Evidência:** revisão do protótipo: havia dois itens de menu para encontrar um filme, e a busca já mostrava resultados enquanto o usuário digitava. O TMDB devolve 20 filmes por página, o que deixava 4 espaços vazios em uma grade de 6 colunas.
- **Melhoria aplicada:** Início e Explorar unidos em uma página, com busca e filtros no topo e resultados no lugar das listas; banner removido; botão "Buscar" removido (Enter continua funcionando); menu só com os nomes das páginas; páginas de 24 resultados, que preenchem linhas inteiras de 2, 3, 4 ou 6 colunas; informações secundárias em texto atenuado.
- **Onde verificar:** Início.

### 9. Ajudar os usuários a reconhecer, diagnosticar e recuperar-se de erros

- **Problema:** falhas como falta de internet, credencial inválida, excesso de requisições ou servidor fora do ar apareceriam como códigos técnicos ou como uma tela em branco.
- **Evidência:** a API do TMDB responde com os códigos HTTP 401, 404, 429 e 5xx, e um erro de renderização sem tratamento derruba a página inteira.
- **Melhoria aplicada:** uma mensagem para cada tipo de falha, com orientação ("Verifique sua internet e tente novamente") e o botão "Tentar novamente"; estados vazios com sugestões ("Nenhum filme encontrado para…", com ações para limpar a busca); página 404 com caminhos de volta; página de resultados inexistente com "Ir para a página 1"; filme inexistente com "Buscar outro filme"; proteção contra erros de renderização (`ErrorBoundary`); com o servidor de favoritos fora do ar, a página Favoritos mostra "Favoritos indisponíveis" com "Tentar novamente", e um favorito que não pôde ser salvo volta ao estado anterior com o aviso "Não foi possível salvar no servidor de favoritos".
- **Onde verificar:** abrir `/teste` (404), `/filme/999999999` (filme inexistente) ou buscar sem internet.

### 10. Ajuda e documentação

- **Problema:** atalhos, recursos de acessibilidade e limites da busca não são óbvios para quem usa o site pela primeira vez.
- **Evidência:** na revisão do projeto surgiram dúvidas sobre o link "Pular para o conteúdo principal", os avisos para leitores de tela e a redução de animações, sinal de que recursos sem explicação passam despercebidos.
- **Melhoria aplicada:** página Ajuda com como usar, tabela de atalhos, preferências, recursos de acessibilidade explicados em linguagem simples (inclusive onde ativar a redução de animações no Windows) e perguntas frequentes; dica embaixo do campo de busca; tela de configuração passo a passo quando falta a credencial da API; links no rodapé para Acessibilidade e Atalhos de teclado.
- **Onde verificar:** página Ajuda e rodapé.

## Acessibilidade: checklist WCAG 2.2

Meta: nível AA. Os critérios estão agrupados por tema, e cada um traz o que foi aplicado e a evidência. As evidências vêm de quatro fontes:

- **Testes no Chrome:** navegação por teclado e medições de layout e de tamanho de alvo, feitas com o Chrome controlado por script.
- **Cálculo de contraste:** razão de contraste de todos os pares de cor dos dois temas, pela fórmula da WCAG.
- **Análise automática:** `npm run lint` (ESLint com as regras recomendadas do `eslint-plugin-jsx-a11y`) sem erros nem avisos.
- **Código:** o arquivo onde cada recurso foi implementado.

### Teclado

- [x] **2.1.1 Teclado (A)**
  - Aplicado: todas as funções funcionam só com o teclado: menu, busca, filtros, faixas, favoritar, trailer, paginação e diálogos. Nos cards, Tab vai de filme em filme, Enter abre os detalhes e Espaço favorita.
  - Evidência: teste no Chrome percorrendo Início e Favoritos só com Tab, Enter e Espaço. Os controles são elementos nativos (`button`, `a`, `select`, `dialog`).
- [x] **2.1.2 Sem bloqueio do teclado (A)**
  - Aplicado: o trailer e a confirmação usam o `<dialog>` nativo, que mantém o foco dentro enquanto estão abertos e fecha com Esc.
  - Evidência: `components/ui/Dialog.jsx`.
- [x] **2.1.4 Atalhos de tecla única (A)**
  - Aplicado: o atalho "/" pode ser desligado em Ajuda → Preferências e não funciona dentro de campos de texto. O Espaço só favorita quando o card está em foco, caso que o critério permite.
  - Evidência: `components/layout/Layout.jsx` e chave "Atalho de tecla única" na página Ajuda.
- [x] **2.4.1 Ignorar blocos (A)**
  - Aplicado: link "Pular para o conteúdo principal", que aparece no primeiro Tab da página; botões "Lista anterior" e "Pular lista" em cada faixa do Início.
  - Evidência: teste no Chrome: o 1º Tab mostra o link no canto superior esquerdo; Enter seguidos em "Pular lista" passam pelas 5 faixas e terminam no rodapé, e "Lista anterior" faz o caminho inverso.
- [x] **2.4.3 Ordem do foco (A)**
  - Aplicado: ao trocar de página, o foco vai para o conteúdo principal; ao fechar um diálogo, volta ao botão que o abriu; ao remover um favorito, vai para o próximo card; ao trocar a página de resultados, vai para o título dos resultados.
  - Evidência: teste no Chrome na página Favoritos: depois de remover um filme, o foco foi para o card seguinte e, depois do último, para o título "Meus favoritos".

### Foco

- [x] **2.4.7 Foco visível (AA)**
  - Aplicado: contorno de 3px na cor de foco em todo elemento interativo. Como é um `outline`, continua visível no modo de alto contraste do Windows.
  - Evidência: `src/index.css`. Teste no Chrome: o contorno dos cards nas faixas, antes cortado no topo, agora aparece inteiro.
- [x] **2.4.11 Foco não encoberto (AA)**
  - Aplicado: ao navegar por Tab, a página rola deixando 80px livres no topo (cabeçalho fixo) e 96px na base (notificações).
  - Evidência: `scroll-padding` em `src/index.css`. Teste no Chrome: os botões "Pular lista" em foco aparecem abaixo do cabeçalho.

### Contraste e cor

- [x] **1.4.3 Contraste mínimo (AA)**
  - Aplicado: todo texto tem contraste de pelo menos 4,5:1 nos dois temas.
  - Evidência: cálculo pela fórmula da WCAG. Texto principal: 17,5:1 (escuro) e 17,1:1 (claro). Menor contraste de texto secundário: 7,3:1 e 6,7:1. Texto de destaque: 12,1:1 e 6,8:1. Texto dos botões amarelos: 10,6:1.
- [x] **1.4.11 Contraste não textual (AA)**
  - Aplicado: bordas de campos, contorno de foco e ícones informativos têm contraste de pelo menos 3:1.
  - Evidência: cálculo pela fórmula da WCAG. Bordas de campos: a partir de 3,5:1 (escuro) e 4,2:1 (claro). Contorno de foco: a partir de 10,5:1 e 4,8:1. Estrela da nota: 10,5:1 e 5,0:1.
- [x] **1.4.1 Uso de cor (A)**
  - Aplicado: nenhuma informação depende só da cor: a nota aparece em número, o favorito muda de forma (coração cheio ou vazado), o item ativo do menu fica sublinhado e em negrito e os links são sublinhados.
  - Evidência: `Rating.jsx`, `FavoriteButton.jsx` e `Header.jsx`.

### Rótulos, nomes e instruções

- [x] **3.3.2 Rótulos ou instruções (A)**
  - Aplicado: todo campo tem rótulo visível ("Buscar por título", "Gênero", "Ano de lançamento", "Ordenar por"), e o campo de busca tem uma instrução embaixo.
  - Evidência: `HomePage.jsx` (`label` ligado ao campo por `id`); análise do jsx-a11y sem erros.
- [x] **3.3.1 Identificação de erro (A)**
  - Aplicado: uma busca com menos de 2 caracteres mostra o erro em texto, marcado com `aria-invalid` e ligado ao campo por `aria-describedby`.
  - Evidência: `HomePage.jsx`.
- [x] **4.1.2 Nome, função, valor (A)**
  - Aplicado: botões só com ícone têm nome ("Adicionar “Duna” aos favoritos", "Ativar tema claro"); o menu do celular informa se está aberto (`aria-expanded`); a página atual é marcada (`aria-current`); a preferência de atalho é uma chave (`role="switch"`); o trailer tem título.
  - Evidência: árvore de acessibilidade do Chrome: o card é lido como "Resident Evil, Lançamento: 2026, Nota 7,3 de 10", com a descrição "Espaço adiciona aos favoritos." ou "Nos seus favoritos. Espaço remove.".
- [x] **2.5.3 Rótulo no nome (A)**
  - Aplicado: o nome lido pelo leitor de tela começa pelo texto visível (ex.: "Pular lista “Nos cinemas”"), o que permite acionar o botão por comando de voz.
  - Evidência: `MovieRow.jsx`.
- [x] **2.4.4 Finalidade do link (A)**
  - Aplicado: links com texto curto ganham um complemento lido pelo leitor de tela (ex.: o gênero "Ação" nos detalhes é lido como "Ação — ver mais filmes deste gênero").
  - Evidência: `MovieDetailsPage.jsx`.
- [x] **2.4.6 Cabeçalhos e rótulos (AA)**
  - Aplicado: títulos e rótulos descrevem o conteúdo (ex.: "Resultados para “batman”", "Elenco principal", "Meus favoritos").
  - Evidência: páginas em `src/pages/`.

### Leitores de tela e estrutura

- [x] **1.1.1 Conteúdo não textual (A)**
  - Aplicado: o pôster da página de detalhes tem texto alternativo ("Pôster do filme “…”"). Imagens que só repetem um nome já escrito ao lado (pôster dos cards, fotos do elenco, imagem de fundo) têm `alt=""`, e ícones decorativos ficam ocultos com `aria-hidden`.
  - Evidência: `Poster.jsx` e `MovieDetailsPage.jsx`; análise do jsx-a11y sem erros.
- [x] **1.3.1 Informações e relações (A)**
  - Aplicado: regiões `header`, `nav`, `main` e `footer`; títulos em ordem (h1 → h2 → h3) sem saltos; filtros agrupados em `fieldset`/`legend`; dados do filme em lista de definição (`dl`); tabela de atalhos com cabeçalhos `th scope`.
  - Evidência: `Layout.jsx`, `HomePage.jsx`, `MovieDetailsPage.jsx` e `HelpPage.jsx`.
- [x] **2.4.2 Página com título (A)**
  - Aplicado: cada página define o título da aba (ex.: "Busca: batman | MovieSpot").
  - Evidência: teste no Chrome: `/teste` abre com o título "Página não encontrada | MovieSpot".
- [x] **4.1.3 Mensagens de status (AA)**
  - Aplicado: a quantidade de resultados, os carregamentos, as notificações e a troca de página são anunciados pelo leitor de tela sem mover o foco.
  - Evidência: regiões `role="status"` e `aria-live` em `HomePage.jsx`, `ToastProvider.jsx` e `Layout.jsx`.
- [x] **3.1.1 / 3.1.2 Idioma da página e das partes (A / AA)**
  - Aplicado: página marcada como `lang="pt-BR"`; o título original de cada filme é marcado com o idioma dele.
  - Evidência: `index.html` e `MovieDetailsPage.jsx`.
- [x] **3.2.2 Em entrada (A)**
  - Aplicado: mudar um filtro atualiza os resultados sem trocar de página nem mover o foco.
  - Evidência: `HomePage.jsx`.
- [x] **3.2.3 Navegação consistente (AA)**
  - Aplicado: o mesmo cabeçalho e o mesmo rodapé, na mesma ordem, em todas as páginas.
  - Evidência: `Layout.jsx`.

### Layout, movimento e mídia

- [x] **1.4.10 Reflow (AA)**
  - Aplicado: o layout se adapta a telas de 320px de largura, o equivalente a 400% de zoom, sem rolagem horizontal.
  - Evidência: medição no Chrome em 320px no Início, nos resultados de busca, nos detalhes, em Favoritos, na Ajuda e na 404: nenhuma das páginas teve rolagem horizontal.
- [x] **2.5.8 Tamanho mínimo do alvo (AA)**
  - Aplicado: todo alvo clicável tem pelo menos 24×24px; os botões têm de 36 a 48px de altura.
  - Evidência: medição no Chrome em todas as páginas. O menor alvo tem 24px de altura (links do rodapé e da trilha de navegação, que tinham 19px e foram aumentados durante a medição). Os botões de rádio do tema ficam dentro de rótulos clicáveis de 44px de altura.
- [x] **2.2.1 Tempo ajustável (A)**
  - Aplicado: as notificações ficam 6 segundos na tela e pausam enquanto o mouse ou o foco está sobre elas.
  - Evidência: `Toaster.jsx`.
- [x] **2.3.3 Animação a partir de interações (AAA)**
  - Aplicado: com a opção de reduzir animações ativada no sistema, o site desliga o zoom dos pôsteres, o pulsar dos esqueletos, o giro do carregador e a rolagem suave das faixas.
  - Evidência: regra `prefers-reduced-motion` em `src/index.css` e `MovieRow.jsx`.
- [x] **1.2.2 Legendas (A)**
  - Aplicado: o trailer abre com legendas ativadas quando o YouTube as oferece.
  - Evidência: parâmetro `cc_load_policy=1` em `TrailerDialog.jsx`.
