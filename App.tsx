
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { type User, type Group, type Account, Role, AccountStatus, type Income, type View } from './types';
import LoginScreen from './components/LoginScreen';
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
import StatCardSkeleton from './components/skeletons/StatCardSkeleton';
import AccountCardSkeleton from './components/skeletons/AccountCardSkeleton';
import FloatingAiButton from './components/FloatingAiButton';
import { useTheme } from './hooks/useTheme';
import { ParsedCommand, analyzeSpending } from './services/geminiService';
import * as dataService from './services/dataService';
import realtimeService from './services/realtimeService';
import IncomeManagement from './components/IncomeManagement';
import ChangePasswordModal from './components/ChangePasswordModal';
import GroupSelectionScreen from './components/GroupSelectionScreen';

interface ManageCategoriesModalProps {
    isOpen: boolean;
    onClose: () => void;
    categories: string[];
    onAdd: (name: string) => Promise<boolean>;
    onUpdate: (oldName: string, newName: string) => Promise<boolean>;
    onDelete: (name: string) => Promise<boolean>;
}

const ManageCategoriesModal: React.FC<ManageCategoriesModalProps> = ({ isOpen, onClose, categories, onAdd, onUpdate, onDelete }) => {
    const [newCategoryName, setNewCategoryName] = useState('');
    const [editingCategory, setEditingCategory] = useState<{ oldName: string; newName: string } | null>(null);

    useEffect(() => {
        if (!isOpen) {
            setNewCategoryName('');
            setEditingCategory(null);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleAdd = async () => {
        if (await onAdd(newCategoryName.trim())) {
            setNewCategoryName('');
        } else {
            alert('Nome de categoria inválido ou já existente.');
        }
    };

    const handleStartEdit = (name: string) => {
        setEditingCategory({ oldName: name, newName: name });
    };

    const handleCancelEdit = () => {
        setEditingCategory(null);
    };

    const handleSaveEdit = async () => {
        if (editingCategory && await onUpdate(editingCategory.oldName, editingCategory.newName.trim())) {
            setEditingCategory(null);
        } else {
            alert('Novo nome de categoria inválido ou já existente.');
        }
    };
    
    const handleDelete = async (name: string) => {
        if (window.confirm(`Tem certeza que deseja excluir a categoria "${name}"?`)) {
            await onDelete(name);
        }
    }

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-[60] p-4 animate-fade-in">
            <div className="bg-surface dark:bg-dark-surface rounded-2xl shadow-xl p-6 w-full max-w-md animate-fade-in-up">
                <h2 className="text-2xl font-bold mb-4">Gerenciar Categorias</h2>
                <div className="space-y-2 max-h-64 overflow-y-auto mb-4 p-1">
                    {categories.map(cat => (
                        <div key={cat} className="flex items-center justify-between p-2 bg-surface-light dark:bg-dark-surface-light rounded-md">
                            {editingCategory?.oldName === cat ? (
                                <input 
                                    type="text"
                                    value={editingCategory.newName}
                                    onChange={(e) => setEditingCategory({ ...editingCategory, newName: e.target.value })}
                                    className="w-full text-sm py-1 px-2 rounded bg-white dark:bg-dark-background border border-primary focus:outline-none"
                                    autoFocus
                                    onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                                />
                            ) : (
                                <span className="text-sm">{cat}</span>
                            )}
                            <div className="flex items-center space-x-3 text-sm">
                                {editingCategory?.oldName === cat ? (
                                    <>
                                        <button onClick={handleSaveEdit} className="font-semibold text-success hover:opacity-80">Salvar</button>
                                        <button onClick={handleCancelEdit} className="text-text-muted hover:opacity-80">Cancelar</button>
                                    </>
                                ) : (
                                    <>
                                        <button onClick={() => handleStartEdit(cat)} className="text-primary-light hover:text-primary transition-colors">Editar</button>
                                        <button onClick={() => handleDelete(cat)} className="text-danger hover:text-pink-700 transition-colors">Excluir</button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="flex space-x-2">
                    <input 
                        type="text" 
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="Adicionar nova categoria"
                        className="w-full p-2 text-sm rounded-md bg-surface-light dark:bg-dark-surface-light border border-border-color dark:border-dark-border-color focus:outline-none focus:ring-1 focus:ring-primary"
                        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                    />
                    <button onClick={handleAdd} className="px-4 py-2 text-sm font-medium rounded-md bg-primary text-white hover:bg-primary-dark transition-colors">Adicionar</button>
                </div>
                <div className="flex justify-end pt-4 mt-4 border-t border-border-color dark:border-dark-border-color">
                    <button onClick={onClose} className="px-4 py-2 rounded-md bg-surface-light dark:bg-dark-surface-light hover:bg-border-color dark:hover:bg-dark-border-color transition-colors text-sm font-medium">Fechar</button>
                </div>
            </div>
        </div>
    )
}

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
  
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [startVoiceOnChatOpen, setStartVoiceOnChatOpen] = useState(false);
  const [isAiListening, setIsAiListening] = useState(false);
  
  const constraintsRef = useRef<HTMLDivElement>(null);
  const chatModalRef = useRef<AiChatModalRef>(null);

    useEffect(() => {
        setIsLoading(true);

        const handleUsersUpdate = (data: User[]) => setUsers(data);
        const handleGroupsUpdate = (data: Group[]) => setGroups(data);
        const handleAccountsUpdate = (data: Account[]) => setAccounts(data);
        const handleIncomesUpdate = (data: Income[]) => setIncomes(data);
        const handleCategoriesUpdate = (data: string[]) => setCategories(data);
        
        realtimeService.subscribe('users', handleUsersUpdate);
        realtimeService.subscribe('groups', handleGroupsUpdate);
        realtimeService.subscribe('accounts', handleAccountsUpdate);
        realtimeService.subscribe('incomes', handleIncomesUpdate);
        realtimeService.subscribe('categories', handleCategoriesUpdate);
        
        const initAuth = async () => {
            const storedUserStr = sessionStorage.getItem('app_currentUser');
            if (storedUserStr) {
                const storedUser = JSON.parse(storedUserStr);
                const storedGroupId = sessionStorage.getItem('app_activeGroupId');
                setCurrentUser(storedUser);

                if (storedGroupId) {
                    setActiveGroupId(storedGroupId);
                    setView('dashboard');
                } else if (storedUser.groupIds.length > 1) {
                    setView('groupSelection');
                } else {
                    handleLogout();
                }
            } else {
                setView('login');
            }
            setIsLoading(false);
        };

        initAuth();

        return () => {
            realtimeService.unsubscribe('users', handleUsersUpdate);
            realtimeService.unsubscribe('groups', handleGroupsUpdate);
            realtimeService.unsubscribe('accounts', handleAccountsUpdate);
            realtimeService.unsubscribe('incomes', handleIncomesUpdate);
            realtimeService.unsubscribe('categories', handleCategoriesUpdate);
        };
    }, []);
  
  const userAccounts = useMemo(() => {
    if (!currentUser || !activeGroupId) return [];
    return accounts.filter(acc => acc.groupId === activeGroupId);
  }, [accounts, currentUser, activeGroupId]);

  const userIncomes = useMemo(() => {
      if (!currentUser || !activeGroupId) return [];
      return incomes.filter(inc => inc.groupId === activeGroupId);
  }, [incomes, currentUser, activeGroupId]);

  const handleLogin = async (usernameInput: string, passwordInput: string): Promise<boolean> => {
    const trimmedUsername = usernameInput.trim().toLowerCase();
    const trimmedPassword = passwordInput.trim();

    const user = users.find(u => u.username.toLowerCase() === trimmedUsername);
    if (!user || user.password !== trimmedPassword) {
        return false;
    }
    
    setCurrentUser(user);
    sessionStorage.setItem('app_currentUser', JSON.stringify(user));

    if (user.mustChangePassword) {
        // Handled by view render
    } else if (user.groupIds.length === 1) {
        handleGroupSelect(user.groupIds[0]);
    } else if (user.groupIds.length > 1) {
        setView('groupSelection');
    } else {
        alert("Você não pertence a nenhum grupo.");
        handleLogout();
        return false;
    }

    return true;
  };
  
  const handleGroupSelect = (groupId: string) => {
    setActiveGroupId(groupId);
    sessionStorage.setItem('app_activeGroupId', groupId);
    setView('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveGroupId(null);
    sessionStorage.removeItem('app_currentUser');
    sessionStorage.removeItem('app_activeGroupId');
    setView('login');
  };

  // ... rest of the file ...
  const handleAddOrUpdateAccount = async (accountData: Omit<Account, 'id' | 'status'> & { id?: string }) => {
    if (accountData.id) {
        const existingAccount = accounts.find(acc => acc.id === accountData.id);
        if (!existingAccount) return;
        const updatedAccountData = { ...existingAccount, ...accountData };
        if (existingAccount.isRecurrent && !updatedAccountData.isRecurrent) {
            updatedAccountData.status = AccountStatus.PENDING;
            updatedAccountData.paymentDate = undefined;
        }
        await dataService.updateAccount(updatedAccountData);
    } else {
        if (!currentUser || !activeGroupId) return;
        const newAccountData: Account = {
            ...accountData,
            groupId: activeGroupId,
            id: `acc-${Date.now()}`,
            status: AccountStatus.PENDING,
            ...(accountData.isInstallment && { currentInstallment: 1 }),
        };
        await dataService.addAccount(newAccountData);
    }
  };

  const handleBatchAddAccounts = async (accountsData: any[]) => {
      if (!currentUser || !activeGroupId) return;
      const newAccounts: Account[] = accountsData.map((data, index) => ({
          ...data,
          groupId: activeGroupId,
          id: `acc-${Date.now()}-${index}`,
          status: AccountStatus.PENDING,
          ...(data.isInstallment && { currentInstallment: 1 }),
      }));
      for (const acc of newAccounts) {
          await dataService.addAccount(acc);
      }
  };
  
  const handleToggleAccountStatus = async (accountId: string) => {
      const account = accounts.find(acc => acc.id === accountId);
      if (!account) return;
      const isNowPaid = account.status === AccountStatus.PENDING;
      const updatedAccountData = {
          ...account,
          status: isNowPaid ? AccountStatus.PAID : AccountStatus.PENDING,
          paymentDate: isNowPaid ? new Date().toISOString() : undefined,
      };
      await dataService.updateAccount(updatedAccountData);
  };
  
  const handleToggleAccountStatusByName = async (accountName: string): Promise<boolean> => {
      const accountToToggle = userAccounts.find(acc => acc.name.toLowerCase() === accountName.toLowerCase());
      if (accountToToggle) {
          await handleToggleAccountStatus(accountToToggle.id);
          return true;
      }
      return false;
  };

  const handleDeleteAccount = async (accountId: string) => {
      await dataService.deleteAccount(accountId);
  };
  
  const handleEditAccountByName = async (editData: { original_name: string; new_name?: string; new_value?: number; new_category?: string }): Promise<boolean> => {
    const accountToEdit = userAccounts.find(acc => acc.name.toLowerCase() === editData.original_name.toLowerCase());
    if (accountToEdit) {
        const updatedAccountData = {
            ...accountToEdit,
            name: editData.new_name || accountToEdit.name,
            value: editData.new_value || accountToEdit.value,
            category: editData.new_category || accountToEdit.category,
        };
        await dataService.updateAccount(updatedAccountData);
        return true;
    }
    return false;
  };

  const handleAddOrUpdateIncome = async (incomeData: Omit<Income, 'id' | 'date'> & { id?: string }) => {
    if (incomeData.id) {
        const existingIncome = incomes.find(inc => inc.id === incomeData.id);
        if (!existingIncome) return;
        const updatedIncomeData = { ...existingIncome, ...incomeData };
        await dataService.updateIncome(updatedIncomeData);
    } else {
        if (!currentUser || !activeGroupId) return;
        const newIncomeData: Income = {
            ...(incomeData as Omit<Income, 'id'|'date'>),
            groupId: activeGroupId,
            id: `inc-${Date.now()}`,
            date: new Date().toISOString(),
        };
        await dataService.addIncome(newIncomeData);
    }
  };

  const handleDeleteIncome = async (incomeId: string) => {
      await dataService.deleteIncome(incomeId);
  };
  
   const handleEditIncomeByName = async (editData: { original_name: string; new_name?: string; new_value?: number }): Promise<boolean> => {
    const incomeToEdit = userIncomes.find(inc => inc.name.toLowerCase() === editData.original_name.toLowerCase());
    if (incomeToEdit) {
        const updatedIncomeData = {
            ...incomeToEdit,
            name: editData.new_name || incomeToEdit.name,
            value: editData.new_value || incomeToEdit.value,
        };
        await dataService.updateIncome(updatedIncomeData);
        return true;
    }
    return false;
  };

  const handleAddUser = async (user: Omit<User, 'id'>): Promise<boolean> => {
    if (users.some(u => u.username.toLowerCase() === user.username.toLowerCase())) {
        alert('Este nome de usuário já está em uso.');
        return false;
    }
    if (!user.password || user.password.trim() === '') {
        alert('A senha é obrigatória.');
        return false;
    }
    await dataService.addUser(user);
    return true;
  };

  const handleUpdateUser = async (updatedUser: User): Promise<boolean> => {
    const originalUser = users.find(u => u.id === updatedUser.id);
    if (originalUser && originalUser.username.toLowerCase() !== updatedUser.username.toLowerCase()) {
        if (users.some(u => u.id !== updatedUser.id && u.username.toLowerCase() === updatedUser.username.toLowerCase())) {
            alert('Este nome de usuário já está em uso.');
            return false;
        }
    }
    await dataService.updateUser(updatedUser);
    return true;
  };

  const handleDeleteUser = async (userId: string) => {
    await dataService.deleteUser(userId);
  };

  const handleChangePassword = async (userId: string, newPassword: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    const updatedUserData = { ...user, password: newPassword, mustChangePassword: false };
    const updatedUser = await dataService.updateUser(updatedUserData);
    if (currentUser && currentUser.id === userId) {
      setCurrentUser(updatedUser);
      sessionStorage.setItem('app_currentUser', JSON.stringify(updatedUser));
      if (updatedUser.groupIds.length === 1) {
          handleGroupSelect(updatedUser.groupIds[0]);
      } else {
          setView('groupSelection');
      }
    }
  };

  const handleAddGroup = async (group: Omit<Group, 'id'>) => {
    await dataService.addGroup(group);
  };
  const handleUpdateGroup = async (updatedGroup: Group) => {
    await dataService.updateGroup(updatedGroup);
  };
  const handleDeleteGroup = async (groupId: string) => {
    if (users.some(u => u.groupIds.includes(groupId))) {
      alert("Não é possível excluir um grupo que contém usuários.");
      return;
    }
    await dataService.deleteGroup(groupId);
  };

   const handleAddCategory = async (name: string): Promise<boolean> => {
        if (name && !categories.find(c => c.toLowerCase() === name.toLowerCase())) {
            const newCategories = [...categories, name].sort((a, b) => a.localeCompare(b));
            await dataService.saveCategories(newCategories);
            return true;
        }
        return false;
    };
    
    const handleUpdateCategory = async (oldName: string, newName: string): Promise<boolean> => {
        if (newName && oldName !== newName && !categories.find(c => c.toLowerCase() === newName.toLowerCase())) {
            const newCategories = categories.map(c => (c === oldName ? newName : c)).sort((a, b) => a.localeCompare(b));
            await dataService.saveCategories(newCategories);
            const newAccounts = accounts.map(acc => (acc.category === oldName ? { ...acc, category: newName } : acc));
            await dataService.updateMultipleAccounts(newAccounts);
            return true;
        }
        return false;
    };

    const handleDeleteCategory = async (name: string): Promise<boolean> => {
        const isCategoryInUse = accounts.some(acc => acc.category === name);
        if (isCategoryInUse) {
            alert(`A categoria "${name}" está em uso.`);
            return false;
        }
        if (categories.length <= 1) {
            alert("Mínimo de 1 categoria.");
            return false;
        }
        const newCategories = categories.filter(c => c !== name);
        await dataService.saveCategories(newCategories);
        return true;
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
        if (!currentUser || !activeGroupId) {
            return "Erro: Sessão inválida.";
        }
        switch (command.intent) {
            case 'add_account':
                handleAddOrUpdateAccount({ ...command.data, groupId: activeGroupId, isRecurrent: false, isInstallment: false });
                return `Conta "${command.data.name}" adicionada!`;
            case 'pay_account':
                handleToggleAccountStatusByName(command.data.name);
                return `Conta "${command.data.name}" marcada como paga!`;
            case 'edit_account':
                handleEditAccountByName(command.data);
                return `Conta "${command.data.original_name}" atualizada!`;
            case 'add_income':
                handleAddOrUpdateIncome({ ...command.data, groupId: activeGroupId, isRecurrent: false });
                return `Entrada "${command.data.name}" adicionada!`;
            case 'edit_income':
                handleEditIncomeByName(command.data);
                return `Entrada "${command.data.original_name}" atualizada!`;
            default:
                return command.data.text || "Comando não compreendido.";
        }
    };
    
    const handleAiButtonClick = () => {
        if (isAiListening) {
            chatModalRef.current?.stopListening();
        } else {
            setIsChatOpen(true);
        }
    };
    
    const handleAiButtonLongPress = () => {
        setStartVoiceOnChatOpen(true);
        setIsChatOpen(true);
    };

    const handleTriggerAiAnalysis = async (): Promise<string> => {
        if (userAccounts.length === 0) return "Sem dados para análise.";
        try {
            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();
            const prevMonthDate = new Date(currentYear, currentMonth - 1, 1);
            const prevMonth = prevMonthDate.getMonth();
            const prevYear = prevMonthDate.getFullYear();
            const currentMonthAccounts = userAccounts.filter(acc => {
                if (acc.status !== AccountStatus.PAID || !acc.paymentDate) return false;
                const paymentDate = new Date(acc.paymentDate);
                return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
            });
            const previousMonthAccounts = accounts.filter(acc => {
                if (acc.groupId !== activeGroupId || acc.status !== AccountStatus.PAID || !acc.paymentDate) return false;
                const paymentDate = new Date(acc.paymentDate);
                return paymentDate.getMonth() === prevMonth && paymentDate.getFullYear() === prevYear;
            });
            return await analyzeSpending(currentMonthAccounts, previousMonthAccounts);
        } catch (error) {
            return "Erro na análise.";
        }
    };
    
    const handleExportData = async () => {
        try {
            const dataToExport = await dataService.exportData();
            const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(dataToExport, null, 2))}`;
            const link = document.createElement("a");
            link.href = jsonString;
            link.download = `controle_contas_backup_${new Date().toISOString().slice(0, 10)}.json`;
            link.click();
        } catch (e) { alert("Erro ao exportar."); }
    };

    const handleImportData = (file: File) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = JSON.parse(e.target?.result as string);
                if (data.users && data.groups && data.accounts) {
                    await dataService.importData(data);
                    window.location.reload();
                } else { alert("Arquivo inválido."); }
            } catch (e) { alert("Erro ao importar."); }
        };
        reader.readAsText(file);
    };

    const handleExportToCsv = () => {
        if (userAccounts.length === 0) { alert("Sem contas."); return; }
        const headers = ["Nome", "Categoria", "Valor", "Status", "Recorrente", "Data Pagamento"];
        const rows = userAccounts.map(acc => [
            `"${acc.name}"`, `"${acc.category}"`, acc.value, `"${acc.status}"`, acc.isRecurrent ? "Sim" : "Não", `"${acc.paymentDate || ''}"`
        ].join(','));
        const blob = new Blob([`\uFEFF${[headers.join(','), ...rows].join('\n')}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `contas_${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
    };

  if (view === 'login') return <LoginScreen onLogin={handleLogin} />;
  if (!currentUser) return <LoginScreen onLogin={handleLogin} />;
  
  if (currentUser.mustChangePassword) {
    return <ChangePasswordModal user={currentUser} onSubmit={handleChangePassword} onLogout={handleLogout} />;
  }

  if (view === 'groupSelection') {
      return <GroupSelectionScreen user={currentUser} groups={groups} onSelectGroup={handleGroupSelect} onLogout={handleLogout} />;
  }

  const renderContent = () => {
      if (isLoading || !activeGroupId) {
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
          return <Dashboard accounts={userAccounts} incomes={userIncomes} onEditAccount={openAccountModal} onDeleteAccount={handleDeleteAccount} onToggleStatus={handleToggleAccountStatus} selectedDate={selectedDate} setSelectedDate={setSelectedDate} onOpenBatchModal={() => setIsBatchModalOpen(true)} />;
        case 'admin':
           return currentUser.role === Role.ADMIN ? <AdminPanel users={users} groups={groups} onAddUser={handleAddUser} onUpdateUser={handleUpdateUser} onDeleteUser={handleDeleteUser} onAddGroup={handleAddGroup} onUpdateGroup={handleUpdateGroup} onDeleteGroup={handleDeleteGroup} /> : <p>Acesso negado.</p>;
        case 'history':
          return <AccountHistory accounts={accounts.filter(acc => acc.groupId === activeGroupId)} />;
        case 'income':
            return <IncomeManagement incomes={userIncomes} onAddOrUpdate={handleAddOrUpdateIncome} onDelete={handleDeleteIncome} activeGroupId={activeGroupId} />;
        default: return null;
      }
  }

  return (
    <div className="min-h-screen bg-background text-text-primary dark:bg-dark-background dark:text-dark-text-primary relative overflow-hidden">
      <Header currentUser={currentUser} onSettingsClick={() => setIsSettingsModalOpen(true)} onLogout={handleLogout} />
      <main className="p-3 sm:p-4 lg:p-6 max-w-7xl mx-auto pb-24">{renderContent()}</main>
      <AccountFormModal isOpen={isAccountModalOpen} onClose={closeAccountModal} onSubmit={handleAddOrUpdateAccount} account={accountToEdit} categories={categories} onManageCategories={() => setIsCategoryModalOpen(true)} activeGroupId={activeGroupId} />
      <BatchAccountModal isOpen={isBatchModalOpen} onClose={() => setIsBatchModalOpen(false)} onSubmit={handleBatchAddAccounts} categories={categories} />
      <AddSelectionModal isOpen={isSelectionModalOpen} onClose={() => setIsSelectionModalOpen(false)} onSelectSingle={() => openAccountModal()} onSelectBatch={() => setIsBatchModalOpen(true)} />
       <ManageCategoriesModal isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)} categories={categories} onAdd={handleAddCategory} onUpdate={handleUpdateCategory} onDelete={handleDeleteCategory} />
      <AiChatModal ref={chatModalRef} isOpen={isChatOpen} onClose={() => { setIsChatOpen(false); setStartVoiceOnChatOpen(false); }} currentUser={currentUser} accounts={userAccounts} incomes={userIncomes} categories={categories} onCommand={handleAiCommand} startWithVoice={startVoiceOnChatOpen} onListeningChange={setIsAiListening} onTriggerAnalysis={handleTriggerAiAnalysis} />
      <SettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} theme={theme} toggleTheme={toggleTheme} onExportData={handleExportData} onImportData={handleImportData} onExportToCsv={handleExportToCsv} />
       <div ref={constraintsRef} className="fixed inset-0 pointer-events-none z-40" />
       <FloatingAiButton onClick={handleAiButtonClick} onLongPress={handleAiButtonLongPress} constraintsRef={constraintsRef} isListening={isAiListening} />
       <BottomNavBar activeView={view} onViewChange={setView} onAddClick={() => setIsSelectionModalOpen(true)} isAdmin={currentUser.role === Role.ADMIN} />
    </div>
  );
};

export default App;
