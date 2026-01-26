
import React, { useState, useEffect } from 'react';
import { type User, type Group, Role } from '../types';

interface UserFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (user: any) => boolean;
    user: User | null;
    groups: Group[];
}

const UserFormModal: React.FC<UserFormModalProps> = ({ isOpen, onClose, onSubmit, user, groups }) => {
    const [formData, setFormData] = useState({ name: '', username: '', groupIds: [] as string[], role: Role.USER, password: '', mustChangePassword: false });

    useEffect(() => {
        if (user) {
            setFormData({ name: user.name, username: user.username, groupIds: user.groupIds, role: user.role, password: '', mustChangePassword: !!user.mustChangePassword });
        } else {
            setFormData({ name: '', username: '', groupIds: [], role: Role.USER, password: '', mustChangePassword: false });
        }
    }, [user, isOpen]);
    
    const handleGroupChange = (groupId: string) => {
        setFormData(prev => {
            const newGroupIds = prev.groupIds.includes(groupId)
                ? prev.groupIds.filter(id => id !== groupId)
                : [...prev.groupIds, groupId];
            return { ...prev, groupIds: newGroupIds };
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (onSubmit(formData)) {
            onClose();
        }
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-fade-in">
            <div className="bg-surface dark:bg-dark-surface rounded-2xl shadow-xl p-6 w-full max-w-lg animate-fade-in-up">
                <h2 className="text-2xl font-bold mb-4">{user ? 'Editar Usuário' : 'Adicionar Usuário'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="text" placeholder="Nome" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required className="w-full p-2 rounded bg-surface-light dark:bg-dark-surface-light border border-border-color dark:border-dark-border-color" />
                    <input type="text" placeholder="Usuário" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} required className="w-full p-2 rounded bg-surface-light dark:bg-dark-surface-light border border-border-color dark:border-dark-border-color" />
                    <input type="password" placeholder="Senha (deixe em branco para não alterar)" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required={!user} className="w-full p-2 rounded bg-surface-light dark:bg-dark-surface-light border border-border-color dark:border-dark-border-color" />
                    <div>
                        <label className="block text-sm font-medium text-text-secondary dark:text-dark-text-secondary mb-2">Grupos</label>
                        <div className="space-y-2 max-h-32 overflow-y-auto p-2 border border-border-color dark:border-dark-border-color rounded-md">
                            {groups.map(g => (
                                <div key={g.id} className="flex items-center">
                                    <input
                                        id={`group-${g.id}`}
                                        type="checkbox"
                                        checked={formData.groupIds.includes(g.id)}
                                        onChange={() => handleGroupChange(g.id)}
                                        className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                                    />
                                    <label htmlFor={`group-${g.id}`} className="ml-2 block text-sm">
                                        {g.name}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                     <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as Role})} className="w-full p-2 rounded bg-surface-light dark:bg-dark-surface-light border border-border-color dark:border-dark-border-color">
                        <option value={Role.USER}>Usuário</option>
                        <option value={Role.ADMIN}>Admin</option>
                    </select>
                    <div className="flex items-center">
                        <input
                            id="mustChangePassword"
                            type="checkbox"
                            checked={formData.mustChangePassword}
                            onChange={(e) => setFormData({ ...formData, mustChangePassword: e.target.checked })}
                            className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                        <label htmlFor="mustChangePassword" className="ml-2 block text-sm text-text-secondary dark:text-dark-text-secondary">
                            Exigir troca de senha no primeiro login
                        </label>
                    </div>
                    <div className="flex justify-end space-x-2 pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-surface-light dark:bg-dark-surface-light hover:bg-border-color dark:hover:bg-dark-border-color transition-colors">Cancelar</button>
                        <button type="submit" className="px-4 py-2 rounded-md bg-primary text-white hover:bg-primary-dark transition-colors">{user ? 'Salvar' : 'Adicionar'}</button>
                    </div>
                </form>
            </div>
        </div>
    )
}

interface GroupFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (group: any) => void;
    group: Group | null;
}

const GroupFormModal: React.FC<GroupFormModalProps> = ({ isOpen, onClose, onSubmit, group }) => {
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');

    useEffect(() => {
        setName(group?.name || '');
        setPassword(group?.password || '');
    }, [group, isOpen]);
    
    if(!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-fade-in">
             <div className="bg-surface dark:bg-dark-surface rounded-2xl shadow-xl p-6 w-full max-w-lg animate-fade-in-up">
                <h2 className="text-2xl font-bold mb-4">{group ? 'Editar Grupo' : 'Adicionar Grupo'}</h2>
                <form onSubmit={(e) => { e.preventDefault(); onSubmit({ name, password })}} className="space-y-4">
                    <input type="text" placeholder="Nome do Grupo" value={name} onChange={e => setName(e.target.value)} required className="w-full p-2 rounded bg-surface-light dark:bg-dark-surface-light border border-border-color dark:border-dark-border-color" />
                    <input type="password" placeholder="Senha do Grupo" value={password} onChange={e => setPassword(e.target.value)} required className="w-full p-2 rounded bg-surface-light dark:bg-dark-surface-light border border-border-color dark:border-dark-border-color" />
                    <div className="flex justify-end space-x-2 pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-surface-light dark:bg-dark-surface-light hover:bg-border-color dark:hover:bg-dark-border-color transition-colors">Cancelar</button>
                        <button type="submit" className="px-4 py-2 rounded-md bg-primary text-white hover:bg-primary-dark transition-colors">{group ? 'Salvar' : 'Adicionar'}</button>
                    </div>
                </form>
            </div>
        </div>
    )
}


interface AdminPanelProps {
    users: User[];
    groups: Group[];
    onAddUser: (user: Omit<User, 'id'>) => boolean;
    onUpdateUser: (user: User) => boolean;
    onDeleteUser: (userId: string) => void;
    onAddGroup: (group: Omit<Group, 'id'>) => void;
    onUpdateGroup: (group: Group) => void;
    onDeleteGroup: (groupId: string) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ users, groups, onAddUser, onUpdateUser, onDeleteUser, onAddGroup, onUpdateGroup, onDeleteGroup }) => {
    const [activeTab, setActiveTab] = useState<'users' | 'groups'>('users');
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    const [userToEdit, setUserToEdit] = useState<User | null>(null);
    const [groupToEdit, setGroupToEdit] = useState<Group | null>(null);

    const openUserModal = (user: User | null = null) => { setUserToEdit(user); setIsUserModalOpen(true); }
    const openGroupModal = (group: Group | null = null) => { setGroupToEdit(group); setIsGroupModalOpen(true); }

    const handleUserSubmit = (userData: any): boolean => {
        if (userToEdit) {
            const updatedUser = {
                ...userToEdit,
                ...userData,
                password: userData.password || userToEdit.password,
            };
            return onUpdateUser(updatedUser);
        } else {
            return onAddUser(userData);
        }
    }

    const handleGroupSubmit = (groupData: any) => {
        if (groupToEdit) {
            onUpdateGroup({ ...groupToEdit, ...groupData });
        } else {
            onAddGroup(groupData);
        }
        setIsGroupModalOpen(false);
    }

    return (
        <div className="bg-surface dark:bg-dark-surface p-4 sm:p-6 rounded-2xl shadow-lg">
            <h1 className="text-3xl font-bold mb-6">Painel Administrativo</h1>
            <div className="border-b border-border-color dark:border-dark-border-color mb-6">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button onClick={() => setActiveTab('users')} className={`${activeTab === 'users' ? 'border-primary text-primary' : 'border-transparent text-text-muted dark:text-dark-text-muted hover:text-text-secondary dark:hover:text-dark-text-secondary hover:border-gray-400 dark:hover:border-gray-500'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}>Gerenciar Usuários</button>
                    <button onClick={() => setActiveTab('groups')} className={`${activeTab === 'groups' ? 'border-primary text-primary' : 'border-transparent text-text-muted dark:text-dark-text-muted hover:text-text-secondary dark:hover:text-dark-text-secondary hover:border-gray-400 dark:hover:border-gray-500'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}>Gerenciar Grupos</button>
                </nav>
            </div>

            {activeTab === 'users' && (
                <div className="animate-fade-in">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold">Todos os Usuários</h2>
                        <button onClick={() => openUserModal()} className="px-4 py-2 rounded-md bg-primary text-white text-sm hover:bg-primary-dark transition-colors">Adicionar Usuário</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-border-color dark:divide-dark-border-color">
                            {/* ... table header ... */}
                             <thead className="bg-surface-light dark:bg-dark-surface-light">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary dark:text-dark-text-secondary uppercase tracking-wider">Nome</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary dark:text-dark-text-secondary uppercase tracking-wider">Usuário</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary dark:text-dark-text-secondary uppercase tracking-wider">Grupo</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary dark:text-dark-text-secondary uppercase tracking-wider">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="bg-surface dark:bg-dark-surface divide-y divide-border-color dark:divide-dark-border-color">
                                {users.map(user => (
                                    <tr key={user.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{user.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">{user.username}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">{user.groupIds.map(gid => groups.find(g => g.id === gid)?.name).filter(Boolean).join(', ')}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                            <button onClick={() => openUserModal(user)} className="text-primary-light hover:text-primary transition-colors">Editar</button>
                                            <button onClick={() => { if (window.confirm(`Tem certeza que deseja excluir o usuário "${user.name}"?`)) onDeleteUser(user.id) }} className="text-danger hover:text-pink-700 transition-colors">Excluir</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'groups' && (
                 <div className="animate-fade-in">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold">Todos os Grupos</h2>
                         <button onClick={() => openGroupModal()} className="px-4 py-2 rounded-md bg-primary text-white text-sm hover:bg-primary-dark transition-colors">Adicionar Grupo</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-border-color dark:divide-dark-border-color">
                            <thead className="bg-surface-light dark:bg-dark-surface-light">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary dark:text-dark-text-secondary uppercase tracking-wider">Nome do Grupo</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary dark:text-dark-text-secondary uppercase tracking-wider">Membros</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary dark:text-dark-text-secondary uppercase tracking-wider">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="bg-surface dark:bg-dark-surface divide-y divide-border-color dark:divide-dark-border-color">
                                {groups.map(group => (
                                    <tr key={group.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{group.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">{users.filter(u => u.groupIds.includes(group.id)).length}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                            <button onClick={() => openGroupModal(group)} className="text-primary-light hover:text-primary transition-colors">Editar</button>
                                            <button onClick={() => { if (window.confirm(`Tem certeza que deseja excluir o grupo "${group.name}"?`)) onDeleteGroup(group.id) }} className="text-danger hover:text-pink-700 transition-colors">Excluir</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            
            <UserFormModal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} onSubmit={handleUserSubmit} user={userToEdit} groups={groups} />
            <GroupFormModal isOpen={isGroupModalOpen} onClose={() => setIsGroupModalOpen(false)} onSubmit={handleGroupSubmit} group={groupToEdit} />
        </div>
    );
};

export default AdminPanel;
