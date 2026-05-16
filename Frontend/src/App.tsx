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
  XCircle
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
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(100);

  // ESTADOS DE CLIENTES
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [statusFilter, setStatusFilter] = useState("TODOS");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ razao_social: "", cnpj_cpf: "", email: "", cidade: "", estado: "", telefone: "", status_cadastro: "Ativo", observacoes: "" });
  const [editFormData, setEditFormData] = useState({ razao_social: "", cnpj_cpf: "", email: "", cidade: "", estado: "", telefone: "", status_cadastro: "Ativo", observacoes: "" });

  // ESTADOS DE REVENDAS
  const [revendas, setRevendas] = useState<Revenda[]>([]);
  const [revendaStatusFilter, setRevendaStatusFilter] = useState("TODOS");
  const [isRevendaModalOpen, setIsRevendaModalOpen] = useState(false);
  const [selectedRevendaId, setSelectedRevendaId] = useState<string | null>(null);
  const [selectedRevendaNome, setSelectedRevendaNome] = useState("");
  const [subUsers, setSubUsers] = useState<SubUser[]>([]);

  // Modais de Revendas separados
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false); 
  const [isEditRevendaModalOpen, setIsEditRevendaModalOpen] = useState(false); 

  const [revendaFormData, setRevendaFormData] = useState({ nome: "", cnpj: "", email: "", telefone: "", cidade: "", estado: "", senha: "mudar123", status: "Ativo" });
  const [editRevendaFormData, setEditRevendaFormData] = useState({ nome: "", cnpj: "", email: "", telefone: "", cidade: "", estado: "", senha: "mudar123", status: "Ativo" });

  // Estado de Integrantes da Equipe
  const [newSubUserFormData, setNewSubUserFormData] = useState({ nome: "", email: "", telefone: "", senha: "" });
  const [editingSubUser, setEditingSubUser] = useState<SubUser | null>(null);
  const [editSubUserFormData, setEditSubUserFormData] = useState({ nome: "", email: "", telefone: "", senha: "", status: "Ativo" });

  useEffect(() => {
    fetchCustomers();
    fetchRevendas();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, revendaStatusFilter, itemsPerPage, currentMenu]);

  const fetchCustomers = () => {
    setLoading(true);
    axios.get("http://localhost:3001/customers")
      .then((res) => { setCustomers(res.data); setLoading(false); })
      .catch((err) => { console.error(err); setLoading(false); });
  };

  const fetchRevendas = () => {
    setLoading(true);
    axios.get("http://localhost:3001/users/revendas")
      .then((res) => { setRevendas(res.data); setLoading(false); })
      .catch((err) => { console.error(err); setLoading(false); });
  };

  const fetchSubUsers = (revendaId: string) => {
    axios.get(`http://localhost:3001/users/revendas/${revendaId}/subusers`)
      .then((res) => setSubUsers(res.data))
      .catch((err) => console.error(err));
  };

  // HANDLERS CLIENTES
  const handleCsvImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const desejaSubstituir = window.confirm("Deseja SUBSTITUIR os dados de clientes duplicados pelas novas informações do CSV?");
    const fData = new FormData();
    fData.append("file", file);
    fData.append("substituir", desejaSubstituir ? "true" : "false");
    try {
      alert("Processando CSV de Clientes...");
      const response = await axios.post("http://localhost:3001/customers/import", fData, { headers: { "Content-Type": "multipart/form-data" } });
      alert(`Importação Concluída!\n\n📥 Novos: ${response.data.inseridos}\n🔄 Atualizados: ${response.data.atualizados}\n🚫 Ignorados: ${response.data.ignorados}`);
      e.target.value = "";
      fetchCustomers();
    } catch (err) { alert("Erro ao importar CSV."); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:3001/customers", formData);
      setIsModalOpen(false);
      setFormData({ razao_social: "", cnpj_cpf: "", email: "", cidade: "", estado: "", telefone: "", status_cadastro: "Ativo", observacoes: "" });
      alert("Cliente cadastrado com sucesso!");
      fetchCustomers();
    } catch (err) { alert("Erro ao salvar cliente."); }
  };

  const handleEditClick = (customer: Customer) => {
    setSelectedCustomerId(customer.id);
    setEditFormData({
      razao_social: customer.razao_social,
      cnpj_cpf: customer.cnpj_cpf,
      email: customer.email,
      cidade: customer.cidade || "",
      estado: customer.estado || "",
      telefone: customer.telefone || "",
      status_cadastro: customer.status_cadastro || "Ativo",
      observacoes: customer.observacoes || "",
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) return;
    try {
      await axios.put(`http://localhost:3001/customers/${selectedCustomerId}`, editFormData);
      setIsEditModalOpen(false);
      alert("Dados atualizados com sucesso!");
      fetchCustomers();
    } catch (err) { alert("Erro ao salvar alterações."); }
  };

  // HANDLERS REVENDAS
  const handleRevendaCsvImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fData = new FormData();
    fData.append("file", file);
    try {
      alert("Processando CSV de Revendas...");
      const response = await axios.post("http://localhost:3001/users/revendas/import", fData, { headers: { "Content-Type": "multipart/form-data" } });
      alert(`Importação de Revendas Concluída!\n\n📥 Cadastradas: ${response.data.inseridos}\n🚫 Ignoradas: ${response.data.ignorados}`);
      e.target.value = "";
      fetchRevendas();
    } catch (err) { alert("Erro ao importar revendas."); }
  };

  const handleRevendaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:3001/users/revendas", revendaFormData);
      setIsRevendaModalOpen(false);
      setRevendaFormData({ nome: "", cnpj: "", email: "", telefone: "", cidade: "", estado: "", senha: "mudar123", status: "Ativo" });
      alert("Revenda cadastrada com sucesso!");
      fetchRevendas();
    } catch (err) { alert("Erro ao cadastrar revenda."); }
  };

  const handleEditRevendaClick = (revenda: Revenda) => {
    setSelectedRevendaId(revenda.id);
    setEditRevendaFormData({
      nome: revenda.nome,
      cnpj: revenda.cnpj || "",
      email: revenda.email,
      telefone: revenda.telefone || "",
      cidade: revenda.cidade || "",
      estado: revenda.estado || "",
      senha: revenda.senha || "mudar123",
      status: revenda.status || "Ativo"
    });
    setIsEditRevendaModalOpen(true);
  };

  const handleEditRevendaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRevendaId) return;
    try {
      await axios.put(`http://localhost:3001/users/revendas/${selectedRevendaId}`, editRevendaFormData);
      setIsEditRevendaModalOpen(false);
      alert("Revenda atualizada com sucesso!");
      fetchRevendas();
    } catch (err) { alert("Erro ao atualizar revenda."); }
  };

  const handleRowRevendaClick = (revenda: Revenda) => {
    setSelectedRevendaId(revenda.id);
    setSelectedRevendaNome(revenda.nome);
    setSubUsers([]);
    setEditingSubUser(null);
    fetchSubUsers(revenda.id);
    setIsTeamModalOpen(true);
  };

  // HANDLERS INTEGRANTES (SUBUSERS)
  const handleAddSubUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRevendaId) return;
    try {
      await axios.post(`http://localhost:3001/users/revendas/${selectedRevendaId}/subusers`, newSubUserFormData);
      alert("Funcionário adicionado com sucesso!");
      setNewSubUserFormData({ nome: "", email: "", telefone: "", senha: "" });
      fetchSubUsers(selectedRevendaId);
    } catch (err) { alert("Erro ao cadastrar funcionário."); }
  };

  const startEditSubUser = (su: SubUser) => {
    setEditingSubUser(su);
    setEditSubUserFormData({
      nome: su.nome,
      email: su.email,
      telefone: su.telefone || "",
      senha: su.senha || "",
      status: su.status || "Ativo"
    });
  };

  const handleEditSubUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRevendaId || !editingSubUser) return;
    try {
      await axios.put(`http://localhost:3001/users/revendas/${selectedRevendaId}/subusers/${editingSubUser.id}`, editSubUserFormData);
      alert("Dados do funcionário atualizados!");
      setEditingSubUser(null);
      fetchSubUsers(selectedRevendaId);
    } catch (err) { alert("Erro ao atualizar funcionário."); }
  };

  const handleDeleteSubUser = async (subUserId: string) => {
    if (!selectedRevendaId) return;
    if (!window.confirm("Tem certeza que deseja remover este funcionário? Ele perderá acesso ao sistema.")) return;
    try {
      await axios.delete(`http://localhost:3001/users/revendas/${selectedRevendaId}/subusers/${subUserId}`);
      alert("Funcionário removido com sucesso!");
      fetchSubUsers(selectedRevendaId);
    } catch (err) { alert("Erro ao remover funcionário."); }
  };

  // FILTROS
  const filteredCustomers = customers.filter((c) => {
    const matchS = c.razao_social.toLowerCase().includes(search.toLowerCase()) || c.cnpj_cpf.includes(search);
    const matchSt = statusFilter === "TODOS" || (c.status_cadastro || "Ativo").trim().toUpperCase() === statusFilter;
    return matchS && matchSt;
  });

  const filteredRevendas = revendas.filter((r) => {
    const matchS = r.nome.toLowerCase().includes(search.toLowerCase()) || (r.cnpj && r.cnpj.includes(search));
    const matchSt = revendaStatusFilter === "TODOS" || (r.status || "Ativo").trim().toUpperCase() === revendaStatusFilter;
    return matchS && matchSt;
  });

  const activeListLength = currentMenu === "CLIENTES" ? filteredCustomers.length : filteredRevendas.length;
  const isAllSelected = itemsPerPage === 0;
  const totalPages = isAllSelected ? 1 : Math.ceil(activeListLength / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  const currentDisplayedCustomers = isAllSelected ? filteredCustomers : filteredCustomers.slice(indexOfFirstItem, indexOfLastItem);
  const currentDisplayedRevendas = isAllSelected ? filteredRevendas : filteredRevendas.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="flex min-h-screen bg-[#f8fafc] font-sans text-[#1e293b]">
      
      {/* SIDEBAR LATERAL */}
      <aside className="w-64 bg-[#0f172a] text-slate-300 flex flex-col border-r border-slate-800 shrink-0">
        <div className="p-5 border-b border-slate-800 flex flex-col items-center gap-2">
          <img src={logoImg} alt="Pro Ciber" className="h-12 object-contain mb-1" />
          <span className="text-[10px] bg-blue-500/20 text-blue-400 px-3 py-0.5 rounded-full font-mono font-bold tracking-widest">SISTEMA MATRIZ</span>
        </div>
        <nav className="flex-grow p-4 space-y-1.5">
          <button onClick={() => { setCurrentMenu("CLIENTES"); setSearch(""); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${currentMenu === "CLIENTES" ? "bg-blue-600 text-white shadow-md shadow-blue-600/10" : "hover:bg-slate-800 text-slate-400 hover:text-slate-200"}`}><FileText size={18} /> Gestão de Contratos</button>
          <button onClick={() => { setCurrentMenu("REVENDAS"); setSearch(""); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${currentMenu === "REVENDAS" ? "bg-blue-600 text-white shadow-md shadow-blue-600/10" : "hover:bg-slate-800 text-slate-400 hover:text-slate-200"}`}><Users size={18} /> Cadastros Revendas</button>
        </nav>
        <div className="p-4 border-t border-slate-800 text-xs text-slate-500 text-center font-medium">Matriz Pro Ciber v2.0</div>
      </aside>

      {/* COMPONENTE PRINCIPAL */}
      <main className="flex-grow p-4 md:p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          
          <header className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold text-[#0f172a]">{currentMenu === "CLIENTES" ? "Gestão de Contratos (Clientes)" : "Cadastro de Revendas Parceiras"}</h1>
            <div className="flex items-center gap-3">
              {currentMenu === "CLIENTES" ? (
                <>
                  <label className="bg-white border border-slate-200 text-slate-600 px-4 py-2.5 rounded-lg font-medium flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm text-sm cursor-pointer"><Upload size={17} /> Importar CSV<input type="file" accept=".csv" className="hidden" onChange={handleCsvImport} /></label>
                  <button onClick={() => setIsModalOpen(true)} className="bg-[#2563eb] text-white px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 hover:bg-blue-700 shadow-sm text-sm"><Plus size={18} /> Novo Cliente</button>
                </>
              ) : (
                <>
                  <label className="bg-white border border-slate-200 text-slate-600 px-4 py-2.5 rounded-lg font-medium flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm text-sm cursor-pointer"><Upload size={17} /> Importar CSV Revendas<input type="file" accept=".csv" className="hidden" onChange={handleRevendaCsvImport} /></label>
                  <button onClick={() => setIsRevendaModalOpen(true)} className="bg-emerald-600 text-white px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 hover:bg-emerald-700 shadow-sm text-sm"><Plus size={18} /> Nova Revenda</button>
                </>
              )}
            </div>
          </header>

          {/* INDICADORES */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-600"><p className="text-xs font-bold text-gray-500 uppercase mb-2">{currentMenu === "CLIENTES" ? "Base Total de Clientes" : "Total de Revendas Unidas"}</p><p className="text-3xl font-bold text-slate-800">{currentMenu === "CLIENTES" ? customers.length.toLocaleString() : revendas.length.toLocaleString()}</p></div>
            <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-amber-500"><p className="text-xs font-bold text-gray-500 uppercase mb-2">Filtrados na Tela</p><p className="text-3xl font-bold text-slate-800">{activeListLength.toLocaleString()}</p></div>
            <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-emerald-500"><p className="text-xs font-bold text-gray-500 uppercase mb-2">Faturado Hoje</p><p className="text-3xl font-bold text-slate-800">R$ 12.450</p></div>
          </div>

          {/* TABELAS DE DADOS */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
            <div className="p-4 bg-white flex flex-col md:flex-row gap-4 items-center justify-between border-b border-slate-100">
              <div className="relative flex-grow w-full md:w-auto">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                <input type="text" placeholder={currentMenu === "CLIENTES" ? "Buscar cliente..." : "Buscar revenda..."} className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <div className="flex gap-3 items-center">
                <Filter size={15} className="text-slate-400" />
                <select value={currentMenu === "CLIENTES" ? statusFilter : revendaStatusFilter} onChange={(e) => currentMenu === "CLIENTES" ? setStatusFilter(e.target.value) : setRevendaStatusFilter(e.target.value)} className="border border-slate-200 rounded-lg p-1 text-sm">
                  <option value="TODOS">Todos os Status</option>
                  <option value="ATIVO">Ativos</option>
                  <option value="CANCELADO">Cancelados</option>
                  <option value="CONGELADO">Congelados</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              {currentMenu === "CLIENTES" ? (
                <table className="w-full text-left border-collapse">
                  <thead className="bg-[#f1f5f9]">
                    <tr>
                      <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase">Cliente / CNPJ</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase">Cidade/UF</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase">Contato</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase">Status</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? (<tr><td colSpan={5} className="p-6 text-center text-slate-400">Carregando...</td></tr>) : currentDisplayedCustomers.map((customer) => (
                      <tr key={customer.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4"><div className="font-bold text-sm">{customer.razao_social}</div><div className="text-xs font-mono text-slate-400">{customer.cnpj_cpf}</div></td>
                        <td className="px-6 py-4 text-xs"><MapPin size={12} className="inline mr-1" />{customer.cidade} - {customer.estado}</td>
                        <td className="px-6 py-4 text-xs"><div>{customer.email}</div><div className="text-slate-400">{customer.telefone}</div></td>
                        <td className="px-6 py-4"><span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-xs">{customer.status_cadastro}</span></td>
                        <td className="px-6 py-4 text-right"><button onClick={() => handleEditClick(customer)} className="text-slate-400 hover:text-blue-600"><Settings size={16} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead className="bg-[#f1f5f9]">
                    <tr>
                      <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase">Razão Social / CNPJ</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase">Cidade/UF</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase">Contato / Telefone</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase">Status</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? (<tr><td colSpan={5} className="p-6 text-center text-slate-400">Carregando...</td></tr>) : currentDisplayedRevendas.map((revenda) => (
                      <tr key={revenda.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => handleRowRevendaClick(revenda)}>
                        <td className="px-6 py-4"><div className="font-bold text-sm">{revenda.nome}</div><div className="text-xs font-mono text-slate-400">{revenda.cnpj}</div></td>
                        <td className="px-6 py-4 text-xs"><MapPin size={12} className="inline mr-1" />{revenda.cidade} - {revenda.estado}</td>
                        <td className="px-6 py-4 text-xs"><div>{revenda.email}</div><div className="text-slate-400 font-mono mt-0.5">{revenda.telefone || "Sem Telefone"}</div></td>
                        <td className="px-6 py-4"><span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs">{revenda.status}</span></td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={(e) => { e.stopPropagation(); handleEditRevendaClick(revenda); }} className="text-slate-400 hover:text-emerald-600 p-2">
                            <Settings size={16} />
                          </button>
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

      {/* MODAL DE INTEGRANTES (Abre ao clicar na linha da revenda) */}
      {isTeamModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl overflow-hidden shadow-xl flex flex-col max-h-[90vh]">
            <div className="p-6 bg-slate-50 border-b flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Users size={20} className="text-emerald-600" /> Integrantes Cadastrados</h2>
                <p className="text-xs text-slate-500 font-mono mt-0.5">Revenda: {selectedRevendaNome}</p>
              </div>
              <button onClick={() => setIsTeamModalOpen(false)} className="text-2xl font-bold">×</button>
            </div>

            <div className="p-6 overflow-y-auto flex-grow space-y-6">
              {editingSubUser ? (
                <form onSubmit={handleEditSubUserSubmit} className="bg-amber-50/50 p-4 rounded-xl border border-amber-200 grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                  <div className="md:col-span-5 text-xs font-bold text-amber-700 flex items-center gap-1"><Pencil size={14} /> EDITANDO INTEGRANTE: {editingSubUser.nome}</div>
                  <div className="md:col-span-1"><label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nome</label><input required type="text" className="w-full p-2 border rounded-lg text-xs" value={editSubUserFormData.nome} onChange={(e) => setEditSubUserFormData({ ...editSubUserFormData, nome: e.target.value })} /></div>
                  <div><label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Telefone</label><input type="text" className="w-full p-2 border rounded-lg text-xs" value={editSubUserFormData.telefone} onChange={(e) => setEditSubUserFormData({ ...editSubUserFormData, telefone: e.target.value })} /></div>
                  <div><label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">E-mail</label><input required type="email" className="w-full p-2 border rounded-lg text-xs" value={editSubUserFormData.email} onChange={(e) => setEditSubUserFormData({ ...editSubUserFormData, email: e.target.value })} /></div>
                  <div><label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Senha</label><input required type="text" className="w-full p-2 border rounded-lg text-xs font-mono" value={editSubUserFormData.senha} onChange={(e) => setEditSubUserFormData({ ...editSubUserFormData, senha: e.target.value })} /></div>
                  <div><label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Status</label><select className="w-full p-2 border rounded-lg text-xs" value={editSubUserFormData.status} onChange={(e) => setEditSubUserFormData({ ...editSubUserFormData, status: e.target.value })}><option value="Ativo">Ativo</option><option value="Inativo">Inativo</option></select></div>
                  <div className="md:col-span-5 flex gap-2 justify-end mt-1">
                    <button type="submit" className="bg-amber-600 text-white px-4 py-2 rounded-lg text-xs font-bold">Salvar Alterações</button>
                    <button type="button" onClick={() => setEditingSubUser(null)} className="bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-xs">Cancelar</button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleAddSubUserSubmit} className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                  <div className="md:col-span-4 text-xs font-bold text-slate-600 flex items-center gap-1"><UserPlus size={14} /> NOVO INTEGRANTE</div>
                  <div><label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nome Completo</label><input required type="text" placeholder="Ex: João Técnico" className="w-full p-2 border rounded-lg text-xs" value={newSubUserFormData.nome} onChange={(e) => setNewSubUserFormData({ ...newSubUserFormData, nome: e.target.value })} /></div>
                  <div><label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Telefone</label><input type="text" placeholder="(45) 9999-9999" className="w-full p-2 border rounded-lg text-xs" value={newSubUserFormData.telefone} onChange={(e) => setNewSubUserFormData({ ...newSubUserFormData, telefone: e.target.value })} /></div>
                  <div><label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">E-mail</label><input required type="email" placeholder="joao@email.com" className="w-full p-2 border rounded-lg text-xs" value={newSubUserFormData.email} onChange={(e) => setNewSubUserFormData({ ...newSubUserFormData, email: e.target.value })} /></div>
                  <div><label className="block text-[10px] font-bold text-slate-500 uppercase mb-1"><Lock size={10} /> Senha</label><input required type="text" placeholder="Senha" className="w-full p-2 border rounded-lg text-xs font-mono" value={newSubUserFormData.senha} onChange={(e) => setNewSubUserFormData({ ...newSubUserFormData, senha: e.target.value })} /></div>
                  <div className="md:col-span-4"><button type="submit" className="w-full bg-slate-800 text-white py-2 rounded-lg text-xs font-bold">Adicionar Funcionário</button></div>
                </form>
              )}

              <div className="border rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-100 font-bold text-slate-600">
                    <tr>
                      <th className="p-3">Nome</th>
                      <th className="p-3">E-mail</th>
                      <th className="p-3">Telefone</th>
                      <th className="p-3">Senha</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {subUsers.length === 0 ? (<tr><td colSpan={6} className="p-4 text-center text-slate-400">Nenhum funcionário vinculado ainda.</td></tr>) : (
                      subUsers.map((su) => (
                        <tr key={su.id} className="hover:bg-slate-50">
                          <td className="p-3 font-bold text-slate-700">{su.nome}</td>
                          <td className="p-3 text-slate-600 font-mono">{su.email}</td>
                          <td className="p-3 text-slate-600">{su.telefone || "Não informado"}</td>
                          <td className="p-3 text-slate-500 font-mono">{su.senha}</td>
                          <td className="p-3">
                            {su.status === "Inativo" ? (
                              <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 w-max"><XCircle size={10} /> Inativo</span>
                            ) : (
                              <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 w-max"><CheckCircle size={10} /> Ativo</span>
                            )}
                          </td>
                          <td className="p-3 text-right flex justify-end gap-1.5">
                            <button onClick={() => startEditSubUser(su)} className="p-1.5 text-slate-400 hover:text-amber-600 transition-all"><Pencil size={14} /></button>
                            <button onClick={() => handleDeleteSubUser(su.id)} className="p-1.5 text-slate-400 hover:text-rose-600 transition-all"><Trash2 size={14} /></button>
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
      )}

      {/* MODAL DE DADOS CADASTRAIS (Abre ao clicar na engrenagem) */}
      {isEditRevendaModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-xl">
            <div className="p-6 bg-slate-50 border-b flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Dados Cadastrais da Revenda</h2>
                <p className="text-xs text-slate-400 font-mono mt-0.5">Modo de Edição Geral</p>
              </div>
              <button onClick={() => setIsEditRevendaModalOpen(false)} className="text-2xl font-bold">×</button>
            </div>
            <form onSubmit={handleEditRevendaSubmit} className="p-6 grid grid-cols-2 gap-4">
              <div className="col-span-2"><label className="block text-xs font-bold text-slate-500 mb-1">RAZÃO SOCIAL</label><input required type="text" className="w-full p-2 border rounded-xl text-sm" value={editRevendaFormData.nome} onChange={(e) => setEditRevendaFormData({ ...editRevendaFormData, nome: e.target.value })} /></div>
              <div><label className="block text-xs font-bold text-slate-500 mb-1">CNPJ</label><input type="text" className="w-full p-2 border rounded-xl text-sm" value={editRevendaFormData.cnpj} onChange={(e) => setEditRevendaFormData({ ...editRevendaFormData, cnpj: e.target.value })} /></div>
              <div><label className="block text-xs font-bold text-slate-500 mb-1">TELEFONE</label><input type="text" className="w-full p-2 border rounded-xl text-sm" value={editRevendaFormData.telefone} onChange={(e) => setEditRevendaFormData({ ...editRevendaFormData, telefone: e.target.value })} /></div>
              <div><label className="block text-xs font-bold text-slate-500 mb-1">E-MAIL PRINCIPAL</label><input required type="email" className="w-full p-2 border rounded-xl text-sm" value={editRevendaFormData.email} onChange={(e) => setEditRevendaFormData({ ...editRevendaFormData, email: e.target.value })} /></div>
              <div><label className="block text-xs font-bold text-slate-500 mb-1">SENHA DA REVENDA</label><input type="text" className="w-full p-2 border rounded-xl text-sm font-mono" value={editRevendaFormData.senha} onChange={(e) => setEditRevendaFormData({ ...editRevendaFormData, senha: e.target.value })} /></div>
              <div><label className="block text-xs font-bold text-slate-500 mb-1">CIDADE</label><input type="text" className="w-full p-2 border rounded-xl text-sm" value={editRevendaFormData.cidade} onChange={(e) => setEditRevendaFormData({ ...editRevendaFormData, city: e.target.value })} /></div>
              <div><label className="block text-xs font-bold text-slate-500 mb-1">UF</label><input type="text" maxLength={2} className="w-full p-2 border rounded-xl text-sm text-center uppercase" value={editRevendaFormData.estado} onChange={(e) => setEditRevendaFormData({ ...editRevendaFormData, estado: e.target.value.toUpperCase() })} /></div>
              <div className="col-span-2"><label className="block text-xs font-bold text-slate-500 mb-1">SITUAÇÃO DO CONTRATO</label><select className="w-full p-2 border rounded-xl text-sm" value={editRevendaFormData.status} onChange={(e) => setEditRevendaFormData({ ...editRevendaFormData, status: e.target.value })}><option value="Ativo">Ativo</option><option value="Cancelado">Cancelado</option><option value="Congelado">Congelado</option></select></div>
              <div className="col-span-2 flex gap-3 mt-4"><button type="submit" className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold">Salvar Dados da Revenda</button></div>
            </form>
          </div>
        </div>
      )}

      {/* OUTROS MODAIS DA APLICAÇÃO */}
      {isRevendaModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-xl">
            <div className="p-6 bg-slate-50 border-b flex justify-between items-center"><h2 className="text-lg font-bold">Cadastrar Nova Revenda</h2><button onClick={() => setIsRevendaModalOpen(false)} className="text-xl font-bold">×</button></div>
            <form onSubmit={handleRevendaSubmit} className="p-6 grid grid-cols-2 gap-4">
              <div className="col-span-2"><label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Nome / Razão Social</label><input required type="text" className="w-full p-2 border rounded-xl" value={revendaFormData.nome} onChange={(e) => setRevendaFormData({ ...revendaFormData, nome: e.target.value })} /></div>
              <div><label className="block text-xs font-bold text-slate-500 mb-1 uppercase">CNPJ</label><input type="text" className="w-full p-2 border rounded-xl" value={revendaFormData.cnpj} onChange={(e) => setRevendaFormData({ ...revendaFormData, cnpj: e.target.value })} /></div>
              <div><label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Telefone Comercial</label><input type="text" className="w-full p-2 border rounded-xl" value={revendaFormData.telefone} onChange={(e) => setRevendaFormData({ ...revendaFormData, telefone: e.target.value })} /></div>
              <div><label className="block text-xs font-bold text-slate-500 mb-1 uppercase">E-mail de Acesso</label><input required type="email" className="w-full p-2 border rounded-xl" value={revendaFormData.email} onChange={(e) => setRevendaFormData({ ...revendaFormData, email: e.target.value })} /></div>
              <div><label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Senha Inicial</label><input type="text" className="w-full p-2 border rounded-xl" value={revendaFormData.senha} onChange={(e) => setRevendaFormData({ ...revendaFormData, senha: e.target.value })} /></div>
              <div><label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Cidade</label><input type="text" className="w-full p-2 border rounded-xl" value={revendaFormData.cidade} onChange={(e) => setRevendaFormData({ ...revendaFormData, cidade: e.target.value })} /></div>
              <div><label className="block text-xs font-bold text-slate-500 mb-1 uppercase">UF</label><input type="text" maxLength={2} className="w-full p-2 border rounded-xl uppercase text-center" value={revendaFormData.estado} onChange={(e) => setRevendaFormData({ ...revendaFormData, estado: e.target.value.toUpperCase() })} /></div>
              <div className="col-span-2 flex gap-3 mt-4"><button type="submit" className="flex-grow bg-emerald-600 text-white p-3 rounded-xl font-bold">Salvar Revenda</button></div>
            </form>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-xl">
            <div className="p-6 bg-slate-50 border-b flex justify-between items-center"><h2 className="text-lg font-bold">Cadastrar Novo Cliente</h2><button onClick={() => setIsModalOpen(false)} className="text-xl font-bold">×</button></div>
            <form onSubmit={handleSubmit} className="p-6 grid grid-cols-2 gap-4">
              <div className="col-span-2"><label className="block text-xs font-bold text-slate-500 mb-1">RAZÃO SOCIAL</label><input required type="text" className="w-full p-2 border rounded-xl" value={formData.razao_social} onChange={(e) => setFormData({ ...formData, razao_social: e.target.value })} /></div>
              <div><label className="block text-xs font-bold text-slate-500 mb-1">CNPJ / CPF</label><input required type="text" className="w-full p-2 border rounded-xl" value={formData.cnpj_cpf} onChange={(e) => setFormData({ ...formData, cnpj_cpf: e.target.value })} /></div>
              <div><label className="block text-xs font-bold text-slate-500 mb-1">E-MAIL</label><input required type="email" className="w-full p-2 border rounded-xl" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} /></div>
              <div className="col-span-2 flex gap-3 mt-4"><button type="submit" className="flex-grow bg-blue-600 text-white p-3 rounded-xl font-bold">Salvar Cliente</button></div>
            </form>
          </div>
        </div>
      )}

      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-xl">
            <div className="p-6 bg-slate-50 border-b flex justify-between items-center"><h2 className="text-lg font-bold">Alterar Dados do Cliente</h2><button onClick={() => setIsEditModalOpen(false)} className="text-xl font-bold">×</button></div>
            <form onSubmit={handleEditSubmit} className="p-6 grid grid-cols-2 gap-4">
              <div className="col-span-2"><label className="block text-xs font-bold text-slate-500 mb-1">RAZÃO SOCIAL</label><input required type="text" className="w-full p-2 border rounded-xl" value={editFormData.razao_social} onChange={(e) => setEditFormData({ ...editFormData, razao_social: e.target.value })} /></div>
              <div><label className="block text-xs font-bold text-slate-500 mb-1">CIDADE</label><input type="text" className="w-full p-2 border rounded-xl" value={editFormData.cidade} onChange={(e) => setEditFormData({ ...editFormData, cidade: e.target.value })} /></div>
              <div><label className="block text-xs font-bold text-slate-500 mb-1">UF</label><input type="text" maxLength={2} className="w-full p-2 border rounded-xl text-center uppercase" value={editFormData.estado} onChange={(e) => setEditFormData({ ...editFormData, estado: e.target.value.toUpperCase() })} /></div>
              <div className="col-span-2"><label className="block text-xs font-bold text-slate-500 mb-1">OBSERVAÇÕES</label><textarea rows={3} className="w-full p-2 border rounded-xl resize-none" value={editFormData.observacoes} onChange={(e) => setEditFormData({ ...editFormData, observacoes: e.target.value })} /></div>
              <div className="col-span-2 flex gap-3 mt-4"><button type="submit" className="flex-grow bg-emerald-600 text-white p-3 rounded-xl font-bold">Salvar Alterações</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;