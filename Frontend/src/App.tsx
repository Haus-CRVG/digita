import React, { useState, useEffect } from 'react';

// 1. Dicionário Completo de Planos e Valores conforme imagens image_d4a842.png e image_d4a87d.png
const TABELA_PRECOS: Record<string, { RefMensal: number; Mensal: number; Trimestral: number; Semestral: number; Anual: number }> = {
    '3GB':   { RefMensal: 69,   Mensal: 69,   Trimestral: 207,   Semestral: 393.30,   Anual: 745.20 },
    '5GB':   { RefMensal: 89,   Mensal: 89,   Trimestral: 267,   Semestral: 507.30,   Anual: 961.20 },
    '6GB':   { RefMensal: 99,   Mensal: 99,   Trimestral: 297,   Semestral: 564.30,   Anual: 1069.20 },
    '7GB':   { RefMensal: 109,  Mensal: 109,  Trimestral: 327,   Semestral: 621.30,   Anual: 1177.20 },
    '8GB':   { RefMensal: 129,  Mensal: 129,  Trimestral: 387,   Semestral: 735.30,   Anual: 1393.20 },
    '9GB':   { RefMensal: 139,  Mensal: 139,  Trimestral: 417,   Semestral: 792.30,   Anual: 1501.20 },
    '10GB':  { RefMensal: 149,  Mensal: 149,  Trimestral: 447,   Semestral: 849.30,   Anual: 1609.20 },
    '20GB':  { RefMensal: 159,  Mensal: 159,  Trimestral: 477,   Semestral: 906.30,   Anual: 1717.20 },
    '30GB':  { RefMensal: 169,  Mensal: 169,  Trimestral: 507,   Semestral: 963.30,   Anual: 1825.20 },
    '40GB':  { RefMensal: 179,  Mensal: 179,  Trimestral: 537,   Semestral: 1020.30,  Anual: 1933.20 },
    '50GB':  { RefMensal: 189,  Mensal: 189,  Trimestral: 567,   Semestral: 1077.30,  Anual: 2041.20 },
    '100GB': { RefMensal: 249,  Mensal: 249,  Trimestral: 747,   Semestral: 1419.30,  Anual: 2689.20 },
    '150GB': { RefMensal: 299,  Mensal: 299,  Trimestral: 897,   Semestral: 1704.30,  Anual: 3229.20 },
    '200GB': { RefMensal: 379,  Mensal: 379,  Trimestral: 1137,  Semestral: 2160.30,  Anual: 4093.20 },
    '250GB': { RefMensal: 399,  Mensal: 399,  Trimestral: 1197,  Semestral: 2274.30,  Anual: 4309.20 },
    '300GB': { RefMensal: 449,  Mensal: 449,  Trimestral: 1347,  Semestral: 2559.30,  Anual: 4849.20 },
    '350GB': { RefMensal: 479,  Mensal: 479,  Trimestral: 1437,  Semestral: 2730.30,  Anual: 5173.20 },
    '400GB': { RefMensal: 499,  Mensal: 499,  Trimestral: 1497,  Semestral: 2844.30,  Anual: 5389.20 },
    '450GB': { RefMensal: 549,  Mensal: 549,  Trimestral: 1647,  Semestral: 3129.30,  Anual: 5929.20 },
    '500GB': { RefMensal: 599,  Mensal: 599,  Trimestral: 1797,  Semestral: 3414.30,  Anual: 6469.20 },
    '550GB': { RefMensal: 649,  Mensal: 649,  Trimestral: 1947,  Semestral: 3699.30,  Anual: 7009.20 },
    '600GB': { RefMensal: 699,  Mensal: 699,  Trimestral: 2097,  Semestral: 3984.30,  Anual: 7549.20 },
    '650GB': { RefMensal: 749,  Mensal: 749,  Trimestral: 2247,  Semestral: 4269.30,  Anual: 8089.20 },
    '700GB': { RefMensal: 799,  Mensal: 799,  Trimestral: 2397,  Semestral: 4554.30,  Anual: 8629.20 },
    '750GB': { RefMensal: 849,  Mensal: 849,  Trimestral: 2547,  Semestral: 4839.30,  Anual: 9169.20 },
    '800GB': { RefMensal: 899,  Mensal: 899,  Trimestral: 2697,  Semestral: 5124.30,  Anual: 9709.20 },
    '850GB': { RefMensal: 949,  Mensal: 949,  Trimestral: 2847,  Semestral: 5409.30,  Anual: 10249.20 },
    '900GB': { RefMensal: 999,  Mensal: 999,  Trimestral: 2997,  Semestral: 5694.30,  Anual: 10789.20 },
    '950GB': { RefMensal: 1049, Mensal: 1049, Trimestral: 3147,  Semestral: 5979.30,  Anual: 11329.20 },
    '1000GB':{ RefMensal: 1099, Mensal: 1099, Trimestral: 3297,  Semestral: 6264.30,  Anual: 11869.20 }
};

// Mock simples de Estados/Cidades (IBGE)
const DADOS_IBGE: Record<string, string[]> = {
    'PR': ['Cascavel', 'Curitiba', 'Foz do Iguaçu', 'Londrina', 'Maringá'],
    'SP': ['São Paulo', 'Campinas', 'Santos', 'São Bernardo do Campo'],
    'SC': ['Florianópolis', 'Blumenau', 'Joinville', 'Chapecó'],
    'RS': ['Porto Alegre', 'Caxias do Sul', 'Passo Fundo', 'Gramado']
};

export default function App() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);

    const [formData, setFormData] = useState({
        // Etapa 1: Cliente
        razaoSocial: '',
        cnpj: '',
        email: '',
        telefone: '', // Novo campo adicionado!
        cidade: '',
        uf: '',

        // Etapa 2: Implantação e Produto
        dataImplantacao: '',
        responsavel: '',
        plano: '',
        recorrencia: 'Mensal',

        // Etapa 3: Financeiro & Comissões integrados e editáveis
        faturado: 'Não',
        formaAdesao: 'Boleto bancário',
        formaRecorrencia: 'Boleto bancário',
        vencimentoAdesao: '2026-06-08',
        vencimentoRecorrencia: '2026-06-08',
        parcelasAdesao: 1,
        parcelasRecorrencia: 1,
        referenciaMensal: 0,
        valorAdesao: 199.00, // Custo inicial padrão
        valorRecorrencia: 0, 

        // Regras de Comissões movidas para a mesma tela financeira
        comissaoAdesao: 100,
        comissaoRecorrencia: 15,
        impostoAdesao: 29.90
    });

    // Atualização dinâmica inteligente de valores com base no Plano + Recorrência real
    useEffect(() => {
        if (formData.plano && TABELA_PRECOS[formData.plano]) {
            const dadosPlano = TABELA_PRECOS[formData.plano];
            const refMensal = dadosPlano.RefMensal;
            
            // Pega o valor real de acordo com a chave da recorrência (Mensal, Trimestral, Semestral, Anual)
            const tipoRecorrencia = formData.recorrencia as 'Mensal' | 'Trimestral' | 'Semestral' | 'Anual';
            const valorCalculadoPeriodo = dadosPlano[tipoRecorrencia] || refMensal;

            setFormData(prev => ({
                ...prev,
                referenciaMensal: refMensal,
                valorRecorrencia: valorCalculadoPeriodo
            }));
        }
    }, [formData.plano, formData.recorrencia]);

    const limparCidadesAoMudarUF = (estadoSelecionado: string) => {
        setFormData({ ...formData, uf: estadoSelecionado, cidade: '' });
    };

    return (
        <div className="flex h-screen bg-slate-50 text-slate-800 font-sans">
            {/* MENU LATERAL */}
            <aside className="w-64 bg-white border-r border-slate-200 p-4 space-y-6">
                <div className="text-xl font-bold border-b border-slate-100 pb-4 text-slate-900">Prociber Painel</div>
                <nav className="space-y-2">
                    <button className="w-full text-left p-2 hover:bg-slate-100 rounded text-sm font-medium">Dashboard</button>
                    <button className="w-full text-left p-2 bg-blue-50 text-blue-600 rounded text-sm font-semibold">Clientes</button>
                </nav>
            </aside>

            {/* CONTEÚDO PRINCIPAL */}
            <main className="flex-1 p-8 overflow-y-auto">
                <header className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-slate-900">Gestão de Contratos</h1>
                    <button
                        onClick={() => { setCurrentStep(1); setIsModalOpen(true); }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm"
                    >
                        + Novo Contrato
                    </button>
                </header>

                {/* MODAL PRINCIPAL */}
                {isModalOpen && (
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="bg-white border border-slate-200 rounded-xl max-w-3xl w-full p-6 space-y-6 max-h-[95vh] overflow-y-auto shadow-xl">

                            {/* Indicador de Etapas Reduzido para 3 Etapas */}
                            <div className="flex justify-between border-b border-slate-100 pb-4 text-xs font-semibold tracking-wide">
                                <span className={currentStep === 1 ? "text-blue-600 border-b-2 border-blue-600 pb-4 -mb-[18px]" : "text-slate-400"}>1. CLIENTE</span>
                                <span className={currentStep === 2 ? "text-blue-600 border-b-2 border-blue-600 pb-4 -mb-[18px]" : "text-slate-400"}>2. PRODUTO</span>
                                <span className={currentStep === 3 ? "text-blue-600 border-b-2 border-blue-600 pb-4 -mb-[18px]" : "text-slate-400"}>3. FINANCEIRO & COMISSÕES</span>
                            </div>

                            {/* ETAPA 1: CLIENTE (COM TELEFONE E COMPORTAMENTO IBGE) */}
                            {currentStep === 1 && (
                                <div className="space-y-4 pt-2">
                                    <h3 className="text-base font-bold text-slate-900">Dados Básicos do Cliente</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-600 mb-1">Razão Social / Nome *</label>
                                            <input
                                                type="text"
                                                className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-sm text-slate-800"
                                                value={formData.razaoSocial}
                                                onChange={e => setFormData({ ...formData, razaoSocial: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-600 mb-1">CNPJ / CPF *</label>
                                            <input
                                                type="text"
                                                className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-sm text-slate-800"
                                                value={formData.cnpj}
                                                onChange={e => setFormData({ ...formData, cnpj: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-600 mb-1">E-mail *</label>
                                            <input
                                                type="email"
                                                className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-sm text-slate-800"
                                                value={formData.email}
                                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-600 mb-1">Telefone / Celular *</label>
                                            <input
                                                type="text"
                                                placeholder="(00) 00000-0000"
                                                className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-sm text-slate-800"
                                                value={formData.telefone}
                                                onChange={e => setFormData({ ...formData, telefone: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-600 mb-1">Estado (UF) *</label>
                                            <select
                                                className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-sm text-slate-800"
                                                value={formData.uf}
                                                onChange={e => limparCidadesAoMudarUF(e.target.value)}
                                            >
                                                <option value="">Selecione a UF...</option>
                                                {Object.keys(DADOS_IBGE).map(uf => <option key={uf} value={uf}>{uf}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-600 mb-1">Cidade *</label>
                                            <select
                                                className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-sm text-slate-800"
                                                value={formData.cidade}
                                                disabled={!formData.uf}
                                                onChange={e => setFormData({ ...formData, cidade: e.target.value })}
                                            >
                                                <option value="">Selecione a cidade...</option>
                                                {formData.uf && DADOS_IBGE[formData.uf].map(cidade => (
                                                    <option key={cidade} value={cidade}>{cidade}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="flex justify-end pt-4 border-t border-slate-100">
                                        <button
                                            onClick={() => setCurrentStep(2)}
                                            disabled={!formData.razaoSocial || !formData.cnpj || !formData.cidade}
                                            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium px-6 py-2 rounded text-sm shadow-sm"
                                        >
                                            Avançar para Venda →
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* ETAPA 2: PRODUTO (LISTANDO TODOS OS 30 PLANOS DA ARVORE) */}
                            {currentStep === 2 && (
                                <div className="space-y-6 pt-2">
                                    <div>
                                        <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-1 mb-3">IMPLANTAÇÃO</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-600 mb-1">Previsão de implantação *</label>
                                                <input
                                                    type="date"
                                                    className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-sm text-slate-800"
                                                    value={formData.dataImplantacao}
                                                    onChange={(e) => setFormData({ ...formData, dataImplantacao: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-600 mb-1">Responsável pela implantação *</label>
                                                <input
                                                    type="text"
                                                    className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-sm text-slate-800"
                                                    value={formData.responsavel}
                                                    onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-1 mb-3">PRODUTO: BACKUP DADOS</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-600 mb-1">Plano (Todos os tamanhos disponíveis) *</label>
                                                <select
                                                    className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-sm text-slate-800"
                                                    value={formData.plano}
                                                    onChange={e => setFormData({ ...formData, plano: e.target.value })}
                                                >
                                                    <option value="">Selecione um plano...</option>
                                                    {Object.keys(TABELA_PRECOS).map(p => <option key={p} value={p}>{p}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-600 mb-1">Recorrência *</label>
                                                <select
                                                    className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-sm text-slate-800"
                                                    value={formData.recorrencia}
                                                    onChange={e => setFormData({ ...formData, recorrencia: e.target.value })}
                                                >
                                                    <option value="Mensal">Mensal</option>
                                                    <option value="Trimestral">Trimestral</option>
                                                    <option value="Semestral">Semestral</option>
                                                    <option value="Anual">Anual</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-between pt-4 border-t border-slate-100">
                                        <button onClick={() => setCurrentStep(1)} className="text-slate-500 hover:text-slate-800 text-sm font-medium">
                                            ← Voltar
                                        </button>
                                        <button
                                            onClick={() => setCurrentStep(3)}
                                            disabled={!formData.dataImplantacao || !formData.plano}
                                            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium px-6 py-2 rounded text-sm shadow-sm"
                                        >
                                            Próximo
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* ETAPA 3: FINANCEIRO & COMISSÕES INTEGRADOS EM CARD BOXES TOTALMENTE EDITÁVEIS */}
                            {currentStep === 3 && (
                                <div className="space-y-6 pt-2">
                                    
                                    {/* Bloco de Informações Gerais */}
                                    <div className="bg-blue-50/70 border border-blue-100 p-3 rounded-lg text-xs text-blue-800 flex justify-between items-center">
                                        <div><strong>Plano Ativo:</strong> {formData.plano} ({formData.recorrencia})</div>
                                        <div><strong>Ref. Mensal Base:</strong> R$ {formData.referenciaMensal.toFixed(2)}</div>
                                    </div>

                                    {/* BOXES EDITÁVEIS DE CONFIGURAÇÃO DE PAGAMENTO */}
                                    <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
                                        <h4 className="text-sm font-bold text-slate-900 tracking-wide uppercase border-b pb-2 text-blue-600">Configurações de Faturamento</h4>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-600 mb-1">Faturado *</label>
                                                <select className="w-full bg-white border border-slate-300 rounded p-2 text-sm" value={formData.faturado} onChange={e => setFormData({...formData, faturado: e.target.value})}>
                                                    <option value="Sim">Sim</option>
                                                    <option value="Não">Não</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-600 mb-1">Forma de Pagamento - Adesão *</label>
                                                <input type="text" className="w-full bg-white border border-slate-300 rounded p-2 text-sm" value={formData.formaAdesao} onChange={e => setFormData({...formData, formaAdesao: e.target.value})}/>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-600 mb-1">Primeiro Vencimento da Adesão</label>
                                                <input type="date" className="w-full bg-white border border-slate-300 rounded p-2 text-sm" value={formData.vencimentoAdesao} onChange={e => setFormData({...formData, vencimentoAdesao: e.target.value})}/>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-600 mb-1">Forma de Pagamento - Recorrência *</label>
                                                <input type="text" className="w-full bg-white border border-slate-300 rounded p-2 text-sm" value={formData.formaRecorrencia} onChange={e => setFormData({...formData, formaRecorrencia: e.target.value})}/>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-600 mb-1">Primeiro Vencimento da Recorrência</label>
                                                <input type="date" className="w-full bg-white border border-slate-300 rounded p-2 text-sm" value={formData.vencimentoRecorrencia} onChange={e => setFormData({...formData, vencimentoRecorrencia: e.target.value})}/>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-600 mb-1">Recorrência do Pagamento *</label>
                                                <input type="text" className="w-full bg-slate-100 border border-slate-300 rounded p-2 text-sm font-semibold" value={formData.recorrencia} readOnly />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-600 mb-1">Parcelas de Adesão</label>
                                                <input type="number" className="w-full bg-white border border-slate-300 rounded p-2 text-sm" value={formData.parcelasAdesao} onChange={e => setFormData({...formData, parcelasAdesao: Number(e.target.value)})}/>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-600 mb-1">Parcelas de Recorrência</label>
                                                <input type="number" className="w-full bg-white border border-slate-300 rounded p-2 text-sm" value={formData.parcelasRecorrencia} onChange={e => setFormData({...formData, parcelasRecorrencia: Number(e.target.value)})}/>
                                            </div>
                                        </div>

                                        {/* BOXES EDITÁVEIS DE VALORES (PRODUTOS DE ENTRADA DO BOX) */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-600 mb-1">Referência Mensal (R$)</label>
                                                <input type="number" className="w-full bg-slate-100 border border-slate-300 rounded p-2 text-sm text-slate-700 font-medium" value={formData.referenciaMensal} readOnly/>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-700 mb-1">Valor de Adesão (R$) *</label>
                                                <input type="number" step="0.01" className="w-full bg-white border border-blue-400 rounded p-2 text-sm text-slate-900 font-bold focus:ring-1 focus:ring-blue-500" value={formData.valorAdesao} onChange={e => setFormData({...formData, valorAdesao: Number(e.target.value)})}/>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-700 mb-1">Valor de Recorrência (R$) *</label>
                                                <input type="number" step="0.01" className="w-full bg-white border border-blue-400 rounded p-2 text-sm text-slate-900 font-bold focus:ring-1 focus:ring-blue-500" value={formData.valorRecorrencia} onChange={e => setFormData({...formData, valorRecorrencia: Number(e.target.value)})}/>
                                            </div>
                                        </div>
                                    </div>

                                    {/* UNIFICAÇÃO DA TELA DE COMISSÕES (INTEGRADA NO MESMO PASSO) */}
                                    <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
                                        <h4 className="text-sm font-bold text-slate-900 tracking-wide uppercase border-b pb-2 text-amber-600">Regras de Comissão e Imposto</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-600 mb-1">Revenda - Comissão de Adesão (%) *</label>
                                                <input type="number" className="w-full bg-white border border-slate-300 rounded p-2 text-sm" value={formData.comissaoAdesao} onChange={e => setFormData({...formData, comissaoAdesao: Number(e.target.value)})}/>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-600 mb-1">Revenda - Comissão de Recorrência (%) *</label>
                                                <input type="number" className="w-full bg-white border border-slate-300 rounded p-2 text-sm" value={formData.comissaoRecorrencia} onChange={e => setFormData({...formData, comissaoRecorrencia: Number(e.target.value)})}/>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-600 mb-1">Revenda - Imposto de Adesão (R$) *</label>
                                                <input type="number" step="0.01" className="w-full bg-white border border-slate-300 rounded p-2 text-sm" value={formData.impostoAdesao} onChange={e => setFormData({...formData, impostoAdesao: Number(e.target.value)})}/>
                                            </div>
                                        </div>
                                    </div>

                                    {/* BOTÕES DE CONTROLE FINAL */}
                                    <div className="flex justify-between pt-4 border-t border-slate-100">
                                        <button onClick={() => setCurrentStep(2)} className="text-slate-500 hover:text-slate-800 text-sm font-medium">
                                            ← Voltar
                                        </button>
                                        <button onClick={finalizarVendaCompleta} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2 rounded text-sm shadow-sm transition-colors">
                                            Salvar e Concluir Contrato ✓
                                        </button>
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}