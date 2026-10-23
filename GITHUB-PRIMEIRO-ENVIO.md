# ProjectX — preparação segura para o GitHub

Esta entrega remove o arquivo `.env` que continha a chave Publishable e deixa apenas `.env.example` com um marcador. A chave Publishable é feita para uso no aplicativo cliente, mas mantemos o arquivo `.env` fora do Git para separar configuração local e repositório.

## Preparar configuração local

1. Nesta pasta, faça uma cópia de `.env.example` chamada `.env`.
2. No `.env` local, substitua `COLE_AQUI_SUA_CHAVE_PUBLISHABLE` pela chave Publishable do Supabase (`sb_publishable_...`).
3. Não adicione o `.env` ao GitHub. O `.gitignore` já exclui esse arquivo.
4. Não use neste aplicativo chaves `secret` nem `service_role`.

## Conferir antes de enviar ao GitHub (PowerShell)

```powershell
git status --short
git check-ignore -v .env
```

O segundo comando deve apontar a regra `.env` do `.gitignore`. Se `git` não for reconhecido, instale o Git for Windows e abra um novo terminal.

## Vincular ao repositório existente

Antes de fazer `git push`, confira se o repositório remoto está vazio ou se já tem arquivos. Não force push e não sobrescreva o histórico remoto.

```powershell
git init
git add .
git status
git commit -m "Preparar ProjectX para versionamento seguro"
git branch -M main
git remote add origin https://github.com/Almeida30201/ProjectX.git
git push -u origin main
```

Se `git remote add origin` informar que `origin` já existe, execute `git remote -v` e confira o endereço antes de continuar. Se o GitHub já tiver um README ou outro commit, pare antes do `push` e reconcilie o histórico; não use `--force`.

## Estado da arquitetura

Esta entrega prepara o projeto para versionamento seguro; **não implementa ainda SQLite nem conclui a sincronização em nuvem**. O aplicativo atual usa AsyncStorage para dados locais e tem uma integração Supabase opcional que depende da configuração e das políticas do projeto. A próxima etapa deve introduzir SQLite em uma alteração separada, com migração e preservação dos dados, após confirmar a versão estável.
