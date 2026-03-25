import React, { useState, useEffect } from 'react';
import { Save, FileText, AlertCircle, Heart, ShieldAlert, CheckCircle2, Plus, Clock, FileWarning } from 'lucide-react';
import api from '../../services/api';

const AbaAnamnese = ({ pacienteId }) => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [error, setError] = useState('');

    const [fichasList, setFichasList] = useState([]);
    const [viewMode, setViewMode] = useState('new'); // 'new' ou ID da ficha

    const defaultDados = {
        // 2. Motivo da Consulta
        motivo_consulta: '',
        sentindo_dor: '',
        dor_regiao: '',
        dor_tempo: '',
        dor_tipo: '',
        ja_tratou_antes: '',
        
        // 3. Histórico Médico
        prob_cardiacos: false,
        pressao_alta: false,
        pressao_baixa: false,
        diabetes: false,
        prob_respiratorios: false,
        prob_renais: false,
        prob_hepaticos: false,
        epilepsia: false,
        prob_coagulacao: false,
        anemia: false,
        osteoporose: false,
        cancer: false,
        doencas_infecciosas: false,
        doencas_autoimunes: false,
        hiv_aids: false,
        hepatite: false,
        outras_doencas: '',

        // 4. Uso de Medicamentos
        uso_continuo: '',
        quais_medicamentos: '',
        
        // 5. Alergias
        alergia_anestesicos: false,
        alergia_penicilina: false,
        alergia_antiinflamatorios: false,
        alergia_latex: false,
        alergia_alimentos: false,
        alergia_outros: '',

        // 6. Histórico Hospitalar
        fez_cirurgia: '',
        qual_cirurgia: '',
        ano_cirurgia: '',
        ja_hospitalizado: '',
        transfusao_sangue: '',

        // 7. Hábitos
        fuma: false,
        ja_fumou: false,
        bebe_alcool: false,
        usa_drogas: false,
        cigarros_dia: '',
        anos_fuma: '',

        // 8. Histórico Odontológico
        ultima_consulta: '',
        experiencia_negativa: '',
        tratamento_canal: '',
        extracao_dentaria: '',
        usa_protese: '',
        usa_aparelho: '',
        sangra_gengiva: '',

        // 9. Higiene Bucal
        escova_dia: '',
        uso_fio_dental: '',
        uso_enxaguante: '',

        // 10. Sintomas Atuais
        dor_mastigar: false,
        sensivel_frio: false,
        sensivel_quente: false,
        mau_halito: false,
        gengiva_sangrando: false,
        gengiva_inchada: false,
        dentes_moles: false,
        estalos_mandibula: false,
        dificuldade_abrir_boca: false,
        outros_sintomas: '',

        // 11. Para Pacientes Mulheres
        gravida: '',
        meses_gravidez: '',
        amamentando: '',
        anticoncepcional: '',

        // 12. Observações Form
        observacoes: ''
    };

    const [dados, setDados] = useState(defaultDados);

    const fetchAnamnese = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/anamneses/${pacienteId}`);
            if (response.data && Array.isArray(response.data)) {
                setFichasList(response.data);
                if (response.data.length > 0) {
                    // Seleciona a mais recente por padrão
                    setViewMode(response.data[0].id);
                    setDados(response.data[0].dados);
                }
            }
        } catch (err) {
            console.error("Erro ao buscar anamneses:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnamnese();
    }, [pacienteId]);

    // Handle ficha selection from history
    const selecionarFicha = (id) => {
        setViewMode(id);
        const fichaEncontrada = fichasList.find(f => f.id === id);
        if (fichaEncontrada) {
            setDados(fichaEncontrada.dados);
        }
    };

    const iniciarNovaFicha = () => {
        setViewMode('new');
        setDados(defaultDados);
    };

    const handleTextChange = (e) => {
        const { name, value } = e.target;
        setDados(prev => ({ ...prev, [name]: value }));
    };

    const handleCheckboxChange = (e) => {
        const { name, checked } = e.target;
        setDados(prev => ({ ...prev, [name]: checked }));
    };

    const handleRadioChange = (e) => {
        const { name, value } = e.target;
        setDados(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            setError('');
            setSuccessMessage('');
            
            await api.post('/anamneses/', {
                paciente_id: pacienteId,
                dados: dados
            });
            
            setSuccessMessage('Anamnese salva com sucesso!');
            fetchAnamnese(); // Atualiza a lista com a nova ficha rebaixando a tela
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err) {
            console.error(err);
            setError('Erro ao salvar os dados da anamnese.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    const SectionHeader = ({ icon: Icon, title, colorClass }) => (
        <div className={`flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-700/50`}>
            <div className={`p-2 rounded-lg ${colorClass}`}>
                <Icon size={20} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white">{title}</h3>
        </div>
    );

    const isReadOnly = viewMode !== 'new';

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300 pb-12">
            
            {/* Header de Abas / Histórico de Fichas */}
            <div className="bg-white dark:bg-slate-800/80 p-4 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-x-auto flex gap-3">
                 <button
                    onClick={iniciarNovaFicha}
                    className={`flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-colors ${
                        viewMode === 'new'
                            ? 'bg-rose-600 text-white shadow-md shadow-rose-500/20'
                            : 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-200 dark:border-rose-800/50'
                    }`}
                >
                    <Plus size={18} /> Nova Ficha
                </button>

                {fichasList.map((ficha, index) => {
                    const dataCriacao = new Date(ficha.created_at).toLocaleDateString();
                    const isSelected = viewMode === ficha.id;
                    return (
                        <button
                            key={ficha.id}
                            onClick={() => selecionarFicha(ficha.id)}
                            className={`flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-colors ${
                                isSelected
                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                                    : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700'
                            }`}
                        >
                            <Clock size={16} /> 
                            {index === 0 ? `Atual (${dataCriacao})` : `Histórico: ${dataCriacao}`}
                        </button>
                    )
                })}
            </div>

            {isReadOnly && (
                <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 p-4 rounded-xl border border-amber-200 dark:border-amber-800/50 flex items-center gap-3">
                    <FileWarning size={20} className="shrink-0" />
                    <p className="text-sm font-medium">Você está visualizando uma ficha do histórico. Esta ficha é de leitura. Para atualizar ou preencher novas informações, crie uma "Nova Ficha".</p>
                </div>
            )}
            
            {/* 1. Motivo da Consulta */}
            <section className="bg-white dark:bg-slate-800/80 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 lg:p-8">
                <SectionHeader icon={FileText} title="1. Motivo da Consulta" colorClass="bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Qual o motivo da sua consulta hoje?</label>
                        <input type="text" disabled={isReadOnly} name="motivo_consulta" value={dados.motivo_consulta} onChange={handleTextChange} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all disabled:opacity-60 disabled:bg-slate-100" />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Está sentindo dor?</label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer"><input type="radio" disabled={isReadOnly} name="sentindo_dor" value="sim" checked={dados.sentindo_dor === 'sim'} onChange={handleRadioChange} className="text-indigo-600 focus:ring-indigo-500 disabled:opacity-60" /> <span className="text-slate-700 dark:text-slate-300">Sim</span></label>
                            <label className="flex items-center gap-2 cursor-pointer"><input type="radio" disabled={isReadOnly} name="sentindo_dor" value="nao" checked={dados.sentindo_dor === 'nao'} onChange={handleRadioChange} className="text-indigo-600 focus:ring-indigo-500 disabled:opacity-60" /> <span className="text-slate-700 dark:text-slate-300">Não</span></label>
                        </div>
                    </div>
                    
                    {dados.sentindo_dor === 'sim' && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Se sim, em qual região?</label>
                            <input type="text" disabled={isReadOnly} name="dor_regiao" value={dados.dor_regiao} onChange={handleTextChange} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-60 disabled:bg-slate-100" />
                        </div>
                    )}
                    
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Há quanto tempo iniciou o problema?</label>
                        <input type="text" disabled={isReadOnly} name="dor_tempo" value={dados.dor_tempo} onChange={handleTextChange} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 disabled:opacity-60 disabled:bg-slate-100" />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">A dor é contínua ou apenas quando mastiga / temperatura?</label>
                        <input type="text" disabled={isReadOnly} name="dor_tipo" value={dados.dor_tipo} onChange={handleTextChange} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 disabled:opacity-60 disabled:bg-slate-100" />
                    </div>
                    
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Já realizou algum tratamento para esse problema?</label>
                        <input type="text" disabled={isReadOnly} name="ja_tratou_antes" value={dados.ja_tratou_antes} onChange={handleTextChange} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 disabled:opacity-60 disabled:bg-slate-100" />
                    </div>
                </div>
            </section>

            {/* 2. Histórico Médico */}
            <section className="bg-white dark:bg-slate-800/80 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 lg:p-8">
                <SectionHeader icon={Heart} title="2. Histórico Médico (Saúde Geral)" colorClass="bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400" />
                <p className="text-sm text-slate-500 mb-4 font-medium">Você possui ou já teve:</p>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {[
                        ['prob_cardiacos', 'Problemas cardíacos'],
                        ['pressao_alta', 'Pressão alta (Hipertensão)'],
                        ['pressao_baixa', 'Pressão baixa'],
                        ['diabetes', 'Diabetes'],
                        ['prob_respiratorios', 'Prob. respiratórios/Asma'],
                        ['prob_renais', 'Problemas renais'],
                        ['prob_hepaticos', 'Prob. hepáticos (Fígado)'],
                        ['epilepsia', 'Epilepsia/Convulsões'],
                        ['prob_coagulacao', 'Problemas de coagulação'],
                        ['anemia', 'Anemia'],
                        ['osteoporose', 'Osteoporose'],
                        ['cancer', 'Câncer'],
                        ['doencas_infecciosas', 'Doenças infecciosas'],
                        ['doencas_autoimunes', 'Doenças autoimunes'],
                        ['hiv_aids', 'HIV / AIDS'],
                        ['hepatite', 'Hepatite']
                    ].map(([key, label]) => (
                        <label key={key} className={`flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors ${isReadOnly ? 'opacity-70 pointer-events-none' : ''}`}>
                            <input type="checkbox" name={key} disabled={isReadOnly} checked={dados[key]} onChange={handleCheckboxChange} className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500" />
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
                        </label>
                    ))}
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Outras doenças:</label>
                    <input type="text" name="outras_doencas" disabled={isReadOnly} value={dados.outras_doencas} onChange={handleTextChange} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 disabled:opacity-60 disabled:bg-slate-100" />
                </div>
            </section>

            {/* 3. Uso de Medicamentos & 4. Alergias */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <section className="bg-white dark:bg-slate-800/80 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <SectionHeader icon={AlertCircle} title="3. Medicamentos" colorClass="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" />
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Faz uso contínuo de medicamentos?</label>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer"><input type="radio" disabled={isReadOnly} name="uso_continuo" value="sim" checked={dados.uso_continuo === 'sim'} onChange={handleRadioChange} className="text-amber-600 focus:ring-amber-500 disabled:opacity-60" /> <span className="text-slate-700 dark:text-slate-300">Sim</span></label>
                                <label className="flex items-center gap-2 cursor-pointer"><input type="radio" disabled={isReadOnly} name="uso_continuo" value="nao" checked={dados.uso_continuo === 'nao'} onChange={handleRadioChange} className="text-amber-600 focus:ring-amber-500 disabled:opacity-60" /> <span className="text-slate-700 dark:text-slate-300">Não</span></label>
                            </div>
                        </div>
                        {dados.uso_continuo === 'sim' && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Quais medicamentos e frequência?</label>
                                <textarea disabled={isReadOnly} name="quais_medicamentos" value={dados.quais_medicamentos} onChange={handleTextChange} rows={3} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 disabled:opacity-60 disabled:bg-slate-100" placeholder="Ex: Losartana 50mg / 12x12h" />
                            </div>
                        )}
                    </div>
                </section>

                <section className="bg-white dark:bg-slate-800/80 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <SectionHeader icon={ShieldAlert} title="4. Alergias" colorClass="bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400" />
                    <p className="text-sm text-slate-500 mb-3 font-medium">Você possui alergia a:</p>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        {[
                            ['alergia_anestesicos', 'Anestésicos'],
                            ['alergia_penicilina', 'Penicilina'],
                            ['alergia_antiinflamatorios', 'Anti-inflamatórios'],
                            ['alergia_latex', 'Látex'],
                            ['alergia_alimentos', 'Alimentos']
                        ].map(([key, label]) => (
                            <label key={key} className={`flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer ${isReadOnly ? 'opacity-70 pointer-events-none' : ''}`}>
                                <input type="checkbox" name={key} disabled={isReadOnly} checked={dados[key]} onChange={handleCheckboxChange} className="w-4 h-4 text-orange-600 rounded border-slate-300 focus:ring-orange-500" />
                                <span className="text-sm text-slate-700 dark:text-slate-300">{label}</span>
                            </label>
                        ))}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Outros/Quais?</label>
                        <input type="text" name="alergia_outros" disabled={isReadOnly} value={dados.alergia_outros} onChange={handleTextChange} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 disabled:opacity-60 disabled:bg-slate-100" />
                    </div>
                </section>
            </div>

            {/* 5. Histórico Hospitalar & 6. Hábitos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <section className="bg-white dark:bg-slate-800/80 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">5. Histórico Hospitalar</h3>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Já realizou cirurgia?</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer"><input type="radio" disabled={isReadOnly} name="fez_cirurgia" value="sim" checked={dados.fez_cirurgia === 'sim'} onChange={handleRadioChange} className="text-indigo-600 focus:ring-indigo-500 disabled:opacity-60" /> <span className="text-slate-700 dark:text-slate-300 text-sm">Sim</span></label>
                                    <label className="flex items-center gap-2 cursor-pointer"><input type="radio" disabled={isReadOnly} name="fez_cirurgia" value="nao" checked={dados.fez_cirurgia === 'nao'} onChange={handleRadioChange} className="text-indigo-600 focus:ring-indigo-500 disabled:opacity-60" /> <span className="text-slate-700 dark:text-slate-300 text-sm">Não</span></label>
                                </div>
                            </div>
                            
                            {dados.fez_cirurgia === 'sim' && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Ano</label>
                                    <input type="text" disabled={isReadOnly} name="ano_cirurgia" value={dados.ano_cirurgia} onChange={handleTextChange} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 disabled:opacity-60 disabled:bg-slate-100" />
                                </div>
                            )}
                        </div>
                        {dados.fez_cirurgia === 'sim' && (
                             <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Qual cirurgia?</label>
                                <input type="text" disabled={isReadOnly} name="qual_cirurgia" value={dados.qual_cirurgia} onChange={handleTextChange} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 disabled:opacity-60 disabled:bg-slate-100" />
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Já foi hospitalizado?</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2"><input type="radio" disabled={isReadOnly} name="ja_hospitalizado" value="sim" checked={dados.ja_hospitalizado === 'sim'} onChange={handleRadioChange} className="text-indigo-600 disabled:opacity-60" /> <span className="text-sm">Sim</span></label>
                                    <label className="flex items-center gap-2"><input type="radio" disabled={isReadOnly} name="ja_hospitalizado" value="nao" checked={dados.ja_hospitalizado === 'nao'} onChange={handleRadioChange} className="text-indigo-600 disabled:opacity-60" /> <span className="text-sm">Não</span></label>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Transfusão sanguínea?</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2"><input type="radio" disabled={isReadOnly} name="transfusao_sangue" value="sim" checked={dados.transfusao_sangue === 'sim'} onChange={handleRadioChange} className="text-indigo-600 disabled:opacity-60" /> <span className="text-sm">Sim</span></label>
                                    <label className="flex items-center gap-2"><input type="radio" disabled={isReadOnly} name="transfusao_sangue" value="nao" checked={dados.transfusao_sangue === 'nao'} onChange={handleRadioChange} className="text-indigo-600 disabled:opacity-60" /> <span className="text-sm">Não</span></label>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="bg-white dark:bg-slate-800/80 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">6. Hábitos do Paciente</h3>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        {[
                            ['fuma', 'Fuma habitualmente'],
                            ['ja_fumou', 'Já fumou no passado'],
                            ['bebe_alcool', 'Bebe álcool'],
                            ['usa_drogas', 'Usa drogas / recr.']
                        ].map(([key, label]) => (
                            <label key={key} className={`flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer ${isReadOnly ? 'opacity-70 pointer-events-none' : ''}`}>
                                <input type="checkbox" disabled={isReadOnly} name={key} checked={dados[key]} onChange={handleCheckboxChange} className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500" />
                                <span className="text-sm text-slate-700 dark:text-slate-300">{label}</span>
                            </label>
                        ))}
                    </div>
                    {dados.fuma && (
                        <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700">
                             <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Cigarros por dia</label>
                                <input type="text" disabled={isReadOnly} name="cigarros_dia" value={dados.cigarros_dia} onChange={handleTextChange} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 disabled:opacity-60 disabled:bg-slate-100" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Há quantos anos</label>
                                <input type="text" disabled={isReadOnly} name="anos_fuma" value={dados.anos_fuma} onChange={handleTextChange} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 disabled:opacity-60 disabled:bg-slate-100" />
                            </div>
                        </div>
                    )}
                </section>
            </div>

            {/* Múltiplas Seçõees Finais juntas para Otmização */}
            <section className="bg-white dark:bg-slate-800/80 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 lg:p-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                    
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">7. Hist. Odontológico</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-slate-700 dark:text-slate-300 mb-1">Última consulta (aprox.)</label>
                                <input type="text" disabled={isReadOnly} name="ultima_consulta" value={dados.ultima_consulta} onChange={handleTextChange} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm disabled:opacity-60 disabled:bg-slate-100" />
                            </div>
                            
                            {[
                                ['experiencia_negativa','Exp. negativa dentista?'],
                                ['tratamento_canal','Fez canal?'],
                                ['extracao_dentaria','Fez extrações?'],
                                ['usa_protese','Usa prótese?'],
                                ['usa_aparelho','Usa aparelho ortond.'],
                            ].map(([field, label]) => (
                                <div key={field} className="flex justify-between items-center py-1">
                                    <span className="text-sm text-slate-600 dark:text-slate-400">{label}</span>
                                    <div className="flex gap-2">
                                        <label className="text-xs flex items-center gap-1"><input type="radio" disabled={isReadOnly} name={field} value="sim" checked={dados[field]==='sim'} onChange={handleRadioChange} className="disabled:opacity-60"/> Sim</label>
                                        <label className="text-xs flex items-center gap-1"><input type="radio" disabled={isReadOnly} name={field} value="nao" checked={dados[field]==='nao'} onChange={handleRadioChange} className="disabled:opacity-60"/> Não</label>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">8. Sintomas Atuais</h3>
                        <div className="grid grid-cols-1 gap-2 mb-4">
                            {[
                                ['dor_mastigar', 'Dor ao mastigar'],
                                ['sensivel_frio', 'Sensibilidade ao frio'],
                                ['sensivel_quente', 'Sensibilidade ao quente'],
                                ['mau_halito', 'Mau hálito'],
                                ['gengiva_sangrando', 'Gengiva sangrando'],
                                ['gengiva_inchada', 'Gengiva inchada'],
                                ['dentes_moles', 'Dentes moles'],
                                ['estalos_mandibula', 'Estalos na mandíbula'],
                                ['dificuldade_abrir_boca', 'Dificul. abrir boca']
                            ].map(([key, label]) => (
                                <label key={key} className={`flex items-center gap-3 ${isReadOnly ? 'opacity-70 pointer-events-none' : ''}`}>
                                    <input type="checkbox" disabled={isReadOnly} name={key} checked={dados[key]} onChange={handleCheckboxChange} className="w-4 h-4 text-indigo-600 rounded border-slate-300" />
                                    <span className="text-sm text-slate-700 dark:text-slate-300">{label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div>
                            <h3 className="text-lg font-bold text-pink-600 dark:text-pink-400 mb-4 pb-2 border-b border-pink-100 dark:border-pink-900/40">9. Pacientes Mulheres</h3>
                            <div className="space-y-4">
                                {[
                                    ['gravida','Gestante?'],
                                    ['amamentando','Amamentando?'],
                                    ['anticoncepcional','Anticoncepcional?']
                                ].map(([field, label]) => (
                                    <div key={field} className="flex justify-between items-center py-1">
                                        <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">{label}</span>
                                        <div className="flex gap-2">
                                            <label className="text-xs flex items-center gap-1"><input type="radio" disabled={isReadOnly} name={field} value="sim" checked={dados[field]==='sim'} onChange={handleRadioChange} className="text-pink-500 disabled:opacity-60" /> Sim</label>
                                            <label className="text-xs flex items-center gap-1"><input type="radio" disabled={isReadOnly} name={field} value="nao" checked={dados[field]==='nao'} onChange={handleRadioChange} className="text-pink-500 disabled:opacity-60" /> Não</label>
                                        </div>
                                    </div>
                                ))}
                                {dados.gravida === 'sim' && (
                                    <input type="text" disabled={isReadOnly} name="meses_gravidez" placeholder="Meses de gravidez?" value={dados.meses_gravidez} onChange={handleTextChange} className="w-full bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800 rounded-lg px-3 py-1.5 text-sm outline-none disabled:opacity-60 disabled:bg-slate-100" />
                                )}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">10. Higiene Bucal</h3>
                            <div className="space-y-2">
                                <div>
                                    <label className="block text-xs text-slate-500">Escovações por dia</label>
                                    <input type="number" disabled={isReadOnly} name="escova_dia" value={dados.escova_dia} onChange={handleTextChange} className="w-full bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-700 rounded-lg px-2 py-1 text-sm outline-none disabled:opacity-60 disabled:bg-slate-100" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

             {/* 11. Observações */}
             <section className="bg-white dark:bg-slate-800/80 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 lg:p-8 mb-8">
                 <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">11. Observações Adicionais</h3>
                 <textarea 
                    name="observacoes" 
                    value={dados.observacoes} 
                    onChange={handleTextChange}
                    rows="4" 
                    disabled={isReadOnly}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium disabled:opacity-60 disabled:bg-slate-100"
                    placeholder="Relatar qualquer informação considerável adicional para o tratamento..."
                ></textarea>
            </section>

            {/* Actions Footer */}
            <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-lg sticky bottom-6 z-10">
                <div className="flex items-center gap-4">
                    {successMessage && (
                        <span className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-900/30 px-4 py-2 rounded-xl">
                            <CheckCircle2 size={20} />
                            {successMessage}
                        </span>
                    )}
                    {error && (
                        <span className="text-red-600 flex items-center gap-2 font-medium">
                            <AlertCircle size={18} /> {error}
                        </span>
                    )}
                </div>
                {!isReadOnly && (
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-all text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 disabled:opacity-70 disabled:scale-100"
                    >
                        {saving ? (
                            <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        ) : (
                            <Save size={20} />
                        )}
                        Salvar Nova Ficha de Anamnese
                    </button>
                )}
            </div>
            
        </div>
    );
};

export default AbaAnamnese;
