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
  user?: {
    nome: string;
  };
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
  id: string;
  nome: string;
  role: string;      // "MATRIZ", "REVENDA" ou "TECNICO"
  revendaId: string; // Guarda o ID da revenda do escopo atual
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

  // API LISTAGENS (Unificadas e sem duplicações)
  const fetchCustomers = async () => {
    if (!usuarioLogado?.role) return;
    try {
      const response = await axios.get("http://localhost:3001/customers", {
        params: {
          revendaId: usuarioLogado.revendaId || "",
          role: usuarioLogado.role
        }
      });
      setCustomers(response.data);
    } catch (error) {
      console.error("Erro ao buscar clientes:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRevendas = async () => {
    if (!usuarioLogado?.role) return;
    try {
      const response = await axios.get("http://localhost:3001/users/revendas", {
        params: {
          revendaId: usuarioLogado.revendaId || "",
          role: usuarioLogado.role
        }
      });
      setRevendas(response.data);
    } catch (error) {
      console.error("Erro ao buscar revendas:", error);
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

  // Busca dados se estiver autenticado e com escopo carregado
  useEffect(() => {
    if (isAuthenticated && usuarioLogado) {
      fetchCustomers();
      fetchRevendas();
    }
  }, [isAuthenticated, usuarioLogado]);

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

  // Observa mudança de estado nos formulários
  useEffect(() => {
    carregarCidadesDoEstado(revendaFormData.estado);
  }, [revendaFormData.estado]);

  useEffect(() => {
    carregarCidadesDoEstado(customerFormData.estado);
  }, [customerFormData.estado]);

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
        id: userObj.id,
        nome: userObj.nome,
        role: role,
        revendaId: userObj.revendaId,
        revendaNome: userObj.revendaNome || "Matriz",
      });
    } else {
      setUsuarioLogado({ id: "", nome: "Usuário", role: role, revendaId: "", revendaNome: "Sistema" });
    }
  };

  const handleLogout = () => {
    setToken(null);
    setIsAuthenticated(false);
    setUsuarioLogado(null);
    setCustomers([]);
    setRevendas([]);
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
      alert("Dados cadastrais da revenda updated com sucesso!");
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

  // BUSCAS BLINDADAS CONTRA CAMPOS NULOS (Evita tela em branco)
  const filteredCustomers = customers.filter((c) => {
    const razaoSocial = (c.razao_social || "").toLowerCase();
    const cnpjCpf = (c.cnpj_cpf || "");
    const cidade = (c.cidade || "").toLowerCase();
    const termo = searchTerm.toLowerCase();

    const matchesSearch =
      razaoSocial.includes(termo) ||
      cnpjCpf.includes(termo) ||
      cidade.includes(termo);

    if (statusFilter === "Todos") return matchesSearch;
    return matchesSearch && c.status_cadastro === statusFilter;
  });

  const filteredRevendas = revendas.filter((r) => {
    const nome = (r.nome || "").toLowerCase();
    const cnpj = (r.cnpj || "");
    const cidade = (r.cidade || "").toLowerCase();
    const termo = searchTerm.toLowerCase();

    const matchesSearch =
      nome.includes(termo) ||
      cnpj.includes(termo) ||
      cidade.includes(termo);

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
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${currentMenu === "CLIENTES"
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
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${currentMenu === "REVENDAS"
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
                  <th className="p-3 w-1/4">Revenda</th>
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
                    <td className="p-3 truncate text-slate-700 font-semibold">
                      {customer.user?.nome || <span className="text-slate-300 italic">Sem Revenda</span>}
                    </td>
                    <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleStatusChange(customer.id, customer.status_cadastro)}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-colors ${
                          customer.status_cadastro === "FINALIZADO"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100"
                            : customer.status_cadastro === "EM_PROCESSO"
                            ? "bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100"
                            : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                        }`}
                      >
                        {customer.status_cadastro === "PENDENTE" ? "Pendente" : customer.status_cadastro === "EM_PROCESSO" ? "Em Processo" : "Finalizado"}
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

      {/* Os modais permanecem mantidos no final conforme a estrutura do arquivo... */}
    </div>
  );
}

export default App;