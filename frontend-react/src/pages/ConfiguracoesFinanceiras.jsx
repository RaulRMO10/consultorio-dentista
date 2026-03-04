import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Settings, CreditCard, Percent, Plus, Edit2, Trash2, Power, Briefcase, FileWarning } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';

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
                placeholder="Ex: Stone Débito, Link de Pagamento MercadoPago..."
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
                    {loading ? 'Salvando...' : 'Salvar Configuração'}
                </Button>
            </div>
        </form>
    );
};

const ConfiguracoesFinanceiras = () => {
    const [metodos, setMetodos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editItem, setEditItem] = useState(null);

    const fetchMetodos = async () => {
        try {
            setLoading(true);
            const res = await api.get('/api/financeiro/settings/formas-pagamento');
            setMetodos(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMetodos();
    }, []);

    const handleOpenModal = (item = null) => {
        setEditItem(item);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setEditItem(null);
        setIsModalOpen(false);
    };

    const handleSuccess = () => {
        handleCloseModal();
        fetchMetodos();
    };

    const handleToggleStatus = async (item) => {
        if (!window.confirm(`Deseja ${item.ativo ? 'inativar' : 'ativar'} a forma de pagamento ${item.nome}?`)) return;
        try {
            if (item.ativo) {
                // Soft delete / inactivate
                await api.delete(`/api/financeiro/settings/formas-pagamento/${item.id}`);
            } else {
                // Reactivate
                await api.put(`/api/financeiro/settings/formas-pagamento/${item.id}`, { ativo: true });
            }
            fetchMetodos();
        } catch (err) {
            console.error(err);
            alert("Erro ao alterar status.");
        }
    };

    return (
        <div className="max-w-7xl mx-auto animate-in fade-in duration-500 pb-12">
            <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
                        <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
                            <Settings size={24} />
                        </div>
                        Configurações Financeiras
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">Gerencie adquirentes, maquininhas de cartão e suas respectivas taxas de desconto.</p>
                </div>
                <div>
                    <Button variant="primary" icon={Plus} onClick={() => handleOpenModal()}>Nova Forma de Pagamento</Button>
                </div>
            </header>

            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50">
                    <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <CreditCard size={18} className="text-indigo-500" />
                        Formas de Recebimento Ativas
                    </h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-semibold">
                                <th className="p-4 pl-6">Nome / Descrição</th>
                                <th className="p-4">Tipo Base</th>
                                <th className="p-4">Taxa (%)</th>
                                <th className="p-4">Dias Repasse</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right pr-6">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="p-12 text-center text-slate-500">Carregando...</td>
                                </tr>
                            ) : metodos.length > 0 ? (
                                metodos.map(m => (
                                    <tr key={m.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors ${!m.ativo ? 'opacity-60 bg-slate-50/50 dark:bg-slate-900/30' : ''}`}>
                                        <td className="p-4 pl-6 font-medium text-slate-900 dark:text-white">
                                            {m.nome}
                                        </td>
                                        <td className="p-4 text-sm text-slate-500 dark:text-slate-400">
                                            <span className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-xs font-bold uppercase tracking-wider">
                                                {m.tipo}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            {m.taxa_padrao_porcentagem > 0 ? (
                                                <span className="font-bold text-red-600 dark:text-red-400 text-sm">
                                                    -{m.taxa_padrao_porcentagem}%
                                                </span>
                                            ) : (
                                                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">Isento</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-sm text-slate-600 dark:text-slate-300">
                                            {m.dias_repasse === 0 ? 'Imediato' : `${m.dias_repasse} dia(s)`}
                                        </td>
                                        <td className="p-4">
                                            {m.ativo ? (
                                                <span className="text-emerald-600 text-xs font-bold uppercase">Ativo</span>
                                            ) : (
                                                <span className="text-slate-400 text-xs font-bold uppercase">Inativo</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-right pr-6">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => handleOpenModal(m)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 rounded-lg transition-colors" title="Editar">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button onClick={() => handleToggleStatus(m)} className={`p-2 rounded-lg transition-colors ${m.ativo ? 'text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/40' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/40'}`} title={m.ativo ? 'Inativar' : 'Ativar'}>
                                                    <Power size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="p-10 text-center text-slate-500">Nenhuma forma de pagamento configurada.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editItem ? 'Editar Configuração' : 'Nova Forma de Recebimento'} maxWidth="max-w-lg">
                <FormaPagamentoForm initialData={editItem} onSuccess={handleSuccess} onCancel={handleCloseModal} />
            </Modal>
        </div>
    );
};

export default ConfiguracoesFinanceiras;
