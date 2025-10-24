import { GoogleGenAI, Type, FunctionDeclaration, Content } from "@google/genai";
import { Account, ChatMessage, AccountStatus, Income } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export type ParsedCommand =
  | { intent: 'add_account'; data: { name: string; value: number; category: string } }
  | { intent: 'pay_account'; data: { name: string } }
  | { intent: 'edit_account'; data: { original_name: string; new_name?: string; new_value?: number; new_category?: string } }
  | { intent: 'add_income'; data: { name: string; value: number } }
  | { intent: 'edit_income'; data: { original_name: string; new_name?: string; new_value?: number } }
  | { intent: 'unknown'; data: { text: string } };

// Limpa o conteúdo da mensagem para a API, removendo prefixos de UI.
const cleanMessageContent = (content: string): string => {
    const voiceMatch = content.match(/^🎤: "(.*)"$/);
    if (voiceMatch) {
        return voiceMatch[1];
    }
    return content;
};

export const processUserCommand = async (
  command: string, 
  history: ChatMessage[], 
  accounts: Account[], 
  categories: string[],
  incomes: Income[],
): Promise<ParsedCommand> => {
  if (!command) {
    return { intent: 'unknown', data: { text: 'Nenhum comando recebido.' } };
  }

  const addAccountFunctionDeclaration: FunctionDeclaration = {
    name: 'add_account',
    description: 'Adiciona uma nova conta ou despesa.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: 'O nome da conta. Ex: "Conta de Luz", "Aluguel"' },
        value: { type: Type.NUMBER, description: 'O valor monetário da conta.' },
        category: {
          type: Type.STRING,
          description: `A categoria da conta. Deve ser uma das seguintes: ${categories.join(', ')}. Se não se encaixar, use "Outros".`
        },
      },
      required: ['name', 'value', 'category'],
    },
  };

  const payAccountFunctionDeclaration: FunctionDeclaration = {
    name: 'pay_account',
    description: 'Marca uma conta como paga.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: 'O nome da conta a ser marcada como paga. Ex: "Conta de Luz"' },
      },
      required: ['name'],
    },
  };

  const editAccountFunctionDeclaration: FunctionDeclaration = {
    name: 'edit_account',
    description: 'Edita uma conta ou despesa existente. Pelo menos um dos campos "new_name", "new_value" ou "new_category" deve ser fornecido.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        original_name: { type: Type.STRING, description: 'O nome original da conta a ser editada. Ex: "Aluguel"' },
        new_name: { type: Type.STRING, description: 'O novo nome para a conta.' },
        new_value: { type: Type.NUMBER, description: 'O novo valor monetário para a conta.' },
        new_category: {
          type: Type.STRING,
          description: `A nova categoria para a conta. Deve ser uma das seguintes: ${categories.join(', ')}.`
        },
      },
      required: ['original_name'],
    },
  };

  const addIncomeFunctionDeclaration: FunctionDeclaration = {
    name: 'add_income',
    description: 'Adiciona uma nova entrada de dinheiro, como um salário ou um bônus.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: 'O nome da entrada. Ex: "Salário", "Vale Alimentação"' },
        value: { type: Type.NUMBER, description: 'O valor monetário da entrada.' },
      },
      required: ['name', 'value'],
    },
  };

  const editIncomeFunctionDeclaration: FunctionDeclaration = {
    name: 'edit_income',
    description: 'Edita uma entrada de dinheiro existente. Pelo menos "new_name" ou "new_value" deve ser fornecido.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        original_name: { type: Type.STRING, description: 'O nome original da entrada a ser editada. Ex: "Salário"' },
        new_name: { type: Type.STRING, description: 'O novo nome para a entrada.' },
        new_value: { type: Type.NUMBER, description: 'O novo valor monetário para a entrada.' },
      },
      required: ['original_name'],
    },
  };
  
  const functionDeclarations = [addAccountFunctionDeclaration, payAccountFunctionDeclaration, editAccountFunctionDeclaration, addIncomeFunctionDeclaration, editIncomeFunctionDeclaration];

  try {
    const accountList = accounts.map(a => a.name).join(', ');
    const incomeList = incomes.map(i => i.name).join(', ');
    const categoryList = categories.join(', ');
    
    const systemInstruction = `Você é um assistente financeiro conversacional e prestativo.
- Analise os comandos do usuário para adicionar, pagar ou editar contas e entradas de dinheiro, e chame a função apropriada (add_account, pay_account, edit_account, add_income, edit_income).
- Use o histórico da conversa para entender o contexto de perguntas de acompanhamento. Por exemplo, se o usuário adicionar uma conta e depois disser "edite o valor para 50", você deve saber a qual conta ele se refere.
- Se o usuário estiver apenas fazendo uma pergunta ou conversando, responda de forma útil e amigável sem chamar uma função.
- Seja conciso e direto em suas respostas.

**Contexto Atual:**
- Lista de contas (despesas) existentes: ${accountList || 'Nenhuma'}
- Lista de entradas (renda) existentes: ${incomeList || 'Nenhuma'}
- Categorias de conta disponíveis: ${categoryList}. Se o usuário mencionar uma categoria que não está na lista para adicionar ou editar uma conta, use a categoria "Outros".`;
    
    const contents: Content[] = [
      ...history.map(msg => ({
        role: msg.role,
        parts: [{ text: cleanMessageContent(msg.content) }],
      })),
      {
        role: 'user',
        parts: [{ text: command }],
      },
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        tools: [{ functionDeclarations }],
      },
    });

    const functionCall = response.functionCalls?.[0];

    if (functionCall) {
      if (functionCall.name === 'add_account') {
        return { intent: 'add_account', data: functionCall.args as { name: string; value: number; category: string } };
      }
      if (functionCall.name === 'pay_account') {
        return { intent: 'pay_account', data: functionCall.args as { name: string } };
      }
       if (functionCall.name === 'edit_account') {
        return { intent: 'edit_account', data: functionCall.args as { original_name: string; new_name?: string; new_value?: number; new_category?: string } };
      }
      if (functionCall.name === 'add_income') {
        return { intent: 'add_income', data: functionCall.args as { name: string; value: number } };
      }
      if (functionCall.name === 'edit_income') {
        return { intent: 'edit_income', data: functionCall.args as { original_name: string; new_name?: string; new_value?: number } };
      }
    }

    // If no function call, it's a general question/statement. Return the model's text response.
    return { intent: 'unknown', data: { text: response.text } };
  } catch (error) {
    console.error("Error processing command with Gemini:", error);
    return { intent: 'unknown', data: { text: 'Desculpe, não consegui processar sua solicitação no momento.' } };
  }
};

// Helper function to summarize accounts by category
const summarizeAccounts = (accounts: Account[]): Record<string, number> => {
  return accounts.reduce((summary, account) => {
    summary[account.category] = (summary[account.category] || 0) + account.value;
    return summary;
  }, {} as Record<string, number>);
};

export const analyzeSpending = async (
  currentMonthAccounts: Account[],
  previousMonthAccounts: Account[]
): Promise<string> => {
  const currentMonthSummary = summarizeAccounts(currentMonthAccounts);
  const previousMonthSummary = summarizeAccounts(previousMonthAccounts);

  if (Object.keys(currentMonthSummary).length === 0 || Object.keys(previousMonthSummary).length === 0) {
    return "Não há dados suficientes para uma comparação. Por favor, registre mais contas pagas neste mês e no anterior para que eu possa analisar.";
  }
  
  const formattedCurrentSummary = JSON.stringify(currentMonthSummary);
  const formattedPreviousSummary = JSON.stringify(previousMonthSummary);

  const systemInstruction = `Você é um analista financeiro prestativo. Seu objetivo é analisar os dados de gastos do usuário e fornecer insights claros e acionáveis.
- Compare os gastos do mês anterior com os do mês atual.
- Identifique até 3 categorias com os maiores aumentos percentuais de gastos.
- Forneça uma breve observação (uma ou duas frases) para cada aumento, sugerindo uma possível causa ou um ponto de atenção.
- Se não houver aumentos significativos, mencione que os gastos estão estáveis.
- Responda de forma amigável e direta.
- Formate sua resposta usando markdown simples (use ** para negrito).
- Se não houver dados em um dos meses, informe que a comparação não é possível.`;

  const prompt = `Aqui estão os resumos de gastos. Mês anterior: ${formattedPreviousSummary}. Mês atual: ${formattedCurrentSummary}. Por favor, forneça sua análise.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        systemInstruction: systemInstruction,
      },
    });

    return response.text;
  } catch (error) {
    console.error("Error analyzing spending with Gemini:", error);
    return "Desculpe, não consegui analisar seus gastos no momento.";
  }
};