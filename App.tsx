
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { type User, type Group, type Account, Role, AccountStatus, type Income, type View } from './types';
import LoginScreen from './components/LoginScreen';
import RegisterScreen from './components/RegisterScreen';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import AdminPanel from './components/AdminPanel';
import AccountHistory from './components/AccountHistory';
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

const isVariableExpense = (acc: Partial<Account>) => {
    if (!acc) return false;
    const nameLower = acc.name?.toLowerCase() || '';
    const categoryLower = acc.category?.toLowerCase() || '';
    const isCartao = nameLower.includes('cartão') || categoryLower.includes('cartão');
    const isAgua = nameLower.includes('água') || categoryLower.includes('água');
    const isLuz = nameLower.includes('luz') || categoryLower.includes('luz');
    return isCartao || isAgua || isLuz;
};

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
  
  const constraintsRef = useRef<HTMLDivElement>(null);
  const chatModalRef = useRef<AiChatModalRef>(null);

  useEffect(() => {
    const unsubUsers = realtimeService.subscribe('users', setUsers);
    const unsubGroups = realtimeService.subscribe('groups', setGroups);
    const unsubAccounts = realtimeService.subscribe('accounts', setAccounts);
    const unsubIncomes = realtimeService.subscribe('incomes', setIncomes);
    const unsubCategories = realtimeService.subscribe('categories', setCategories);
    
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
        unsubUsers(); unsubGroups(); unsubAccounts(); unsubIncomes(); unsubCategories();
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

  const handleToggleAccountStatus = (accountId: string) => {
    const acc = accounts.find(a => a.id === accountId);
    if (!acc) return;
    
    const isPaying = acc.status !== AccountStatus.PAID;
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const targetDate = `${year}-${month}-10T12:00:00Z`;

    // Se for variável e estiver sem valor, abre o modal para preencher
    if (isVariableExpense(acc) && isPaying && acc.value === 0) {
        setAccountToEdit(acc);
        setIsAccountModalOpen(true);
        return;
    }

    // Lógica de "Snapshot": Se for uma projeção virtual ou um template recorrente original
    const isVirtual = accountId.toString().startsWith('projected-') || (!acc.paymentDate && acc.isRecurrent);

    if (isVirtual) {
        const snapshot: Account = {
            ...acc,
            id: `acc-snap-${Date.now()}`,
            isRecurrent: false, // snapshots não são templates
            status: isPaying ? AccountStatus.PAID : AccountStatus.PENDING,
            paymentDate: targetDate
        };
        dataService.addAccount(snapshot);
    } else {
        // Se já é um registro físico, apenas atualizamos o status e mantemos a data
        // para evitar que ele "suma" do dashboard ou duplique com o template
        dataService.updateAccount({
            ...acc, 
            status: isPaying ? AccountStatus.PAID : AccountStatus.PENDING,
            paymentDate: acc.paymentDate || targetDate // Mantém a data original se existir
        });
    }
  };

  const handleAccountSubmit = (data: any) => {
      const isEditingProjection = data.id && data.id.toString().startsWith('projected-');
      const existingAccount = accounts.find(a => a.id === data.id);
      
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const targetDate = `${year}-${month}-10T12:00:00Z`;

      const sanitizedValue = Number(data.value);
      const sanitizedTotal = data.totalInstallments ? Number(data.totalInstallments) : undefined;
      const sanitizedCurrent = data.currentInstallment ? Number(data.currentInstallment) : undefined;

      if (data.id && (existingAccount || isEditingProjection)) {
          if (isEditingProjection || (existingAccount?.isRecurrent && !existingAccount.paymentDate)) {
              let baseId = data.id.toString().replace(/^projected-/, '');
              const parts = baseId.split('-');
              if (parts.length > 2 && /^\d{4}$/.test(parts[parts.length-2])) {
                  baseId = parts.slice(0, -2).join('-');
              }
              
              const original = accounts.find(a => a.id === baseId);
              const finalInstallmentId = data.installmentId || original?.installmentId || (data.isInstallment ? `repair-series-${Date.now()}` : undefined);

              const newSnapshot: Account = { 
                  ...data, 
                  id: `acc-snap-${Date.now()}`, 
                  value: sanitizedValue,
                  paymentDate: targetDate, 
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
              installmentId: data.installmentId || (data.isInstallment ? `manual-repair-${Date.now()}` : undefined)
          };
          realtimeService.updateAccountAndSeries(updateData);
      } else {
          const finalId = `acc-${Date.now()}`;
          const isVar = isVariableExpense(data);
          const isRec = isVar ? true : data.isRecurrent;
          const isInst = data.isInstallment;
          
          dataService.addAccount({
              ...data,
              id: finalId,
              value: sanitizedValue,
              isRecurrent: isRec,
              isInstallment: isInst,
              installmentId: isInst ? `inst-series-${Date.now()}` : undefined,
              currentInstallment: isInst ? (sanitizedCurrent || 1) : undefined,
              totalInstallments: sanitizedTotal,
              status: AccountStatus.PENDING,
              paymentDate: (isRec && !isInst) ? undefined : targetDate
          });
      }
  };

  if (isLoading) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background dark:bg-dark-background">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="font-black text-primary animate-pulse tracking-tighter text-2xl">TATU.</p>
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
      <Header currentUser={currentUser} onSettingsClick={() => setIsSettingsModalOpen(true)} onLogout={handleLogout} />
      <main className="p-3 sm:p-4 lg:p-6 max-w-7xl mx-auto pb-32">
        {view === 'dashboard' && (
            <Dashboard 
                accounts={userAccounts} incomes={userIncomes} 
                onEditAccount={(acc) => { setAccountToEdit(acc); setIsAccountModalOpen(true); }} 
                onDeleteAccount={(id) => dataService.deleteAccount(id)} 
                onToggleStatus={handleToggleAccountStatus} 
                selectedDate={selectedDate} setSelectedDate={setSelectedDate} 
                onOpenBatchModal={() => setIsBatchModalOpen(true)} 
                currentUser={currentUser} onOpenMoveModal={() => setIsMoveModalOpen(true)} 
                categories={categories}
            />
        )}
        {view === 'history' && <AccountHistory accounts={userAccounts} />}
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
      <SettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} theme={theme} toggleTheme={toggleTheme} onExportData={() => {}} onImportData={() => {}} onExportToCsv={() => {}} currentUser={currentUser} />
      <AccountFormModal isOpen={isAccountModalOpen} onClose={() => { setIsAccountModalOpen(false); setAccountToEdit(null); }} onSubmit={handleAccountSubmit} account={accountToEdit} categories={categories} onManageCategories={() => {}} activeGroupId={activeGroupId} />
      <BatchAccountModal isOpen={isBatchModalOpen} onClose={() => setIsBatchModalOpen(false)} onSubmit={async (batch) => {
          batch.forEach(acc => {
              const year = selectedDate.getFullYear();
              const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
              const defaultDate = `${year}-${month}-10T12:00:00Z`;
              dataService.addAccount({...acc, id: `acc-batch-${Date.now()}-${Math.random()}`, groupId: activeGroupId, paymentDate: acc.isRecurrent ? undefined : defaultDate});
          });
      }} categories={categories} />
      <AddSelectionModal isOpen={isSelectionModalOpen} onClose={() => setIsSelectionModalOpen(false)} onSelectSingle={() => setIsAccountModalOpen(true)} onSelectBatch={() => setIsBatchModalOpen(true)} />
      <MoveAccountsModal isOpen={isMoveModalOpen} onClose={() => setIsMoveModalOpen(false)} onSubmit={(ids, to) => {
          const accsToUpdate = accounts.filter(a => ids.includes(a.id)).map(a => ({...a, paymentDate: `${to}-10T12:00:00Z`}));
          dataService.updateMultipleAccounts(accsToUpdate);
      }} allAccounts={userAccounts} currentDashboardMonth={selectedDate.toISOString().slice(0, 7)} />
    </div>
  );
};
export default App;
