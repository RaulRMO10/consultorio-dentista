import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Settings, CreditCard, Percent, Plus, Edit2, Trash2, Power, Briefcase, FileWarning, Tags, ArrowRightLeft, TrendingDown, Building2, UserCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';

const TABS_CATEGORIAS = [
    { id: 'RECEITAS_PESSOAIS', label: 'Receitas Pessoais', tipo: 'RECEITA', escopo: 'PESSOAL', icon: Plus, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { id: 'DESPESAS_PESSOAIS', label: 'Despesas Pessoais', tipo: 'DESPESA', escopo: 'PESSOAL', icon: TrendingDown, color: 'text-red-500', bg: 'bg-red-50' },
    { id: 'DESPESAS_CLINICA', label: 'Despesas Clínica', tipo: 'DESPESA', escopo: 'CLINICA', icon: TrendingDown, color: 'text-rose-600', bg: 'bg-rose-50' },
    { id: 'TRANSFERENCIAS', label: 'Transferências/Aportes', tipo: 'TRANSFERENCIA', escopo: 'GLOBAL', icon: ArrowRightLeft, color: 'text-slate-600', bg: 'bg-slate-100' },
];

const CategoriaForm = ({ initialData, activeTabInfo, onSuccess, onCancel }) => {
    const [formData, setFormData] = useState({
        nome: '',
        tipo: activeTabInfo.tipo,
        escopo: activeTabInfo.escopo
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (initialData) {
            setFormData({
                nome: initialData.nome,
                tipo: initialData.tipo,
                escopo: initialData.escopo
            });
        } else {
            setFormData({
                nome: '',
                tipo: activeTabInfo.tipo,
                escopo: activeTabInfo.escopo
            });
        }
    }, [initialData, activeTabInfo]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (initialData?.id) {
                await api.put(`/api/financeiro/settings/categorias/${initialData.id}`, formData);
            } else {
                await api.post('/api/financeiro/settings/categorias', formData);
            }
            onSuccess();
        } catch (err) {
            setError(err.response?.data?.detail || "Erro ao salvar a categoria.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
                <div className="p-3 bg-red-50 text-red-700 text-sm rounded-xl flex items-center gap-2">
                    <FileWarning size={16} /> {error}
                </div>
            )}

            <div className={`p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-3 ${activeTabInfo.bg} dark:bg-slate-800/50`}>
                <activeTabInfo.icon size={24} className={activeTabInfo.color} />
                <div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-200">{activeTabInfo.label}</h4>
                    <p className="text-xs text-slate-500">
                        Tipo: <span className="font-semibold">{activeTabInfo.tipo}</span> | Escopo: <span className="font-semibold">{activeTabInfo.escopo}</span>
                    </p>
                </div>
            </div>

            <Input
                label="Nome da Categoria *"
                name="nome"
                required
                placeholder="Ex: Salário, Conta de Luz, Materiais..."
                value={formData.nome}
                onChange={handleChange}
            />

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button variant="outline" type="button" onClick={onCancel} disabled={loading}>Cancelar</Button>
                <Button variant="primary" type="submit" disabled={loading}>
                    {loading ? 'Salvando...' : 'Salvar Categoria'}
                </Button>
            </div>
        </form>
    );
};

// ==========================================
// SEÇÃO ORIGINAL DE FORMAS DE PAGAMENTO
// ==========================================
const FormaPagamentoForm = ({ initialData, onSuccess, onCancel }) => {
    const [formData, setFormData] = useState({
        nome: '',
        tipo: 'CREDITO',
        taxa_padrao_porcentagem: 0,
        dias_repasse: 0
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (initialData) {
            setFormData({
                nome: initialData.nome,
                tipo: initialData.tipo,
                taxa_padrao_porcentagem: initialData.taxa_padrao_porcentagem,
                dias_repasse: initialData.dias_repasse
            });
        }
    }, [initialData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const payload = {
            ...formData,
            taxa_padrao_porcentagem: parseFloat(formData.taxa_padrao_porcentagem) || 0,
            dias_repasse: parseInt(formData.dias_repasse, 10) || 0
        };

        try {
            if (initialData?.id) {
                await api.put(`/api/financeiro/settings/formas-pagamento/${initialData.id}`, payload);
            } else {
                await api.post('/api/financeiro/settings/formas-pagamento', payload);
            }
            onSuccess();
        } catch (err) {
            setError(err.response?.data?.detail || "Erro ao salvar a forma de pagamento.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
                <div className="p-3 bg-red-50 text-red-700 text-sm rounded-xl flex items-center gap-2">
                    <FileWarning size={16} /> {error}
                </div>
            )}

            <Input
                label="Nome Descritivo *"
                name="nome"
                required
                placeholder="Ex: Stone Débito, Link de Pagamento..."
                value={formData.nome}
                onChange={handleChange}
            />

            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Categoria (Tipo base) *</label>
                <select
                    name="tipo"
                    value={formData.tipo}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/50 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none"
                >
                    <option value="CREDITO">Cartão de Crédito</option>
                    <option value="DEBITO">Cartão de Débito</option>
                    <option value="PIX">PIX</option>
                    <option value="BOLETO">Boleto Bancário</option>
                    <option value="DINHEIRO">Dinheiro</option>
                </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <Input
                    label="Taxa da Operadora (%)"
                    name="taxa_padrao_porcentagem"
                    type="number"
                    step="0.01"
                    min="0"
                    icon={Percent}
                    value={formData.taxa_padrao_porcentagem}
                    onChange={handleChange}
                />
                <Input
                    label="Dias para Repasse"
                    name="dias_repasse"
                    type="number"
                    min="0"
                    value={formData.dias_repasse}
                    onChange={handleChange}
                />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button variant="outline" type="button" onClick={onCancel} disabled={loading}>Cancelar</Button>
                <Button variant="primary" type="submit" disabled={loading}>
                    {loading ? 'Salvando...' : 'Salvar'}
                </Button>
            </div>
        </form>
    );
};

const ConfiguracoesFinanceiras = () => {
    // ESTADOS COMUNS
    const [globalTab, setGlobalTab] = useState('CATEGORIAS'); // CATEGORIAS ou RECEBIMENTOS

    // ESTADOS FORMAS PGTO
    const [metodos, setMetodos] = useState([]);
    const [loadingMetodos, setLoadingMetodos] = useState(false);
    const [isMetodoModalOpen, setIsMetodoModalOpen] = useState(false);
    const [editMetodo, setEditMetodo] = useState(null);

    // ESTADOS CATEGORIAS
    const [categorias, setCategorias] = useState([]);
    const [loadingCategorias, setLoadingCategorias] = useState(false);
    const [activeCatTab, setActiveCatTab] = useState(TABS_CATEGORIAS[0].id);
    const [isCatModalOpen, setIsCatModalOpen] = useState(false);
    const [editCategoria, setEditCategoria] = useState(null);

    const activeTabInfo = TABS_CATEGORIAS.find(t => t.id === activeCatTab);

    // ==========================================
    // ACTIONS METODOS
    // ==========================================
    const fetchMetodos = async () => {
        try {
            setLoadingMetodos(true);
            const res = await api.get('/api/financeiro/settings/formas-pagamento');
            setMetodos(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingMetodos(false);
        }
    };

    const handleToggleStatusMetodo = async (item) => {
        if (!window.confirm(`Deseja ${item.ativo ? 'inativar' : 'ativar'} a forma de pagamento ${item.nome}?`)) return;
        try {
            if (item.ativo) {
                await api.delete(`/api/financeiro/settings/formas-pagamento/${item.id}`);
            } else {
                await api.put(`/api/financeiro/settings/formas-pagamento/${item.id}`, { ativo: true });
            }
            fetchMetodos();
        } catch (err) {
            console.error(err);
            alert("Erro ao alterar status.");
        }
    };

    // ==========================================
    // ACTIONS CATEGORIAS
    // ==========================================
    const fetchCategorias = async () => {
        try {
            setLoadingCategorias(true);
            const res = await api.get('/api/financeiro/settings/categorias');
            setCategorias(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingCategorias(false);
        }
    };

    const handleToggleStatusCategoria = async (item) => {
        if (!window.confirm(`Deseja ${item.ativo ? 'inativar' : 'ativar'} a categoria ${item.nome}?`)) return;
        try {
            if (item.ativo) {
                await api.delete(`/api/financeiro/settings/categorias/${item.id}`);
            } else {
                await api.put(`/api/financeiro/settings/categorias/${item.id}`, { ativo: true });
            }
            fetchCategorias();
        } catch (err) {
            console.error(err);
            alert("Erro ao alterar status.");
        }
    };

    useEffect(() => {
        if (globalTab === 'RECEBIMENTOS') fetchMetodos();
        if (globalTab === 'CATEGORIAS') fetchCategorias();
    }, [globalTab]);

    // Filtra as categorias ativas para a tab selecionada
    const currentTabCategorias = categorias.filter(c => c.tipo === activeTabInfo.tipo && c.escopo === activeTabInfo.escopo);

    return (
        <div className="w-full animate-in fade-in duration-500 pb-12">
            <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
                        <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
                            <Settings size={24} />
                        </div>
                        Configurações Financeiras
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">Gerencie as categorias de lançamentos e suas formas de recebimento / taxas.</p>
                </div>
            </header>

            {/* ABAS GLOBAIS */}
            <div className="flex gap-4 mb-8 border-b border-slate-200 dark:border-slate-800">
                <button
                    onClick={() => setGlobalTab('CATEGORIAS')}
                    className={`pb-4 px-2 font-bold text-sm transition-colors border-b-2 ${globalTab === 'CATEGORIAS' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                >
                    Categorias de Lançamentos
                </button>
                <button
                    onClick={() => setGlobalTab('RECEBIMENTOS')}
                    className={`pb-4 px-2 font-bold text-sm transition-colors border-b-2 ${globalTab === 'RECEBIMENTOS' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                >
                    Formas de Recebimento
                </button>
            </div>

            {globalTab === 'CATEGORIAS' && (
                <div className="animate-in fade-in duration-300">
                    <div className="flex flex-col lg:flex-row gap-6">

                        {/* SIDEBAR TABS DAS CATEGORIAS */}
                        <div className="w-full lg:w-64 flex flex-col gap-2 shrink-0">
                            {TABS_CATEGORIAS.map(tab => {
                                const isActive = activeCatTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveCatTab(tab.id)}
                                        className={`flex items-center gap-3 p-4 rounded-2xl text-left transition-all ${isActive ? `${tab.bg} ring-1 ring-inset ring-slate-200 dark:ring-slate-700 shadow-sm border-l-4 border-l-${tab.color.split('-')[1]}-500` : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                                    >
                                        <div className={`p-2 rounded-xl ${isActive ? 'bg-white shadow-sm' : 'bg-slate-100'} ${tab.color}`}>
                                            <tab.icon size={18} />
                                        </div>
                                        <span className={`font-bold ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                                            {tab.label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* LISTAGEM DE CATEGORIAS DA TAB ATUAL */}
                        <div className="flex-1">
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm min-h-[400px]">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                        <Tags className={activeTabInfo.color} /> Categorias: {activeTabInfo.label}
                                    </h3>
                                    <Button
                                        variant="primary"
                                        icon={Plus}
                                        onClick={() => { setEditCategoria(null); setIsCatModalOpen(true); }}
                                    >
                                        Nova Categoria
                                    </Button>
                                </div>

                                <div className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase text-xs tracking-wider">
                                                <th className="px-6 py-4 font-semibold">Nome da Categoria</th>
                                                <th className="px-6 py-4 font-semibold">Status</th>
                                                <th className="px-6 py-4 font-semibold text-right">Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {loadingCategorias ? (
                                                <tr><td colSpan="3" className="px-6 py-8 text-center text-slate-500">Carregando...</td></tr>
                                            ) : currentTabCategorias.length === 0 ? (
                                                <tr><td colSpan="3" className="px-6 py-12 text-center text-slate-400">Nenhuma categoria cadastrada para {activeTabInfo.label}.</td></tr>
                                            ) : (
                                                currentTabCategorias.map(cat => (
                                                    <tr key={cat.id} className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors ${!cat.ativo ? 'opacity-50' : ''}`}>
                                                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">{cat.nome}</td>
                                                        <td className="px-6 py-4">
                                                            {cat.ativo ? (
                                                                <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-bold uppercase tracking-wider">Ativo</span>
                                                            ) : (
                                                                <span className="px-2 py-1 bg-slate-100 text-slate-500 rounded text-xs font-bold uppercase tracking-wider">Inativo</span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <button onClick={() => { setEditCategoria(cat); setIsCatModalOpen(true); }} className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors">
                                                                    <Edit2 size={16} />
                                                                </button>
                                                                <button onClick={() => handleToggleStatusCategoria(cat)} className={`p-2 rounded-lg transition-colors ${cat.ativo ? 'text-slate-400 hover:text-red-500' : 'text-slate-400 hover:text-emerald-500'}`}>
                                                                    <Power size={16} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            )}

            {globalTab === 'RECEBIMENTOS' && (
                <div className="animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
                            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <CreditCard size={18} className="text-indigo-500" /> Formas de Recebimento
                            </h3>
                            <Button variant="primary" size="sm" icon={Plus} onClick={() => { setEditMetodo(null); setIsMetodoModalOpen(true); }}>
                                Novo Recebimento
                            </Button>
                        </div>
                        {/* LISTAGEM DE FORMAS DE PAGAMENTO */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                                        <th className="p-4 pl-6">Nome / Descrição</th>
                                        <th className="p-4">Tipo Base</th>
                                        <th className="p-4">Taxa (%)</th>
                                        <th className="p-4">Dias Repasse</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4 text-right pr-6">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                    {loadingMetodos ? (
                                        <tr><td colSpan="6" className="p-12 text-center text-slate-500">Carregando...</td></tr>
                                    ) : metodos.length > 0 ? (
                                        metodos.map(m => (
                                            <tr key={m.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors ${!m.ativo ? 'opacity-60 bg-slate-50/50' : ''}`}>
                                                <td className="p-4 pl-6 font-medium text-slate-900 dark:text-white">{m.nome}</td>
                                                <td className="p-4 text-sm text-slate-500"><span className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-xs font-bold uppercase">{m.tipo}</span></td>
                                                <td className="p-4">{m.taxa_padrao_porcentagem > 0 ? <span className="font-bold text-red-600 text-sm">-{m.taxa_padrao_porcentagem}%</span> : <span className="font-bold text-emerald-600 text-sm">Isento</span>}</td>
                                                <td className="p-4 text-sm text-slate-600">{m.dias_repasse === 0 ? 'Imediato' : `${m.dias_repasse} dia(s)`}</td>
                                                <td className="p-4">{m.ativo ? <span className="text-emerald-600 text-xs font-bold uppercase">Ativo</span> : <span className="text-slate-400 text-xs font-bold uppercase">Inativo</span>}</td>
                                                <td className="p-4 text-right pr-6">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button onClick={() => { setEditMetodo(m); setIsMetodoModalOpen(true); }} className="p-2 text-slate-400 hover:text-indigo-600"><Edit2 size={16} /></button>
                                                        <button onClick={() => handleToggleStatusMetodo(m)} className={`p-2 ${m.ativo ? 'text-slate-400 hover:text-red-600' : 'text-slate-400 hover:text-emerald-600'}`}><Power size={16} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan="6" className="p-10 text-center text-slate-500">Nenhuma forma de pagamento configurada.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* MODALS */}
            <Modal isOpen={isCatModalOpen} onClose={() => setIsCatModalOpen(false)} title={editCategoria ? 'Editar Categoria' : `Nova Categoria em ${activeTabInfo.label}`} maxWidth="max-w-md">
                <CategoriaForm
                    initialData={editCategoria}
                    activeTabInfo={activeTabInfo}
                    onSuccess={() => { setIsCatModalOpen(false); fetchCategorias(); }}
                    onCancel={() => setIsCatModalOpen(false)}
                />
            </Modal>

            <Modal isOpen={isMetodoModalOpen} onClose={() => setIsMetodoModalOpen(false)} title={editMetodo ? 'Editar Configuração' : 'Nova Forma de Recebimento'} maxWidth="max-w-lg">
                <FormaPagamentoForm
                    initialData={editMetodo}
                    onSuccess={() => { setIsMetodoModalOpen(false); fetchMetodos(); }}
                    onCancel={() => setIsMetodoModalOpen(false)}
                />
            </Modal>
        </div>
    );
};

export default ConfiguracoesFinanceiras;
