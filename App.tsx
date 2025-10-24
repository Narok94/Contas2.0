


import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { type User, type Group, type Account, Role, AccountStatus } from './types';
import { MOCK_USERS, MOCK_GROUPS, MOCK_ACCOUNTS } from './utils/mockData';
import LoginScreen from './components/LoginScreen';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import AdminPanel from './components/AdminPanel';
import AccountHistory from './components/AccountHistory';
import AccountFormModal from './components/AccountFormModal';
import BottomNavBar from './components/BottomNavBar';
import AiChatModal from './components/AiChatModal';
import SettingsModal from './components/SettingsModal';
import StatCardSkeleton from './components/skeletons/StatCardSkeleton';
import AccountCardSkeleton from './components/skeletons/AccountCardSkeleton';
import FloatingAiButton from './components/FloatingAiButton';
import { useTheme } from './hooks/useTheme';
import { ParsedCommand } from './services/geminiService';

export type View = 'login' | 'dashboard' | 'admin' | 'history';

const App: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [view, setView] = useState<View>('dashboard');

  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [accountToEdit, setAccountToEdit] = useState<Account | null>(null);

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [startVoiceOnChatOpen, setStartVoiceOnChatOpen] = useState(false);
  const [isAiListening, setIsAiListening] = useState(false);


  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<AccountStatus | 'ALL'>('ALL');
  const constraintsRef = useRef<HTMLDivElement>(null);


  const loadData = useCallback(() => {
    setIsLoading(true);
    try {
      const storedUsers = localStorage.getItem('app_users');
      const storedGroups = localStorage.getItem('app_groups');
      const storedAccounts = localStorage.getItem('app_accounts');

      if (storedUsers && storedGroups && storedAccounts) {
        setUsers(JSON.parse(storedUsers));
        setGroups(JSON.parse(storedGroups));
        setAccounts(JSON.parse(storedAccounts));
      } else {
        localStorage.setItem('app_users', JSON.stringify(MOCK_USERS));
        localStorage.setItem('app_groups', JSON.stringify(MOCK_GROUPS));
        localStorage.setItem('app_accounts', JSON.stringify(MOCK_ACCOUNTS));
        setUsers(MOCK_USERS);
        setGroups(MOCK_GROUPS);
        setAccounts(MOCK_ACCOUNTS);
      }
    } catch (error) {
      console.error("Failed to load data from localStorage", error);
    } finally {
      setTimeout(() => setIsLoading(false), 1000); // Simulate loading
    }
  }, []);

  useEffect(() => {
    // Only run on initial mount
    const storedUser = sessionStorage.getItem('app_currentUser');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
      setView('dashboard');
    }
    loadData();
  }, [loadData]);

  const saveData = useCallback(<T,>(key: string, data: T) => {
    localStorage.setItem(key, JSON.stringify(data));
  }, []);

  const handleLogin = (username: string, password: string): boolean => {
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      setCurrentUser(user);
      sessionStorage.setItem('app_currentUser', JSON.stringify(user));
      setView('dashboard');
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem('app_currentUser');
    setView('dashboard'); // Will be redirected to login screen
  };

  // Account CRUD
  const handleAddOrUpdateAccount = (accountData: Omit<Account, 'id' | 'groupId' | 'status'> & { id?: string }) => {
    if (accountData.id) {
        // Update
        const newAccounts = accounts.map(acc => acc.id === accountData.id ? { ...acc, ...accountData } : acc);
        setAccounts(newAccounts);
        saveData('app_accounts', newAccounts);
    } else {
        // Add
        if (!currentUser) return;
        const newAccount: Account = {
            ...accountData,
            id: `acc-${Date.now()}`,
            groupId: currentUser.groupId,
            status: AccountStatus.PENDING,
            ...(accountData.isInstallment && { currentInstallment: 1 }),
        };
        const newAccounts = [...accounts, newAccount];
        setAccounts(newAccounts);
        saveData('app_accounts', newAccounts);
    }
};
  const handleToggleAccountStatus = (accountId: string) => {
      const newAccounts = accounts.map(acc => {
        if (acc.id === accountId) {
            const isNowPaid = acc.status === AccountStatus.PENDING;
            return {
                ...acc,
                status: isNowPaid ? AccountStatus.PAID : AccountStatus.PENDING,
                paymentDate: isNowPaid ? new Date().toISOString() : undefined,
            };
        }
        return acc;
    });
    setAccounts(newAccounts);
    saveData('app_accounts', newAccounts);
  };
  
  const handleToggleAccountStatusByName = (accountName: string) => {
      const accountToToggle = userAccounts.find(acc => acc.name.toLowerCase() === accountName.toLowerCase());
      if (accountToToggle) {
          handleToggleAccountStatus(accountToToggle.id);
          return true;
      }
      return false;
  };

  const handleDeleteAccount = (accountId: string) => {
      const newAccounts = accounts.filter(acc => acc.id !== accountId);
      setAccounts(newAccounts);
      saveData('app_accounts', newAccounts);
  };
  
  const handleEditAccountByName = (editData: { original_name: string; new_name?: string; new_value?: number; new_category?: string }): boolean => {
    const accountToEdit = userAccounts.find(acc => acc.name.toLowerCase() === editData.original_name.toLowerCase());
    if (accountToEdit) {
        const updatedAccount = {
            ...accountToEdit,
            name: editData.new_name || accountToEdit.name,
            value: editData.new_value || accountToEdit.value,
            category: editData.new_category || accountToEdit.category,
        };
        const newAccounts = accounts.map(acc => acc.id === updatedAccount.id ? updatedAccount : acc);
        setAccounts(newAccounts);
        saveData('app_accounts', newAccounts);
        return true;
    }
    return false;
  };


  // User CRUD
  const handleAddUser = (user: Omit<User, 'id'>) => {
    const newUser = { ...user, id: `user-${Date.now()}` };
    const newUsers = [...users, newUser];
    setUsers(newUsers);
    saveData('app_users', newUsers);
  };
  const handleUpdateUser = (updatedUser: User) => {
    const newUsers = users.map(u => u.id === updatedUser.id ? updatedUser : u);
    setUsers(newUsers);
    saveData('app_users', newUsers);
  };
  const handleDeleteUser = (userId: string) => {
    const newUsers = users.filter(u => u.id !== userId);
    setUsers(newUsers);
    saveData('app_users', newUsers);
  };

  // Group CRUD
  const handleAddGroup = (group: Omit<Group, 'id'>) => {
    const newGroup = { ...group, id: `group-${Date.now()}` };
    const newGroups = [...groups, newGroup];
    setGroups(newGroups);
    saveData('app_groups', newGroups);
  };
  const handleUpdateGroup = (updatedGroup: Group) => {
    const newGroups = groups.map(g => g.id === updatedGroup.id ? updatedGroup : g);
    setGroups(newGroups);
    saveData('app_groups', newGroups);
  };
  const handleDeleteGroup = (groupId: string) => {
    if (users.some(u => u.groupId === groupId)) {
      alert("Não é possível excluir um grupo que contém usuários.");
      return;
    }
    const newGroups = groups.filter(g => g.id !== groupId);
    setGroups(newGroups);
    saveData('app_groups', newGroups);
  };
  
  const openAccountModal = (account: Account | null = null) => {
      setAccountToEdit(account);
      setIsAccountModalOpen(true);
  };

  const closeAccountModal = () => {
      setIsAccountModalOpen(false);
      setAccountToEdit(null);
  };
  
   const handleAiCommand = (command: ParsedCommand): string => {
        switch (command.intent) {
            case 'add_account':
                handleAddOrUpdateAccount({ ...command.data, isRecurrent: false, isInstallment: false });
                return `Conta "${command.data.name}" adicionada com sucesso!`;
            case 'pay_account':
                const paySuccess = handleToggleAccountStatusByName(command.data.name);
                return paySuccess
                    ? `Conta "${command.data.name}" marcada como paga!`
                    : `Não encontrei a conta "${command.data.name}" para pagar.`;
            case 'edit_account':
                const editSuccess = handleEditAccountByName(command.data);
                return editSuccess
                    ? `Conta "${command.data.original_name}" atualizada com sucesso!`
                    : `Não encontrei a conta "${command.data.original_name}" para editar.`;
            default:
                return "Não consegui entender seu comando. Você pode tentar reformular?";
        }
    };
    
    const handleAiButtonLongPress = () => {
        setStartVoiceOnChatOpen(true);
        setIsChatOpen(true);
    };

  const userAccounts = useMemo(() => {
    if (!currentUser) return [];
    return accounts.filter(acc => acc.groupId === currentUser.groupId);
  }, [accounts, currentUser]);

  const filteredDashboardAccounts = useMemo(() => {
    return userAccounts
      .filter(acc => {
        const matchesStatus = filterStatus === 'ALL' || acc.status === filterStatus;
        const matchesSearch = searchTerm === '' || acc.name.toLowerCase().includes(searchTerm.toLowerCase()) || acc.category.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesSearch;
      })
      .sort((a, b) => {
        if (a.status === AccountStatus.PENDING && b.status !== AccountStatus.PENDING) return -1;
        if (a.status !== AccountStatus.PENDING && b.status === AccountStatus.PENDING) return 1;
        return a.name.localeCompare(b.name);
    });
  }, [userAccounts, searchTerm, filterStatus]);


  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  const renderContent = () => {
      if (isLoading) {
        return (
             <div className="space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => <StatCardSkeleton key={i} />)}
                </div>
                 <div>
                    <div className="flex justify-between items-center mb-4 h-9">
                        <div className="h-8 w-48 bg-gray-200 dark:bg-dark-surface-light rounded-md animate-skeleton-pulse"></div>
                    </div>
                     <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                        {[...Array(8)].map((_, i) => <AccountCardSkeleton key={i} />)}
                    </div>
                </div>
            </div>
        )
      }

      switch(view) {
        case 'dashboard':
          return (
            <Dashboard 
              accounts={filteredDashboardAccounts} 
              onEditAccount={openAccountModal} 
              onDeleteAccount={handleDeleteAccount} 
              onToggleStatus={handleToggleAccountStatus} 
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              filterStatus={filterStatus}
              setFilterStatus={setFilterStatus}
            />
          );
        case 'admin':
           return currentUser.role === Role.ADMIN ? (
            <AdminPanel 
              users={users} 
              groups={groups}
              onAddUser={handleAddUser}
              onUpdateUser={handleUpdateUser}
              onDeleteUser={handleDeleteUser}
              onAddGroup={handleAddGroup}
              onUpdateGroup={handleUpdateGroup}
              onDeleteGroup={handleDeleteGroup}
            />
          ) : <p>Acesso negado.</p>;
        case 'history':
          return <AccountHistory accounts={userAccounts} />;
        default:
          return null;
      }
  }

  return (
    <div className="min-h-screen bg-background text-text-primary dark:bg-dark-background dark:text-dark-text-primary relative overflow-hidden">
      <Header 
        currentUser={currentUser} 
        onSettingsClick={() => setIsSettingsModalOpen(true)}
        onLogout={handleLogout}
      />
      <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto pb-24">
        {renderContent()}
      </main>
      <AccountFormModal
        isOpen={isAccountModalOpen}
        onClose={closeAccountModal}
        onSubmit={handleAddOrUpdateAccount}
        account={accountToEdit}
      />
      <AiChatModal 
        isOpen={isChatOpen}
        onClose={() => {
            setIsChatOpen(false);
            setStartVoiceOnChatOpen(false);
        }}
        accounts={userAccounts}
        onCommand={handleAiCommand}
        startWithVoice={startVoiceOnChatOpen}
        onListeningChange={setIsAiListening}
      />
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        theme={theme}
        toggleTheme={toggleTheme}
      />
       <div ref={constraintsRef} className="fixed inset-0 pointer-events-none z-40" />
       <FloatingAiButton 
            onClick={() => setIsChatOpen(true)} 
            onLongPress={handleAiButtonLongPress}
            constraintsRef={constraintsRef}
            isListening={isAiListening}
        />
       <BottomNavBar
          activeView={view}
          onViewChange={setView}
          onAddClick={() => openAccountModal()}
          isAdmin={currentUser.role === Role.ADMIN}
       />
    </div>
  );
};

export default App;