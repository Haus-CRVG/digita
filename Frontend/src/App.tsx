import { useEffect, useState } from 'react';
import axios from 'axios';
import { Users, MapPin, Building2, Search, FileText, Settings, DollarSign, Plus } from 'lucide-react';

interface Customer {
  id: string;
  razao_social: string;
  cnpj_cpf: string;
  cidade: string;
  estado: string;
  user?: { nome: string };
}

function App() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    axios.get('http://localhost:3001/customers')
      .then(res => {
        setCustomers(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Erro ao carregar dados:", err);
        setLoading(false);
      });
  }, []);

  // Lógica de busca: executada toda vez que 'search' ou 'customers' muda
  const filteredCustomers = customers.filter(customer =>
    customer.razao_social.toLowerCase().includes(search.toLowerCase()) ||
    customer.cnpj_cpf.includes(search)
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8 font-sans text-[#1e293b]">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Estilo CRM */}
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#0f172a]">Gestão de Contratos</h1>
          </div>
          <button className="bg-[#2563eb] text-white px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 hover:bg-blue-700 transition-all shadow-sm text-sm">
            <Plus size={18} /> Novo Contrato
          </button>
        </header>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-600">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Ativos</p>
            <p className="text-3xl font-bold text-slate-800">{customers.length.toLocaleString()}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-amber-500">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Em Aceite</p>
            <p className="text-3xl font-bold text-slate-800">42</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-emerald-500">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Faturado Hoje</p>
            <p className="text-3xl font-bold text-slate-800">R$ 12.450</p>
          </div>
        </div>

        {/* Filtros e Tabela */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          
          {/* Barra de Filtros */}
          <div className="p-4 border-b border-slate-100 bg-white flex gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Buscar por Cliente, CNPJ ou Código..."
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 outline-none hover:bg-slate-50 cursor-pointer">
              <option>Todos os Planos</option>
            </select>
            <select className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 outline-none hover:bg-slate-50 cursor-pointer">
              <option>Status: Todos</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#f1f5f9]">
                <tr>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Código</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Cliente / CNPJ</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Cidade/UF</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={5} className="px-6 py-10 text-center text-slate-400">Carregando dados...</td></tr>
                ) : filteredCustomers.map((customer, index) => (
                  <tr key={customer.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-500 font-mono">#{1000 + index}</td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-700 text-sm">{customer.razao_social}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{customer.cnpj_cpf}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <MapPin size={13} className="text-slate-300" />
                        {customer.cidade} - {customer.estado}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight">
                        Ativo
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button title="Contrato" className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all border border-slate-100">
                          <FileText size={16} />
                        </button>
                        <button title="Configurar" className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all border border-slate-100">
                          <Settings size={16} />
                        </button>
                        <button title="Financeiro" className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all border border-slate-100">
                          <DollarSign size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;