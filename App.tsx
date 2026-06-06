
import React, { useState, useEffect, useMemo, useRef } from 'react';
import * as XLSX from 'xlsx';
import { type User, type Group, type Account, Role, AccountStatus, type Income, type View } from './types';
import LoginScreen from './components/LoginScreen';
import RegisterScreen from './components/RegisterScreen';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import AccountsView from './components/AccountsView';
import AdminPanel from './components/AdminPanel';
import AccountFormModal from './components/AccountFormModal';
import BatchAccountModal from './components/BatchAccountModal';
import AddSelectionModal from './components/AddSelectionModal';
import SettingsModal from './components/SettingsModal';
import { useTheme } from './hooks/useTheme';
import * as dataService from './services/dataService';
import realtimeService from './services/realtimeService';
import IncomeManagement from './components/IncomeManagement';
import GroupSelectionScreen from './components/GroupSelectionScreen';
import MoveAccountsModal from './components/MoveAccountsModal';
import { notifyPaymentViaWhatsApp } from './utils/whatsapp';
import { isVariableExpense, getMonthlyAccounts } from './utils/accountUtils';

import { Plus } from 'lucide-react';

// isVariableExpense removed as it is now imported from accountUtils

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const { theme, toggleTheme } = useTheme(currentUser?.username);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [view, setView] = useState<View>('login');
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);
  const [accountToEdit, setAccountToEdit] = useState<Account | null>(null);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  
  const constraintsRef = useRef<HTMLDivElement>(null);

  // Redirect to accounts view on mobile devices when logged in
  useEffect(() => {
    if (isMobile && activeGroupId && view !== 'accounts' && view !== 'login' && view !== 'register' && view !== 'groupSelection') {
      setView('accounts');
    }
  }, [isMobile, activeGroupId, view]);

  useEffect(() => {
    const unsubUsers = realtimeService.subscribe('users', setUsers);
    const unsubGroups = realtimeService.subscribe('groups', setGroups);
    const unsubAccounts = realtimeService.subscribe('accounts', setAccounts);
    const unsubIncomes = realtimeService.subscribe('incomes', setIncomes);
    const unsubCategories = realtimeService.subscribe('categories', setCategories);
    const unsubSettings = realtimeService.subscribe('settings', (s) => {
        setWhatsappEnabled(!!s?.whatsappEnabled);
    });
    
    const initAuth = async () => {
        setIsLoading(true);
        const storedUserStr = sessionStorage.getItem('app_currentUser');
        if (storedUserStr) {
            try {
                const storedUser = JSON.parse(storedUserStr);
                const storedGroupId = sessionStorage.getItem('app_activeGroupId');
                setCurrentUser(storedUser);
                realtimeService.setUser(storedUser.username);
                if (storedGroupId) {
                    setActiveGroupId(storedGroupId);
                    setView(isMobile ? 'accounts' : 'dashboard');
                } else if (storedUser.groupIds.length > 0) {
                    setView('groupSelection');
                } else {
                    setView('login');
                }
            } catch (e) { setView('login'); }
        } else { setView('login'); }
        setIsLoading(false);
    };
    initAuth();
    return () => {
        unsubUsers(); unsubGroups(); unsubAccounts(); unsubIncomes(); unsubCategories(); unsubSettings();
    };
  }, []);

  useEffect(() => {
      // INJEÇÃO ÚNICA DAS CONTAS SOLICITADAS PELO USUÁRIO NO DIA 05 DE JUNHO
      if (activeGroupId) {
          const injected = localStorage.getItem('contas_injetadas_05_jun_v5');
          if (!injected) {
              const itemsToInject = [
                  { name: 'Loja 1', value: 81.68, date: '2026-03-01T12:00:00Z', cat: '🛍️ Compras' },
                  { name: 'Minas mas', value: 39.50, date: '2026-02-01T12:00:00Z', cat: '🛒 Mercado' },
                  { name: 'Big suplementos', value: 55.00, date: '2026-02-01T12:00:00Z', cat: '💊 Saúde' },
                  { name: 'Minas mais', value: 63.38, date: '2026-03-01T12:00:00Z', cat: '🛒 Mercado' },
                  { name: 'Drogaria americana', value: 64.52, date: '2026-03-01T12:00:00Z', cat: '💊 Saúde' },
                  { name: 'Araújo - 914 cartão', value: 88.00, date: '2026-03-01T12:00:00Z', cat: '💊 Saúde' },
                  { name: 'Academia', value: 129.90, date: '2026-06-01T12:00:00Z', cat: '🏋️ Lazer / Esporte', rec: true },
                  { name: 'Meire', value: 600.00, date: '2026-06-01T12:00:00Z', cat: '📄 Boleto' },
                  { name: 'Unimed', value: 340.00, date: '2026-06-01T12:00:00Z', cat: '💊 Saúde', rec: true },
                  { name: 'Avet', value: 120.00, date: '2026-06-01T12:00:00Z', cat: '🐶 Pet' },
                  { name: 'Petlove', value: 133.00, date: '2026-06-01T12:00:00Z', cat: '🐶 Pet', inst: {cur: 2, tot: 2} },
                  { name: 'Época', value: 74.88, date: '2026-06-01T12:00:00Z', cat: '🛍️ Compras', inst: {cur: 6, tot: 8} },
                  { name: 'Centauro', value: 99.90, date: '2026-06-01T12:00:00Z', cat: '🛍️ Compras', inst: {cur: 7, tot: 10} },
                  { name: 'Stanley', value: 23.80, date: '2026-06-01T12:00:00Z', cat: '🛍️ Compras', inst: {cur: 7, tot: 10} },
                  { name: 'Farmácia', value: 60.13, date: '2026-06-01T12:00:00Z', cat: '💊 Saúde', inst: {cur: 2, tot: 3} },
                  { name: 'Disney', value: 46.90, date: '2026-06-01T12:00:00Z', cat: '📺 Assinaturas', rec: true },
                  { name: 'Havan', value: 29.90, date: '2026-06-01T12:00:00Z', cat: '🛍️ Compras', inst: {cur: 9, tot: 10} },
                  { name: 'Compras bh', value: 242.40, date: '2026-06-01T12:00:00Z', cat: '🛒 Mercado', inst: {cur: 3, tot: 3} },
                  { name: 'Aniversário Antônio, clube, celular', value: 648.90, date: '2026-06-01T12:00:00Z', cat: '🎉 Festa/Evento' },
              ];

              itemsToInject.forEach(item => {
                  const alreadyExists = accounts.some(a => a.name === item.name && a.groupId === activeGroupId && a.value === item.value);
                  if (!alreadyExists) {
                      const newAccount = {
                          name: item.name,
                          value: item.value,
                          groupId: activeGroupId,
                          category: item.cat,
                          status: AccountStatus.PENDING,
                          paymentDate: item.date,
                          isRecurrent: !!item.rec,
                          isInstallment: !!item.inst,
                          currentInstallment: item.inst?.cur,
                          totalInstallments: item.inst?.tot,
                          installmentId: item.inst ? `inst-${Date.now()}-${item.name}` : undefined,
                          id: `acc-injected-${Date.now()}-${Math.random()}`
                      } as unknown as Account;
                      
                      realtimeService.addAccount(newAccount);
                  }
              });
              localStorage.setItem('contas_injetadas_05_jun_v5', 'true');
          }
      }
  }, [activeGroupId, accounts]);
  
  const userAccounts = useMemo(() => {
    if (!activeGroupId) return [];
    return accounts.filter(acc => acc.groupId === activeGroupId);
  }, [accounts, activeGroupId]);

  const mobileStats = useMemo(() => {
    if (!activeGroupId) return { total: 0, paid: 0 };
    const safeDate = selectedDate instanceof Date && !isNaN(selectedDate.getTime()) ? selectedDate : new Date();
    const allForMonth = getMonthlyAccounts(userAccounts, safeDate);
    
    const total = allForMonth.reduce((sum, acc) => sum + Number(acc.value || 0), 0);
    const paid = allForMonth
      .filter(acc => acc.status === AccountStatus.PAID)
      .reduce((sum, acc) => sum + Number(acc.value || 0), 0);
      
    return { total, paid };
  }, [userAccounts, selectedDate, activeGroupId]);

  const userIncomes = useMemo(() => {
    if (!activeGroupId) return [];
    return incomes.filter(inc => inc.groupId === activeGroupId);
  }, [incomes, activeGroupId]);

  const handleLogin = async (username: string, password: string): Promise<boolean> => {
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (!user || user.password !== password) return false;
    setCurrentUser(user);
    sessionStorage.setItem('app_currentUser', JSON.stringify(user));
    realtimeService.setUser(user.username);
    if (user.groupIds.length === 1) {
        handleGroupSelect(user.groupIds[0]);
    } else if (user.groupIds.length > 1) {
        setView('groupSelection');
    }
    return true;
  };

  const handleRegister = async (name: string, username: string, password: string): Promise<boolean> => {
    const existing = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (existing) return false;
    const newUser = await dataService.addUser({ name, username, password, role: Role.USER, groupIds: ['group-3'] });
    if (newUser) return handleLogin(username, password);
    return false;
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveGroupId(null);
    sessionStorage.removeItem('app_currentUser');
    sessionStorage.removeItem('app_activeGroupId');
    realtimeService.setUser("");
    setView('login');
  };

  const handleGroupSelect = (groupId: string) => {
    setActiveGroupId(groupId);
    sessionStorage.setItem('app_activeGroupId', groupId);
    setView(isMobile ? 'accounts' : 'dashboard');
  };

  const handleToggleAccountStatus = (acc: Account) => {
    const isPaying = acc.status !== AccountStatus.PAID;
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const targetDate = `${year}-${month}-15T12:00:00Z`;

    if (isVariableExpense(acc) && isPaying && Number(acc.value) === 0) {
        setAccountToEdit(acc);
        setIsAccountModalOpen(true);
        return;
    }

    const isVirtual = acc.id?.toString().startsWith('projected-') || (!acc.paymentDate && acc.isRecurrent);

    if (isVirtual) {
        // Criando um snapshot físico para uma projeção ou template recorrente
        const snapshot: Account = {
            ...acc,
            id: `acc-snap-${Date.now()}`,
            isRecurrent: false,
            status: isPaying ? AccountStatus.PAID : AccountStatus.PENDING,
            paymentDate: targetDate,
            value: Number(acc.value)
        };
        dataService.addAccount(snapshot);
        
        if (isPaying) {
            const settings = realtimeService.getSettings();
            if (settings?.whatsappEnabled) {
                notifyPaymentViaWhatsApp(snapshot.name, snapshot.value, settings.whatsappGroupLink);
            }
        }
    } else {
        // Atualizando um registro físico existente
        dataService.updateAccount({
            ...acc, 
            status: isPaying ? AccountStatus.PAID : AccountStatus.PENDING,
            paymentDate: acc.paymentDate || targetDate,
            value: Number(acc.value)
        });

        if (isPaying) {
            const settings = realtimeService.getSettings();
            if (settings?.whatsappEnabled) {
                notifyPaymentViaWhatsApp(acc.name, Number(acc.value), settings.whatsappGroupLink);
            }
        }
    }
  };

  const handleToggleMultipleAccountStatus = (accs: Account[]) => {
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const targetDate = `${year}-${month}-15T12:00:00Z`;
    const settings = realtimeService.getSettings();

    accs.forEach(acc => {
      const isPaying = acc.status !== AccountStatus.PAID;
      
      // Skip variable expenses with 0 value for batch processing to avoid multiple modals
      if (isVariableExpense(acc) && isPaying && Number(acc.value) === 0) return;

      const isVirtual = acc.id?.toString().startsWith('projected-') || (!acc.paymentDate && acc.isRecurrent);

      if (isVirtual) {
          const snapshot: Account = {
              ...acc,
              id: `acc-snap-${Date.now()}-${Math.random()}`,
              isRecurrent: false,
              status: isPaying ? AccountStatus.PAID : AccountStatus.PENDING,
              paymentDate: targetDate,
              value: Number(acc.value)
          };
          dataService.addAccount(snapshot);
          if (isPaying && settings?.whatsappEnabled) {
              notifyPaymentViaWhatsApp(snapshot.name, snapshot.value, settings.whatsappGroupLink);
          }
      } else {
          dataService.updateAccount({
              ...acc, 
              status: isPaying ? AccountStatus.PAID : AccountStatus.PENDING,
              paymentDate: acc.paymentDate || targetDate,
              value: Number(acc.value)
          });
          if (isPaying && settings?.whatsappEnabled) {
              notifyPaymentViaWhatsApp(acc.name, Number(acc.value), settings.whatsappGroupLink);
          }
      }
    });
  };

  const handleAccountSubmit = (data: any) => {
      const isEditingProjection = data.id && data.id?.toString().startsWith('projected-');
      const existingAccount = accounts.find(a => a.id === data.id);
      
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const targetDate = `${year}-${month}-15T12:00:00Z`;

      const sanitizedTotal = data.totalInstallments ? Number(data.totalInstallments) : undefined;
      const sanitizedCurrent = data.currentInstallment ? Number(data.currentInstallment) : undefined;
      
      let sanitizedValue = Number(data.value);
      if (data.isInstallment && data.totalValue && sanitizedTotal) {
          sanitizedValue = Number(data.totalValue) / sanitizedTotal;
      }

      if (data.id && (existingAccount || isEditingProjection)) {
          if (isEditingProjection || (existingAccount?.isRecurrent && !existingAccount.paymentDate)) {
              let baseId = data.id.toString().replace(/^projected-/, '');
              const parts = baseId.split('-');
              if (parts.length > 2 && /^\d{4}$/.test(parts[parts.length-2])) {
                  baseId = parts.slice(0, -2).join('-');
              }
              
              const original = accounts.find(a => a.id === baseId);
              
              // Se o usuário desmarcou "Recorrente", atualiza o template original para virar físico não recorrente no mês atual
              if (original && !data.isRecurrent) {
                  const updatedOriginal: Account = {
                      ...original,
                      ...data,
                      id: original.id,
                      isRecurrent: false,
                      paymentDate: data.paymentDate || targetDate,
                      status: data.status || AccountStatus.PENDING,
                      value: sanitizedValue
                  };
                  dataService.updateAccount(updatedOriginal);
                  return;
              }
              
              const finalInstallmentId = data.installmentId || original?.installmentId || (data.isInstallment ? `series-${Date.now()}` : undefined);

              const newSnapshot: Account = { 
                  ...data, 
                  id: `acc-snap-${Date.now()}`, 
                  value: sanitizedValue,
                  paymentDate: data.paymentDate || targetDate, 
                  status: data.status || AccountStatus.PENDING,
                  currentInstallment: sanitizedCurrent,
                  totalInstallments: sanitizedTotal || original?.totalInstallments,
                  installmentId: finalInstallmentId
              };
              dataService.addAccount(newSnapshot);
              
              if (newSnapshot.installmentId) {
                  realtimeService.updateAccountAndSeries(newSnapshot);
              }
              return;
          }
          
          const updateData = {
              ...data,
              value: sanitizedValue,
              totalInstallments: sanitizedTotal,
              currentInstallment: sanitizedCurrent,
              installmentId: data.installmentId || (data.isInstallment ? `repair-${Date.now()}` : undefined)
          };
          realtimeService.updateAccountAndSeries(updateData);
      } else {
          const isVar = isVariableExpense(data);
          const isRec = Boolean(data.isRecurrent);
          const isInst = Boolean(data.isInstallment);
          const installmentId = isInst ? `inst-${Date.now()}` : undefined;
          
          if (isInst && sanitizedTotal && sanitizedTotal > 0) {
              const currentInstallmentNum = sanitizedCurrent || 1;
              const baseDate = data.paymentDate ? new Date(data.paymentDate) : new Date(targetDate);
              
              for (let i = 1; i <= sanitizedTotal; i++) {
                  const currentDate = new Date(baseDate);
                  currentDate.setMonth(baseDate.getMonth() + (i - currentInstallmentNum));
                  
                  // Mark past installments as paid, and current / future as pending
                  const status = i < currentInstallmentNum ? AccountStatus.PAID : AccountStatus.PENDING;
                  
                  dataService.addAccount({
                      ...data,
                      id: `acc-${Date.now()}-${i}`,
                      value: sanitizedValue,
                      totalValue: data.totalValue,
                      isRecurrent: false, // Installments are fixed series
                      isInstallment: true,
                      installmentId: installmentId,
                      currentInstallment: i,
                      totalInstallments: sanitizedTotal,
                      status: status,
                      paymentDate: currentDate.toISOString()
                  });
              }
          } else {
              // Single account or simple recurrent template
              const newAccount: Account = {
              ...data,
              id: `acc-${Date.now()}`,
              value: sanitizedValue,
              totalValue: data.totalValue,
              isRecurrent: isRec,
              isInstallment: isInst,
              installmentId: installmentId,
              currentInstallment: isInst ? (sanitizedCurrent || 1) : undefined,
              totalInstallments: sanitizedTotal,
              status: AccountStatus.PENDING,
              paymentDate: (isRec && !isInst) ? undefined : (data.paymentDate || targetDate)
          };
          
          dataService.addAccount(newAccount);
          
          // If it's a recurrent variable expense, also create a physical record for the current month
          // so the user sees the value they just entered immediately.
          if (isVar && isRec && !isInst) {
              dataService.addAccount({
                  ...newAccount,
                  id: `acc-snap-${Date.now()}`,
                  isRecurrent: false,
                  paymentDate: data.paymentDate || targetDate
              });
          }
      }
    }
  };

  const handleExportJson = () => {
    const data = realtimeService.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tatu_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = async (file: File) => {
    try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (window.confirm('Atenção: Importar um backup irá substituir TODOS os dados atuais. Deseja continuar?')) {
            realtimeService.importData(data);
            alert('Backup importado com sucesso!');
            window.location.reload(); // Recarregar para garantir que tudo sincronize
        }
    } catch (e) {
        alert('Erro ao importar backup. Verifique se o arquivo é um JSON válido.');
    }
  };

  const handleExportCsv = () => {
    const accounts = realtimeService.getAccounts();
    const incomes = realtimeService.getIncomes();
    
    let csv = 'Tipo,Nome,Valor,Categoria,Data,Status\n';
    
    accounts.forEach(acc => {
        csv += `Despesa,"${acc.name}",${acc.value},"${acc.category}",${acc.paymentDate || (acc as any).dueDate},${acc.status}\n`;
    });
    
    incomes.forEach(inc => {
        csv += `Receita,"${inc.name}",${inc.value},"${inc.category}",${inc.date},PAGO\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tatu_relatorio_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportExcel = () => {
    const accounts = realtimeService.getAccounts();
    const incomes = realtimeService.getIncomes();
    
    const wb = XLSX.utils.book_new();

    // 1. Add a "Resumo Geral" sheet first
    const allData = [
        ...incomes.map(inc => ({
            'Tipo': 'Receita',
            'Nome': inc.name,
            'Valor': inc.value,
            'Categoria': inc.category,
            'Data': new Date(inc.date).toLocaleDateString('pt-BR'),
            'Status': 'Pago'
        })),
        ...accounts.map(acc => ({
            'Tipo': 'Despesa',
            'Nome': acc.name,
            'Valor': acc.value,
            'Categoria': acc.category,
            'Data': acc.paymentDate ? new Date(acc.paymentDate).toLocaleDateString('pt-BR') : 'N/A',
            'Status': acc.status === AccountStatus.PAID ? 'Pago' : 'Pendente'
        }))
    ];
    const wsAll = XLSX.utils.json_to_sheet(allData);
    XLSX.utils.book_append_sheet(wb, wsAll, 'Resumo Geral');
    
    // 2. Group accounts by category in separate sheets
    const categories = Array.from(new Set(accounts.map(a => a.category)));
    
    categories.forEach(cat => {
        const catAccounts = accounts.filter(a => a.category === cat);
        const data = catAccounts.map(acc => ({
            'Nome': acc.name,
            'Valor': acc.value,
            'Status': acc.status === AccountStatus.PAID ? 'Pago' : 'Pendente',
            'Data': acc.paymentDate ? new Date(acc.paymentDate).toLocaleDateString('pt-BR') : 'N/A',
            'Recorrente': acc.isRecurrent ? 'Sim' : 'Não',
            'Parcela': acc.isInstallment ? `${acc.currentInstallment}/${acc.totalInstallments}` : 'N/A'
        }));
        
        const ws = XLSX.utils.json_to_sheet(data);
        
        // Auto-size columns
        const maxWidths = data.reduce((acc: any, row: any) => {
            Object.keys(row).forEach((key, i) => {
                const val = String(row[key]);
                acc[i] = Math.max(acc[i] || 0, val.length, key.length);
            });
            return acc;
        }, []);
        ws['!cols'] = maxWidths.map((w: number) => ({ wch: w + 2 }));

        XLSX.utils.book_append_sheet(wb, ws, cat.replace(/[\[\]\*\?\/\\]/g, '').substring(0, 31) || 'Sem Categoria');
    });

    XLSX.writeFile(wb, `tatu_financeiro_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  if (isLoading) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0B0E14] font-sans">
            <div className="flex flex-col items-center gap-6">
                <div className="relative">
                  <div className="w-20 h-20 border-t-4 border-l-4 border-primary rounded-3xl animate-spin shadow-[0_0_20px_rgba(99,102,241,0.5)]"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-10 border-t-4 border-r-4 border-highlight rounded-2xl animate-spin-reverse opacity-60"></div>
                  </div>
                </div>
                <div className="text-center">
                  <p className="font-sans font-black text-white tracking-[0.4em] text-3xl mb-1 flex items-center gap-2">
                    TATU<span className="text-primary italic animate-ping">.</span>
                  </p>
                  <p className="text-text-muted text-[10px] font-bold uppercase tracking-widest animate-pulse">Sincronizando finanças...</p>
                </div>
            </div>
        </div>
    );
  }

  if (view === 'login') return <LoginScreen onLogin={handleLogin} onNavigateToRegister={() => setView('register')} />;
  if (view === 'register') return <RegisterScreen onRegister={handleRegister} onNavigateToLogin={() => setView('login')} />;
  if (view === 'groupSelection' && currentUser) return <GroupSelectionScreen user={currentUser} groups={groups} onSelectGroup={handleGroupSelect} onLogout={handleLogout} />;
  if (!currentUser || !activeGroupId) return <LoginScreen onLogin={handleLogin} onNavigateToRegister={() => setView('register')} />;

  return (
    <div className="min-h-screen bg-background text-text-primary dark:bg-dark-background dark:text-dark-text-primary relative overflow-x-hidden">
      {/* Decorative Background Elements (mostly visible in dark mode, extremely subtle in light) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-primary/5 dark:bg-primary/30 rounded-full blur-[150px] animate-pulse transition-colors duration-1000" />
        <div className="absolute top-[10%] -right-[15%] w-[50%] h-[50%] bg-highlight/5 dark:bg-highlight/20 rounded-full blur-[130px] animate-pulse transition-colors duration-1000" style={{ animationDelay: '1s' }} />
        <div className="absolute -bottom-[20%] left-[10%] w-[55%] h-[55%] bg-indigo-500/5 dark:bg-blue-600/20 rounded-full blur-[140px] animate-pulse transition-colors duration-1000" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[40%] right-[20%] w-[25%] h-[25%] bg-success/5 dark:bg-emerald-500/20 rounded-full blur-[120px] animate-pulse transition-colors duration-1000" style={{ animationDelay: '4s' }} />
      </div>

      <div className="relative z-10">
        <Header 
          currentUser={currentUser} 
          onSettingsClick={() => setIsSettingsModalOpen(true)} 
          onLogout={handleLogout} 
          activeView={view}
          onViewChange={setView}
          isAdmin={currentUser.role === Role.ADMIN}
          onAddClick={() => setIsSelectionModalOpen(true)}
          mobileStats={mobileStats}
        />
        <main className="p-3 sm:p-4 lg:p-6 max-w-[1200px] mx-auto pb-32">
          {view === 'dashboard' && (
              <Dashboard 
                  accounts={userAccounts} 
                  incomes={userIncomes} 
                  selectedDate={selectedDate}
                  setSelectedDate={setSelectedDate}
              />
          )}
          {view === 'accounts' && (
              <AccountsView 
                  accounts={userAccounts} 
                  onEditAccount={(acc) => { setAccountToEdit(acc); setIsAccountModalOpen(true); }} 
                  onDeleteAccount={(id) => {
                      let targetId = id;
                      if (id.toString().startsWith('projected-')) {
                          let baseId = id.toString().replace(/^projected-/, '');
                          const parts = baseId.split('-');
                          if (parts.length > 2 && /^\d{4}$/.test(parts[parts.length-2])) {
                              baseId = parts.slice(0, -2).join('-');
                          }
                          targetId = baseId;
                      }
                      dataService.deleteAccount(targetId);
                  }} 
                  onToggleStatus={handleToggleAccountStatus} 
                  onToggleMultipleStatus={handleToggleMultipleAccountStatus}
                  onNotifyWhatsApp={(acc) => {
                      const settings = realtimeService.getSettings();
                      notifyPaymentViaWhatsApp(acc.name, acc.value, settings?.whatsappGroupLink);
                  }}
                  whatsappEnabled={whatsappEnabled}
                  selectedDate={selectedDate} setSelectedDate={setSelectedDate} 
                  onOpenMoveModal={() => setIsMoveModalOpen(true)} 
                  categories={categories}
              />
          )}
          {view === 'income' && <IncomeManagement incomes={userIncomes} onAddOrUpdate={(data) => {
              if (data.id) dataService.updateIncome({...data, date: new Date().toISOString()} as any);
              else dataService.addIncome({...data, date: new Date().toISOString(), id: `inc-${Date.now()}`} as any);
          }} onDelete={(id) => dataService.deleteIncome(id)} activeGroupId={activeGroupId} />}
          {view === 'admin' && <AdminPanel users={users} groups={groups} onAddUser={dataService.addUser} onUpdateUser={dataService.updateUser} onDeleteUser={dataService.deleteUser} onAddGroup={dataService.addGroup} onUpdateGroup={dataService.updateGroup} onDeleteGroup={dataService.deleteGroup} />}
        </main>
        <div ref={constraintsRef} className="fixed inset-0 pointer-events-none z-40" />
        {isMobile && currentUser && activeGroupId && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
            <button
              onClick={() => {
                setAccountToEdit(null);
                setIsAccountModalOpen(true);
              }}
              className="flex items-center justify-center w-14 h-14 bg-primary dark:bg-primary text-white rounded-full shadow-[0_8px_30px_rgba(99,102,241,0.5)] active:scale-95 transition-all border-[3px] border-white dark:border-[#0B0E14] hover:bg-opacity-95"
              title="Adicionar Conta"
            >
              <Plus className="w-7 h-7" strokeWidth={3.5} />
            </button>
          </div>
        )}

        <SettingsModal 
          isOpen={isSettingsModalOpen} 
          onClose={() => setIsSettingsModalOpen(false)} 
          theme={theme} 
          toggleTheme={toggleTheme} 
          onExportData={handleExportJson} 
          onImportData={handleImportJson} 
          onExportToCsv={handleExportCsv} 
          onExportToExcel={handleExportExcel}
          currentUser={currentUser} 
        />
        <AccountFormModal 
          isOpen={isAccountModalOpen} 
          onClose={() => { setIsAccountModalOpen(false); setAccountToEdit(null); }} 
          onSubmit={handleAccountSubmit} 
          account={accountToEdit} 
          categories={categories} 
          onManageCategories={() => {}} 
          activeGroupId={activeGroupId}
          selectedDate={selectedDate}
        />
        <BatchAccountModal isOpen={isBatchModalOpen} onClose={() => setIsBatchModalOpen(false)} onSubmit={async (batch) => {
            const year = selectedDate.getFullYear();
            const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
            const defaultDate = `${year}-${month}-10T12:00:00Z`;
  
            batch.forEach(item => {
                const isVar = isVariableExpense(item);
                const isRec = Boolean(item.isRecurrent);
                const isInst = Boolean(item.isInstallment);
                const sanitizedTotal = item.totalInstallments ? Number(item.totalInstallments) : undefined;
                const installmentId = isInst ? `batch-series-${Date.now()}-${Math.random()}` : undefined;
                const sanitizedValue = (isInst && sanitizedTotal && sanitizedTotal > 1) ? Number(item.value) / sanitizedTotal : Number(item.value);
                
                if (isInst && sanitizedTotal && sanitizedTotal > 1) {
                    const baseDate = new Date(defaultDate);
                    for (let i = 1; i <= sanitizedTotal; i++) {
                        const currentDate = new Date(baseDate);
                        currentDate.setMonth(baseDate.getMonth() + (i - 1));
                        
                        dataService.addAccount({
                            ...item,
                            id: `batch-${Date.now()}-${Math.random()}-${i}`,
                            groupId: activeGroupId,
                            value: sanitizedValue,
                            isRecurrent: false,
                            isInstallment: true,
                            installmentId: installmentId,
                            currentInstallment: i,
                            totalInstallments: sanitizedTotal,
                            paymentDate: currentDate.toISOString(),
                            status: AccountStatus.PENDING
                        });
                    }
                } else {
                    dataService.addAccount({
                        ...item,
                        id: `batch-${Date.now()}-${Math.random()}`,
                        groupId: activeGroupId,
                        value: sanitizedValue,
                        isRecurrent: isRec,
                        isInstallment: isInst,
                        installmentId: installmentId,
                        currentInstallment: isInst ? (Number(item.currentInstallment) || 1) : undefined,
                        totalInstallments: sanitizedTotal,
                        paymentDate: (isRec && !isInst) ? undefined : defaultDate,
                        status: AccountStatus.PENDING
                    });
                }
            });
        }} categories={categories} />
        <AddSelectionModal isOpen={isSelectionModalOpen} onClose={() => setIsSelectionModalOpen(false)} onSelectSingle={() => setIsAccountModalOpen(true)} onSelectBatch={() => setIsBatchModalOpen(true)} />
        <MoveAccountsModal isOpen={isMoveModalOpen} onClose={() => setIsMoveModalOpen(false)} onSubmit={(ids, to) => {
            const accsToUpdate = accounts.filter(a => ids.includes(a.id)).map(a => ({...a, paymentDate: `${to}-10T12:00:00Z`}));
            dataService.updateMultipleAccounts(accsToUpdate);
        }} allAccounts={userAccounts} currentDashboardMonth={selectedDate.toISOString().slice(0, 7)} />
      </div>
    </div>
  );
};
export default App;
