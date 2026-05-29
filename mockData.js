// Aura OS Mock Data - Dados Iniciais de Exemplo
// Para preencher o dashboard e dar vida ao aplicativo no primeiro carregamento.

const getTodayDate = (offsetDays = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
};

export const initialTasks = [
  {
    id: "task-1",
    text: "Revisar relatório de vendas do trimestre",
    status: "doing",
    category: "Trabalho",
    createdAt: getTodayDate(0)
  },
  {
    id: "task-2",
    text: "Comprar ingredientes para o jantar de sexta-feira",
    status: "todo",
    category: "Pessoal",
    createdAt: getTodayDate(0)
  },
  {
    id: "task-3",
    text: "Renovar assinatura da hospedagem do site",
    status: "backlog",
    category: "Finanças",
    createdAt: getTodayDate(-1)
  },
  {
    id: "task-4",
    text: "Beber pelo menos 2.5L de água hoje",
    status: "done",
    category: "Saúde",
    createdAt: getTodayDate(0)
  },
  {
    id: "task-5",
    text: "Enviar email com proposta comercial para cliente",
    status: "todo",
    category: "Trabalho",
    createdAt: getTodayDate(0)
  }
];

export const initialEvents = [
  {
    id: "event-1",
    title: "Reunião de Alinhamento com Equipe",
    date: getTodayDate(0),
    time: "10:00",
    description: "Alinhamento semanal sobre sprints e novos clientes."
  },
  {
    id: "event-2",
    title: "Almoço com investidor da Startup",
    date: getTodayDate(1),
    time: "12:30",
    description: "Apresentação dos resultados de crescimento anual."
  },
  {
    id: "event-3",
    title: "Sessão de Mentoria / Carreira",
    date: getTodayDate(3),
    time: "17:00",
    description: "Mentoria com o novo time de desenvolvedores."
  },
  {
    id: "event-4",
    title: "Check-up Médico Anual",
    date: getTodayDate(5),
    time: "08:30",
    description: "Consulta geral de rotina no hospital central."
  }
];

export const initialFinance = [
  {
    id: "fin-1",
    description: "Projeto Frontend Aura (Freelance)",
    amount: 3200.00,
    type: "income",
    category: "Trabalho",
    date: getTodayDate(-4)
  },
  {
    id: "fin-2",
    description: "Supermercado Semanal",
    amount: 450.32,
    type: "expense",
    category: "Alimentação",
    date: getTodayDate(-3)
  },
  {
    id: "fin-3",
    description: "Combustível Carro",
    amount: 180.00,
    type: "expense",
    category: "Transporte",
    date: getTodayDate(-2)
  },
  {
    id: "fin-4",
    description: "Assinatura Streaming (Netflix/Spotify)",
    amount: 55.90,
    type: "expense",
    category: "Lazer",
    date: getTodayDate(-1)
  },
  {
    id: "fin-5",
    description: "Rendimento Fundos Imobiliários",
    amount: 154.20,
    type: "income",
    category: "Investimentos",
    date: getTodayDate(0)
  },
  {
    id: "fin-6",
    description: "Jantar Restaurante Japonês",
    amount: 220.00,
    type: "expense",
    category: "Alimentação",
    date: getTodayDate(0)
  }
];

export const initialHabits = [
  {
    id: "habit-1",
    name: "Meditação Diária",
    streak: 5,
    completedDays: [
      getTodayDate(-5),
      getTodayDate(-4),
      getTodayDate(-3),
      getTodayDate(-2),
      getTodayDate(-1)
    ],
    frequency: "diário"
  },
  {
    id: "habit-2",
    name: "Exercício Físico (30 min)",
    streak: 3,
    completedDays: [
      getTodayDate(-3),
      getTodayDate(-2),
      getTodayDate(-1),
      getTodayDate(0)
    ],
    frequency: "diário"
  },
  {
    id: "habit-3",
    name: "Leitura de Livros (10 págs)",
    streak: 0,
    completedDays: [
      getTodayDate(-2),
      getTodayDate(-1)
    ],
    frequency: "diário"
  },
  {
    id: "habit-4",
    name: "Codificar Projeto Pessoal",
    streak: 12,
    completedDays: [
      getTodayDate(-6),
      getTodayDate(-5),
      getTodayDate(-4),
      getTodayDate(-3),
      getTodayDate(-2),
      getTodayDate(-1),
      getTodayDate(0)
    ],
    frequency: "diário"
  }
];

export const initialReminders = [
  {
    id: "rem-1",
    text: "Beber água (Lembrete de rotina)",
    time: "16:00",
    active: true
  },
  {
    id: "rem-2",
    text: "Reunião de fechamento às 18h",
    time: "17:45",
    active: true
  },
  {
    id: "rem-3",
    text: "Ligar para a mãe",
    time: "20:00",
    active: true
  }
];
