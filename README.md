# Radio Hub Connect

Crie o projeto inicial de um sistema web profissional chamado **Papo de Produtor | Gestão de Rádios**, para uma empresa de produção de eventos que trabalha com locação de rádios comunicadores.

OBJETIVO
Construir primeiro um FRONT-END completo, bonito, direto, intuitivo e responsivo para desktop e celular. Nesta etapa, use dados fictícios/mockados e não dependa de backend real. A arquitetura visual e os componentes, porém, devem ficar preparados para integração posterior com Supabase, GitHub e deploy na Vercel.

DIREÇÃO VISUAL

- Aparência moderna, premium, limpa e profissional.
- Não parecer um ERP antigo ou poluído.
- Interface extremamente fácil de operar durante eventos e locações.
- Sidebar elegante no desktop e navegação adaptada no mobile.
- Cards de indicadores claros, tabelas fáceis de ler, filtros simples e ações evidentes.
- Tipografia moderna, bom espaçamento, cantos levemente arredondados, sombras discretas.
- Use uma identidade visual forte e sóbria, adequada à marca Papo de Produtor e ao universo de produção de eventos/comunicação.
- Priorize excelente UX e hierarquia visual.
- Crie um logotipo tipográfico temporário simples com “Papo de Produtor” e subtítulo “Gestão de Rádios”; não invente uma marca complexa.

TELAS E FLUXOS INICIAIS

1. LOGIN

- Tela elegante de acesso.
- E-mail, senha, lembrar acesso e botão Entrar.
- Pode ser apenas visual nesta etapa.

2. DASHBOARD
   Mostrar indicadores principais com dados mockados:

- Total de rádios cadastrados.
- Rádios locados.
- Rádios disponíveis.
- Rádios em manutenção.
- Faturamento do mês.
- Valores a receber.
- Locações ativas.
- Locações com devolução próxima/atrasada.

Adicionar:

- Botão de destaque “+ Nova Locação”.
- Lista de locações em andamento.
- Próximas devoluções.
- Resumo financeiro.
- Indicador visual de ocupação do estoque.

3. RÁDIOS / EQUIPAMENTOS

- Lista com busca e filtros.
- Cada rádio deve ser tratado individualmente, com código patrimonial no padrão RAD-001, RAD-002 etc.
- Campos visuais: código, modelo, número de série, status, bateria, observação/localização.
- Status: Disponível, Locado, Manutenção, Reservado, Inativo/Perdido.
- Botão “+ Novo Rádio”.
- Ao clicar em um item, abrir detalhes do equipamento com histórico fictício de locações e manutenções.
- Reserve espaço para futuro QR Code individual.

4. LOCAÇÕES

- Página com abas/filtros: Ativas, Reservadas, Finalizadas, Atrasadas.
- Tabela/cards com número da locação, cliente, período, quantidade de rádios, valor, pagamento e status.
- Botão “+ Nova Locação”.

5. NOVA LOCAÇÃO
   Criar um fluxo simples em etapas, sem burocracia:

- Cliente.
- Data/hora de retirada.
- Data/hora prevista de devolução.
- Seleção dos rádios disponíveis.
- Seleção de acessórios: baterias extras, carregadores, fones, cases e outros.
- Valor da locação.
- Desconto/acréscimo opcional.
- Forma de pagamento.
- Pago / parcial / a receber.
- Observações.
- Resumo lateral/final antes de confirmar.
- A interface deve deixar claro quais rádios estão disponíveis.

6. DEVOLUÇÃO / CONFERÊNCIA

- Tela pensada para uso rápido no celular.
- Exibir equipamentos da locação.
- Para cada rádio: OK, Avariado, Faltando.
- Campo para acessórios faltantes ou avarias.
- Espaço visual para futuramente escanear QR Code pela câmera.
- Botão “Finalizar devolução”.

7. CLIENTES

- Cadastro e lista.
- Nome/Razão social, CPF/CNPJ, telefone, e-mail, responsável e observações.
- Histórico visual de locações e saldo a receber.

8. FINANCEIRO

- Cards: faturamento no mês, recebido, a receber, despesas e resultado.
- Entradas e saídas.
- Filtros por período, cliente e situação.
- Gráfico simples de faturamento mensal.
- Contas a receber com vencimento e status.

9. MANUTENÇÃO

- Lista de rádios em manutenção.
- Tipo do problema, data de entrada, custo, status, fornecedor/técnico e observação.

10. RELATÓRIOS

- Área visual inicial para relatórios futuros: faturamento, utilização dos rádios, clientes, manutenção e perdas.

11. CONFIGURAÇÕES

- Dados da empresa.
- Usuários.
- Formas de pagamento.
- Categorias de acessórios.
- Preferências do sistema.

MENU PRINCIPAL
Dashboard
Rádios
Locações
Clientes
Financeiro
Manutenção
Relatórios
Configurações

REGRAS DE UX

- O usuário deve conseguir iniciar uma nova locação em no máximo 1 clique a partir do dashboard.
- Ações primárias muito claras.
- Status com badges visuais consistentes.
- Evitar excesso de texto e formulários gigantes.
- Criar estados vazios, busca e filtros visualmente bem resolvidos.
- Responsividade excelente; especialmente Dashboard, Nova Locação e Devolução devem funcionar muito bem no celular.
- Use componentes reutilizáveis e organização de código limpa.

DADOS MOCKADOS
Use exemplos realistas do mercado de eventos, incluindo rádios como Motorola EP450 e locações para clientes/eventos fictícios, apenas para demonstrar o funcionamento visual.

IMPORTANTE
Neste primeiro momento, concentre-se no produto visual/front-end e experiência. Não faça integrações complexas nem configure banco real ainda. Quero um protótipo navegável e convincente que possamos revisar visualmente antes de construir o backend definitivo.

Crie todas as páginas e navegação básica necessárias para que eu consiga clicar e avaliar o sistema como se já estivesse em uso.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/e42d12ea-b2eb-4422-84e9-6f1d944ba451).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
