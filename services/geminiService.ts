
import { GoogleGenAI, Type, FunctionDeclaration, Content, GenerateContentResponse, Modality, Part } from "@google/genai";
import { Account, ChatMessage, AccountStatus, Income } from '../types';

// Initialize Gemini API with correct client and API Key
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
  image?: { data: string; mimeType: string }
): AsyncGenerator<GenerateContentResponse> {
  const addAccountFunctionDeclaration: FunctionDeclaration = {
    name: 'add_account',
    parameters: {
      type: Type.OBJECT,
      description: 'Adiciona uma nova conta ou despesa.',
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
    parameters: {
      type: Type.OBJECT,
      description: 'Marca uma conta como paga.',
      properties: {
        name: { type: Type.STRING, description: 'O nome da conta a ser marcada como paga. Ex: "Conta de Luz"' },
      },
      required: ['name'],
    },
  };

  const editAccountFunctionDeclaration: FunctionDeclaration = {
    name: 'edit_account',
    parameters: {
      type: Type.OBJECT,
      description: 'Edita uma conta ou despesa existente. Pelo menos um dos campos "new_name", "new_value" ou "new_category" deve ser fornecido.',
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
    parameters: {
      type: Type.OBJECT,
      description: 'Adiciona uma nova entrada de dinheiro, como um salário ou um bônus.',
      properties: {
        name: { type: Type.STRING, description: 'O nome da entrada. Ex: "Salário", "Vale Alimentação"' },
        value: { type: Type.NUMBER, description: 'O valor monetário da entrada.' },
      },
      required: ['name', 'value'],
    },
  };

  const editIncomeFunctionDeclaration: FunctionDeclaration = {
    name: 'edit_income',
    parameters: {
      type: Type.OBJECT,
      description: 'Edita uma entrada de dinheiro existente. Pelo menos "new_name" ou "new_value" deve ser fornecido.',
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
    
    const systemInstruction = `Você é o Tatu, um assistente financeiro amigável e organizado, com um toque de humor. Seu objetivo é ajudar o usuário a gerenciar suas finanças de forma leve e eficiente.
- Seu nome é Tatu.
- Responda sempre em Português do Brasil, usando uma linguagem informal, emojis e um tom prestativo.
- Analise os comandos do usuário para adicionar, pagar ou editar contas e entradas, e chame a função apropriada (add_account, pay_account, edit_account, add_income, edit_income).
- **IMPORTANTE:** Se o usuário pedir para adicionar, editar ou pagar VÁRIOS itens de uma vez (ex: "Adicione luz 100 e água 50"), você DEVE gerar múltiplas chamadas de função na mesma resposta, uma para cada item identificado. Não processe apenas o primeiro.
- **ANÁLISE DE IMAGEM:** Se o usuário enviar uma imagem (print, foto de boleto, nota fiscal), extraia TODAS as informações financeiras visíveis (valor, beneficiário/loja, data, etc.).
    - Se for um boleto ou conta, sugira chamar 'add_account' preenchendo o nome com o beneficiário e a categoria mais adequada.
    - Se for um comprovante de pagamento, pergunte se deve marcar a conta correspondente como paga.
- Use o histórico da conversa para entender o contexto. Se o usuário adicionar uma conta e depois disser 'muda o valor pra 50', você sabe qual conta é.
- Se o usuário estiver só conversando, responda de forma divertida e engajadora. Dê dicas financeiras com uma pitada de humor.
- Seja direto, mas com personalidade. Evite respostas robóticas.

**Contexto Atual:**
- Contas (despesas) na área: ${accountList || 'Nenhuma'}
- Grana entrando (renda): ${incomeList || 'Nenhuma'}
- Categorias de conta disponíveis: ${categoryList}. Se o usuário falar uma categoria que não existe, joga em 'Outros'.`;
    
    const currentMessageParts: Part[] = [{ text: command }];
    
    // Adiciona a imagem à mensagem se ela existir
    if (image) {
        currentMessageParts.unshift({
            inlineData: {
                mimeType: image.mimeType,
                data: image.data
            }
        });
    }

    const contents: Content[] = [
      ...history.map(msg => ({
        role: msg.role,
        parts: [{ text: cleanMessageContent(msg.content) }],
      })),
      {
        role: 'user',
        parts: currentMessageParts,
      },
    ];

    // Use allowed model 'gemini-3-flash-preview' for basic text/chat tasks
    const stream = await ai.models.generateContentStream({
      model: 'gemini-3-flash-preview',
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
    // Corrected mock GenerateContentResponse structure
    const errorChunk = {
        text: "Desculpe, não consegui processar sua solicitação no momento.",
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

  const systemInstruction = `Você é o Tatu, um analista financeiro gente boa que manja dos números. Sua missão é analisar os gastos do usuário e dar a real de forma clara e descontraída.
- Responda sempre em Português do Brasil, com uma linguagem amigável e usando emojis.
- Compare os gastos do mês anterior com o mês atual.
- Aponte até 3 categorias onde os gastos mais aumentaram (percentualmente).
- Dê um pitaco rápido (uma ou duas frases) sobre cada aumento, tipo 'Opa, demos uma escorregada aqui? 👀'.
- Se os gastos diminuíram ou estão estáveis, elogie e comente que a situação está sob controle.
- Seja amigável e direto, sem enrolação.
- Use markdown para deixar as coisas mais legíveis (tipo **negrito**).
- Se faltar informação, avise que 'precisamos de mais dados para fazer a mágica acontecer'. ✨`;

  const prompt = `Aqui estão os resumos de gastos. Mês anterior: ${formattedPreviousSummary}. Mês atual: ${formattedCurrentSummary}. Por favor, forneça sua análise.`;

  try {
    // Use allowed model 'gemini-3-flash-preview' for analysis tasks
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        systemInstruction: systemInstruction,
      },
    });

    return response.text || "Desculpe, não consegui analisar seus gastos no momento.";
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
        // Use allowed model 'gemini-2.5-flash-preview-tts' for text-to-speech tasks
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
