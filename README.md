## Preparação segura para GitHub

- O arquivo `.env` local não deve ser versionado; o `.gitignore` o exclui.
- Use `.env.example` como modelo e preencha sua chave Publishable somente no `.env` local.
- Nunca use chaves `secret` ou `service_role` no aplicativo.
- Consulte `GITHUB-PRIMEIRO-ENVIO.md` antes de vincular ao repositório remoto.
- Esta versão ainda usa AsyncStorage para persistência local; a migração para SQLite será feita separadamente, com plano de preservação dos dados.

## Correção de compatibilidade — Expo SDK 58 (iOS)

Esta versão foi ajustada para a família do Expo SDK 58, usada pelo Expo Go mostrado no erro. O `package-lock.json` anterior do SDK 57 foi removido intencionalmente para que o npm gere um lock novo e coerente no computador de teste.

No Windows, abra o terminal **CMD** dentro da pasta `ProjectX` e execute, nesta ordem:

```cmd
npm.cmd install
npx.cmd expo install --fix
npx.cmd expo-doctor@latest
npx.cmd expo start --clear
```

Se `expo-doctor` indicar incompatibilidades, copie a saída completa antes de continuar. O comando `expo install --fix` ajusta os módulos Expo às versões compatíveis com o SDK instalado. Não use `npm ci` antes de `npm install`, pois o lockfile será recriado localmente.

# ProjectX — correção Etapas 3 + 4 e mapa inicial

Esta versão parte do projeto enviado e preserva os recursos já testados: pesquisa, favoritos, cadastro local e integração opcional com Supabase.

## Mudanças desta versão

- A tela inicial de Explorar agora abre diretamente em um mapa, centrado inicialmente em Brasília.
- Eventos com coordenadas aparecem como marcadores no mapa; toque em um marcador ou cartão inferior para abrir os detalhes.
- Barra superior flutuante com marca, busca, busca manual de região e categorias.
- Cartões de eventos em uma faixa inferior sobre o mapa e atalhos para os raios de 5, 10, 25 e 50 km.
- Correção do fluxo de localização: verifica a permissão existente antes de pedir novamente, verifica se os Serviços de Localização estão ativos, tenta usar uma posição recente e apresenta mensagens distintas para permissão negada, serviços desativados e falha/timeout ao obter posição.
- A configuração Expo declara o texto de permissão de localização do iOS.
- Mantém AsyncStorage para persistência local e a integração Supabase opcional.

## Instalação

1. Extraia o ZIP em uma nova pasta, sem sobrescrever a versão anterior.
2. Abra a pasta `ProjectX` no VS Code.
3. No terminal CMD nessa pasta, execute:

   ```cmd
   npm.cmd install
   ```

   Isso instalará `react-native-maps` e atualizará o `package-lock.json` localmente.

4. Inicie o Expo:

   ```cmd
   npx.cmd expo start --clear
   ```

5. Leia o QR code com o Expo Go no iPhone. Mantenha o computador e o iPhone na mesma rede Wi-Fi.

## Teste do mapa

1. Ao abrir o app, a tela Explorar deve mostrar o mapa de Brasília, marcadores de eventos e cartões inferiores.
2. Toque em um marcador para abrir os detalhes do evento.
3. Toque em um cartão inferior para abrir os detalhes.
4. Use as categorias e o campo de busca para filtrar os eventos e marcadores.
5. Troque o raio de busca entre 5, 10, 25 e 50 km.
6. Toque no ícone de localização para solicitar/usar a posição atual. Com permissão concedida, o mapa deve centralizar na localização.
7. Teste a busca manual de região caso não queira conceder localização.

## Se a localização continuar falhando no iPhone

A mensagem agora diferencia as causas. Verifique:
- Ajustes > Privacidade e Segurança > Serviços de Localização: serviços gerais ligados.
- Na lista de apps, Expo Go: permitir localização durante o uso.
- Desative temporariamente o Modo de Pouca Energia se a localização demorar e tente em área aberta.
- Feche e reabra o Expo Go depois de mudar permissões.
- Se a mensagem disser que os serviços estão desativados, isso é diferente da permissão do app estar concedida.

Não redefina todas as permissões nem reinstale o Expo Go sem antes observar a mensagem exata. Se falhar, envie a mensagem apresentada pelo app e os logs do terminal.

## Etapa 15 — conexão com o Supabase

A URL e a chave Publishable fornecidas foram configuradas no arquivo `.env` desta entrega. A chave `sb_publishable_...` é destinada ao uso no cliente; a segurança depende das políticas RLS do banco. Nunca coloque neste aplicativo uma chave `secret` ou `service_role`.

### Configuração obrigatória no painel Supabase

1. Abra o projeto `finmivzdqzgaslejsqtr`.
2. Entre em **Authentication → Sign In / Providers** (o nome pode variar conforme a versão do painel) e habilite **Anonymous Sign-Ins / Anonymous users**. O app usa uma sessão anônima do Supabase para aplicar as regras de propriedade dos anúncios.
3. Abra **SQL Editor → New query**.
4. Abra `supabase-schema.sql`, copie todo o conteúdo e execute no SQL Editor. O script cria a tabela `public.events`, índices, RLS e políticas para leitura de eventos publicados e escrita por usuários com sessão autenticada.
5. No CMD, dentro da pasta `ProjectX`, execute `npm.cmd install` e depois `npx.cmd expo start --clear`.

### Como testar

1. Abra o app no Expo Go com conexão à internet.
2. Entre em Explorar e aguarde alguns segundos. O status deve indicar sincronização ou manter os dados locais se houver falha.
3. Cadastre um evento com data, horário e local. O app mantém uma cópia local e tenta enviar o evento à nuvem.
4. Abra o app em outro aparelho usando a mesma configuração Supabase. Eventos publicados devem aparecer nos dois aparelhos após sincronização/reabertura.
5. Se falhar, confira se o SQL foi executado e se o login anônimo está habilitado; anote o alerta completo.

### Segurança e limitações

- Não desative RLS nem crie políticas de escrita irrestrita para `anon`.
- Eventos de demonstração e anúncios locais antigos permanecem no aparelho; eventos demonstrativos não são enviados automaticamente à nuvem.
- Favoritos continuam locais neste estágio.
- A integração usa REST do Supabase e não adiciona dependências nativas extras.
- O `.env` inclui a chave Publishable para facilitar o teste. Ela não é uma chave secreta; nunca inclua `secret` ou `service_role` no aplicativo.
- A conexão real com o seu projeto e o teste em iPhone físico não puderam ser executados neste ambiente.

## Limitações conhecidas

- Eventos de exemplo usam coordenadas aproximadas de regiões de Brasília; não são eventos reais.
- A busca manual usa o serviço de geocodificação do Expo Location e precisa de conexão.
- Favoritos são persistidos no aparelho; sincronização de favoritos entre dispositivos depende de autenticação/implementação futura.
- A sincronização Supabase é opcional e não fica ativa sem credenciais.
- O projeto foi verificado quanto à sintaxe JSX, mas esta entrega ainda precisa ser aberta e testada no iPhone físico com Expo Go. Não afirmamos teste em dispositivo real.


## Correção de localização — versão 3

- `getCurrentPositionAsync` agora recebe explicitamente `{ accuracy: Location.Accuracy.Balanced }`, pois a chamada sem opções pode chegar à ponte nativa do iOS como `undefined`.
- Logs de diagnóstico indicam se a falha ocorre na permissão, na verificação dos Serviços de Localização ou na solicitação da posição.
- Não é necessário alterar novamente as permissões do iPhone para aplicar esta correção. Reinicie o Metro com `npx expo start --clear`.


## Correção de localização v4

Esta versão corrige um detalhe da versão anterior: a chamada `getCurrentPositionAsync` agora recebe explicitamente um objeto de opções (`accuracy: Location.Accuracy.Balanced`). Foram adicionados logs por etapa (`[RolePertoLocation]`) para indicar exatamente onde uma falha ocorre. Não foi possível testar fisicamente no iPhone; confirme o resultado no Expo Go.


## Correção de localização — versão 5

O log do teste no iPhone mostrou que a permissão e a solicitação da posição eram concluídas, e a falha acontecia durante `applyCoordinates`. Essa função fazia uma chamada a `Location.reverseGeocodeAsync`, usada somente para transformar coordenadas em nome de bairro/cidade. A chamada foi removida desse fluxo; agora o app usa as coordenadas GPS para centralizar o mapa e calcular distâncias, exibindo “Perto de você” como rótulo. A busca manual de região continua usando geocodificação separadamente.


## Correção de localização — versão 6

A versão anterior ainda continha `Location.reverseGeocodeAsync` dentro de `applyCoordinates`, apesar da orientação de removê-lo. Esta versão remove essa chamada por completo. Ao obter a posição, o app agora atualiza coordenadas e armazenamento local diretamente e usa o rótulo "Perto de você". O nome do bairro/cidade pode ser adicionado depois em uma rotina independente.


## Ajuste visual do mapa — versão 7

- A faixa "Acontecendo por aí" agora fica ancorada na parte inferior do mapa, acima da navegação, em vez de ocupar o meio da tela.
- A faixa foi compactada para deixar mais área cartográfica visível.
- Os controles de raio ficam alinhados à direita, mantendo o acesso à centralização da localização.
- Mantidos marcadores, seleção de evento, categorias, favoritos e localização corrigida na versão anterior.


## Versão 8 — ajuste real do painel do mapa

- O painel "Acontecendo por aí" agora usa posicionamento absoluto ancorado na parte inferior da área do mapa, logo acima da barra de navegação.
- A sobreposição principal não distribui mais os elementos com `space-between`, que podia deixar o painel flutuando em posição inesperada.
- O painel foi compactado (máximo de 174 px), com cartões menores para liberar o centro do mapa.
- Esta alteração é de layout; testar no iPhone para validar a posição em diferentes tamanhos de tela.


## Versão 9 — fix definitivo do painel inferior

O painel de eventos foi ancorado explicitamente à parte inferior da área do mapa usando `position: 'absolute'`, `left: 0`, `right: 0` e `bottom: 0`. A versão anterior não aplicou corretamente essa alteração ao estilo existente. Os cartões também foram compactados.


## Versão 10 — mapa limpo e navegação restaurada

- Removido o painel "Acontecendo por aí" da visualização padrão do centro do mapa.
- Criada uma barra vertical de ícones no lado direito: um botão abre/fecha a lista compacta de eventos; outro centraliza na localização.
- Mantidos filtros de categoria e raio no topo.
- Restaurada a barra inferior horizontal com Explorar, Salvos e Anunciar, incluindo estilos que estavam ausentes na folha de estilos.
- O painel de eventos é opcional e só aparece quando o usuário toca no ícone de lista.


## Versão 11 — mapa limpo e navegação corrigida

- O painel de eventos fica oculto por padrão e só abre ao tocar no botão de lista na lateral direita.
- Adicionada coluna vertical de ícones à direita: lista de eventos e centralização da localização.
- Mantidos filtros de categoria no cartão superior e raios de busca em uma linha separada.
- Barra inferior explicitamente estilizada em linha horizontal com três abas de largura igual.
- Testar no iPhone para validar a posição dos controles em telas de diferentes alturas.


## Correção de layout v12 (reempacotada)

O painel de eventos do mapa foi substituído por ícones compactos em coluna à esquerda. Foram incluídos estilos ausentes usados pelas telas Salvos, Anunciar e Detalhes, além de espaçamento e cartões padronizados.


## Versão 13 — persistência de anúncios e painel resumido

- A gravação em AsyncStorage agora aguarda a hidratação inicial, evitando sobrescrever anúncios existentes com a lista de demonstração no primeiro render.
- A publicação grava explicitamente a lista atualizada no armazenamento local.
- A aba Anunciar inclui “Ver meus anúncios”, lista anúncios locais e permite excluí-los.
- O botão de eventos próximos abre um painel compacto com categoria, título, local, distância/preço e atalho para salvar, limitado a quatro eventos visíveis.
- O painel é uma alteração de layout e comportamento; a sincronização entre dispositivos ainda depende de configurar Supabase.


## Etapa 14 — cadastro de data, horário e preço simplificado

- A data agora é preenchida em campo numérico com máscara `DD/MM/AAAA`, com atalhos para Hoje e Amanhã.
- O horário tem campo próprio com máscara `HH:MM` em formato de 24 horas.
- A publicação valida data e horário para impedir datas inexistentes e horários inválidos.
- O campo de preço exibe o prefixo `R$`, formata os centavos conforme o padrão brasileiro e aceita a opção explícita de entrada gratuita.
- O evento salvo mantém uma descrição legível de data e horário (por exemplo, `25/10/2026 às 19:30`) e preço (por exemplo, `R$ 25,00` ou `Gratuito`).
- Não foi adicionada uma dependência externa de calendário; os campos usam controles nativos já disponíveis no React Native.


## Correção da Etapa 14 — hotfix de sintaxe e dados de demonstração

- Corrigida a expressão regular que causava `SyntaxError: Invalid regular expression flag` no App.js e impedia o Metro de compilar.
- Adicionada migração segura dos eventos de demonstração: ao abrir uma instalação que já tem eventos salvos, os novos exemplos são mesclados por ID sem substituir anúncios locais existentes.
- Acrescentados sete eventos de demonstração em categorias variadas e regiões diferentes de Brasília (cultura, esportes, gastronomia, música e feiras). Eles são dados fictícios para testes e não devem ser tratados como eventos reais confirmados.
- Validada a sintaxe JavaScript de App.js com `node --check` (aprovado). O teste em Expo Go no aparelho ainda precisa ser feito.
