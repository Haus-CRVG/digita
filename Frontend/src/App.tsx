import { useEffect, useState } from "react";
import axios from "axios";
import {
  MapPin,
  Search,
  Plus,
  Upload,
  Filter,
  Users,
  UserPlus,
  Pencil,
  Settings,
  LogOut,
  X,
  FileText,
} from "lucide-react";

import logoImg from "./Logo.png";
import Login from "./Login"; // Importando a tela de login funcional

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
  cidade?: string;
  estado?: string;
  email: string;
  status: string;
  senha?: string;
}

interface SubUser {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  status: string;
}

interface UsuarioLogado {
  nome: string;
  revendaNome?: string;
}

const ESTADOS_BR = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO", "EX"
];

function App() {
  // ESTADO DE AUTENTICAÇÃO
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [usuarioLogado, setUsuarioLogado] = useState<UsuarioLogado | null>(null);

  // Estados de navegação e filtros
  const [currentMenu, setCurrentMenu] = useState<"CLIENTES" | "REVENDAS">("CLIENTES");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");

  // Dados
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [revendas, setRevendas] = useState<Revenda[]>([]);
  const [subUsersSelected, setSubUsersSelected] = useState<SubUser[]>([]);
  const [selectedRevenda, setSelectedRevenda] = useState<Revenda | null>(null);

  // Modais
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isRevendaModalOpen, setIsRevendaModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubUsersModalOpen, setIsSubUsersModalOpen] = useState(false);
  const [isNewSubUserModalOpen, setIsNewSubUserModalOpen] = useState(false);
  const [isEditSubUserModalOpen, setIsEditSubUserModalOpen] = useState(false);
  
  // NOVO MODAL: Controla a exibição exclusiva da lista de usuários ao clicar na linha
  const [isViewUsersOnlyModalOpen, setIsViewUsersOnlyModalOpen] = useState(false);

  // Autocomplemento Cidades
  const [listaCidades, setListaCidades] = useState<string[]>([]);
  const [loadingCidades, setLoadingCidades] = useState(false);

  // Formulários
  const [customerFormData, setCustomerFormData] = useState({
    razao_social: "",
    cnpj_cpf: "",
    email: "",
    cidade: "",
    estado: "",
    telefone: "",
    status_cadastro: "PENDENTE",
  });
  const [revendaFormData, setRevendaFormData] = useState({
    nome: "",
    cnpj: "",
    email: "",
    telefone: "",
    cidade: "",
    estado: "",
  });
  // Formulário para edição de dados cadastrais da revenda selecionada
  const [editRevendaFormData, setEditRevendaFormData] = useState({
    nome: "",
    cnpj: "",
    email: "",
    telefone: "",
    status: "",
  });
  const [subUserFormData, setSubUserFormData] = useState({
    nome: "",
    email: "",
    telefone: "",
    senha: "mudar123",
  });
  const [editSubUserFormData, setEditSubUserFormData] = useState({
    id: "",
    nome: "",
    email: "",
    telefone: "",
    status: "Ativo",
  });
  
  // FORMULÁRIO DE EDIÇÃO DE CLIENTE EXPANDIDO COM TODOS OS CAMPOS
  const [editFormData, setEditFormData] = useState({
    id: "",
    razao_social: "",
    cnpj_cpf: "",
    email: "",
    telefone: "",
    cidade: "",
    estado: "",
    status_cadastro: "",
    observacoes: "",
  });

  // Busca dados se estiver autenticado
  useEffect(() => {
    if (isAuthenticated) {
      fetchCustomers();
      fetchRevendas();
    }
  }, [isAuthenticated]);

  // Carregar cidades do IBGE com base no Estado selecionado da Revenda/Cliente
  const carregarCidadesDoEstado = async (uf: string) => {
    if (!uf || uf === "EX") {
      setListaCidades([]);
      return;
    }
    setLoadingCidades(true);
    try {
      const response = await axios.get(
        `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`
      );
      setListaCidades(response.data.map((c: any) => c.nome));
    } catch (error) {
      console.error("Erro ao carregar cidades do IBGE:", error);
    } finally {
      setLoadingCidades(false);
    }
  };

  // Observa mudança de estado no formulário de Nova Revenda
  useEffect(() => {
    carregarCidadesDoEstado(revendaFormData.estado);
  }, [revendaFormData.estado]);

  // Observa mudança de estado no formulário de Novo Cliente
  useEffect(() => {
    carregarCidadesDoEstado(customerFormData.estado);
  }, [customerFormData.estado]);

  // Observa mudança de estado no formulário de Edição de Cliente
  useEffect(() => {
    if (isEditModalOpen && editFormData.estado) {
      carregarCidadesDoEstado(editFormData.estado);
    }
  }, [editFormData.estado, isEditModalOpen]);


  // FUNÇÕES DE LOGIN / LOGOUT
  const handleLoginSuccess = (userToken: string, role: string, userObj?: any) => {
    setToken(userToken);
    setIsAuthenticated(true);
    if (userObj) {
      setUsuarioLogado({
        nome: userObj.nome,
        revendaNome: userObj.user?.nome || userObj.revendaNome || "Matriz",
      });
    } else {
      setUsuarioLogado({ nome: "Usuário", revendaNome: "Sistema" });
    }
  };

  const handleLogout = () => {
    setToken(null);
    setIsAuthenticated(false);
    setUsuarioLogado(null);
    setCustomers([]);
    setRevendas([]);
  };

  const fetchCustomers = async () => {
    try {
      const response = await axios.get("http://localhost:3001/customers");
      setCustomers(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRevendas = async () => {
    try {
      const response = await axios.get("http://localhost:3001/users/revendas");
      setRevendas(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchSubUsers = async (revendaId: string) => {
    try {
      const response = await axios.get(`http://localhost:3001/users/revendas/${revendaId}/subusers`);
      setSubUsersSelected(response.data);
    } catch (error) {
      console.error("Erro ao buscar usuários da revenda:", error);
    }
  };

  const handleCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:3001/customers", customerFormData);
      setIsCustomerModalOpen(false);
      setCustomerFormData({
        razao_social: "",
        cnpj_cpf: "",
        email: "",
        cidade: "",
        estado: "",
        telefone: "",
        status_cadastro: "PENDENTE",
      });
      fetchCustomers();
    } catch (error) {
      console.error(error);
    }
  };

  const handleRevendaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:3001/users/revendas", revendaFormData);
      setIsRevendaModalOpen(false);
      setRevendaFormData({
        nome: "",
        cnpj: "",
        email: "",
        telefone: "",
        cidade: "",
        estado: "",
      });
      fetchRevendas();
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpdateRevendaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRevenda) return;
    try {
      await axios.put(`http://localhost:3001/users/revendas/${selectedRevenda.id}`, {
        nome: editRevendaFormData.nome,
        email: editRevendaFormData.email,
        telefone: editRevendaFormData.telefone,
        status: editRevendaFormData.status,
      });
      alert("Dados cadastrais da revenda atualizados com sucesso!");
      setIsSubUsersModalOpen(false);
      fetchRevendas();
    } catch (error) {
      console.error("Erro ao atualizar dados da revenda:", error);
      alert("Erro ao atualizar os dados cadastrais da revenda.");
    }
  };

  const handleSubUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRevenda) return;
    try {
      await axios.post(
        `http://localhost:3001/users/revendas/${selectedRevenda.id}/subusers`,
        subUserFormData
      );
      setIsNewSubUserModalOpen(false);
      setSubUserFormData({ nome: "", email: "", telefone: "", senha: "mudar123" });
      fetchSubUsers(selectedRevenda.id);
    } catch (error) {
      console.error("Erro ao cadastrar funcionário:", error);
    }
  };

  const openEditSubUserModal = (subUser: SubUser) => {
    setEditSubUserFormData({
      id: subUser.id,
      nome: subUser.nome,
      email: subUser.email,
      telefone: subUser.telefone || "",
      status: subUser.status,
    });
    setIsEditSubUserModalOpen(true);
  };

  const handleEditSubUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRevenda) return;
    try {
      await axios.put(
        `http://localhost:3001/users/revendas/${selectedRevenda.id}/subusers/${editSubUserFormData.id}`,
        {
          nome: editSubUserFormData.nome,
          email: editSubUserFormData.email,
          telefone: editSubUserFormData.telefone,
          status: editSubUserFormData.status,
        }
      );
      setIsEditSubUserModalOpen(false);
      fetchSubUsers(selectedRevenda.id);
    } catch (error) {
      console.error("Erro ao atualizar técnico:", error);
    }
  };

  const handleDeleteSubUser = async (subUserId: string) => {
    if (!selectedRevenda || !window.confirm("Tem certeza que deseja remover este técnico do sistema?")) return;
    try {
      await axios.delete(`http://localhost:3001/users/revendas/${selectedRevenda.id}/subusers/${subUserId}`);
      fetchSubUsers(selectedRevenda.id);
    } catch (error) {
      console.error("Erro ao deletar técnico:", error);
    }
  };

  // ABRE O MODAL PREENCHENDO TODOS OS DADOS DO CLIENTE PARA SEREM EDITADOS
  const openEditModal = (customer: Customer) => {
    setEditFormData({
      id: customer.id,
      razao_social: customer.razao_social,
      cnpj_cpf: customer.cnpj_cpf,
      email: customer.email || "",
      telefone: customer.telefone || "",
      cidade: customer.cidade || "",
      estado: customer.estado || "",
      status_cadastro: customer.status_cadastro,
      observacoes: customer.observacoes || "",
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:3001/customers/${editFormData.id}`, {
        razao_social: editFormData.razao_social,
        cnpj_cpf: editFormData.cnpj_cpf,
        email: editFormData.email,
        telefone: editFormData.telefone,
        cidade: editFormData.cidade,
        estado: editFormData.estado,
        status_cadastro: editFormData.status_cadastro,
        observacoes: editFormData.observacoes,
      });
      setIsEditModalOpen(false);
      fetchCustomers();
    } catch (error) {
      console.error(error);
    }
  };

  const handleStatusChange = async (id: string, currentStatus: string) => {
    const nextStatusMap: { [key: string]: string } = {
      PENDENTE: "EM_PROCESSO",
      EM_PROCESSO: "FINALIZADO",
      FINALIZADO: "PENDENTE",
    };
    const newStatus = nextStatusMap[currentStatus] || "PENDENTE";
    try {
      await axios.put(`http://localhost:3001/customers/${id}`, {
        status_cadastro: newStatus,
      });
      fetchCustomers();
    } catch (error) {
      console.error(error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      setLoading(true);
      await axios.post("http://localhost:3001/customers/import-csv", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("CSV importado com sucesso!");
      fetchCustomers();
    } catch (error) {
      console.error(error);
      alert("Falha na importação.");
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (revenda: Revenda) => {
    setSelectedRevenda(revenda);
    fetchSubUsers(revenda.id);
    setIsViewUsersOnlyModalOpen(true);
  };

  const handleGearClick = (e: React.MouseEvent, revenda: Revenda) => {
    e.stopPropagation(); 
    setSelectedRevenda(revenda);
    setEditRevendaFormData({
      nome: revenda.nome,
      cnpj: revenda.cnpj,
      email: revenda.email,
      telefone: revenda.telefone || "",
      status: revenda.status,
    });
    fetchSubUsers(revenda.id);
    setIsSubUsersModalOpen(true);
  };

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      c.razao_social.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.cnpj_cpf.includes(searchTerm) ||
      (c.cidade && c.cidade.toLowerCase().includes(searchTerm.toLowerCase()));
    if (statusFilter === "Todos") return matchesSearch;
    return matchesSearch && c.status_cadastro === statusFilter;
  });

  const filteredRevendas = revendas.filter((r) => {
    const matchesSearch =
      r.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.cnpj.includes(searchTerm) ||
      (r.cidade && r.cidade.toLowerCase().includes(searchTerm.toLowerCase()));
    if (statusFilter === "Todos") return matchesSearch;
    return matchesSearch && r.status === statusFilter;
  });

  const totalClientes = customers.length;
  const pendentes = customers.filter((c) => c.status_cadastro === "PENDENTE").length;
  const emProcesso = customers.filter((c) => c.status_cadastro === "EM_PROCESSO").length;
  const finalizados = customers.filter((c) => c.status_cadastro === "FINALIZADO").length;

  return (
    <div className="flex min-h-screen bg-slate-50/50 font-sans overflow-hidden">
      {/* MENU LATERAL */}
      <div className="w-56 bg-slate-900 text-slate-400 p-4 flex flex-col justify-between border-r border-slate-800 shrink-0 select-none">
        <div className="flex flex-col gap-4">
          <div className="px-2 pt-2">
            <p className="text-sm font-bold text-white truncate">
              Olá, {usuarioLogado?.nome || "Usuário"}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5 truncate">
              {usuarioLogado?.revendaNome || "Sistema Matriz"}
            </p>
          </div>

          <div className="flex justify-center py-2">
            <img
              src={logoImg}
              alt="Digita"
              className="h-32 w-auto object-contain opacity-90 hover:opacity-100 transition-all duration-300"
            />
          </div>

          <div className="space-y-1">
            <button
              onClick={() => {
                setCurrentMenu("CLIENTES");
                setSearchTerm("");
                setStatusFilter("Todos");
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                currentMenu === "CLIENTES"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/10 font-bold"
                  : "hover:bg-slate-800/50 hover:text-slate-200"
              }`}
            >
              <Users size={16} />
              Clientes Ativos
            </button>

            <button
              onClick={() => {
                setCurrentMenu("REVENDAS");
                setSearchTerm("");
                setStatusFilter("Todos");
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                currentMenu === "REVENDAS"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/10 font-bold"
                  : "hover:bg-slate-800/50 hover:text-slate-200"
              }`}
            >
              <UserPlus size={16} />
              Canais & Revendas
            </button>
          </div>
        </div>
      </div>

      {/* CONTEÚDO PRINCIPAL */}
      <div className="flex-1 min-w-0 px-6 py-6 overflow-y-auto space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">
              Gestão de Contratos & Clientes
            </h1>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {currentMenu === "CLIENTES"
                ? "Gerencie os registros unificados enviados pelos seus canais."
                : "Acesse uma revenda para gerenciar seus técnicos de suporte autorizados."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            <label className="flex items-center gap-2 px-3 py-2 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold cursor-pointer transition-all shadow-sm">
              <Upload size={14} className="text-slate-500" />
              Importar Planilha
              <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
            </label>
            {currentMenu === "CLIENTES" ? (
              <button
                onClick={() => setIsCustomerModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/10"
              >
                <Plus size={14} /> Novo Cliente
              </button>
            ) : (
              <button
                onClick={() => setIsRevendaModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/10"
              >
                <Plus size={14} /> Nova Revenda
              </button>
            )}

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-200 hover:border-rose-600 rounded-xl transition-all duration-200 shadow-sm"
            >
              <LogOut size={13} />
              Sair
            </button>
          </div>
        </div>

        {/* CARDS NUMÉRICOS */}
        {currentMenu === "CLIENTES" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fadeIn">
            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Clientes</p>
                <h3 className="text-lg font-bold text-slate-800 mt-0.5">{totalClientes}</h3>
              </div>
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><Users size={18} /></div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pendentes</p>
                <h3 className="text-lg font-bold text-slate-800 mt-0.5">{pendentes}</h3>
              </div>
              <div className="p-2 bg-slate-100 rounded-lg text-slate-500"><FileText size={18} /></div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Em Processo</p>
                <h3 className="text-lg font-bold text-slate-800 mt-0.5">{emProcesso}</h3>
              </div>
              <div className="p-2 bg-amber-50 rounded-lg text-amber-600"><FileText size={18} /></div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Finalizados</p>
                <h3 className="text-lg font-bold text-slate-800 mt-0.5">{finalizados}</h3>
              </div>
              <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600"><FileText size={18} /></div>
            </div>
          </div>
        )}

        {/* FILTROS */}
        <div className="flex flex-col sm:flex-row gap-3 items-center bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
            <input
              type="text"
              placeholder={currentMenu === "CLIENTES" ? "Buscar por nome, CPF/CNPJ ou cidade..." : "Buscar revenda por nome, CNPJ ou cidade..."}
              className="w-full bg-slate-50/50 pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter size={13} className="text-slate-400 shrink-0" />
            <select
              className="w-full sm:w-40 bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 focus:outline-none"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="Todos">Todos os Status</option>
              {currentMenu === "CLIENTES" ? (
                <>
                  <option value="PENDENTE">Pendente</option>
                  <option value="EM_PROCESSO">Em Processo</option>
                  <option value="FINALIZADO">Finalizado</option>
                </>
              ) : (
                <>
                  <option value="Ativo">Ativo</option>
                  <option value="Cancelado">Cancelado</option>
                  <option value="Congelado">Congelado</option>
                </>
              )}
            </select>
          </div>
        </div>

        {/* TABELAS COMPACTAS */}
        {currentMenu === "CLIENTES" ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <table className="w-full text-left border-collapse table-fixed">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="p-3 w-1/4">Razão Social / Cliente</th>
                  <th className="p-3 w-1/5">CNPJ / CPF</th>
                  <th className="p-3 w-1/5">Cidade / UF</th>
                  <th className="p-3 w-1/4">Observações</th>
                  <th className="p-3 text-center w-28">Status</th>
                  <th className="p-3 text-center w-16">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
                {filteredCustomers.map((customer) => (
                  <tr
                    key={customer.id}
                    onClick={() => openEditModal(customer)}
                    className="hover:bg-blue-50/40 cursor-pointer transition-colors"
                  >
                    <td className="p-3 font-semibold text-slate-900 truncate">{customer.razao_social}</td>
                    <td className="p-3 font-mono text-slate-500 truncate">{customer.cnpj_cpf}</td>
                    <td className="p-3 truncate">
                      {customer.cidade ? (
                        <span className="inline-flex items-center gap-1">
                          <MapPin size={11} className="text-slate-400 shrink-0" />
                          {customer.cidade} - {customer.estado}
                        </span>
                      ) : (
                        <span className="text-slate-300 italic">Não informado</span>
                      )}
                    </td>
                    <td className="p-3 truncate text-slate-400 font-medium">{customer.observacoes || "-"}</td>
                    <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleStatusChange(customer.id, customer.status_cadastro)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold text-[10px] border ${
                          customer.status_cadastro === "FINALIZADO"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                            : customer.status_cadastro === "EM_PROCESSO"
                            ? "bg-amber-50 text-amber-700 border-amber-100"
                            : "bg-slate-50 text-slate-500 border-slate-200"
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${customer.status_cadastro === "FINALIZADO" ? "bg-emerald-500" : customer.status_cadastro === "EM_PROCESSO" ? "bg-amber-500" : "bg-slate-400"}`} />
                        {customer.status_cadastro === "FINALIZADO" ? "Finalizado" : customer.status_cadastro === "EM_PROCESSO" ? "Em Processo" : "Pendente"}
                      </button>
                    </td>
                    <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => openEditModal(customer)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      >
                        <Pencil size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <table className="w-full text-left border-collapse table-fixed">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="p-3 pl-5 w-1/4">Revenda / Empresa</th>
                  <th className="p-3 w-1/5">CNPJ / CPF</th>
                  <th className="p-3 w-1/5">Localização</th>
                  <th className="p-3 w-1/4">E-mail Comercial / Contato</th>
                  <th className="p-3 text-center w-24">Status</th>
                  <th className="p-3 text-center w-16">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
                {filteredRevendas.map((rev) => (
                  <tr
                    key={rev.id}
                    onClick={() => handleRowClick(rev)}
                    className="hover:bg-blue-50/40 cursor-pointer transition-colors"
                  >
                    <td className="p-3 pl-5 font-bold text-slate-900 truncate">{rev.nome}</td>
                    <td className="p-3 font-mono text-slate-600 truncate">{rev.cnpj}</td>
                    <td className="p-3 truncate">
                      {rev.cidade ? (
                        <span className="inline-flex items-center gap-1">
                          <MapPin size={11} className="text-slate-400 shrink-0" />
                          {rev.cidade} - {rev.estado}
                        </span>
                      ) : (
                        <span className="text-slate-300 italic">Não configurada</span>
                      )}
                    </td>
                    <td className="p-3 truncate">
                      <div className="flex flex-col min-w-0">
                        <span className="text-slate-900 font-semibold truncate">{rev.email}</span>
                        <span className="text-slate-400 text-[10px] truncate">{rev.telefone || "Sem Telefone"}</span>
                      </div>
                    </td>
                    <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${rev.status === "Ativo" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : rev.status === "Congelado" ? "bg-amber-50 text-amber-700 border-amber-100" : "bg-slate-100 text-slate-600"}`}>
                        {rev.status}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={(e) => handleGearClick(e, rev)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      >
                        <Settings size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- MODAL: NOVO CLIENTE --- */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-slate-50 px-5 py-4 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-sm font-bold text-slate-800">Cadastrar Novo Cliente</h2>
              <button onClick={() => setIsCustomerModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
            </div>
            <form onSubmit={handleCustomerSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Razão Social *</label>
                <input required type="text" className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-blue-500" value={customerFormData.razao_social} onChange={(e) => setCustomerFormData({...customerFormData, razao_social: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">CNPJ / CPF *</label>
                  <input required type="text" className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-blue-500" value={customerFormData.cnpj_cpf} onChange={(e) => setCustomerFormData({...customerFormData, cnpj_cpf: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Telefone</label>
                  <input type="text" className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-blue-500" value={customerFormData.telefone} onChange={(e) => setCustomerFormData({...customerFormData, telefone: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">E-mail</label>
                <input type="email" className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-blue-500" value={customerFormData.email} onChange={(e) => setCustomerFormData({...customerFormData, email: e.target.value})} />
              </div>
              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-1">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">UF</label>
                  <select className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-2 py-2 text-xs font-bold text-slate-600 focus:outline-none" value={customerFormData.estado} onChange={(e) => setCustomerFormData({...customerFormData, estado: e.target.value, cidade: ""})}>
                    <option value="">--</option>
                    {ESTADOS_BR.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
                  </select>
                </div>
                <div className="col-span-3">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Cidade</label>
                  <select disabled={loadingCidades || !customerFormData.estado} className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 focus:outline-none disabled:opacity-50" value={customerFormData.cidade} onChange={(e) => setCustomerFormData({...customerFormData, cidade: e.target.value})}>
                    <option value="">{loadingCidades ? "Carregando..." : "Selecione a cidade"}</option>
                    {listaCidades.map((cid) => <option key={cid} value={cid}>{cid}</option>)}
                  </select>
                </div>
              </div>
              <button type="submit" className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md transition-all">Salvar Cliente</button>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: NOVA REVENDA --- */}
      {isRevendaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-slate-50 px-5 py-4 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-sm font-bold text-slate-800">Cadastrar Nova Revenda</h2>
              <button onClick={() => setIsRevendaModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
            </div>
            <form onSubmit={handleRevendaSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Nome da Revenda / Empresa *</label>
                <input required type="text" className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-blue-500" value={revendaFormData.nome} onChange={(e) => setRevendaFormData({...revendaFormData, nome: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">CNPJ *</label>
                  <input required type="text" className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-blue-500" value={revendaFormData.cnpj} onChange={(e) => setRevendaFormData({...revendaFormData, cnpj: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Telefone</label>
                  <input type="text" className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-blue-500" value={revendaFormData.telefone} onChange={(e) => setRevendaFormData({...revendaFormData, telefone: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">E-mail de Acesso *</label>
                <input required type="email" className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-blue-500" value={revendaFormData.email} onChange={(e) => setRevendaFormData({...revendaFormData, email: e.target.value})} />
              </div>
              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-1">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">UF</label>
                  <select className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-2 py-2 text-xs font-bold text-slate-600 focus:outline-none" value={revendaFormData.estado} onChange={(e) => setRevendaFormData({...revendaFormData, estado: e.target.value, cidade: ""})}>
                    <option value="">--</option>
                    {ESTADOS_BR.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
                  </select>
                </div>
                <div className="col-span-3">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Cidade</label>
                  <select disabled={loadingCidades || !revendaFormData.estado} className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 focus:outline-none disabled:opacity-50" value={revendaFormData.cidade} onChange={(e) => setRevendaFormData({...revendaFormData, cidade: e.target.value})}>
                    <option value="">{loadingCidades ? "Carregando..." : "Selecione"}</option>
                    {listaCidades.map((cid) => <option key={cid} value={cid}>{cid}</option>)}
                  </select>
                </div>
              </div>
              <button type="submit" className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md transition-all">Salvar Revenda</button>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL COMPLETO: EDITAR INFORMAÇÕES DO CLIENTE --- */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-slate-50 px-5 py-4 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-sm font-bold text-slate-800">Editar Informações do Cliente</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Razão Social</label>
                <input required type="text" className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-blue-500" value={editFormData.razao_social} onChange={(e) => setEditFormData({...editFormData, razao_social: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">CNPJ / CPF</label>
                  <input required type="text" className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-blue-500" value={editFormData.cnpj_cpf} onChange={(e) => setEditFormData({...editFormData, cnpj_cpf: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Telefone</label>
                  <input type="text" className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-blue-500" value={editFormData.telefone} onChange={(e) => setEditFormData({...editFormData, telefone: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">E-mail</label>
                <input type="email" className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-blue-500" value={editFormData.email} onChange={(e) => setEditFormData({...editFormData, email: e.target.value})} />
              </div>
              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-1">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">UF</label>
                  <select className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-2 py-2 text-xs font-bold text-slate-600 focus:outline-none" value={editFormData.estado} onChange={(e) => setEditFormData({...editFormData, estado: e.target.value, cidade: ""})}>
                    <option value="">--</option>
                    {ESTADOS_BR.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
                  </select>
                </div>
                <div className="col-span-3">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Cidade</label>
                  <select disabled={loadingCidades || !editFormData.estado} className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 focus:outline-none disabled:opacity-50" value={editFormData.cidade} onChange={(e) => setEditFormData({...editFormData, cidade: e.target.value})}>
                    <option value="">{loadingCidades ? "Carregando..." : "Selecione"}</option>
                    {listaCidades.map((cid) => <option key={cid} value={cid}>{cid}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Observações Internas</label>
                <textarea rows={3} className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-blue-500 resize-none" value={editFormData.observacoes} onChange={(e) => setEditFormData({...editFormData, observacoes: e.target.value})} />
              </div>
              <button type="submit" className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md transition-all">Salvar Alterações</button>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: GERENCIADOR DA REVENDA COMPLETO (SÓ ABRE NA ENGRENAGEM) --- */}
      {isSubUsersModalOpen && selectedRevenda && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-slate-50 px-5 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-sm font-bold text-slate-800">Gerenciamento Completo da Revenda</h2>
                <p className="text-[10px] text-slate-400 mt-0.5">Modifique as informações cadastrais centrais e gerencie as contas dos usuários técnicos.</p>
              </div>
              <button onClick={() => setIsSubUsersModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto">
              {/* SEÇÃO 1: DADOS DA EMPRESA */}
              <form onSubmit={handleUpdateRevendaSubmit} className="space-y-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                <h3 className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">1. Dados Cadastrais da Empresa</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Razão Social</label>
                    <input type="text" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none" value={editRevendaFormData.nome} onChange={(e) => setEditRevendaFormData({...editRevendaFormData, nome: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">CNPJ</label>
                    <input disabled type="text" className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-500" value={editRevendaFormData.cnpj} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">E-mail Comercial</label>
                    <input type="email" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none" value={editRevendaFormData.email} onChange={(e) => setEditRevendaFormData({...editRevendaFormData, email: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Telefone</label>
                    <input type="text" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none" value={editRevendaFormData.telefone} onChange={(e) => setEditRevendaFormData({...editRevendaFormData, telefone: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Status</label>
                    <select className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 focus:outline-none" value={editRevendaFormData.status} onChange={(e) => setEditRevendaFormData({...editRevendaFormData, status: e.target.value})}>
                      <option value="Ativo">Ativo</option>
                      <option value="Cancelado">Cancelado</option>
                      <option value="Congelado">Congelado</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end pt-1">
                  <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md transition-all">Salvar Alterações Cadastrais</button>
                </div>
              </form>

              {/* SEÇÃO 2: USUÁRIOS TÉCNICOS */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">2. Usuários Técnicos / Integrantes da Equipe</h3>
                  <button onClick={() => setIsNewSubUserModalOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[11px] font-bold transition-all"><Plus size={12} /> Cadastrar Integrante</button>
                </div>

                <div className="border border-slate-100 rounded-xl overflow-hidden bg-white shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                        <th className="p-2.5 pl-4">Nome do Usuário</th>
                        <th className="p-2.5">E-mail Técnico</th>
                        <th className="p-2.5 text-center">Status da Conta</th>
                        <th className="p-2.5 text-center w-24">Gerenciar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
                      {subUsersSelected.length === 0 ? (
                        <tr><td colSpan={4} className="p-4 text-center text-slate-400 italic">Nenhum técnico cadastrado para esta revenda.</td></tr>
                      ) : (
                        subUsersSelected.map((su) => (
                          <tr key={su.id} className="hover:bg-slate-50/50">
                            <td className="p-2.5 pl-4 font-bold text-slate-700">{su.nome}</td>
                            <td className="p-2.5 font-medium text-slate-500">{su.email}</td>
                            <td className="p-2.5 text-center">
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold ${su.status === "Ativo" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>{su.status}</span>
                            </td>
                            <td className="p-2.5 text-center flex items-center justify-center gap-1">
                              <button onClick={() => openEditSubUserModal(su)} className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md"><Pencil size={12} /></button>
                              <button onClick={() => handleDeleteSubUser(su.id)} className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md"><X size={12} /></button>
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

      {/* --- MODAL EXCLUSIVO: VISUALIZAÇÃO DE INTEGRANTES (CLIQUE NA LINHA DA REVENDA) --- */}
      {isViewUsersOnlyModalOpen && selectedRevenda && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="bg-slate-50 px-5 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-sm font-bold text-slate-800">Integrantes & Técnicos Autorizados</h2>
                <p className="text-[10px] text-slate-400 mt-0.5">Lista de contas vinculadas que prestam suporte por este canal de atendimento.</p>
              </div>
              <button onClick={() => setIsViewUsersOnlyModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
            </div>
            <div className="p-5 overflow-y-auto">
              <div className="border border-slate-100 rounded-xl overflow-hidden bg-white">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/75 text-[10px] font-bold text-slate-400 uppercase border-b border-slate-100">
                      <th className="p-3 pl-5">Nome do Técnico</th>
                      <th className="p-3">E-mail de Acesso</th>
                      <th className="p-3 text-center w-28">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
                    {subUsersSelected.length === 0 ? (
                      <tr><td colSpan={3} className="p-6 text-center text-slate-400 italic">Nenhum integrante associado a este canal até o momento.</td></tr>
                    ) : (
                      subUsersSelected.map((su) => (
                        <tr key={su.id} className="hover:bg-slate-50/30">
                          <td className="p-3 pl-5 font-bold text-slate-800">{su.nome}</td>
                          <td className="p-3 font-medium text-slate-500">{su.email}</td>
                          <td className="p-3 text-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${su.status === "Ativo" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-slate-100 text-slate-600 border-slate-200"}`}>{su.status}</span>
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

      {/* --- MODAL AUXILIAR: CADASTRAR NOVO TÉCNICO --- */}
      {isNewSubUserModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-xl border border-slate-100 shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex justify-between items-center">
              <h4 className="text-xs font-bold text-slate-800">Cadastrar Novo Integrante</h4>
              <button onClick={() => setIsNewSubUserModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={14} /></button>
            </div>
            <form onSubmit={handleSubUserSubmit} className="p-4 space-y-3.5">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nome Completo *</label>
                <input required type="text" className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none" value={subUserFormData.nome} onChange={(e) => setSubUserFormData({...subUserFormData, nome: e.target.value})} />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">E-mail de Acesso *</label>
                <input required type="email" className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none" value={subUserFormData.email} onChange={(e) => setSubUserFormData({...subUserFormData, email: e.target.value})} />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Telefone / Ramal</label>
                <input type="text" className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none" value={subUserFormData.telefone} onChange={(e) => setSubUserFormData({...subUserFormData, telefone: e.target.value})} />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Senha Inicial</label>
                <input disabled type="text" className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-400" value={subUserFormData.senha} />
              </div>
              <button type="submit" className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-emerald-600/10">Liberar Acesso & Cadastrar</button>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL AUXILIAR: EDITAR TÉCNICO --- */}
      {isEditSubUserModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-xl border border-slate-100 shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex justify-between items-center">
              <h4 className="text-xs font-bold text-slate-800">Modificar Integrante</h4>
              <button onClick={() => setIsEditSubUserModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={14} /></button>
            </div>
            <form onSubmit={handleEditSubUserSubmit} className="p-4 space-y-3.5">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nome</label>
                <input required type="text" className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none" value={editSubUserFormData.nome} onChange={(e) => setEditSubUserFormData({...editSubUserFormData, nome: e.target.value})} />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">E-mail</label>
                <input required type="email" className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none" value={editSubUserFormData.email} onChange={(e) => setEditSubUserFormData({...editSubUserFormData, email: e.target.value})} />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Telefone</label>
                <input type="text" className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none" value={editSubUserFormData.telefone} onChange={(e) => setEditSubUserFormData({...editSubUserFormData, telefone: e.target.value})} />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Status da Conta</label>
                <select className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 focus:outline-none" value={editSubUserFormData.status} onChange={(e) => setEditSubUserFormData({...editSubUserFormData, status: e.target.value})}>
                  <option value="Ativo">Ativo</option>
                  <option value="Inativo">Inativo</option>
                </select>
              </div>
              <button type="submit" className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all">Salvar Alterações</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;