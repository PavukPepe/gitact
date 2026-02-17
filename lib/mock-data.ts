export type ChatStatus = "new" | "in-progress" | "replied" | "closed"
export type ChatSource = "website" | "telegram"
export type ChatTag = "urgent" | "question" | "sale"

export interface Chat {
  id: string
  clientName: string
  clientPhone?: string
  clientTelegram?: string
  clientAvatar?: string
  source: ChatSource
  status: ChatStatus
  lastMessage: string
  lastMessageTime: Date
  tags: ChatTag[]
  messages: Message[]
}

export interface Message {
  id: string
  content: string
  sender: "client" | "manager"
  timestamp: Date
}

export interface Manager {
  id: string
  name: string
  email: string
  role: string
  isOnline: boolean
  avatar?: string
}

export const mockChats: Chat[] = [
  {
    id: "1",
    clientName: "Алексей Петров",
    clientPhone: "+7 (999) 123-45-67",
    source: "website",
    status: "new",
    lastMessage: "Здравствуйте! Хотел бы узнать подробнее о ваших услугах",
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 5),
    tags: ["question"],
    messages: [
      {
        id: "1-1",
        content: "Здравствуйте! Хотел бы узнать подробнее о ваших услугах",
        sender: "client",
        timestamp: new Date(Date.now() - 1000 * 60 * 5),
      },
    ],
  },
  {
    id: "2",
    clientName: "Мария Иванова",
    clientTelegram: "@maria_ivanova",
    source: "telegram",
    status: "new",
    lastMessage: "Срочно нужна консультация по интеграции!",
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 2),
    tags: ["urgent", "question"],
    messages: [
      {
        id: "2-1",
        content: "Срочно нужна консультация по интеграции!",
        sender: "client",
        timestamp: new Date(Date.now() - 1000 * 60 * 2),
      },
    ],
  },
  {
    id: "3",
    clientName: "Дмитрий Сидоров",
    clientPhone: "+7 (999) 765-43-21",
    source: "website",
    status: "in-progress",
    lastMessage: "Да, интересует тариф Pro. Какие есть варианты оплаты?",
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 15),
    tags: ["sale"],
    messages: [
      {
        id: "3-1",
        content: "Добрый день! Интересует ваш тариф Pro",
        sender: "client",
        timestamp: new Date(Date.now() - 1000 * 60 * 30),
      },
      {
        id: "3-2",
        content: "Здравствуйте! Рады помочь. Тариф Pro включает...",
        sender: "manager",
        timestamp: new Date(Date.now() - 1000 * 60 * 25),
      },
      {
        id: "3-3",
        content: "Да, интересует тариф Pro. Какие есть варианты оплаты?",
        sender: "client",
        timestamp: new Date(Date.now() - 1000 * 60 * 15),
      },
    ],
  },
  {
    id: "4",
    clientName: "Елена Козлова",
    clientTelegram: "@elena_k",
    source: "telegram",
    status: "in-progress",
    lastMessage: "Хорошо, жду инструкцию по настройке",
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 45),
    tags: ["question"],
    messages: [
      {
        id: "4-1",
        content: "Как настроить виджет на Wordpress?",
        sender: "client",
        timestamp: new Date(Date.now() - 1000 * 60 * 60),
      },
      {
        id: "4-2",
        content: "Сейчас подготовлю инструкцию для вас",
        sender: "manager",
        timestamp: new Date(Date.now() - 1000 * 60 * 50),
      },
      {
        id: "4-3",
        content: "Хорошо, жду инструкцию по настройке",
        sender: "client",
        timestamp: new Date(Date.now() - 1000 * 60 * 45),
      },
    ],
  },
  {
    id: "5",
    clientName: "Сергей Николаев",
    clientPhone: "+7 (999) 111-22-33",
    source: "website",
    status: "replied",
    lastMessage: "Инструкция отправлена на вашу почту. Обращайтесь, если будут вопросы!",
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 120),
    tags: [],
    messages: [
      {
        id: "5-1",
        content: "Не работает кнопка отправки сообщения",
        sender: "client",
        timestamp: new Date(Date.now() - 1000 * 60 * 180),
      },
      {
        id: "5-2",
        content: "Проверьте, пожалуйста, настройки браузера",
        sender: "manager",
        timestamp: new Date(Date.now() - 1000 * 60 * 150),
      },
      {
        id: "5-3",
        content: "Всё равно не работает",
        sender: "client",
        timestamp: new Date(Date.now() - 1000 * 60 * 140),
      },
      {
        id: "5-4",
        content: "Инструкция отправлена на вашу почту. Обращайтесь, если будут вопросы!",
        sender: "manager",
        timestamp: new Date(Date.now() - 1000 * 60 * 120),
      },
    ],
  },
  {
    id: "6",
    clientName: "Анна Морозова",
    clientTelegram: "@anna_m",
    source: "telegram",
    status: "replied",
    lastMessage: "Спасибо за быстрый ответ! Буду тестировать",
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 90),
    tags: [],
    messages: [
      {
        id: "6-1",
        content: "Спасибо за быстрый ответ! Буду тестировать",
        sender: "client",
        timestamp: new Date(Date.now() - 1000 * 60 * 90),
      },
    ],
  },
  {
    id: "7",
    clientName: "Игорь Волков",
    clientPhone: "+7 (999) 444-55-66",
    source: "website",
    status: "closed",
    lastMessage: "Отлично, всё работает! Спасибо за помощь!",
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 24),
    tags: [],
    messages: [
      {
        id: "7-1",
        content: "Отлично, всё работает! Спасибо за помощь!",
        sender: "client",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
      },
    ],
  },
  {
    id: "8",
    clientName: "Ольга Федорова",
    clientTelegram: "@olga_fed",
    source: "telegram",
    status: "closed",
    lastMessage: "Подписка оформлена. Благодарим за выбор нашего сервиса!",
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 48),
    tags: ["sale"],
    messages: [
      {
        id: "8-1",
        content: "Подписка оформлена. Благодарим за выбор нашего сервиса!",
        sender: "manager",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48),
      },
    ],
  },
  {
    id: "9",
    clientName: "Павел Кузнецов",
    clientPhone: "+7 (999) 777-88-99",
    source: "website",
    status: "new",
    lastMessage: "Можно ли настроить автоответы?",
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 8),
    tags: ["question"],
    messages: [
      {
        id: "9-1",
        content: "Можно ли настроить автоответы?",
        sender: "client",
        timestamp: new Date(Date.now() - 1000 * 60 * 8),
      },
    ],
  },
  {
    id: "10",
    clientName: "Наталья Белова",
    clientTelegram: "@nat_belova",
    source: "telegram",
    status: "in-progress",
    lastMessage: "Отправила скриншот ошибки",
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 20),
    tags: ["urgent"],
    messages: [
      {
        id: "10-1",
        content: "У меня ошибка при загрузке виджета",
        sender: "client",
        timestamp: new Date(Date.now() - 1000 * 60 * 35),
      },
      {
        id: "10-2",
        content: "Можете прислать скриншот?",
        sender: "manager",
        timestamp: new Date(Date.now() - 1000 * 60 * 30),
      },
      {
        id: "10-3",
        content: "Отправила скриншот ошибки",
        sender: "client",
        timestamp: new Date(Date.now() - 1000 * 60 * 20),
      },
    ],
  },
  {
    id: "11",
    clientName: "Виктор Соколов",
    clientPhone: "+7 (999) 222-33-44",
    source: "website",
    status: "replied",
    lastMessage: "Ваш запрос передан в техподдержку",
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 180),
    tags: [],
    messages: [
      {
        id: "11-1",
        content: "Ваш запрос передан в техподдержку",
        sender: "manager",
        timestamp: new Date(Date.now() - 1000 * 60 * 180),
      },
    ],
  },
  {
    id: "12",
    clientName: "Татьяна Новикова",
    clientTelegram: "@tanya_n",
    source: "telegram",
    status: "closed",
    lastMessage: "Спасибо, вопрос решён!",
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 72),
    tags: [],
    messages: [
      {
        id: "12-1",
        content: "Спасибо, вопрос решён!",
        sender: "client",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72),
      },
    ],
  },
  {
    id: "13",
    clientName: "Андрей Попов",
    clientPhone: "+7 (999) 555-66-77",
    source: "website",
    status: "new",
    lastMessage: "Хочу заказать enterprise тариф для компании",
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 1),
    tags: ["sale", "urgent"],
    messages: [
      {
        id: "13-1",
        content: "Хочу заказать enterprise тариф для компании",
        sender: "client",
        timestamp: new Date(Date.now() - 1000 * 60 * 1),
      },
    ],
  },
  {
    id: "14",
    clientName: "Юлия Семенова",
    clientTelegram: "@julia_s",
    source: "telegram",
    status: "in-progress",
    lastMessage: "Документы отправлены на подпись",
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 55),
    tags: ["sale"],
    messages: [
      {
        id: "14-1",
        content: "Документы отправлены на подпись",
        sender: "manager",
        timestamp: new Date(Date.now() - 1000 * 60 * 55),
      },
    ],
  },
  {
    id: "15",
    clientName: "Максим Орлов",
    clientPhone: "+7 (999) 888-99-00",
    source: "website",
    status: "replied",
    lastMessage: "Ответ на ваш вопрос: да, мы поддерживаем эту функцию",
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 240),
    tags: ["question"],
    messages: [
      {
        id: "15-1",
        content: "Ответ на ваш вопрос: да, мы поддерживаем эту функцию",
        sender: "manager",
        timestamp: new Date(Date.now() - 1000 * 60 * 240),
      },
    ],
  },
]

export const mockManagers: Manager[] = [
  {
    id: "1",
    name: "Иван Смирнов",
    email: "ivan@multichat.io",
    role: "Администратор",
    isOnline: true,
  },
  {
    id: "2",
    name: "Екатерина Васильева",
    email: "ekaterina@multichat.io",
    role: "Менеджер",
    isOnline: true,
  },
  {
    id: "3",
    name: "Михаил Козлов",
    email: "mikhail@multichat.io",
    role: "Менеджер",
    isOnline: false,
  },
  {
    id: "4",
    name: "Анастасия Петрова",
    email: "anastasia@multichat.io",
    role: "Менеджер",
    isOnline: true,
  },
]

export const quickReplies = [
  "Здравствуйте! Чем могу помочь?",
  "Спасибо за обращение! Сейчас проверю информацию.",
  "Ваш запрос передан специалисту.",
  "Пожалуйста, уточните ваш вопрос.",
  "Благодарим за выбор нашего сервиса!",
]

export function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return "только что"
  if (diffMins < 60) return `${diffMins} мин назад`
  if (diffHours < 24) return `${diffHours} ч назад`
  if (diffDays < 7) return `${diffDays} дн назад`
  return date.toLocaleDateString("ru-RU")
}

export function getStatusLabel(status: ChatStatus): string {
  const labels: Record<ChatStatus, string> = {
    new: "Новые",
    "in-progress": "В обработке",
    replied: "Ответ дан",
    closed: "Закрытые",
  }
  return labels[status]
}

export function getTagLabel(tag: ChatTag): string {
  const labels: Record<ChatTag, string> = {
    urgent: "Срочно",
    question: "Вопрос",
    sale: "Продажа",
  }
  return labels[tag]
}
