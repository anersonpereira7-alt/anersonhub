# Vini como área do painel

## Objetivo
- Remover o balão flutuante do Vini.
- Adicionar “Vini” ao menu do painel administrativo.
- Exibir o chat como uma área própria, acessível somente após login administrativo.
- Usar fundo branco sólido e manter a rolagem restrita à conversa, sem mover o restante do painel durante o uso.

## Implementação
- Instalar e reutilizar os componentes oficiais de conversa, mensagens e campo de envio do AI Elements.
- Compor o chat dentro de um card branco com altura estável em computador e celular.
- Manter o histórico rolável dentro do card e o campo de mensagem fixo na parte inferior.
- Preservar os comandos e ações atuais do Vini.
- Remover o botão e a sobreposição flutuantes.

## Validação
- Testar login, abertura do menu Vini, envio de comando e atualização do painel.
- Conferir fundo opaco, rolagem interna e ausência de movimento da página por trás em celular e computador.
- Confirmar que o Vini continua invisível fora do painel administrativo.
