import { useState } from "react";
import { Lock, Mail, Eye, EyeOff, ShieldCheck, ArrowRight, ArrowLeft } from "lucide-react";
import axios from "axios";
import logoImg from "./Logo.png";

interface LoginProps {
  onLoginSuccess: (token: string, userName: string, userRole: string) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [documento, setDocumento] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [empresaNome, setEmpresaNome] = useState("");
  
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ETAPA 1: Validar se o CPF/CNPJ existe no banco
  const handleValidateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Faz a chamada na nova rota do backend
      const response = await axios.post("http://localhost:3001/auth/validate-document", {
        cnpj_cpf: documento
      });

      if (response.data.exists) {
        setEmpresaNome(response.data.nome);
        setStep(2); // Avança para e-mail e senha
      }
    } catch (err: any) {
      if (err.response && err.response.status === 404) {
        setError("Este CPF/CNPJ não está autorizado ou cadastrado no sistema.");
      } else {
        setError("Falha ao conectar com o servidor de autenticação.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ETAPA 2: Validar E-mail e Senha
  const handleFinalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Simulação de login baseado no seu arquivo server.ts (usuário padrão haus@prociber.com.br)
      // Quando criar a rota de login JWT oficial, trocaremos esse IF por um axios.post("/auth/login")
      if (email === "haus@prociber.com.br" && senha === "mudar123") {
        onLoginSuccess("token-jwt-gerado", "Élcio Centauro", "MATRIZ");
      } else if (senha === "mudar123") {
        // Fallback genérico para testes com as revendas importadas
        onLoginSuccess("token-jwt-revenda", empresaNome, "REVENDA");
      } else {
        setError("Credenciais incorretas para esta empresa. Verifique o e-mail ou a senha.");
      }
    } catch (err) {
      setError("Erro ao autenticar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6">
        
        {/* LOGO E TOPO */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="flex items-center gap-3 px-4 py-3 bg-slate-950/60 rounded-2xl border border-slate-800">
            <img src={logoImg} alt="Logo" className="h-9 w-auto object-contain" />
            <div className="flex flex-col text-left">
              <span className="text-base font-bold text-slate-100 tracking-wide">Prociber</span>
              <span className="text-[10px] text-blue-500 font-bold tracking-wider uppercase">Painel Gestor</span>
            </div>
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-100">Portal de Acesso</h2>
            <p className="text-xs text-slate-400">
              {step === 1 
                ? "Informe o documento corporativo para iniciar a verificação" 
                : `Empresa: ${empresaNome}`}
            </p>
          </div>
        </div>

        {/* ALERTA DE ERRO */}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-xl text-xs font-semibold text-center">
            {error}
          </div>
        )}

        {/* FORMULÁRIO - ETAPA 1 (DOCUMENTO) */}
        {step === 1 && (
          <form onSubmit={handleValidateDocument} className="space-y-4 animate-fadeIn">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">CNPJ ou CPF da Empresa</label>
              <div className="relative">
                <ShieldCheck className="absolute left-3.5 top-3 text-slate-500" size={16} />
                <input
                  required
                  type="text"
                  placeholder="00.000.000/0001-00"
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-xl pl-11 pr-4 py-2.5 text-xs font-medium text-slate-200 focus:outline-none focus:border-blue-500 focus:bg-slate-950 transition-all tracking-wide"
                  value={documento}
                  onChange={(e) => setDocumento(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white py-2.5 rounded-xl font-bold text-xs mt-2 transition-all"
            >
              {loading ? "Verificando empresa..." : "Verificar Empresa"}
              {!loading && <ArrowRight size={14} />}
            </button>
          </form>
        )}

        {/* FORMULÁRIO - ETAPA 2 (E-MAIL E SENHA) */}
        {step === 2 && (
          <form onSubmit={handleFinalLogin} className="space-y-4 animate-fadeIn">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">E-mail de Usuário</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 text-slate-500" size={16} />
                <input
                  required
                  type="email"
                  placeholder="seu@email.com"
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-xl pl-11 pr-4 py-2.5 text-xs font-medium text-slate-200 focus:outline-none focus:border-blue-500 focus:bg-slate-950 transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Senha de Acesso</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 text-slate-500" size={16} />
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-xl pl-11 pr-11 py-2.5 text-xs font-medium text-slate-200 focus:outline-none focus:border-blue-500 focus:bg-slate-950 transition-all"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center pt-1">
              <button
                type="button"
                onClick={() => { setStep(1); setError(""); }}
                className="text-[11px] text-slate-500 hover:text-slate-300 font-semibold flex items-center gap-1 transition-colors"
              >
                <ArrowLeft size={12} /> Alterar CNPJ
              </button>
              <a href="#" className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold transition-colors">
                Esqueceu a senha?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white py-2.5 rounded-xl font-bold text-xs transition-all shadow-lg shadow-blue-600/10"
            >
              {loading ? "Autenticando credenciais..." : "Entrar no Sistema"}
            </button>
          </form>
        )}

        {/* RODAPÉ */}
        <div className="text-center pt-2">
          <p className="text-[10px] text-slate-600 font-medium">Prociber © 2026 • Todos os direitos reservados</p>
        </div>

      </div>
    </div>
  );
}