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
  Trash2,
  FileText,
  Settings,
  LogOut,
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

// Interface criada para tipar o usuário logado no sistema
interface UsuarioLogado {
  nome: string;
  revendaNome?: string;
}

const ESTADOS_BR = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
  "EX",
];

function App() {
  // ESTADO DE AUTENTICAÇÃO
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  // Novo estado para guardar as informações de quem está usando o sistema
  const [usuarioLogado, setUsuarioLogado] = useState<UsuarioLogado | null>(
    null,
  );

  // Estados de navegação e filtros
  const [currentMenu, setCurrentMenu] = useState<"CLIENTES" | "REVENDAS">(
    "CLIENTES",
  );
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

  // Autocomplemento Cidades (Para o Cadastro de Revendas)
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
  const [editFormData, setEditFormData] = useState({
    id: "",
    razao_social: "",
    cidade: "",
    estado: "",
    observacoes: "",
  });

  // Busca dados se estiver autenticado
  useEffect(() => {
    if (isAuthenticated) {
      fetchCustomers();
      fetchRevendas();
    }
  }, [isAuthenticated]);

  // Efeito para carregar cidades do IBGE com base no Estado selecionado da Revenda
  useEffect(() => {
    if (!revendaFormData.estado || revendaFormData.estado === "EX") {
      setListaCidades([]);
      return;
    }
    const carregarCidades = async () => {
      setLoadingCidades(true);
      try {
        const response = await axios.get(
          `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${revendaFormData.estado}/municipios`,
        );
        setListaCidades(response.data.map((c: any) => c.nome));
      } catch (error) {
        console.error("Erro ao carregar cidades do IBGE:", error);
      } finally {
        setLoadingCidades(false);
      }
    };
    carregarCidades();
  }, [revendaFormData.estado]);

  // FUNÇÕES DE LOGIN / LOGOUT
  const handleLoginSuccess = (
    userToken: string,
    role: string,
    userObj?: any,
  ) => {
    setToken(userToken);
    setIsAuthenticated(true);

    // Salvando os dados dinâmicos do usuário mapeando o retorno da sua API
    if (userObj) {
      setUsuarioLogado({
        nome: userObj.nome,
        revendaNome: userObj.user?.nome || userObj.revendaNome || "Matriz",
      });
    } else {
      // Fallback de contingência caso o objeto venha vazio temporariamente
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
      const response = await axios.get(
        `http://localhost:3001/users/revendas/${revendaId}/subusers`,
      );
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

  const handleSubUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRevenda) return;
    try {
      await axios.post(
        `http://localhost:3001/users/revendas/${selectedRevenda.id}/subusers`,
        subUserFormData,
      );
      setIsNewSubUserModalOpen(false);
      setSubUserFormData({
        nome: "",
        email: "",
        telefone: "",
        senha: "mudar123",
      });
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
        },
      );
      setIsEditSubUserModalOpen(false);
      fetchSubUsers(selectedRevenda.id);
    } catch (error) {
      console.error("Erro ao atualizar técnico:", error);
    }
  };

  const handleDeleteSubUser = async (subUserId: string) => {
    if (
      !selectedRevenda ||
      !window.confirm("Tem certeza que deseja remover este técnico do sistema?")
    )
      return;
    try {
      await axios.delete(
        `http://localhost:3001/users/revendas/${selectedRevenda.id}/subusers/${subUserId}`,
      );
      fetchSubUsers(selectedRevenda.id);
    } catch (error) {
      console.error("Erro ao deletar técnico:", error);
    }
  };

  const openEditModal = (customer: Customer) => {
    setEditFormData({
      id: customer.id,
      razao_social: customer.razao_social,
      cidade: customer.cidade || "",
      estado: customer.estado || "",
      observacoes: customer.observacoes || "",
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:3001/customers/${editFormData.id}`, {
        razao_social: editFormData.razao_social,
        cidade: editFormData.cidade,
        estado: editFormData.estado,
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

  const openRevendaSubUsers = (revenda: Revenda) => {
    setSelectedRevenda(revenda);
    fetchSubUsers(revenda.id);
    setIsSubUsersModalOpen(true);
  };

  // SE NÃO ESTIVER AUTENTICADO, MOSTRA A TELA DE LOGIN ISOLADA
  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // FILTROS DA TABELA
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
  const pendentes = customers.filter(
    (c) => c.status_cadastro === "PENDENTE",
  ).length;
  const emProcesso = customers.filter(
    (c) => c.status_cadastro === "EM_PROCESSO",
  ).length;
  const finalizados = customers.filter(
    (c) => c.status_cadastro === "FINALIZADO",
  ).length;

  return (
    <div className="flex min-h-screen bg-slate-50/50 font-sans">
      {/* MENU LATERAL */}
      <div className="w-64 bg-slate-900 text-slate-400 p-4 flex flex-col justify-between border-r border-slate-800 shrink-0">

        {/* Bloco Superior do Menu */}
        <div className="flex flex-col gap-4">
         

          {/* CONTAINER DA LOGO */}
          {/* INFORMAÇÕES DO USUÁRIO */}
          <div className="px-2 pt-2">
            <p className="text-sm font-bold text-white">
              Olá, {usuarioLogado?.nome || "Usuário"}
            </p>

            <p className="text-[11px] text-slate-500 mt-0.5">
              {usuarioLogado?.revendaNome || "Sistema Matriz"}
            </p>
          </div>

          {/* LOGO */}
          <div className="flex justify-center py-6">
            <img
              src={logoImg}
              alt="Digita"
              className="h-10 w-auto object-contain opacity-95"
            />
          </div>

          {/* BOTÕES DE NAVEGAÇÃO */}
          <div className="space-y-1">
            <button
              onClick={() => {
                setCurrentMenu("CLIENTES");
                setSearchTerm("");
                setStatusFilter("Todos");
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${currentMenu === "CLIENTES"
                  ? "bg-blue-600 text-white shadow-lg shadow-emerald-600/10 font-bold"
                  : "hover:bg-slate-800/50 hover:text-slate-200"
                }`}
            >
              <Users size={18} />
              Clientes Ativos
            </button>

            <button
              onClick={() => {
                setCurrentMenu("REVENDAS");
                setSearchTerm("");
                setStatusFilter("Todos");
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${currentMenu === "REVENDAS"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/10 font-bold"
                  : "hover:bg-slate-800/50 hover:text-slate-200"
                }`}
            >
              <UserPlus size={18} />
              Canais & Revendas
            </button>
          </div>
        </div>
        
      </div>

      {/* CONTEÚDO PRINCIPAL */}
      <div className="flex-1 max-w-7xl mx-auto px-6 py-8 overflow-hidden space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Gestão de Contratos & Clientes
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {currentMenu === "CLIENTES"
                ? "Gerencie os registros unificados enviados pelos seus canais."
                : "Clique em uma revenda para gerenciar seus técnicos de suporte autorizados."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <label className="flex items-center gap-2 px-3 py-2 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold cursor-pointer transition-all shadow-sm">
              <Upload size={14} className="text-slate-500" />
              Importar Planilha
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>
            {currentMenu === "CLIENTES" ? (
              <button
                onClick={() => setIsCustomerModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/10"
              >
                <Plus size={14} /> Novo Cliente
              </button>
            ) : (
              <button
                onClick={() => setIsRevendaModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/10"
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
                <p className="text-[11px] font-bold text-slate-400 uppercase">
                  Total Clientes
                </p>
                <h3 className="text-xl font-bold text-slate-800 mt-1">
                  {totalClientes}
                </h3>
              </div>
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                <Users size={20} />
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase">
                  Pendentes
                </p>
                <h3 className="text-xl font-bold text-slate-800 mt-1">
                  {pendentes}
                </h3>
              </div>
              <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                <FileText size={20} />
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase">
                  Em Processo
                </p>
                <h3 className="text-xl font-bold text-slate-800 mt-1">
                  {emProcesso}
                </h3>
              </div>
              <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
                <FileText size={20} />
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase">
                  Finalizados
                </p>
                <h3 className="text-xl font-bold text-slate-800 mt-1">
                  {finalizados}
                </h3>
              </div>
              <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                <FileText size={20} />
              </div>
            </div>
          </div>
        )}

        {/* BARRA DE FILTRO E PESQUISA */}
        <div className="flex flex-col sm:flex-row gap-3 items-center bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
          <div className="relative flex-1 w-full">
            <Search
              className="absolute left-3 top-2.5 text-slate-400"
              size={16}
            />
            <input
              type="text"
              placeholder={
                currentMenu === "CLIENTES"
                  ? "Buscar por nome, CPF/CNPJ ou cidade..."
                  : "Buscar revenda por nome, CNPJ ou cidade..."
              }
              className="w-full bg-slate-50/50 pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter size={14} className="text-slate-400 shrink-0" />
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

        {/* TABELA DE CLIENTES */}
        {currentMenu === "CLIENTES" ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="p-4">Razão Social / Cliente</th>
                    <th className="p-4">CNPJ / CPF</th>
                    <th className="p-4">Cidade / UF</th>
                    <th className="p-4">Observações</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
                  {filteredCustomers.map((customer) => (
                    <tr
                      key={customer.id}
                      className="hover:bg-slate-50/30 transition-colors"
                    >
                      <td className="p-4 font-semibold text-slate-900 whitespace-nowrap">
                        {customer.razao_social}
                      </td>
                      <td className="p-4 font-mono text-slate-500 whitespace-nowrap">
                        {customer.cnpj_cpf}
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        {customer.cidade ? (
                          <span className="inline-flex items-center gap-1">
                            <MapPin size={12} className="text-slate-400" />
                            {customer.cidade} - {customer.estado}
                          </span>
                        ) : (
                          <span className="text-slate-300 italic">
                            Não informado
                          </span>
                        )}
                      </td>
                      <td className="p-4 max-w-xs truncate text-slate-400 font-medium">
                        {customer.observacoes || (
                          <span className="text-slate-200">-</span>
                        )}
                      </td>
                      <td className="p-4 text-center whitespace-nowrap">
                        <button
                          onClick={() =>
                            handleStatusChange(
                              customer.id,
                              customer.status_cadastro,
                            )
                          }
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold transition-all text-[10px] ${customer.status_cadastro === "FINALIZADO" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : customer.status_cadastro === "EM_PROCESSO" ? "bg-amber-50 text-amber-700 border border-amber-100" : "bg-slate-50 text-slate-500 border border-slate-200"}`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${customer.status_cadastro === "FINALIZADO" ? "bg-emerald-500" : customer.status_cadastro === "EM_PROCESSO" ? "bg-amber-500" : "bg-slate-400"}`}
                          />
                          {customer.status_cadastro === "FINALIZADO"
                            ? "Finalizado"
                            : customer.status_cadastro === "EM_PROCESSO"
                              ? "Em Processo"
                              : "Pendente"}
                        </button>
                      </td>
                      <td className="p-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => openEditModal(customer)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        >
                          <Pencil size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* TABELA DE REVENDAS */
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="p-4 pl-6">Revenda / Empresa</th>
                    <th className="p-4">CNPJ / CPF</th>
                    <th className="p-4">Localização</th>
                    <th className="p-4">E-mail Comercial / Contato</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
                  {filteredRevendas.map((rev) => (
                    <tr
                      key={rev.id}
                      onClick={() => openRevendaSubUsers(rev)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                    >
                      <td className="p-4 pl-6 font-bold text-slate-900 whitespace-nowrap">
                        {rev.nome}
                      </td>
                      <td className="p-4 font-mono text-slate-600 whitespace-nowrap tracking-wide">
                        {rev.cnpj}
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        {rev.cidade ? (
                          <span className="inline-flex items-center gap-1">
                            <MapPin size={12} className="text-slate-400" />
                            {rev.cidade} - {rev.estado}
                          </span>
                        ) : (
                          <span className="text-slate-300 italic">
                            Não configurada
                          </span>
                        )}
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-slate-900 font-semibold">
                            {rev.email}
                          </span>
                          <span className="text-slate-400 text-[11px]">
                            {rev.telefone || "Sem Telefone"}
                          </span>
                        </div>
                      </td>
                      <td
                        className="p-4 text-center whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${rev.status === "Ativo" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : rev.status === "Congelado" ? "bg-amber-50 text-amber-700 border border-amber-100" : "bg-slate-100 text-slate-600"}`}
                        >
                          {rev.status}
                        </span>
                      </td>
                      <td
                        className="p-4 text-center whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all">
                          <Settings size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;