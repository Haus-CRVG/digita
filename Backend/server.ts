import express from "express";
import { PrismaClient } from "@prisma/client";
import cors from "cors";
import multer from "multer";
import csv from "csv-parser";
import { Readable } from "stream";

const app = express();
const prisma = new PrismaClient();
const port = 3001;

app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

// ==========================================
// ROTA DE AUTENTICAÇÃO (LOGIN) - TOTALMENTE ALINHADA
// ==========================================
app.post("/login", async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ error: "E-mail e senha são obrigatórios." });
    }

    // Busca o e-mail na tabela User (onde estão Matriz, Revendas e Integrantes/Técnicos)
    const user = await prisma.user.findUnique({
      where: { email: email.trim() },
    });

    if (!user) {
      return res.status(404).json({ error: "Nenhum usuário localizado com este e-mail." });
    }

    if (user.senha !== senha) {
      return res.status(401).json({ error: "Senha incorreta." });
    }

    if (user.status !== "Ativo") {
      return res.status(403).json({ error: "Este usuário ou integrante está inativo." });
    }

    // Se o role começar com "INTEGRANTE_", significa que ele é um Técnico/Subusuário vinculado a uma revenda
    if (user.role.startsWith("INTEGRANTE_")) {
      const revendaId = user.role.replace("INTEGRANTE_", "");

      // Busca os dados da Revenda Pai para garantir que ela está ativa
      const revendaPai = await prisma.user.findUnique({
        where: { id: revendaId }
      });

      if (!revendaPai) {
        return res.status(403).json({ error: "Revenda vinculada não localizada." });
      }

      if (revendaPai.status !== "Ativo") {
        return res.status(403).json({ error: "A revenda responsável por este usuário está bloqueada." });
      }

      return res.json({
        token: `mock-jwt-token-subuser-${user.id}`,
        role: "TECNICO", // Informa ao front que o nível de visualização é técnico
        userObj: {
          id: user.id,
          nome: user.nome,
          revendaId: revendaPai.id,    // Escopo de dados da revenda pai
          revendaNome: revendaPai.nome, // Nome da revenda pai (ex: HMC)
        }
      });
    }

    // Se não é integrante, é o Master da Revenda ou a própria Matriz Prociber
    return res.json({
      token: `mock-jwt-token-user-${user.id}`,
      role: user.role, // "MATRIZ" ou "REVENDA"
      userObj: {
        id: user.id,
        nome: user.nome,
        revendaId: user.id, // Para o master da revenda ou matriz, o ID do escopo é dele mesmo
        revendaNome: user.role === "MATRIZ" ? "Matriz" : user.nome,
      }
    });

  } catch (error) {
    console.error("Erro na rota de login:", error);
    res.status(500).json({ error: "Erro interno no servidor ao tentar logar." });
  }
});

// ==========================================
// ROTAS DE CLIENTES (CUSTOMERS)
// ==========================================

// Criar um cliente individualmente (Ajustado para vincular à revenda correta)
app.post("/customers", async (req, res) => {
  try {
    const {
      razao_social,
      cnpj_cpf,
      email,
      cidade,
      estado,
      telefone,
      status_cadastro,
      observacoes,
      revendaId // Recebe do frontend quem está criando para herdar o vínculo
    } = req.body;

    let targetUserId = revendaId;

    // Se por acaso não vier o ID da revenda, busca a matriz Prociber como fallback
    if (!targetUserId) {
      const fallbackUser = await prisma.user.findFirst({
        where: { email: "haus@prociber.com.br" },
      });
      targetUserId = fallbackUser?.id;
    }

    if (!targetUserId) {
      return res.status(400).json({ error: "Vínculo de revenda obrigatório para criar cliente." });
    }

    const newCustomer = await prisma.customer.create({
      data: {
        razao_social,
        cnpj_cpf,
        email,
        cidade: cidade || "",
        estado: estado || "",
        telefone: telefone || "",
        status_cadastro: status_cadastro || "Ativo",
        observacoes: observacoes || "",
        user_id: targetUserId,
      },
    });

    res.status(201).json(newCustomer);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: "Erro ao criar cliente", details: error.message });
  }
});

// Atualizar dados e observações do cliente
app.put("/customers/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      razao_social,
      cnpj_cpf,
      email,
      cidade,
      estado,
      telefone,
      status_cadastro,
      observacoes,
    } = req.body;

    const updatedCustomer = await prisma.customer.update({
      where: { id },
      data: {
        razao_social,
        cnpj_cpf,
        email,
        cidade,
        estado,
        telefone,
        status_cadastro,
        observacoes,
      },
    });

    res.json(updatedCustomer);
  } catch (error: any) {
    res.status(500).json({ error: "Erro ao atualizar cliente", details: error.message });
  }
});

// Importar CSV de clientes
app.post("/customers/import", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Nenhum arquivo enviado." });
    }

    const substituirParam = req.body.substituir === "true";
    const results: any[] = [];
    const stream = Readable.from(req.file.buffer.toString("utf-8"));

    stream
      .pipe(
        csv({
          mapHeaders: ({ header }) => header.trim().replace(/^\uFEFF/, ""),
        }),
      )
      .on("data", (data) => results.push(data))
      .on("end", async () => {
        let inseridos = 0;
        let updated = 0;
        let ignorados = 0;

        for (const row of results) {
          const nomeCliente = row["Cliente"] || row["cliente"];
          const documento = row["CPF/CNPJ"] || row["cpf/cnpj"];

          if (!nomeCliente || !documento) {
            ignorados++;
            continue;
          }

          const emailCliente = row["E-mail"] || row["email"] || "comercial@prociber.com.br";
          const revendaNome = row["Revenda"] || "PRO CIBER";
          const emailRevenda = `revenda.${revendaNome.toLowerCase().replace(/[^a-z0-9]/g, "")}@notafiscalpanta.com`;

          const revenda = await prisma.user.upsert({
            where: { email: emailRevenda },
            update: {},
            create: {
              nome: revendaNome,
              email: emailRevenda,
              senha: "mudar123",
              role: "REVENDA",
            },
          });

          const clienteExistente = await prisma.customer.findUnique({
            where: { cnpj_cpf: documento.trim() },
          });

          if (clienteExistente) {
            if (substituirParam) {
              await prisma.customer.update({
                where: { cnpj_cpf: documento.trim() },
                data: {
                  razao_social: nomeCliente.trim(),
                  email: emailCliente.trim(),
                  cidade: row["Cidade"] || "",
                  estado: row["Estado"] || "",
                  status_cadastro: (row["Status"] || "Ativo").trim(),
                  user_id: revenda.id,
                },
              });
              updated++;
            } else {
              ignorados++;
            }
          } else {
            await prisma.customer.create({
              data: {
                razao_social: nomeCliente.trim(),
                cnpj_cpf: documento.trim(),
                email: emailCliente.trim(),
                cidade: row["Cidade"] || "",
                estado: row["Estado"] || "",
                status_cadastro: (row["Status"] || "Ativo").trim(),
                observacoes: "",
                user_id: revenda.id,
              },
            });
            inseridos++;
          }
        }

        res.json({
          message: "Processamento concluído com sucesso!",
          inseridos,
          atualizados: updated,
          ignorados,
        });
      });
  } catch (error: any) {
    console.error("Erro na importação:", error);
    res.status(500).json({ error: "Erro interno ao importar CSV.", details: error.message });
  }
});

// ==========================================
// ROTAS DE REVENDAS (USERS com role REVENDA)
// ==========================================

// Criar nova revenda manualmente
app.post("/users/revendas", async (req, res) => {
  try {
    const { nome, cnpj, email, telefone, cidade, estado, senha, status } = req.body;
    const newRevenda = await prisma.user.create({
      data: {
        nome,
        email,
        senha: senha || "mudar123",
        role: "REVENDA",
        ...(cnpj && { cnpj }),
        ...(telefone && { telefone }),
        ...(cidade && { cidade }),
        ...(estado && { estado }),
        ...(status && { status }),
      } as any,
    });
    res.status(201).json(newRevenda);
  } catch (error: any) {
    res.status(500).json({ error: "Erro ao criar revenda", details: error.message });
  }
});

// Atualizar dados cadastrais da revenda
app.put("/users/revendas/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, cnpj, email, telefone, cidade, estado, senha, status } = req.body;
    const updated = await prisma.user.update({
      where: { id },
      data: {
        nome,
        email,
        senha,
        ...(cnpj && { cnpj }),
        ...(telefone && { telefone }),
        ...(cidade && { cidade }),
        ...(estado && { estado }),
        ...(status && { status }),
      } as any,
    });
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: "Erro ao atualizar revenda" });
  }
});

// Importar CSV de Revendas
app.post("/users/revendas/import", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Nenhum arquivo enviado." });
    const results: any[] = [];
    const stream = Readable.from(req.file.buffer.toString("utf-8"));

    stream
      .pipe(
        csv({
          mapHeaders: ({ header }) => header.trim().replace(/^\uFEFF/, ""),
        }),
      )
      .on("data", (data) => results.push(data))
      .on("end", async () => {
        let inseridos = 0;
        let ignorados = 0;

        for (const row of results) {
          const nomeRevenda = row["Revenda"] || row["revenda"];
          const emailRevenda = row["E-mail"] || row["email"];
          if (!nomeRevenda || !emailRevenda) {
            ignorados++;
            continue;
          }

          await prisma.user.upsert({
            where: { email: emailRevenda.trim() },
            update: {},
            create: {
              nome: nomeRevenda.trim(),
              email: emailRevenda.trim(),
              senha: "mudar123",
              role: "REVENDA",
              cnpj: row["CPF/CNPJ"] || "",
              cidade: row["Cidade"] || "",
              estado: row["Estado"] || "",
              status: row["Status"] || "Ativo",
            } as any,
          });
          inseridos++;
        }
        res.json({ inseridos, ignorados });
      });
  } catch (error) {
    res.status(500).json({ error: "Erro ao importar revendas" });
  }
});

// ==========================================
// ROTAS DE GERENCIAMENTO DE INTEGRANTES
// ==========================================

// Adicionar integrante à tabela User com tag de vínculo
app.post("/users/revendas/:revendaId/subusers", async (req, res) => {
  try {
    const { revendaId } = req.params;
    const { nome, email, telefone, senha } = req.body;

    const newSub = await prisma.user.create({
      data: {
        nome,
        email,
        senha,
        role: `INTEGRANTE_${revendaId}`,
        ...(telefone && { telefone }),
        status: "Ativo",
      } as any,
    });

    res.status(201).json({
      id: newSub.id,
      nome: newSub.nome,
      email: newSub.email,
      telefone: (newSub as any).telefone || "",
      senha: newSub.senha,
      status: (newSub as any).status || "Ativo",
    });
  } catch (error: any) {
    console.error("Erro ao criar funcionário:", error);
    res.status(500).json({
      error: "Erro ao criar integrante da equipe.",
      details: error.message,
    });
  }
});

// Atualizar um funcionário da revenda
app.put("/users/revendas/:revendaId/subusers/:subUserId", async (req, res) => {
  try {
    const { subUserId } = req.params;
    const { nome, email, telefone, senha, status } = req.body;

    const updatedSubUser = await prisma.user.update({
      where: { id: subUserId },
      data: {
        nome,
        email,
        senha,
        ...(telefone && { telefone }),
        status: status || "Ativo",
      } as any,
    });

    res.json({
      id: updatedSubUser.id,
      nome: updatedSubUser.nome,
      email: updatedSubUser.email,
      telefone: (updatedSubUser as any).telefone || "",
      senha: updatedSubUser.senha,
      status: (updatedSubUser as any).status || "Ativo",
    });
  } catch (error: any) {
    res.status(500).json({ error: "Erro ao atualizar dados do funcionário." });
  }
});

// Remover um funcionário da revenda
app.delete("/users/revendas/:revendaId/subusers/:subUserId", async (req, res) => {
  try {
    const { subUserId } = req.params;
    await prisma.user.delete({
      where: { id: subUserId },
    });
    res.json({ message: "Funcionário removido com sucesso!" });
  } catch (error: any) {
    res.status(500).json({ error: "Erro ao remover funcionário." });
  }
});

// ==========================================
// ROTA PARA VALIDAR SE O CPF/CNPJ EXISTE NO BANCO (Etapa 1 do Login)
// ==========================================
app.post("/auth/validate-document", async (req, res) => {
  try {
    const { cnpj_cpf } = req.body;

    if (!cnpj_cpf) {
      return res.status(400).json({ error: "Documento não informado." });
    }

    const revenda = await prisma.user.findUnique({
      where: { cnpj: cnpj_cpf.trim() },
    });

    if (revenda) {
      return res.json({
        exists: true,
        type: "REVENDA",
        nome: revenda.nome,
      });
    }

    return res.status(404).json({
      exists: false,
      error: "Nenhuma empresa localizada com este CPF/CNPJ.",
    });
  } catch (error) {
    console.error("Erro ao validar documento:", error);
    res.status(500).json({ error: "Erro interno no servidor." });
  }
});

// ==========================================
// LISTAR CLIENTES (FILTRADO POR ESCOPO)
// ==========================================
app.get("/customers", async (req, res) => {
  try {
    const { revendaId, role } = req.query;

    let whereClause = {};

    if (role !== "MATRIZ" && revendaId) {
      whereClause = {
        user_id: String(revendaId)
      };
    }

    const customers = await prisma.customer.findMany({
      where: whereClause,
      include: {
        user: { select: { nome: true } },
      },
      orderBy: { razao_social: "asc" },
    });

    res.json(customers);
  } catch (error) {
    console.error("Erro ao buscar clientes:", error);
    res.status(500).json({ error: "Erro ao buscar clientes" });
  }
});

// ==========================================
// LISTAR REVENDAS (FILTRADO POR ESCOPO)
// ==========================================
app.get("/users/revendas", async (req, res) => {
  try {
    const { revendaId, role } = req.query;

    let whereClause: any = {
      role: "REVENDA" 
    };

    if (role !== "MATRIZ" && revendaId) {
      whereClause = {
        id: String(revendaId)
      };
    }

    const revendas = await prisma.user.findMany({
      where: whereClause,
      orderBy: { nome: "asc" },
    });

    res.json(revendas);
  } catch (error) {
    console.error("Erro ao buscar revendas:", error);
    res.status(500).json({ error: "Erro ao buscar revendas" });
  }
});

// Inicialização alterada para dar o poder de "MATRIZ" à Prociber
app.listen(port, async () => {
  console.log(`🚀 Servidor rodando em http://localhost:${port}`);
  try {
    await prisma.user.upsert({
      where: { email: "haus@prociber.com.br" },
      update: { role: "MATRIZ" },
      create: {
        nome: "PRO CIBER",
        email: "haus@prociber.com.br",
        senha: "mudar123",
        role: "MATRIZ",
      },
    });
  } catch (e) {}
});