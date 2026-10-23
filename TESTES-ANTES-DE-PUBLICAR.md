# Checklist de teste — ProjectX

- [ ] App abre no Expo Go sem tela vermelha.
- [ ] Tela Explorar carrega o mapa.
- [ ] Busca manual de região centraliza o mapa na cidade informada.
- [ ] Anúncio sem coordenadas mostra aviso de localização ausente em Meus anúncios.
- [ ] A ação Adicionar localização para o mapa aceita endereço com cidade/UF e grava latitude/longitude.
- [ ] Consulta no Supabase confirma latitude e longitude não nulas para o anúncio corrigido.
- [ ] Novo anúncio com endereço completo recebe coordenadas ou mostra aviso claro se a geocodificação falhar.
- [ ] Evento aparece como marcador após pesquisar a região correta e ajustar o raio se necessário.
- [ ] Anúncio continua em Meus anúncios após reiniciar o app.
- [ ] Nenhuma chave privada/service_role foi adicionada ao `.env.example` ou ao Git.

Aviso: o código foi validado sintaticamente neste ambiente, mas o teste real no iPhone/Expo Go e a confirmação das políticas do Supabase precisam ser executados no aparelho e projeto do usuário.

- [ ] Ao selecionar 5, 10, 25 ou 50 km, o mapa ajusta o zoom de acordo com o raio.
- [ ] A busca de região exibe marcadores que estão dentro do raio selecionado.
- [ ] “Ajustar localização do mapa” corrige também anúncios que já tinham coordenadas incorretas.
- [ ] Endereços curtos são geocodificados junto com bairro/cidade/UF para reduzir ambiguidades.
