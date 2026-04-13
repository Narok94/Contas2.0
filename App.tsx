
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
import BottomNavBar from './components/BottomNavBar';
import AiChatModal, { AiChatModalRef } from './components/AiChatModal';
import SettingsModal from './components/SettingsModal';
import FloatingAiButton from './components/FloatingAiButton';
import { useTheme } from './hooks/useTheme';
import * as dataService from './services/dataService';
import realtimeService from './services/realtimeService';
import IncomeManagement from './components/IncomeManagement';
import GroupSelectionScreen from './components/GroupSelectionScreen';
import MoveAccountsModal from './components/MoveAccountsModal';
import { notifyPaymentViaWhatsApp } from './utils/whatsapp';
import { isVariableExpense } from './utils/accountUtils';

// isVariableExpense removed as it is now imported from accountUtils

const App: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
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
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isAiListening, setIsAiListening] = useState(false);
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  
  const constraintsRef = useRef<HTMLDivElement>(null);
  const chatModalRef = useRef<AiChatModalRef>(null);

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
                    setView('dashboard');
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
  
  const userAccounts = useMemo(() => {
    if (!activeGroupId) return [];
    return accounts.filter(acc => acc.groupId === activeGroupId);
  }, [accounts, activeGroupId]);

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
    setView('dashboard');
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

    const isVirtual = acc.id.toString().startsWith('projected-') || (!acc.paymentDate && acc.isRecurrent);

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

      const isVirtual = acc.id.toString().startsWith('projected-') || (!acc.paymentDate && acc.isRecurrent);

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
      const isEditingProjection = data.id && data.id.toString().startsWith('projected-');
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
          // ... (existing update logic)
          if (isEditingProjection || (existingAccount?.isRecurrent && !existingAccount.paymentDate)) {
              let baseId = data.id.toString().replace(/^projected-/, '');
              const parts = baseId.split('-');
              if (parts.length > 2 && /^\d{4}$/.test(parts[parts.length-2])) {
                  baseId = parts.slice(0, -2).join('-');
              }
              
              const original = accounts.find(a => a.id === baseId);
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
          const isRec = isVar ? true : Boolean(data.isRecurrent);
          const isInst = Boolean(data.isInstallment);
          const installmentId = isInst ? `inst-${Date.now()}` : undefined;
          
          if (isInst && sanitizedTotal && sanitizedTotal > 1) {
              // Create all installments
              const baseDate = data.paymentDate ? new Date(data.paymentDate) : new Date(targetDate);
              
              for (let i = 1; i <= sanitizedTotal; i++) {
                  const currentDate = new Date(baseDate);
                  currentDate.setMonth(baseDate.getMonth() + (i - 1));
                  
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
                      status: AccountStatus.PENDING,
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
        csv += `Despesa,"${acc.name}",${acc.value},"${acc.category}",${acc.paymentDate || acc.dueDate},${acc.status}\n`;
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
        <div className="min-h-screen flex items-center justify-center bg-background dark:bg-dark-background font-sans">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="font-serif italic font-black text-primary animate-pulse tracking-tighter text-2xl">TATU.</p>
            </div>
        </div>
    );
  }

  if (view === 'login') return <LoginScreen onLogin={handleLogin} onNavigateToRegister={() => setView('register')} />;
  if (view === 'register') return <RegisterScreen onRegister={handleRegister} onNavigateToLogin={() => setView('login')} />;
  if (view === 'groupSelection' && currentUser) return <GroupSelectionScreen user={currentUser} groups={groups} onSelectGroup={handleGroupSelect} onLogout={handleLogout} />;
  if (!currentUser || !activeGroupId) return <LoginScreen onLogin={handleLogin} onNavigateToRegister={() => setView('register')} />;

  return (
    <div className="min-h-screen bg-background text-text-primary dark:bg-dark-background dark:text-dark-text-primary relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/10 dark:bg-primary/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute top-[20%] -right-[5%] w-[30%] h-[30%] bg-secondary/10 dark:bg-secondary/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute -bottom-[10%] left-[20%] w-[35%] h-[35%] bg-accent/10 dark:bg-accent/20 rounded-full blur-[110px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10">
        <Header currentUser={currentUser} onSettingsClick={() => setIsSettingsModalOpen(true)} onLogout={handleLogout} />
        <main className="p-3 sm:p-4 lg:p-6 max-w-7xl mx-auto pb-32">
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
                  onDeleteAccount={(id) => dataService.deleteAccount(id)} 
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
        <FloatingAiButton onClick={() => setIsChatOpen(true)} onLongPress={() => {}} constraintsRef={constraintsRef} isListening={isAiListening} />
        <BottomNavBar activeView={view} onViewChange={setView} onAddClick={() => setIsSelectionModalOpen(true)} isAdmin={currentUser.role === Role.ADMIN} />
        <AiChatModal ref={chatModalRef} isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} currentUser={currentUser} accounts={userAccounts} incomes={userIncomes} categories={categories} onCommand={(cmd) => "Comando processado com sucesso!"} startWithVoice={false} onListeningChange={setIsAiListening} />
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
                const isRec = isVar ? true : Boolean(item.isRecurrent);
                const isInst = Boolean(item.isInstallment);
                const sanitizedTotal = item.totalInstallments ? Number(item.totalInstallments) : undefined;
                const installmentId = isInst ? `batch-series-${Date.now()}-${Math.random()}` : undefined;
                const sanitizedValue = Number(item.value);
                
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
