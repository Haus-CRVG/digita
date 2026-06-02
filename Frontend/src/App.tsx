import React, { useState, useEffect } from 'react';

// 1. Dicionário Completo de Planos e Valores
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

const DADOS_IBGE: Record<string, string[]> = {
    'PR': ['Cascavel', 'Curitiba', 'Foz do Iguaçu', 'Londrina', 'Maringá'],
    'SP': ['São Paulo', 'Campinas', 'Santos', 'São Bernardo do Campo'],
    'SC': ['Florianópolis', 'Blumenau', 'Joinville', 'Chapecó'],
    'RS': ['Porto Alegre', 'Caxias do Sul', 'Passo Fundo', 'Gramado']
};

// Estado inicial limpo para resetar o formulário
const ESTADO_INICIAL = {
    id: '',
    razaoSocial: '',
    cnpj: '',
    email: '',
    telefone: '', 
    cidade: '',
    uf: '',
    dataImplantacao: '',
    responsavel: '',
    plano: '',
    recorrencia: 'Mensal',
    faturado: 'Não',
    formaAdesao: 'Boleto bancário',
    formaRecorrencia: 'Boleto bancário',
    vencimentoAdesao: '2026-06-08',
    vencimentoRecorrencia: '2026-06-08',
    parcelasAdesao: 1,
    parcelasRecorrencia: 1,
    referenciaMensal: 0,
    valorAdesao: 0, 
    valorRecorrencia: 0, 
    comissaoAdesao: 100,
    comissaoRecorrencia: 15,
    impostoAdesao: 29.90,
    status: 'Rascunho' // 'Rascunho' ou 'Concluído'
};

export default function App() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState(ESTADO_INICIAL);
    
    // Lista simulando o Banco de Dados de contratos salvos
    const [listaContratos, setListaContratos] = useState<any[]>([]);
    const [termoPesquisa, setTermoPesquisa] = useState('');

    // Atualização dinâmica inteligente de valores
    useEffect(() => {
        if (formData.plano && TABELA_PRECOS[formData.plano]) {
            const dadosPlano = TABELA_PRECOS[formData.plano];
            const refMensal = dadosPlano.RefMensal;
            const tipoRecorrencia = formData.recorrencia as 'Mensal' | 'Trimestral' | 'Semestral' | 'Anual';
            const valorCalculadoPeriodo = dadosPlano[tipoRecorrencia] || refMensal;
            const calculoAdesao = dadosPlano.Anual * 0.4;

            setFormData(prev => ({
                ...prev,
                referenciaMensal: refMensal,
                valorRecorrencia: valorCalculadoPeriodo,
                valorAdesao: Number(calculoAdesao.toFixed(2))
            }));
        }
    }, [formData.plano, formData.recorrencia]);

    const limparCidadesAoMudarUF = (estadoSelecionado: string) => {
        setFormData({ ...formData, uf: estadoSelecionado, cidade: '' });
    };

    // 1. AÇÃO DE CANCELAR / SAIR
    const handleCancelarSair = () => {
        const confirmar = window.confirm("Atenção: Ao sair, todas as alterações não salvas deste formulário serão perdidas. Deseja continuar?");
        if (confirmar) {
            setIsModalOpen(false);
            setFormData(ESTADO_INICIAL);
            setCurrentStep(1);
        }
    };

    // 2. AÇÃO DE SALVAR RASCUNHO (Permite pesquisar e editar depois)
    const handleSalvarRascunho = () => {
        let contratoSalvo = { ...formData };
        
        // Se for um novo contrato, gera um ID único, senão mantém o existente para atualizar
        if (!contratoSalvo.id) {
            contratoSalvo.id = Math.random().toString(36).substr(2, 9);
            contratoSalvo.status = 'Rascunho';
            setListaContratos([...listaContratos, contratoSalvo]);
        } else {
            setListaContratos(listaContratos.map(c => c.id === contratoSalvo.id ? contratoSalvo : c));
        }

        alert(`Rascunho de ${contratoSalvo.razaoSocial} salvo com sucesso! Você pode editá-lo na listagem.`);
        setIsModalOpen(false);
        setFormData(ESTADO_INICIAL);
        setCurrentStep(1);
    };

    // 3. AÇÃO DE CONCLUIR CONTRATO
    const finalizarVendaCompleta = () => {
        let contratoConcluido = { ...formData, status: 'Concluído' };
        
        if (!contratoConcluido.id) {
            contratoConcluido.id = Math.random().toString(36).substr(2, 9);
            setListaContratos([...listaContratos, contratoConcluido]);
        } else {
            setListaContratos(listaContratos.map(c => c.id === contratoConcluido.id ? contratoConcluido : c));
        }

        alert(`Contrato de ${contratoConcluido.razaoSocial} CONCLUÍDO e finalizado com sucesso!`);
        setIsModalOpen(false);
        setFormData(ESTADO_INICIAL);
        setCurrentStep(1);
    };

    // 4. FUNÇÃO PARA ABRIR CONTRATO PARA EDIÇÃO
    const handleEditarContrato = (contrato: any) => {
        setFormData(contrato);
        setCurrentStep(1);
        setIsModalOpen(true);
    };

    // 5. EMISSÃO DO ORÇAMENTO EM PDF (Layout exato do anexo)
    const handleGerarPDF = () => {
        // Monta uma estrutura HTML limpa em uma nova aba configurada para impressão nativa do navegador (Salvar como PDF)
        const totalProposta = formData.valorRecorrencia + formData.valorAdesao;
        const dataHoje = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });

        const janelaImpressao = window.open('', '_blank');
        if (janelaImpressao) {
            janelaImpressao.document.write(`
                <html>
                <head>
                    <title>Orçamento Comercial Nº ${Math.floor(Math.random() * 200) + 100}</title>
                    <style>
                        body { font-family: sans-serif; color: #333; margin: 40px; line-height: 1.4; font-size: 13px; }
                        .header { font-weight: bold; font-size: 15px; margin-bottom: 20px; text-transform: uppercase; }
                        .section-title { font-weight: bold; background: #f1f5f9; padding: 5px; margin-top: 20px; border-bottom: 1px solid #cbd5e1; }
                        .grid-dados { margin-left: 10px; margin-top: 5px; margin-bottom: 15px; }
                        .label { font-weight: bold; color: #1e293b; margin-top: 5px; }
                        .value { margin-left: 15px; color: #475569; }
                        table { w-full; width: 100%; border-collapse: collapse; margin-top: 15px; }
                        th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
                        th { background: #f8fafc; font-weight: bold; }
                        .total-row { font-weight: bold; background: #f1f5f9; }
                        .footer-info { margin-top: 30px; font-size: 12px; }
                        @media print { .no-print { display: none; } }
                    </style>
                </head>
                <body>
                    <div class="no-print" style="margin-bottom: 20px; background: #e2e8f0; padding: 10px; text-align: center; border-radius: 5px;">
                        <button onclick="window.print()" style="padding: 8px 16px; background: #2563eb; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">Salvar / Imprimir PDF</button>
                    </div>
                    
                    <div class="header">ORÇAMENTO OU PROPOSTA COMERCIAL</div>
                    <div>Cascavel - PR, ${dataHoje}.</div>

                    <div class="section-title">Dados do cliente</div>
                    <div class="grid-dados">
                        <div class="label">Cliente:</div><div class="value">${formData.razaoSocial || '-------------------------'}</div>
                        <div class="label">CNPJ / CPF:</div><div class="value">${formData.cnpj || '-------------------------'}</div>
                        <div class="label">Endereço:</div><div class="value">${formData.cidade} - ${formData.uf || '-------------------------'}</div>
                        <div class="label">Telefone:</div><div class="value">${formData.telefone || '-------------------------'}</div>
                        <div class="label">E-mail:</div><div class="value">${formData.email || '-------------------------'}</div>
                    </div>

                    <div class="section-title">Dados do fornecedor</div>
                    <div class="grid-dados">
                        <div class="label">Nome da empresa:</div><div class="value">Próciber Tecnologia Ltda.</div>
                        <div class="label">CNPJ:</div><div class="value">45.656.922/0001-90</div>
                        <div class="label">Endereço:</div><div class="value">Rua Antonina 1174</div>
                        <div class="label">Telefone:</div><div class="value">(45) 3112-0017</div>
                        <div class="label">E-mail:</div><div class="value">comercial@prociber.com.br</div>
                    </div>

                    <div class="section-title">Descrição do(s) produto(s) e/ou serviço(s)</div>
                    <table>
                        <thead>
                            <tr>
                                <th style="width: 8%">Item</th>
                                <th>Descrição detalhada do Item</th>
                                <th style="width: 10%">Quant.</th>
                                <th>Valor Unitário</th>
                                <th>Valor Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>01</td>
                                <td>Plano ${formData.recorrencia} ${formData.plano}</td>
                                <td>01</td>
                                <td>R$ ${formData.valorRecorrencia.toFixed(2)}</td>
                                <td>R$ ${formData.valorRecorrencia.toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td>02</td>
                                <td>Implantação do sistema</td>
                                <td>01</td>
                                <td>R$ ${formData.valorAdesao.toFixed(2)}</td>
                                <td>R$ ${formData.valorAdesao.toFixed(2)}</td>
                            </tr>
                            <tr class="total-row">
                                <td colspan="4" style="text-align: right;">VALOR TOTAL DA PROPOSTA:</td>
                                <td>R$ ${totalProposta.toFixed(2)}</td>
                            </tr>
                        </tbody>
                    </table>

                    <div class="footer-info">
                        <p><strong>Prazo/Data de entrega:</strong> Imediato após assinatura do contrato</p>
                        <p><strong>Validade da proposta:</strong> 07 dias</p>
                        <p><strong>Forma de pagamento:</strong> ${formData.formaRecorrencia}</p>
                    </div>
                </body>
                </html>
            `);
            janelaImpressao.document.close();
        }
    };

    // Filtro dinâmico de pesquisa de clientes salvos
    const contratosFiltrados = listaContratos.filter(c => 
        c.razaoSocial.toLowerCase().includes(termoPesquisa.toLowerCase()) || 
        c.cnpj.includes(termoPesquisa)
    );

    return (
        <div className="flex h-screen bg-slate-50 text-slate-800 font-sans">
            {/* MENU LATERAL */}
            <aside className="w-64 bg-white border-r border-slate-200 p-4 space-y-6">
                <div className="text-xl font-bold border-b border-slate-100 pb-4 text-slate-900">Prociber Painel</div>
                <nav className="space-y-2">
                    <button className="w-full text-left p-2 hover:bg-slate-100 rounded text-sm font-medium">Dashboard</button>
                    <button className="w-full text-left p-2 bg-blue-50 text-blue-600 rounded text-sm font-semibold">Clientes e Vendas</button>
                </nav>
            </aside>

            {/* CONTEÚDO PRINCIPAL (COM BUSCA E TABELA DE CONTRATOS) */}
            <main className="flex-1 p-8 overflow-y-auto">
                <header className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-slate-900">Gestão de Contratos</h1>
                    <button
                        onClick={() => { setFormData(ESTADO_INICIAL); setCurrentStep(1); setIsModalOpen(true); }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm"
                    >
                        + Novo Contrato
                    </button>
                </header>

                {/* BARRA DE PESQUISA DE NEGOCIAÇÕES */}
                <div className="mb-6">
                    <input 
                        type="text" 
                        placeholder="Pesquisar cliente por nome ou CNPJ para editar valores..."
                        className="w-full max-w-md bg-white border border-slate-300 rounded-lg p-2 text-sm"
                        value={termoPesquisa}
                        onChange={e => setTermoPesquisa(e.target.value)}
                    />
                </div>

                {/* LISTAGEM DE CONTRATOS ATIVOS / RASCUNHOS */}
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs uppercase">
                            <tr>
                                <th className="p-4">Cliente</th>
                                <th className="p-4">Plano</th>
                                <th className="p-4">Valor Total</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {contratosFiltrados.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-400 text-sm">Nenhum contrato ou rascunho encontrado.</td>
                                </tr>
                            ) : (
                                contratosFiltrados.map((contrato) => (
                                    <tr key={contrato.id} className="hover:bg-slate-50/80">
                                        <td className="p-4 font-medium text-slate-900">{contrato.razaoSocial}</td>
                                        <td className="p-4">{contrato.plano} ({contrato.recorrencia})</td>
                                        <td className="p-4">R$ {(contrato.valorRecorrencia + contrato.valorAdesao).toFixed(2)}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs font-semibold ${contrato.status === 'Concluído' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                {contrato.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center space-x-2">
                                            <button onClick={() => handleEditarContrato(contrato)} className="text-blue-600 hover:text-blue-800 font-medium text-xs">Editar Valores</button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* MODAL PRINCIPAL */}
                {isModalOpen && (
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="bg-white border border-slate-200 rounded-xl max-w-3xl w-full p-6 space-y-6 max-h-[95vh] overflow-y-auto shadow-xl">

                            {/* Indicador de Etapas */}
                            <div className="flex justify-between border-b border-slate-100 pb-4 text-xs font-semibold tracking-wide">
                                <span className={currentStep === 1 ? "text-blue-600 border-b-2 border-blue-600 pb-4 -mb-[18px]" : "text-slate-400"}>1. CLIENTE</span>
                                <span className={currentStep === 2 ? "text-blue-600 border-b-2 border-blue-600 pb-4 -mb-[18px]" : "text-slate-400"}>2. PRODUTO</span>
                                <span className={currentStep === 3 ? "text-blue-600 border-b-2 border-blue-600 pb-4 -mb-[18px]" : "text-slate-400"}>3. FINANCEIRO & COMISSÕES</span>
                            </div>

                            {/* ETAPA 1: CLIENTE */}
                            {currentStep === 1 && (
                                <div className="space-y-4 pt-2">
                                    <h3 className="text-base font-bold text-slate-900">Dados Básicos do Cliente</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-600 mb-1">Razão Social / Nome *</label>
                                            <input type="text" className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-sm text-slate-800" value={formData.razaoSocial} onChange={e => setFormData({ ...formData, razaoSocial: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-600 mb-1">CNPJ / CPF *</label>
                                            <input type="text" className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-sm text-slate-800" value={formData.cnpj} onChange={e => setFormData({ ...formData, cnpj: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-600 mb-1">E-mail *</label>
                                            <input type="email" className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-sm text-slate-800" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-600 mb-1">Telefone / Celular *</label>
                                            <input type="text" placeholder="(00) 00000-0000" className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-sm text-slate-800" value={formData.telefone} onChange={e => setFormData({ ...formData, telefone: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-600 mb-1">Estado (UF) *</label>
                                            <select className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-sm text-slate-800" value={formData.uf} onChange={e => limparCidadesAoMudarUF(e.target.value)}>
                                                <option value="">Selecione a UF...</option>
                                                {Object.keys(DADOS_IBGE).map(uf => <option key={uf} value={uf}>{uf}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-600 mb-1">Cidade *</label>
                                            <select className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-sm text-slate-800" value={formData.cidade} disabled={!formData.uf} onChange={e => setFormData({ ...formData, cidade: e.target.value })}>
                                                <option value="">Selecione a cidade...</option>
                                                {formData.uf && DADOS_IBGE[formData.uf].map(cidade => <option key={cidade} value={cidade}>{cidade}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="flex justify-between pt-4 border-t border-slate-100">
                                        <button onClick={handleCancelarSair} className="text-red-500 hover:text-red-700 text-sm font-medium">Cancelar</button>
                                        <button onClick={() => setCurrentStep(2)} disabled={!formData.razaoSocial || !formData.cnpj || !formData.cidade} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium px-6 py-2 rounded text-sm shadow-sm">Avançar para Venda →</button>
                                    </div>
                                </div>
                            )}

                            {/* ETAPA 2: PRODUTO */}
                            {currentStep === 2 && (
                                <div className="space-y-6 pt-2">
                                    <div>
                                        <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-1 mb-3">IMPLANTAÇÃO</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-600 mb-1">Previsão de implantação *</label>
                                                <input type="date" className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-sm text-slate-800" value={formData.dataImplantacao} onChange={(e) => setFormData({ ...formData, dataImplantacao: e.target.value })} />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-600 mb-1">Responsável pela implantação *</label>
                                                <input type="text" className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-sm text-slate-800" value={formData.responsavel} onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })} />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-1 mb-3">PRODUTO: BACKUP DADOS</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-600 mb-1">Plano *</label>
                                                <select className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-sm text-slate-800" value={formData.plano} onChange={e => setFormData({ ...formData, plano: e.target.value })}>
                                                    <option value="">Selecione um plano...</option>
                                                    {Object.keys(TABELA_PRECOS).map(p => <option key={p} value={p}>{p}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-600 mb-1">Recorrência *</label>
                                                <select className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-sm text-slate-800" value={formData.recorrencia} onChange={e => setFormData({ ...formData, recorrencia: e.target.value })}>
                                                    <option value="Mensal">Mensal</option>
                                                    <option value="Trimestral">Trimestral</option>
                                                    <option value="Semestral">Semestral</option>
                                                    <option value="Anual">Anual</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-between pt-4 border-t border-slate-100">
                                        <button onClick={handleCancelarSair} className="text-red-500 hover:text-red-700 text-sm font-medium">Cancelar</button>
                                        <div className="space-x-2">
                                            <button onClick={() => setCurrentStep(1)} className="text-slate-500 hover:text-slate-800 text-sm font-medium px-4">Voltar</button>
                                            <button onClick={() => setCurrentStep(3)} disabled={!formData.dataImplantacao || !formData.plano} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium px-6 py-2 rounded text-sm shadow-sm">Próximo</button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ETAPA 3: FINANCEIRO & COMISSÕES */}
                            {currentStep === 3 && (
                                <div className="space-y-6 pt-2">
                                    <div className="bg-blue-50/70 border border-blue-100 p-3 rounded-lg text-xs text-blue-800 flex justify-between items-center">
                                        <div><strong>Plano Ativo:</strong> {formData.plano} ({formData.recorrencia})</div>
                                        <div><strong>Ref. Mensal Base:</strong> R$ {formData.referenciaMensal.toFixed(2)}</div>
                                    </div>

                                    {/* CONFIGURAÇÃO DE PAGAMENTO */}
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
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-600 mb-1">Referência Mensal (R$)</label>
                                                <input type="number" className="w-full bg-slate-100 border border-slate-300 rounded p-2 text-sm font-medium" value={formData.referenciaMensal} readOnly/>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-700 mb-1">Valor de Adesão / Implantação (R$) *</label>
                                                <input type="number" step="0.01" className="w-full bg-white border border-blue-400 rounded p-2 text-sm text-slate-900 font-bold" value={formData.valorAdesao} onChange={e => setFormData({...formData, valorAdesao: Number(e.target.value)})}/>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-700 mb-1">Valor de Recorrência (R$) *</label>
                                                <input type="number" step="0.01" className="w-full bg-white border border-blue-400 rounded p-2 text-sm text-slate-900 font-bold" value={formData.valorRecorrencia} onChange={e => setFormData({...formData, valorRecorrencia: Number(e.target.value)})}/>
                                            </div>
                                        </div>
                                    </div>

                                    {/* CONTROLES E NOVOS BOTÕES */}
                                    <div className="flex justify-between pt-4 border-t border-slate-100 items-center">
                                        <button onClick={handleCancelarSair} className="text-red-500 hover:text-red-700 text-sm font-medium">
                                            Cancelar
                                        </button>
                                        
                                        <div className="flex space-x-2">
                                            <button onClick={() => setCurrentStep(2)} className="text-slate-500 hover:text-slate-800 text-sm font-medium px-3">
                                                Voltar
                                            </button>
                                            
                                            {/* NOVO: BOTÃO EMITIR PDF */}
                                            <button onClick={handleGerarPDF} className="bg-amber-500 hover:bg-amber-600 text-white font-medium px-4 py-2 rounded text-sm shadow-sm">
                                                Emitir PDF 📄
                                            </button>
                                            
                                            {/* NOVO: BOTÃO SALVAR RASCUNHO */}
                                            <button onClick={handleSalvarRascunho} className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded text-sm shadow-sm">
                                                Salvar Rascunho 💾
                                            </button>
                                            
                                            {/* ALTERADO: NOMENCLATURA CONCLUIR */}
                                            <button onClick={finalizarVendaCompleta} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2 rounded text-sm shadow-sm">
                                                Concluir ✓
                                            </button>
                                        </div>
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