import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { Account, AccountStatus } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const addAccountFunctionDeclaration: FunctionDeclaration = {
  name: 'add_account',
  description: 'Adiciona uma nova conta ou despesa.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING, description: 'O nome da conta. Ex: "Conta de Luz", "Aluguel"' },
      value: { type: Type.NUMBER, description: 'O valor monetário da conta.' },
      category: { type: Type.STRING, description: 'A categoria da conta. Ex: "Moradia", "Alimentação"' },
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

export type ParsedCommand =
  | { intent: 'add_account'; data: { name: string; value: number; category: string } }
  | { intent: 'pay_account'; data: { name: string } }
  | { intent: 'unknown'; data: { text: string } };

export const processVoiceCommand = async (command: string, accounts: Account[]): Promise<ParsedCommand> => {
  if (!command) {
    return { intent: 'unknown', data: { text: 'Nenhum comando recebido.' } };
  }

  try {
    const accountList = accounts.map(a => a.name).join(', ');
    const prompt = `
      Analise o seguinte comando do usuário e chame a função apropriada.
      Comando: "${command}"
      
      Lista de contas existentes para referência: ${accountList || 'Nenhuma'}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ functionDeclarations: [addAccountFunctionDeclaration, payAccountFunctionDeclaration] }],
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
    }

    return { intent: 'unknown', data: { text: command } };
  } catch (error) {
    console.error("Error processing voice command with Gemini:", error);
    return { intent: 'unknown', data: { text: 'Erro ao processar o comando.' } };
  }
};


export const getFinancialInsights = async (accounts: Account[], question: string): Promise<string> => {
    if (!question) return "Por favor, faça uma pergunta.";
    if (!accounts || accounts.length === 0) return "Não há dados de contas para analisar.";

    const prompt = `
      Você é um assistente financeiro especialista. Analise os dados das contas do usuário fornecidos em formato JSON e responda à pergunta do usuário de forma clara, amigável e concisa.

      Dados das Contas (JSON):
      ${JSON.stringify(accounts, null, 2)}

      Pergunta do Usuário:
      "${question}"
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error getting financial insights from Gemini:", error);
        return "Desculpe, não consegui processar sua solicitação no momento. Tente novamente mais tarde.";
    }
};