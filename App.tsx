
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { type User, type Group, type Account, Role, AccountStatus, type Income, type View } from './types';
import { MOCK_USERS, MOCK_GROUPS, MOCK_ACCOUNTS, ACCOUNT_CATEGORIES, MOCK_INCOMES } from './utils/mockData';
import LoginScreen from './components/LoginScreen';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import AdminPanel from './components/AdminPanel';
import AccountHistory from './components/AccountHistory';
import AccountFormModal from './components/AccountFormModal';
import BottomNavBar from './components/BottomNavBar';
import AiChatModal, { AiChatModalRef } from './components/AiChatModal';
import SettingsModal from './components/SettingsModal';
import StatCardSkeleton from './components/skeletons/StatCardSkeleton';
import AccountCardSkeleton from './components/skeletons/AccountCardSkeleton';
import FloatingAiButton from './components/FloatingAiButton';
import { useTheme } from './hooks/useTheme';
import { ParsedCommand, analyzeSpending } from './services/geminiService';
import IncomeManagement from './components/IncomeManagement';

interface ManageCategoriesModalProps {
    isOpen: boolean;
    onClose: () => void;
    categories: string[];
    onAdd: (name: string) => boolean;
    onUpdate: (oldName: string, newName: string) => boolean;
    onDelete: (name: string) => boolean;
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

    const handleAdd = () => {
        if (onAdd(newCategoryName.trim())) {
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

    const handleSaveEdit = () => {
        if (editingCategory && onUpdate(editingCategory.oldName, editingCategory.newName.trim())) {
            setEditingCategory(null);
        } else {
            alert('Novo nome de categoria inválido ou já existente.');
        }
    };
    
    const handleDelete = (name: string) => {
        if (window.confirm(`Tem certeza que deseja excluir a categoria "${name}"?`)) {
            onDelete(name);
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
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [view, setView] = useState<View>('dashboard');

  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [accountToEdit, setAccountToEdit] = useState<Account | null>(null);
  
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [startVoiceOnChatOpen, setStartVoiceOnChatOpen] = useState(false);
  const [isAiListening, setIsAiListening] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<AccountStatus | 'ALL'>('ALL');
  const constraintsRef = useRef<HTMLDivElement>(null);
  const chatModalRef = useRef<AiChatModalRef>(null);

  const loadData = useCallback(() => {
    setIsLoading(true);
    try {
      const storedUsers = localStorage.getItem('app_users');
      const storedGroups = localStorage.getItem('app_groups');
      const storedAccounts = localStorage.getItem('app_accounts');
      const storedCategories = localStorage.getItem('app_categories');
      const storedIncomes = localStorage.getItem('app_incomes');

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
      
      if (storedCategories) {
          setCategories(JSON.parse(storedCategories));
      } else {
          localStorage.setItem('app_categories', JSON.stringify(ACCOUNT_CATEGORIES));
          setCategories(ACCOUNT_CATEGORIES);
      }
      
      if (storedIncomes) {
          setIncomes(JSON.parse(storedIncomes));
      } else {
          localStorage.setItem('app_incomes', JSON.stringify(MOCK_INCOMES));
          setIncomes(MOCK_INCOMES);
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
  
  const userAccounts = useMemo(() => {
    if (!currentUser) return [];
    return accounts.filter(acc => currentUser.groupIds.includes(acc.groupId));
  }, [accounts, currentUser]);

  const userIncomes = useMemo(() => {
      if (!currentUser) return [];
      return incomes.filter(inc => currentUser.groupIds.includes(inc.groupId));
  }, [incomes, currentUser]);

  const saveData = useCallback(<T,>(key: string, data: T) => {
    localStorage.setItem(key, JSON.stringify(data));
  }, []);

  const handleLogin = (username: string, password: string): boolean => {
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
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
  const handleAddOrUpdateAccount = (accountData: Omit<Account, 'id' | 'status'> & { id?: string }) => {
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

  // Income CRUD
  const handleAddOrUpdateIncome = (incomeData: Omit<Income, 'id' | 'date'> & { id?: string }) => {
    if (incomeData.id) {
        // Update
        const newIncomes = incomes.map(inc => inc.id === incomeData.id ? { ...inc, ...incomeData } : inc);
        setIncomes(newIncomes);
        saveData('app_incomes', newIncomes);
    } else {
        // Add
        if (!currentUser) return;
        const newIncome: Income = {
            ...(incomeData as Omit<Income, 'id'|'date'>),
            id: `inc-${Date.now()}`,
            date: new Date().toISOString(),
        };
        const newIncomes = [...incomes, newIncome];
        setIncomes(newIncomes);
        saveData('app_incomes', newIncomes);
    }
  };

  const handleDeleteIncome = (incomeId: string) => {
      const newIncomes = incomes.filter(inc => inc.id !== incomeId);
      setIncomes(newIncomes);
      saveData('app_incomes', newIncomes);
  };
  
   const handleEditIncomeByName = (editData: { original_name: string; new_name?: string; new_value?: number }): boolean => {
    const incomeToEdit = userIncomes.find(inc => inc.name.toLowerCase() === editData.original_name.toLowerCase());
    if (incomeToEdit) {
        const updatedIncome = {
            ...incomeToEdit,
            name: editData.new_name || incomeToEdit.name,
            value: editData.new_value || incomeToEdit.value,
        };
        const newIncomes = incomes.map(inc => inc.id === updatedIncome.id ? updatedIncome : inc);
        setIncomes(newIncomes);
        saveData('app_incomes', newIncomes);
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
    if (users.some(u => u.groupIds.includes(groupId))) {
      alert("Não é possível excluir um grupo que contém usuários.");
      return;
    }
    const newGroups = groups.filter(g => g.id !== groupId);
    setGroups(newGroups);
    saveData('app_groups', newGroups);
  };

  // Category CRUD
   const handleAddCategory = (name: string): boolean => {
        if (name && !categories.find(c => c.toLowerCase() === name.toLowerCase())) {
            const newCategories = [...categories, name].sort((a, b) => a.localeCompare(b));
            setCategories(newCategories);
            saveData('app_categories', newCategories);
            return true;
        }
        return false;
    };
    
    const handleUpdateCategory = (oldName: string, newName: string): boolean => {
        if (newName && oldName !== newName && !categories.find(c => c.toLowerCase() === newName.toLowerCase())) {
            const newCategories = categories.map(c => (c === oldName ? newName : c)).sort((a, b) => a.localeCompare(b));
            setCategories(newCategories);
            saveData('app_categories', newCategories);

            const newAccounts = accounts.map(acc => (acc.category === oldName ? { ...acc, category: newName } : acc));
            setAccounts(newAccounts);
            saveData('app_accounts', newAccounts);
            return true;
        }
        return false;
    };

    const handleDeleteCategory = (name: string): boolean => {
        const isCategoryInUse = accounts.some(acc => acc.category === name);
        if (isCategoryInUse) {
            alert(`A categoria "${name}" está em uso e não pode ser excluída.`);
            return false;
        }
        if (categories.length <= 1) {
            alert("Você deve ter pelo menos uma categoria.");
            return false;
        }
        const newCategories = categories.filter(c => c !== name);
        setCategories(newCategories);
        saveData('app_categories', newCategories);
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
        if (!currentUser || currentUser.groupIds.length === 0) {
            return "Não foi possível processar o comando. Usuário não está em nenhum grupo.";
        }
        const defaultGroupId = currentUser.groupIds[0];
       
        switch (command.intent) {
            case 'add_account':
                handleAddOrUpdateAccount({ ...command.data, groupId: defaultGroupId, isRecurrent: false, isInstallment: false });
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
            case 'add_income':
                handleAddOrUpdateIncome({ ...command.data, groupId: defaultGroupId, isRecurrent: false });
                return `Entrada "${command.data.name}" adicionada com sucesso!`;
            case 'edit_income':
                 const editIncomeSuccess = handleEditIncomeByName(command.data);
                return editIncomeSuccess
                    ? `Entrada "${command.data.original_name}" atualizada com sucesso!`
                    : `Não encontrei a entrada "${command.data.original_name}" para editar.`;
            default:
                return command.data.text || "Não consegui entender seu comando. Você pode tentar reformular?";
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
        if (userAccounts.length === 0) {
            return "Não há contas para analisar.";
        }

        try {
            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();

            const previousMonthDate = new Date(currentYear, currentMonth - 1, 1);
            const prevMonth = previousMonthDate.getMonth();
            const prevYear = previousMonthDate.getFullYear();

            const currentMonthAccounts = userAccounts.filter(acc => {
                if (acc.status !== AccountStatus.PAID || !acc.paymentDate) return false;
                const paymentDate = new Date(acc.paymentDate);
                return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
            });

            const previousMonthAccounts = userAccounts.filter(acc => {
                if (acc.status !== AccountStatus.PAID || !acc.paymentDate) return false;
                const paymentDate = new Date(acc.paymentDate);
                return paymentDate.getMonth() === prevMonth && paymentDate.getFullYear() === prevYear;
            });
            
            const insight = await analyzeSpending(currentMonthAccounts, previousMonthAccounts);
            return insight;

        } catch (error) {
            console.error("Failed to run spending analysis:", error);
            return "Desculpe, ocorreu um erro ao tentar analisar seus gastos.";
        }
    };
    
    // Data Management
    const handleExportData = () => {
        try {
            const dataToExport = {
                users: users,
                groups: groups,
                accounts: accounts,
                categories: categories,
                incomes: incomes,
            };
            const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
                JSON.stringify(dataToExport, null, 2)
            )}`;
            const link = document.createElement("a");
            link.href = jsonString;
            const date = new Date().toISOString().slice(0, 10);
            link.download = `controle_contas_backup_${date}.json`;
            link.click();
        } catch (error) {
            console.error("Failed to export data", error);
            alert("Ocorreu um erro ao exportar os dados.");
        }
    };

    const handleImportData = (file: File) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') throw new Error("Failed to read file");
                
                const data = JSON.parse(text);
                if (data.users && data.groups && data.accounts && data.categories) {
                    saveData('app_users', data.users);
                    saveData('app_groups', data.groups);
                    saveData('app_accounts', data.accounts);
                    saveData('app_categories', data.categories);
                    if (data.incomes) {
                       saveData('app_incomes', data.incomes);
                    }

                    alert("Backup restaurado com sucesso! A aplicação será recarregada.");
                    window.location.reload();
                } else {
                    alert("Arquivo de backup inválido ou corrompido.");
                }
            } catch (error) {
                console.error("Failed to import data", error);
                alert("Ocorreu um erro ao importar o arquivo de backup.");
            }
        };
        reader.readAsText(file);
    };

    const handleExportToCsv = () => {
        if (userAccounts.length === 0) {
            alert("Nenhuma conta para exportar.");
            return;
        }

        try {
            const headers = ["ID", "Nome", "Categoria", "Valor", "Status", "Recorrente", "Parcela Atual", "Total Parcelas", "Data Pagamento"];
            const rows = userAccounts.map(acc => [
                `"${acc.id}"`,
                `"${acc.name.replace(/"/g, '""')}"`,
                `"${acc.category}"`,
                acc.value,
                `"${acc.status}"`,
                acc.isRecurrent ? "Sim" : "Não",
                acc.isInstallment ? acc.currentInstallment : "",
                acc.isInstallment ? acc.totalInstallments : "",
                `"${acc.paymentDate ? new Date(acc.paymentDate).toLocaleDateString('pt-BR') : ''}"`
            ].join(','));

            const csvContent = [headers.join(','), ...rows].join('\n');
            const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
            
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            const date = new Date().toISOString().slice(0, 10);
            link.setAttribute("download", `contas_export_${date}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error("Failed to export to CSV", error);
            alert("Ocorreu um erro ao exportar para CSV.");
        }
    };

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
              incomes={userIncomes}
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
        case 'income':
            return (
                <IncomeManagement
                    incomes={userIncomes}
                    onAddOrUpdate={handleAddOrUpdateIncome}
                    onDelete={handleDeleteIncome}
                    currentUser={currentUser}
                    groups={groups}
                />
            );
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
        categories={categories}
        onManageCategories={() => setIsCategoryModalOpen(true)}
        currentUser={currentUser}
        groups={groups}
      />
       <ManageCategoriesModal
          isOpen={isCategoryModalOpen}
          onClose={() => setIsCategoryModalOpen(false)}
          categories={categories}
          onAdd={handleAddCategory}
          onUpdate={handleUpdateCategory}
          onDelete={handleDeleteCategory}
        />
      <AiChatModal 
        ref={chatModalRef}
        isOpen={isChatOpen}
        onClose={() => {
            setIsChatOpen(false);
            setStartVoiceOnChatOpen(false);
        }}
        currentUser={currentUser}
        accounts={userAccounts}
        incomes={userIncomes}
        categories={categories}
        onCommand={handleAiCommand}
        startWithVoice={startVoiceOnChatOpen}
        onListeningChange={setIsAiListening}
        onTriggerAnalysis={handleTriggerAiAnalysis}
      />
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        theme={theme}
        toggleTheme={toggleTheme}
        onExportData={handleExportData}
        onImportData={handleImportData}
        onExportToCsv={handleExportToCsv}
      />
       <div ref={constraintsRef} className="fixed inset-0 pointer-events-none z-40" />
       <FloatingAiButton 
            onClick={handleAiButtonClick} 
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