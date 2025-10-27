import { GoogleGenAI, Type, FunctionDeclaration, Content, GenerateContentResponse, Modality } from "@google/genai";
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

export async function* generateResponseStream(
  command: string, 
  history: ChatMessage[], 
  accounts: Account[], 
  categories: string[],
  incomes: Income[],
): AsyncGenerator<GenerateContentResponse> {
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
    
    const systemInstruction = `Você é a Ricka, uma assistente financeira com uma personalidade divertida, moderna e um pouco sarcástica. Seu objetivo é ajudar o usuário a gerenciar suas finanças de forma descontraída.
- Seu nome é Ricka.
- Responda sempre em Português do Brasil, usando uma linguagem informal, emojis e um tom bem-humorado.
- Analise os comandos do usuário para adicionar, pagar ou editar contas e entradas, e chame a função apropriada (add_account, pay_account, edit_account, add_income, edit_income).
- Use o histórico da conversa para entender o contexto. Se o usuário adicionar uma conta e depois disser 'muda o valor pra 50', você sabe qual conta é.
- Se o usuário estiver só conversando, responda de forma divertida e engajadora. Dê dicas financeiras com uma pitada de humor.
- Seja direta, mas com personalidade. Evite respostas robóticas.

**Contexto Atual:**
- Contas (despesas) na área: ${accountList || 'Nenhuma'}
- Grana entrando (renda): ${incomeList || 'Nenhuma'}
- Categorias de conta disponíveis: ${categoryList}. Se o usuário falar uma categoria que não existe, joga em 'Outros'.`;
    
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

    const stream = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        tools: [{ functionDeclarations }],
      },
    });

    for await (const chunk of stream) {
        yield chunk;
    }
  } catch (error) {
    console.error("Error processing command with Gemini:", error);
    const errorChunk = {
        text: () => "Desculpe, não consegui processar sua solicitação no momento.",
        functionCalls: () => undefined,
    } as unknown as GenerateContentResponse;
    yield errorChunk;
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

  const systemInstruction = `Você é a Ricka, uma analista financeira super afiada e com um ótimo senso de humor. Sua missão é dar uma olhada nos gastos do usuário e mandar a real de forma clara e divertida.
- Responda sempre em Português do Brasil, com uma linguagem descontraída e usando emojis.
- Compare os gastos do mês anterior com o mês atual.
- Aponte até 3 categorias onde a galera mais 'meteu o pé na jaca' (maiores aumentos percentuais).
- Dê um pitaco rápido (uma ou duas frases) sobre cada aumento, tipo 'Eita, o que rolou aqui? 🧐'.
- Se os gastos estiverem de boa, comente que a situação está sob controle.
- Seja amigável e direta, sem enrolação.
- Use markdown para deixar as coisas mais legíveis (tipo **negrito**).
- Se faltar informação, avise que 'com esses dados não rola fazer mágica'. ✨`;

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

export const generateSpeech = async (text: string): Promise<string | null> => {
    if (!text.trim()) {
        return null;
    }
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' },
                    },
                },
            },
        });
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        return base64Audio || null;
    } catch (error) {
        console.error("Error generating speech:", error);
        return null;
    }
};
