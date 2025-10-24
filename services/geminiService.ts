import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { Account, AccountStatus } from '../types';
import { ACCOUNT_CATEGORIES } from '../utils/mockData';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
        description: `A categoria da conta. Deve ser uma das seguintes: ${ACCOUNT_CATEGORIES.join(', ')}. Se não se encaixar, use "Outros".`
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
        description: `A nova categoria para a conta. Deve ser uma das seguintes: ${ACCOUNT_CATEGORIES.join(', ')}.`
      },
    },
    required: ['original_name'],
  },
};


export type ParsedCommand =
  | { intent: 'add_account'; data: { name: string; value: number; category: string } }
  | { intent: 'pay_account'; data: { name: string } }
  | { intent: 'edit_account'; data: { original_name: string; new_name?: string; new_value?: number; new_category?: string } }
  | { intent: 'unknown'; data: { text: string } };

export const processUserCommand = async (command: string, accounts: Account[]): Promise<ParsedCommand> => {
  if (!command) {
    return { intent: 'unknown', data: { text: 'Nenhum comando recebido.' } };
  }

  try {
    const accountList = accounts.map(a => a.name).join(', ');
    const categoryList = ACCOUNT_CATEGORIES.join(', ');
    const prompt = `
      Você é um assistente financeiro. Analise o seguinte comando do usuário e chame a função apropriada (add_account, pay_account, edit_account) se a intenção for clara.
      Se o usuário estiver apenas fazendo uma pergunta ou conversando, responda de forma útil e amigável sem chamar uma função.

      Comando: "${command}"
      
      Lista de contas existentes para referência (pode estar vazia): ${accountList || 'Nenhuma'}
      Categorias de conta disponíveis: ${categoryList}. Se o usuário mencionar uma categoria que não está na lista para adicionar ou editar uma conta, use a categoria "Outros".
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ functionDeclarations: [addAccountFunctionDeclaration, payAccountFunctionDeclaration, editAccountFunctionDeclaration] }],
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
    }

    // If no function call, it's a general question/statement. Return the model's text response.
    return { intent: 'unknown', data: { text: response.text } };
  } catch (error) {
    console.error("Error processing command with Gemini:", error);
    return { intent: 'unknown', data: { text: 'Desculpe, não consegui processar sua solicitação no momento.' } };
  }
};