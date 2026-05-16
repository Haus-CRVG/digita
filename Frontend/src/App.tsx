import { useEffect, useState } from "react";
import axios from "axios";
import {
  MapPin,
  Search,
  FileText,
  Settings,
  Plus,
  Upload,
  Filter,
  Users,
  UserPlus,
  Lock,
  Pencil,
  Trash2,
  CheckCircle,
  XCircle,
  ChevronDown
} from "lucide-react";

import logoImg from "./Logo.png";

interface Customer {
  id: string;
  razao_social: string;
  cnpj_cpf: string;
  cidade: string;
  estado: string;
  telefone: string;
  email: string;
  status_cadastro: string;
  observacoes?: string;
}

interface Revenda {
  id: string;
  nome: string;
  cnpj: string;
  telefone?: string;
  cidade: string;
  estado: string;
  email: string;
  status: string;
  senha?: string;
}

interface SubUser {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  senha?: string;
  status: string;
}

function App() {
  const [currentMenu, setCurrentMenu] = useState<"CLIENTES" | "REVENDAS">("CLIENTES");
  const [submenuOpen, setSubmenuOpen] = useState(true); // Controle do submenu lateral
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // ESTADOS DE CLIENTES
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [statusFilter, setStatusFilter] = useState("TODOS");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [substituirCSV, setSubstituirCSV] = useState(false);

  const [formData, setFormData] = useState({
    razao_social: "",
    cnpj_cpf: "",
    email: "",
    cidade: "",
    estado: "",
    telefone: "",
    status_cadastro: "Ativo",
    observacoes: ""
  });

  const [editFormData, setEditFormData] = useState({
    razao_social: "",
    cnpj_cpf: "",
    email: "",
    cidade: "",
    estado: "",
    telefone: "",
    status_cadastro: "Ativo",
    observacoes: ""
  });

  // ESTADOS DE REVENDAS
  const [revendas, setRevendas] = useState<Revenda[]>([]);
  const [isRevendaModalOpen, setIsRevendaModalOpen] = useState(false);
  const [isUnifiedModalOpen, setIsUnifiedModalOpen] = useState(false); // Modal da Engrenagem unificado
  const [selectedRevendaId, setSelectedRevendaId] = useState<string | null>(null);
  const [subUsers, setSubUsers] = useState<SubUser[]>([]);

  const [revendaFormData, setRevendaFormData] = useState({
    nome: "",
    cnpj: "",
    email: "",
    telefone: "",
    cidade: "",
    estado: "",
    status: "Ativo",
    senha: "mudar123"
  });

  const [editRevendaFormData, setEditRevendaFormData] = useState({
    nome: "",
    cnpj: "",
    email: "",
    telefone: "",
    cidade: "",
    estado: "",
    status: "Ativo",
    senha: "mudar123"
  });

  // ESTADOS DE INTEGRANTES (SUBUSERS) DENTRO DA ENGRENAGEM
  const [newSubUserFormData, setNewSubUserFormData] = useState({
    nome: "",
    email: "",
    telefone: "",
    senha: ""
  });
  const [editingSubUser, setEditingSubUser] = useState<SubUser | null>(null);
  const [editSubUserFormData, setEditSubUserFormData] = useState({
    nome: "",
    email: "",
    telefone: "",
    senha: "",
    status: "Ativo"
  });

  useEffect(() => {
    fetchCustomers();
    fetchRevendas();
  }, []);

  const fetchCustomers = () => {
    setLoading(true);
    axios.get("http://localhost:3001/customers")
      .then((res) => { setCustomers(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  const fetchRevendas = () => {
    setLoading(true);
    axios.get("http://localhost:3001/users/revendas")
      .then((res) => { setRevendas(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  const fetchSubUsers = (revendaId: string) => {
    axios.get(`http://localhost:3001/users/revendas/${revendaId}/subusers`)
      .then((res) => setSubUsers(res.data))
      .catch((err) => console.error(err));
  };

  // AO CLICAR NA ENGRENAGEM (ABRE DADOS CADASTRAIS + USUÁRIOS ABAIXO)
  const handleOpenGearModal = (revenda: Revenda) => {
    setSelectedRevendaId(revenda.id);
    setEditRevendaFormData({
      nome: revenda.nome,
      cnpj: revenda.cnpj,
      email: revenda.email,
      telefone: revenda.telefone || "",
      cidade: revenda.cidade,
      estado: revenda.estado,
      status: revenda.status,
      senha: revenda.senha || "mudar123"
    });
    setSubUsers([]);
    setEditingSubUser(null);
    setNewSubUserFormData({ nome: "", email: "", telefone: "", senha: "" });
    fetchSubUsers(revenda.id);
    setIsUnifiedModalOpen(true);
  };

  // SUBMISSÃO CADASTRO REVENDA (DADOS CADASTRAIS SUPERIOR)
  const handleEditRevendaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRevendaId) return;
    try {
      await axios.put(`http://localhost:3001/users/revendas/${selectedRevendaId}`, editRevendaFormData);
      alert("Dados cadastrais da revenda atualizados com sucesso!");
      fetchRevendas();
    } catch (err) {
      alert("Erro ao salvar dados cadastrais.");
    }
  };

  // SUBMISSÃO NOVO INTEGRANTE (EQUIPE INFERIOR)
  const handleAddSubUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRevendaId) return;
    try {
      await axios.post(`http://localhost:3001/users/revendas/${selectedRevendaId}/subusers`, newSubUserFormData);
      alert("Usuário adicionado à equipe com sucesso!");
      setNewSubUserFormData({ nome: "", email: "", telefone: "", senha: "" });
      fetchSubUsers(selectedRevendaId);
    } catch (err) {
      alert("Erro ao cadastrar usuário para a revenda.");
    }
  };

  // SUBMISSÃO EDIÇÃO INTEGRANTE
  const handleEditSubUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRevendaId || !editingSubUser) return;
    try {
      await axios.put(`http://localhost:3001/users/revendas/${selectedRevendaId}/subusers/${editingSubUser.id}`, editSubUserFormData);
      alert("Dados do integrante atualizados!");
      setEditingSubUser(null);
      fetchSubUsers(selectedRevendaId);
    } catch (err) {
      alert("Erro ao atualizar dados do integrante.");
    }
  };

  const handleDeleteSubUser = async (subUserId: string) => {
    if (!selectedRevendaId) return;
    if (!window.confirm("Deseja realmente remover este usuário da equipe?")) return;
    try {
      await axios.delete(`http://localhost:3001/users/revendas/${selectedRevendaId}/subusers/${subUserId}`);
      fetchSubUsers(selectedRevendaId);
    } catch (err) {
      alert("Erro ao remover usuário.");
    }
  };

  // HANDLERS ADICIONAIS ORIGINAIS (CLIENTES E CRIAÇÃO REVENDA)
  const handleCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:3001/customers", formData);
      setIsModalOpen(false);
      setFormData({ razao_social: "", cnpj_cpf: "", email: "", cidade: "", estado: "", telefone: "", status_cadastro: "Ativo", observacoes: "" });
      fetchCustomers();
    } catch (err) { alert("Erro ao cadastrar cliente."); }
  };

  const handleEditCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) return;
    try {
      await axios.put(`http://localhost:3001/customers/${selectedCustomerId}`, editFormData);
      setIsEditModalOpen(false);
      fetchCustomers();
    } catch (err) { alert("Erro ao atualizar cliente."); }
  };

  const handleRevendaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:3001/users/revendas", revendaFormData);
      setIsRevendaModalOpen(false);
      setRevendaFormData({ nome: "", cnpj: "", email: "", telefone: "", cidade: "", estado: "", status: "Ativo", senha: "mudar123" });
      fetchRevendas();
    } catch (err) { alert("Erro ao cadastrar revenda."); }
  };

  const handleCSVImport = async (e: React.ChangeEvent<HTMLInputElement>, tipo: "CLIENTES" | "REVENDAS") => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const formDataCSV = new FormData();
    formDataCSV.append("file", file);
    if (tipo === "CLIENTES") formDataCSV.append("substituir", substituirCSV ? "true" : "false");

    const endpoint = tipo === "CLIENTES" ? "/customers/import" : "/users/revendas/import";
    try {
      const res = await axios.post(`http://localhost:3001${endpoint}`, formDataCSV, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      alert(res.data.message || "Importação realizada com sucesso!");
      tipo === "CLIENTES" ? fetchCustomers() : fetchRevendas();
    } catch (err) {
      alert("Erro ao processar arquivo CSV.");
    }
  };

  // FILTROS ORIGINAIS
  const filteredCustomers = customers.filter((c) => {
    const matchesSearch = c.razao_social.toLowerCase().includes(search.toLowerCase()) || c.cnpj_cpf.includes(search);
    const matchesStatus = statusFilter === "TODOS" || c.status_cadastro.toUpperCase() === statusFilter.toUpperCase();
    return matchesSearch && matchesStatus;
  });

  const filteredRevendas = revendas.filter((r) => {
    return r.nome.toLowerCase().includes(search.toLowerCase()) || r.cnpj.includes(search);
  });

  return (
    <div className="flex min-h-screen bg-[#f8fafc] text-[#1e293b]">
      
      {/* SIDEBAR LATERAL ORIGINAL RECONSTRUÍDA */}
      <aside className="w-64 bg-[#0f172a] text-slate-300 flex flex-col border-r border-slate-800 shrink-0">
        <div className="p-6 border-b border-slate-800 flex flex-col items-center gap-2">
          {/* ALTERE O TAMANHO DA LOGO AQUI ABAIXO: Deixei h-20, altere conforme desejar */}
          <img src={logoImg} alt="Pro Ciber" className="h-20 w-auto object-contain mb-1" />
          <span className="text-[10px] bg-blue-500/20 text-blue-400 px-3 py-0.5 rounded-full font-mono font-bold tracking-widest">SISTEMA MATRIZ</span>
        </div>
        
        <nav className="flex-grow p-4 space-y-1.5">
          <button onClick={() => setCurrentMenu("CLIENTES")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${currentMenu === "CLIENTES" ? "bg-blue-600 text-white shadow-md" : "hover:bg-slate-800 text-slate-400"}`}><FileText size={18} /> Gestão de Contratos</button>
          
          <div>
            <button onClick={() => { setCurrentMenu("REVENDAS"); setSubmenuOpen(!submenuOpen); }} className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-semibold transition-all ${currentMenu === "REVENDAS" ? "bg-blue-600 text-white shadow-md" : "hover:bg-slate-800 text-slate-400"}`}>
              <div className="flex items-center gap-3"><Users size={18} /> Cadastro Revendas</div>
              <ChevronDown size={14} className={`transition-transform ${submenuOpen ? "rotate-180" : ""}`} />
            </button>
            
            {/* SUBMENU INTEGRADO LOGO ABAIXO DA REVENDA */}
            {submenuOpen && (
              <div className="pl-9 mt-1 space-y-1">
                <button onClick={() => { setCurrentMenu("REVENDAS"); setIsRevendaModalOpen(true); }} className="w-full text-left py-2 px-3 rounded-md text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-all flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> Cadastrar Nova Revenda
                </button>
              </div>
            )}
          </div>
        </nav>
        <div className="p-4 border-t border-slate-800 text-xs text-slate-500 text-center font-medium">Matriz Pro Ciber v2.0</div>
      </aside>

      {/* PAINEL PRINCIPAL ORIGINAL */}
      <main className="flex-grow p-8">
        <div className="w-full px-8 mx-auto">
          <header className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold text-[#0f172a]">{currentMenu === "CLIENTES" ? "Gestão de Contratos" : "Cadastro de Revendas Parceiras"}</h1>
              <p className="text-sm text-slate-500 mt-1">Painel administrativo de controle de carteiras e acessos</p>
            </div>
            
            <div className="flex gap-3">
              {currentMenu === "CLIENTES" ? (
                <>
                  <label className="bg-slate-800 text-white px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 hover:bg-slate-700 shadow-sm text-sm cursor-pointer"><Upload size={16} /> Importar Planilha (CSV)<input type="file" accept=".csv" className="hidden" onChange={(e) => handleCSVImport(e, "CLIENTES")} /></label>
                  <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 hover:bg-blue-700 shadow-sm text-sm"><Plus size={18} /> Novo Contrato</button>
                </>
              ) : (
                <>
                  <label className="bg-slate-800 text-white px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 hover:bg-slate-700 shadow-sm text-sm cursor-pointer"><Upload size={16} /> Importar Revendas (CSV)<input type="file" accept=".csv" className="hidden" onChange={(e) => handleCSVImport(e, "REVENDAS")} /></label>
                  <button onClick={() => setIsRevendaModalOpen(true)} className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 hover:bg-emerald-700 shadow-sm text-sm"><Plus size={18} /> Nova Revenda</button>
                </>
              )}
            </div>
          </header>

          {/* ÁREA DE CONTEÚDO E FILTROS */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-white">
              <div className="relative flex-grow max-w-md">
                <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                <input type="text" placeholder={currentMenu === "CLIENTES" ? "Buscar por Razão Social ou CNPJ..." : "Buscar por Nome da Revenda ou CNPJ..."} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>

              {currentMenu === "CLIENTES" && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider"><Filter size={14} /> FILTRAR POR STATUS:</div>
                  <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
                    {["TODOS", "ATIVO", "CANCELADO", "PENDENTE"].map((status) => (
                      <button key={status} onClick={() => setStatusFilter(status)} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${statusFilter === status ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>{status}</button>
                    ))}
                  </div>
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 select-none ml-2 cursor-pointer"><input type="checkbox" className="rounded text-blue-600 border-slate-300" checked={substituirCSV} onChange={(e) => setSubstituirCSV(e.target.checked)} /> Substituir dados se CNPJ já existir no CSV</label>
                </div>
              )}
            </div>

            {/* TABELAS ORIGINAIS RESTAURADAS */}
            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-12 text-center text-slate-400 font-medium">Carregando dados com segurança...</div>
              ) : currentMenu === "CLIENTES" ? (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="px-6 py-4">Razão Social / Cliente</th>
                      <th className="px-6 py-4">CNPJ / CPF</th>
                      <th className="px-6 py-4">E-mail Principal</th>
                      <th className="px-6 py-4">Localização</th>
                      <th className="px-6 py-4">Revenda Vinculada</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {filteredCustomers.map((customer) => (
                      <tr key={customer.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-800">{customer.razao_social}</td>
                        <td className="px-6 py-4 font-mono text-xs text-slate-600">{customer.cnpj_cpf}</td>
                        <td className="px-6 py-4 text-slate-600">{customer.email}</td>
                        <td className="px-6 py-4 text-slate-500 flex items-center gap-1 mt-0.5"><MapPin size={14} className="text-slate-400" /> {customer.cidade ? `${customer.cidade}-${customer.estado}` : "Não informado"}</td>
                        <td className="px-6 py-4 font-medium text-slate-700">{(customer as any).user?.nome || "PRO CIBER MATRIZ"}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${customer.status_cadastro === "Ativo" ? "bg-emerald-50 text-emerald-600" : customer.status_cadastro === "Cancelado" ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600"}`}>{customer.status_cadastro}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => { setSelectedCustomerId(customer.id); setEditFormData({ razao_social: customer.razao_social, cnpj_cpf: customer.cnpj_cpf, email: customer.email, cidade: customer.cidade || "", estado: customer.estado || "", telefone: customer.telefone || "", status_cadastro: customer.status_cadastro, observacoes: customer.observacoes || "" }); setIsEditModalOpen(true); }} className="text-slate-400 hover:text-blue-600 p-2"><Pencil size={16} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="px-6 py-4">Parceiro / Revenda</th>
                      <th className="px-6 py-4">CNPJ</th>
                      <th className="px-6 py-4">E-mail Comercial</th>
                      <th className="px-6 py-4">Telefone</th>
                      <th className="px-6 py-4">Cidade / UF</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Configurações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {filteredRevendas.map((revenda) => (
                      <tr key={revenda.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-800">{revenda.nome}</td>
                        <td className="px-6 py-4 font-mono text-xs text-slate-600">{revenda.cnpj}</td>
                        <td className="px-6 py-4 text-slate-600">{revenda.email}</td>
                        <td className="px-6 py-4 text-slate-500">{revenda.telefone || "(45) 99999-9999"}</td>
                        <td className="px-6 py-4 text-slate-500">{revenda.cidade}-{revenda.estado}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${revenda.status === "Ativo" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>{revenda.status}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => handleOpenGearModal(revenda)} className="text-slate-400 hover:text-blue-600 p-2 bg-slate-100 rounded-lg hover:bg-blue-50 transition-colors"><Settings size={16} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* MODAL DA ENGRENAGEM UNIFICADO (DADOS CADASTRAIS + INTEGRANTES DA EQUIPE) */}
      {isUnifiedModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
            <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Gerenciamento Completo da Revenda</h2>
                <p className="text-xs text-slate-400 font-medium mt-0.5">Modifique as informações cadastrais centrais e gerencie as contas dos usuários técnicos</p>
              </div>
              <button onClick={() => setIsUnifiedModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-2xl font-semibold px-2">×</button>
            </div>

            <div className="p-6 overflow-y-auto flex-grow space-y-8">
              
              {/* BLOCO SUPERIOR: FORMULÁRIO DE DADOS CADASTRAIS DA REVENDA */}
              <form onSubmit={handleEditRevendaSubmit} className="bg-slate-50/60 p-5 rounded-2xl border border-slate-200/80 grid grid-cols-3 gap-4">
                <div className="col-span-3 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">1. Dados Cadastrais da Empresa</div>
                <div className="col-span-2"><label className="block text-xs font-bold text-slate-500 mb-1">RAZÃO SOCIAL</label><input required type="text" className="w-full p-2.5 border rounded-xl text-sm" value={editRevendaFormData.nome} onChange={(e) => setEditRevendaFormData({ ...editRevendaFormData, nome: e.target.value })} /></div>
                <div><label className="block text-xs font-bold text-slate-500 mb-1">CNPJ</label><input required type="text" className="w-full p-2.5 border rounded-xl text-sm font-mono" value={editRevendaFormData.cnpj} onChange={(e) => setEditRevendaFormData({ ...editRevendaFormData, cnpj: e.target.value })} /></div>
                <div><label className="block text-xs font-bold text-slate-500 mb-1">E-MAIL COMERCIAL</label><input required type="email" className="w-full p-2.5 border rounded-xl text-sm" value={editRevendaFormData.email} onChange={(e) => setEditRevendaFormData({ ...editRevendaFormData, email: e.target.value })} /></div>
                <div><label className="block text-xs font-bold text-slate-500 mb-1">TELEFONE</label><input type="text" className="w-full p-2.5 border rounded-xl text-sm" value={editRevendaFormData.telefone} onChange={(e) => setEditRevendaFormData({ ...editRevendaFormData, telefone: e.target.value })} /></div>
                <div><label className="block text-xs font-bold text-slate-500 mb-1">STATUS</label><select className="w-full p-2.5 border rounded-xl text-sm font-bold" value={editRevendaFormData.status} onChange={(e) => setEditRevendaFormData({ ...editRevendaFormData, status: e.target.value })}><option value="Ativo">Ativo</option><option value="Cancelado">Cancelado</option></select></div>
                <div className="col-span-3 flex justify-end pt-2"><button type="submit" className="bg-blue-600 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-sm hover:bg-blue-700 transition-colors">Salvar Alterações Cadastrais</button></div>
              </form>

              <hr className="border-slate-200" />

              {/* BLOCO INFERIOR: SUB-USUÁRIOS / INTEGRANTES DA EQUIPE */}
              <div className="space-y-4">
                <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider">2. Usuários Técnicos / Integrantes da Equipe</div>

                {/* Alternância Dinâmica entre Formulário de Cadastro e de Edição de Funcionários */}
                {editingSubUser ? (
                  <form onSubmit={handleEditSubUserSubmit} className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200 grid grid-cols-4 gap-3 items-end">
                    <div className="col-span-4 text-xs font-bold text-amber-800">Modificando Usuário Selecionado</div>
                    <div className="col-span-2"><label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nome Técnico</label><input required type="text" className="w-full p-2 border rounded-xl text-xs" value={editSubUserFormData.nome} onChange={(e) => setEditSubUserFormData({ ...editSubUserFormData, nome: e.target.value })} /></div>
                    <div><label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">E-mail</label><input required type="email" className="w-full p-2 border rounded-xl text-xs" value={editSubUserFormData.email} onChange={(e) => setEditSubUserFormData({ ...editSubUserFormData, email: e.target.value })} /></div>
                    <div className="flex gap-2"><button type="submit" className="bg-amber-600 text-white px-3 py-2 rounded-xl text-xs font-bold flex-grow">Salvar</button><button type="button" onClick={() => setEditingSubUser(null)} className="bg-slate-200 text-slate-700 px-3 py-2 rounded-xl text-xs">Cancelar</button></div>
                  </form>
                ) : (
                  <form onSubmit={handleAddSubUserSubmit} className="bg-slate-50 p-4 rounded-2xl border border-slate-200/70 grid grid-cols-4 gap-3 items-end">
                    <div className="col-span-2"><label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nome do Integrante</label><input required type="text" placeholder="Ex: Lucas Suporte" className="w-full p-2.5 bg-white border rounded-xl text-xs" value={newSubUserFormData.nome} onChange={(e) => setNewSubUserFormData({ ...newSubUserFormData, nome: e.target.value })} /></div>
                    <div><label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">E-mail de Acesso</label><input required type="email" placeholder="lucas@revenda.com" className="w-full p-2.5 bg-white border rounded-xl text-xs" value={newSubUserFormData.email} onChange={(e) => setNewSubUserFormData({ ...newSubUserFormData, email: e.target.value })} /></div>
                    <div><label className="block text-[10px] font-bold text-slate-500 uppercase mb-1"><Lock size={10} className="inline mr-1 text-slate-400"/>Senha Inicial</label><input required type="text" placeholder="SenhaForte123" className="w-full p-2.5 bg-white border rounded-xl text-xs font-mono" value={newSubUserFormData.senha} onChange={(e) => setNewSubUserFormData({ ...newSubUserFormData, senha: e.target.value })} /></div>
                    <button type="submit" className="col-span-4 bg-slate-900 text-white py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-slate-800 transition-colors"><UserPlus size={15}/> Cadastrar Integrante e Liberar Acesso</button>
                  </form>
                )}

                {/* Tabela de listagem dos Integrantes cadastrados */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-slate-50 font-bold text-slate-500 border-b border-slate-100">
                      <tr>
                        <th className="p-3.5 pl-5">Nome do Usuário</th>
                        <th className="p-3.5">E-mail Técnico</th>
                        <th className="p-3.5">Status da Conta</th>
                        <th className="p-3.5 pr-5 text-right">Gerenciar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {subUsers.length === 0 ? (
                        <tr><td colSpan={4} className="p-6 text-center text-slate-400 font-medium">Nenhum integrante cadastrado para esta revenda parceira até o momento.</td></tr>
                      ) : (
                        subUsers.map((su) => (
                          <tr key={su.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-3.5 pl-5 font-bold text-slate-800">{su.nome}</td>
                            <td className="p-3.5 text-slate-600 font-mono">{su.email}</td>
                            <td className="p-3.5"><span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-md font-bold text-[10px]">{su.status}</span></td>
                            <td className="p-3.5 pr-5 text-right flex justify-end gap-3">
                              <button onClick={() => { setEditingSubUser(su); setEditSubUserFormData({ nome: su.nome, email: su.email, telefone: su.telefone || "", senha: su.senha || "", status: su.status }); }} className="text-slate-400 hover:text-amber-600 p-1"><Pencil size={15} /></button>
                              <button onClick={() => handleDeleteSubUser(su.id)} className="text-slate-400 hover:text-rose-600 p-1"><Trash2 size={15} /></button>
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

      {/* OUTROS MODAIS ORIGINAIS MANIPULADOS CORRETAMENTE */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl overflow-hidden shadow-xl p-6">
            <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-lg text-slate-800">Cadastrar Novo Contrato</h3><button onClick={() => setIsModalOpen(false)} className="text-xl">×</button></div>
            <form onSubmit={handleCustomerSubmit} className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><label className="block text-xs font-bold text-slate-500 mb-1">RAZÃO SOCIAL</label><input required type="text" className="w-full p-2 border rounded-xl text-sm" value={formData.razao_social} onChange={(e) => setFormData({ ...formData, razao_social: e.target.value })} /></div>
              <div><label className="block text-xs font-bold text-slate-500 mb-1">CNPJ / CPF</label><input required type="text" className="w-full p-2 border rounded-xl text-sm" value={formData.cnpj_cpf} onChange={(e) => setFormData({ ...formData, cnpj_cpf: e.target.value })} /></div>
              <div><label className="block text-xs font-bold text-slate-500 mb-1">E-MAIL</label><input required type="email" className="w-full p-2 border rounded-xl text-sm" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} /></div>
              <button type="submit" className="col-span-2 bg-blue-600 text-white py-2.5 rounded-xl font-bold mt-2 hover:bg-blue-700 transition-colors">Salvar Contrato</button>
            </form>
          </div>
        </div>
      )}

      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl overflow-hidden shadow-xl p-6">
            <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-lg text-slate-800">Editar Cliente</h3><button onClick={() => setIsEditModalOpen(false)} className="text-xl">×</button></div>
            <form onSubmit={handleEditCustomerSubmit} className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><label className="block text-xs font-bold text-slate-500 mb-1">RAZÃO SOCIAL</label><input type="text" className="w-full p-2 border rounded-xl text-sm" value={editFormData.razao_social} onChange={(e) => setEditFormData({ ...editFormData, razao_social: e.target.value })} /></div>
              <div><label className="block text-xs font-bold text-slate-500 mb-1">CIDADE</label><input type="text" className="w-full p-2 border rounded-xl text-sm" value={editFormData.cidade} onChange={(e) => setEditFormData({ ...editFormData, cidade: e.target.value })} /></div>
              <div><label className="block text-xs font-bold text-slate-500 mb-1">UF</label><input type="text" maxLength={2} className="w-full p-2 border rounded-xl text-sm uppercase text-center" value={editFormData.estado} onChange={(e) => setEditFormData({ ...editFormData, estado: e.target.value.toUpperCase() })} /></div>
              <div className="col-span-2"><label className="block text-xs font-bold text-slate-500 mb-1">OBSERVAÇÕES</label><textarea rows={3} className="w-full p-2 border rounded-xl text-sm resize-none" value={editFormData.observacoes} onChange={(e) => setEditFormData({ ...editFormData, observacoes: e.target.value })}></textarea></div>
              <button type="submit" className="col-span-2 bg-blue-600 text-white py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-colors">Salvar Alterações</button>
            </form>
          </div>
        </div>
      )}

      {isRevendaModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl p-6">
            <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-lg text-slate-800">Cadastrar Nova Revenda</h3><button onClick={() => setIsRevendaModalOpen(false)} className="text-xl">×</button></div>
            <form onSubmit={handleRevendaSubmit} className="space-y-3">
              <div><label className="block text-xs font-bold text-slate-500 mb-1">Nome da Empresa</label><input required type="text" className="w-full p-2 border rounded-xl text-sm" value={revendaFormData.nome} onChange={(e) => setRevendaFormData({ ...revendaFormData, nome: e.target.value })} /></div>
              <div><label className="block text-xs font-bold text-slate-500 mb-1">CNPJ</label><input required type="text" className="w-full p-2 border rounded-xl text-sm" value={revendaFormData.cnpj} onChange={(e) => setRevendaFormData({ ...revendaFormData, cnpj: e.target.value })} /></div>
              <div><label className="block text-xs font-bold text-slate-500 mb-1">E-mail Comercial</label><input required type="email" className="w-full p-2 border rounded-xl text-sm" value={revendaFormData.email} onChange={(e) => setRevendaFormData({ ...revendaFormData, email: e.target.value })} /></div>
              <button type="submit" className="w-full bg-emerald-600 text-white py-2.5 rounded-xl font-bold text-sm hover:bg-emerald-700 transition-colors">Cadastrar Revenda</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;