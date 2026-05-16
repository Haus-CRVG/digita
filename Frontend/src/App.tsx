import { useEffect, useState } from "react";
import axios from "axios";
import {
  MapPin,
  Search,
  FileText,
  Settings,
  DollarSign,
  Plus,
} from "lucide-react";

interface Customer {
  id: string;
  razao_social: string;
  cnpj_cpf: string;
  cidade: string;
  estado: string;
  telefone: string;
  email: string;
}

function App() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Estado para os campos do formulário
  const [formData, setFormData] = useState({
    razao_social: "",
    cnpj_cpf: "",
    email: "",
    cidade: "",
    estado: "",
    telefone: "",
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = () => {
    axios
      .get("http://localhost:3001/customers")
      .then((res) => {
        setCustomers(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Erro ao carregar dados:", err);
        setLoading(false);
      });
  };

  // Máscara de Telefone: (45) 99999-9999 ou (45) 3333-3333
  const formatTelefone = (value: string) => {
    const cleaned = value.replace(/\D/g, ""); // Remove o que não for número
    if (cleaned.length <= 10) {
      return cleaned.replace(/^(\d{2})(\d{4})(\d{0,4})$/, "($1) $2-$3").trim();
    }
    return cleaned
      .substring(0, 11)
      .replace(/^(\d{2})(\d{5})(\d{0,4})$/, "($1) $2-$3")
      .trim();
  };

  // Máscara de CPF/CNPJ (Aceitando letras para o Novo CNPJ!)
  const formatCpfCnpj = (value: string) => {
    // Remove apenas caracteres de pontuação comuns, mantendo letras e números
    const cleaned = value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

    if (cleaned.length <= 11) {
      // Máscara de CPF: 000.000.000-00
      return cleaned.replace(
        /^(\d{0,3})(\d{0,3})(\d{0,3})(\d{0,2})$/,
        (_, p1, p2, p3, p4) => {
          let res = p1;
          if (p2) res += `.${p2}`;
          if (p3) res += `.${p3}`;
          if (p4) res += `-${p4}`;
          return res;
        },
      );
    } else {
      // Máscara do Novo CNPJ Alfanumérico: XX.XXX.XXX/XXXX-XX
      return cleaned
        .substring(0, 14)
        .replace(
          /^([A-Z0-9]{0,2})([A-Z0-9]{0,3})([A-Z0-9]{0,3})([A-Z0-9]{0,4})([0-9]{0,2})$/,
          (_, p1, p2, p3, p4, p5) => {
            let res = p1;
            if (p2) res += `.${p2}`;
            if (p3) res += `.${p3}`;
            if (p4) res += `/${p4}`;
            if (p5) res += `-${p5}`; // Os dois últimos são sempre números
            return res;
          },
        );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        "http://localhost:3001/customers",
        formData,
      );
      setCustomers([...customers, response.data]);
      setIsModalOpen(false);
      setFormData({
        razao_social: "",
        cnpj_cpf: "",
        email: "",
        cidade: "",
        estado: "",
        telefone: "",
      });
      alert("Cliente cadastrado com sucesso!");
    } catch (err) {
      console.error("Erro ao salvar cliente:", err);
      alert("Erro ao salvar no banco de dados.");
    }
  };

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.razao_social.toLowerCase().includes(search.toLowerCase()) ||
      customer.cnpj_cpf.includes(search),
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8 font-sans text-[#1e293b]">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-[#0f172a]">
            Gestão de Contratos
          </h1>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-[#2563eb] text-white px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 hover:bg-blue-700 transition-all shadow-sm text-sm"
          >
            <Plus size={18} /> Novo Cliente
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-600">
            <p className="text-xs font-bold text-gray-500 uppercase mb-2">
              Ativos
            </p>
            <p className="text-3xl font-bold text-slate-800">
              {customers.length.toLocaleString()}
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-amber-500">
            <p className="text-xs font-bold text-gray-500 uppercase mb-2">
              Em Aceite
            </p>
            <p className="text-3xl font-bold text-slate-800">42</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-emerald-500">
            <p className="text-xs font-bold text-gray-500 uppercase mb-2">
              Faturado Hoje
            </p>
            <p className="text-3xl font-bold text-slate-800">R$ 12.450</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-white flex gap-4">
            <div className="relative flex-grow">
              <Search
                className="absolute left-3 top-2.5 text-slate-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Buscar por Cliente ou CNPJ..."
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#f1f5f9]">
                <tr>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Cliente / CNPJ
                  </th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Cidade/UF
                  </th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Contato
                  </th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-10 text-center text-slate-400"
                    >
                      Carregando dados...
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((customer) => (
                    <tr
                      key={customer.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-700 text-sm">
                          {customer.razao_social}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {customer.cnpj_cpf}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-xs text-slate-600">
                          <MapPin size={13} className="text-slate-300" />
                          {customer.cidade} - {customer.estado}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600">
                        {customer.telefone || "Não informado"}
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase">
                          Ativo
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button className="p-2 text-slate-400 hover:text-blue-600">
                            <FileText size={16} />
                          </button>
                          <button className="p-2 text-slate-400 hover:text-blue-600">
                            <Settings size={16} />
                          </button>
                          <button className="p-2 text-slate-400 hover:text-emerald-600">
                            <DollarSign size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold text-gray-800">
                Cadastrar Novo Cliente
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <Plus size={24} className="rotate-45" />
              </button>
            </div>
            <form
              onSubmit={handleSubmit}
              className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Razão Social
                </label>
                <input
                  required
                  type="text"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 transition-all"
                  value={formData.razao_social}
                  onChange={(e) =>
                    setFormData({ ...formData, razao_social: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  CNPJ / CPF
                </label>
                <input
                  required
                  type="text"
                  maxLength={18} // Tamanho máximo com pontos, barra e traço
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 transition-all font-mono"
                  placeholder="00.000.000/0001-00"
                  value={formData.cnpj_cpf}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      cnpj_cpf: formatCpfCnpj(e.target.value),
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Telefone
                </label>
                <input
                  type="text"
                  maxLength={15} // (XX) XXXXX-XXXX
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 transition-all font-mono"
                  placeholder="(45) 99999-9999"
                  value={formData.telefone}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      telefone: formatTelefone(e.target.value),
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  E-mail
                </label>
                <input
                  required
                  type="email"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 transition-all"
                  placeholder="financeiro@email.com"
                  value={formData.email} // Alterado aqui
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  } // Alterado aqui
                />
              </div>

              {/* Ajuste de Cidade ocupando 3/4 do espaço da linha correspondente */}
              <div className="md:col-span-1 flex gap-4 md:col-span-2">
                <div className="flex-grow">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    Cidade
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Cascavel"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 transition-all"
                    value={formData.cidade}
                    onChange={(e) =>
                      setFormData({ ...formData, cidade: e.target.value })
                    }
                  />
                </div>

                {/* Ajuste de UF menor (col-span-1 equivalente) */}
                <div className="w-24">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    UF
                  </label>
                  <input
                    type="text"
                    maxLength={2}
                    placeholder="PR"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 transition-all uppercase text-center"
                    value={formData.estado}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        estado: e.target.value.toUpperCase(),
                      })
                    }
                  />
                </div>
              </div>

              <div className="md:col-span-2 mt-4 flex gap-3">
                <button
                  type="submit"
                  className="flex-grow bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-all"
                >
                  Salvar Cliente
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 border border-gray-200 text-gray-600 rounded-lg font-bold"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
