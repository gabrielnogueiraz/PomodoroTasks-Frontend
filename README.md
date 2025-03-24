PomodoroTasks
Um gerenciador de tarefas com timer Pomodoro integrado, projetado para aumentar sua produtividade através do método Pomodoro.

<img alt="PomodoroTasks" src="https://imgur.com/a/09TCnOT">
📋 Sobre o Projeto
PomodoroTasks é uma aplicação web que combina um gerenciador de tarefas com a técnica Pomodoro de gerenciamento de tempo. O método Pomodoro consiste em dividir o trabalho em intervalos de 25 minutos (pomodoros) intercalados com pausas curtas, o que ajuda a manter o foco e evitar a fadiga mental.

✨ Funcionalidades
Gerenciamento de Tarefas

Criar tarefas com diferentes níveis de prioridade (alta, média, baixa)
Visualizar tarefas pendentes
Excluir ou marcar tarefas como concluídas
Acompanhar o progresso das tarefas (pomodoros completados/estimados)
Timer Pomodoro

Timer visual com animação circular que diminui com o tempo
Configurar sessões de trabalho (pomodoros)
Pausas curtas (5 minutos) e longas (15 minutos)
Personalizar a duração do pomodoro
Registrar automaticamente os pomodoros concluídos para cada tarefa
🔧 Tecnologias Utilizadas
Frontend
React.js
TypeScript
CSS Modules
Animações CSS
Backend
Node.js
TypeORM
SQLite (banco de dados)
Express
🏗️ Arquitetura do Projeto
O projeto segue uma arquitetura cliente-servidor:

Frontend (Este repositório)
Interfaces de usuário responsivas
Gerenciamento de estado com React Hooks
Comunicação com API através de serviços
Backend (Repositório separado)
API RESTful
Manipulação de dados com TypeORM
Persistência com SQLite
📦 Instalação e Execução
Pré-requisitos
Node.js (v14+)
npm ou yarn
Backend
# Clone o repositório do backend
git clone https://github.com/seu-usuario/pomodorotasks-backend.git
cd pomodorotasks-backend

# Instale as dependências
npm install

# Configure o banco de dados
npm run migration:run

# Inicie o servidor
npm run dev

Frontend
# Clone este repositório
git clone https://github.com/seu-usuario/pomodorotasks-frontend.git
cd pomodorotasks-frontend

# Instale as dependências
npm install

# Inicie a aplicação em modo de desenvolvimento
npm start

A aplicação estará disponível em http://localhost:3000.

🚀 Como Usar
Criando uma Tarefa

Digite o título da tarefa no campo "Nova tarefa..."
Selecione a prioridade (baixa, média ou alta) usando os botões coloridos
Clique em "Adicionar" ou pressione Enter
Usando o Timer Pomodoro

Selecione uma tarefa na lista de tarefas pendentes
Escolha o modo (Pomodoro, Pausa Curta ou Pausa Longa)
Opcionalmente, ajuste o tempo do pomodoro (em minutos)
Clique em "Iniciar" para começar a contagem regressiva
O timer circulará mostrando o progresso visualmente
Ao terminar, o sistema registrará o pomodoro concluído para a tarefa
Gerenciando Tarefas

As tarefas são exibidas com suas prioridades codificadas por cores
Cada tarefa mostra quantos pomodoros foram completados e quantos eram estimados
Clique no botão "×" para excluir uma tarefa
📘 O Método Pomodoro
A técnica Pomodoro foi desenvolvida por Francesco Cirillo no final dos anos 1980. O método usa um timer para dividir o trabalho em intervalos, tradicionalmente de 25 minutos, separados por pausas curtas.

Ciclo Básico:
Decidir a tarefa a ser realizada
Configurar o timer para 25 minutos (um pomodoro)
Trabalhar na tarefa até o timer tocar
Fazer uma pausa curta (5 minutos)
A cada 4 pomodoros, fazer uma pausa mais longa (15-30 minutos)
Benefícios:
Reduz a ansiedade associada ao tempo
Aumenta o foco e a concentração evitando distrações
Aumenta a consciência de decisões
Melhora a motivação e mantém-na constante
Reforça a determinação para atingir objetivos
🤝 Contribuições
Contribuições são bem-vindas! Se você tiver sugestões para melhorar este aplicativo:

Faça um fork do projeto
Crie uma branch para sua feature (git checkout -b feature/nova-funcionalidade)
Faça commit de suas mudanças (git commit -m 'Adiciona nova funcionalidade')
Faça push para a branch (git push origin feature/nova-funcionalidade)
Abra um Pull Request
📄 Licença
Este projeto está licenciado sob a licença MIT - veja o arquivo LICENSE para detalhes.

👨‍💻 Autor
Desenvolvido por Gabriel Nogueira.

⭐️ Este projeto? Deixe uma estrela no GitHub!