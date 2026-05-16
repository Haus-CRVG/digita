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

// Configuração básica do Multer para ler o arquivo temporariamente na memória
const upload = multer({ storage: multer.memoryStorage() });

// Rota para listar todos os clientes
app.get("/customers", async (req, res) => {
  try {
    const customers = await prisma.customer.findMany({
      include: {
        user: { select: { nome: true } },
      },
      orderBy: { razao_social: "asc" },
    });
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar clientes" });
  }
});

// Rota para criar um cliente individualmente pelo formulário
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
      observacoes, // Recebe o campo do frontend
    } = req.body;

    let usuarioVinculo = await prisma.user.findFirst();

    if (!usuarioVinculo) {
      usuarioVinculo = await prisma.user.create({
        data: {
          nome: "Revenda Padrão Pro Ciber",
          email: "admin@prociber.com.br",
          senha: "mudar123",
          role: "REVENDA",
        },
      });
    }

    const customer = await prisma.customer.create({
      data: {
        razao_social,
        cnpj_cpf,
        email,
        cidade,
        estado,
        telefone,
        status_cadastro: status_cadastro || "Ativo",
        observacoes: observacoes || "", // Grava no banco com sucesso
        user_id: usuarioVinculo.id,
      },
    });

    res.status(201).json(customer);
  } catch (error: any) {
    console.error("Erro detalhado no servidor:", error);
    res
      .status(500)
      .json({ error: "Erro ao criar cliente.", details: error.message });
  }
});

// Rota Inteligente de Importação via Dashboard
app.post(
  "/customers/import",
  upload.single("file"),
  async (req: any, res: any) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Nenhum arquivo enviado." });
      }

      const substituirExistentes = req.body.substituir === "true";
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
          let atualizados = 0;
          let ignorados = 0;

          let revenda = await prisma.user.findFirst({
            where: { role: "REVENDA" },
          });

          if (!revenda) {
            revenda = await prisma.user.create({
              data: {
                nome: "PRO CIBER",
                email: "comercial@prociber.com.br",
                senha: "mudar123",
                role: "REVENDA",
              },
            });
          }

          for (const row of results) {
            const nomeCliente = row["Cliente"] || row["cliente"];
            const documento = row["CPF/CNPJ"] || row["cpf/cnpj"];

            if (!nomeCliente || !documento) {
              ignorados++;
              continue;
            }

            const emailCliente =
              row["E-mail"] || row["email"] || "comercial@prociber.com.br";
            const statusPlanilha = row["Status"] || row["status"] || "Ativo";

            const clienteExistente = await prisma.customer.findUnique({
              where: { cnpj_cpf: documento.trim() },
            });

            if (clienteExistente) {
              if (substituirExistentes) {
                await prisma.customer.update({
                  where: { cnpj_cpf: documento.trim() },
                  data: {
                    razao_social: nomeCliente.trim(),
                    email: emailCliente.trim(),
                    cidade: row["Cidade"] || "",
                    estado: row["Estado"] || "",
                    status_cadastro: statusPlanilha.trim(),
                  },
                });
                atualizados++;
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
                  status_cadastro: statusPlanilha.trim(),
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
            atualizados,
            ignorados,
          });
        });
    } catch (error: any) {
      console.error("Erro na importação:", error);
      res.status(500).json({
        error: "Erro interno ao importar CSV.",
        details: error.message,
      });
    }
  },
);

// Rota para Atualizar Status e Dados (Engrenagem da Tabela Clientes)
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
    console.error("Erro ao atualizar cliente:", error);
    res.status(500).json({ error: "Erro ao atualizar os dados do cliente" });
  }
});

// ==========================================
// ROTA DE AUTENTICAÇÃO (LOGIN)
// ==========================================
app.post("/auth/login", async (req, res) => {
  try {
    const { email, senha } = req.body;

    const user = await prisma.user.findUnique({
      where: { email: email.trim() },
    });

    if (!user || user.senha !== senha) {
      return res.status(401).json({ error: "E-mail ou senha inválidos." });
    }

    if (user.status !== "Ativo") {
      return res
        .status(403)
        .json({ error: "Este usuário está suspenso ou congelado." });
    }

    res.json({
      id: user.id,
      nome: user.nome,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    res.status(500).json({ error: "Erro ao realizar login." });
  }
});

// ==========================================
// ROTAS DE GERENCIAMENTO DE REVENDAS
// ==========================================
app.get("/users/revendas", async (req, res) => {
  try {
    const revendas = await prisma.user.findMany({
      where: { role: "REVENDA" },
      orderBy: { nome: "asc" },
    });
    res.json(revendas);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar revendas." });
  }
});

// Cadastro manual com suporte ao campo Telefone
app.post("/users/revendas", async (req, res) => {
  try {
    const { nome, email, senha, cnpj, telefone, cidade, estado, status } = req.body;

    const novaRevenda = await prisma.user.create({
      data: {
        nome,
        email,
        senha: senha || "mudar123",
        cnpj,
        telefone: telefone || "", // Gravando telefone enviado do front
        cidade,
        estado,
        status: status || "Ativo",
        role: "REVENDA",
      },
    });

    res.status(201).json(novaRevenda);
  } catch (error: any) {
    res
      .status(500)
      .json({ error: "Erro ao criar revenda.", details: error.message });
  }
});

// Importação do CSV de Revendas protegendo e mapeando campos
app.post(
  "/users/revendas/import",
  upload.single("file"),
  async (req: any, res: any) => {
    try {
      if (!req.file)
        return res.status(400).json({ error: "Nenhum arquivo enviado." });

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
            const cnpjRevenda = row["CPF/CNPJ"] || row["cpf/cnpj"];
            const telRevenda = row["Telefone"] || row["telefone"] || "";

            if (!nomeRevenda || !emailRevenda) {
              ignorados++;
              continue;
            }

            const existente = await prisma.user.findUnique({
              where: { email: emailRevenda.trim() },
            });

            if (!existente) {
              await prisma.user.create({
                data: {
                  nome: nomeRevenda.trim(),
                  email: emailRevenda.trim(),
                  senha: "mudar123",
                  cnpj: cnpjRevenda ? cnpjRevenda.trim() : null,
                  telefone: telRevenda.trim(),
                  cidade: row["Cidade"] || "",
                  estado: row["Estado"] || "",
                  status: row["Status"] || "Ativo",
                  role: "REVENDA",
                },
              });
              inseridos++;
            } else {
              ignorados++;
            }
          }

          res.json({ message: "Importação concluída!", inseridos, ignorados });
        });
    } catch (error: any) {
      res
        .status(500)
        .json({ error: "Erro interno na importação.", details: error.message });
    }
  },
);

// Atualizar dados da revenda via engrenagem
app.put("/users/revendas/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, cnpj, email, telefone, cidade, estado, status, senha } = req.body;

    const revendaAtualizada = await prisma.user.update({
      where: { id },
      data: {
        nome,
        cnpj,
        email,
        telefone,
        cidade,
        estado,
        status,
        senha,
      },
    });
    res.json(revendaAtualizada);
  } catch (error: any) {
    res.status(500).json({ error: "Erro ao atualizar dados da revenda." });
  }
});

// Listar Funcionários de uma Revenda específica
app.get("/users/revendas/:id/subusers", async (req, res) => {
  try {
    const { id } = req.params;
    const subUsers = await prisma.subUser.findMany({
      where: { user_id: id },
      orderBy: { nome: "asc" },
    });
    res.json(subUsers);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar funcionários da revenda." });
  }
});

// Criar um Funcionário associado à revenda
app.post("/users/revendas/:id/subusers", async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, email, senha, telefone } = req.body;

    const novoFuncionario = await prisma.subUser.create({
      data: {
        nome,
        email,
        senha,
        telefone,
        user_id: id,
      },
    });
    res.status(201).json(novoFuncionario);
  } catch (error: any) {
    res
      .status(500)
      .json({
        error: "Erro ao cadastrar funcionário.",
        details: error.message,
      });
  }
});

app.listen(port, async () => {
  console.log(`🚀 Servidor rodando em http://localhost:${port}`);

  try {
    await prisma.user.upsert({
      where: { email: "haus@prociber.com.br" },
      update: {},
      create: {
        nome: "PROCIBER SEGURANÇA DIGITAL",
        email: "haus@prociber.com.br",
        senha: "admin",
        role: "MATRIZ",
        status: "Ativo",
      },
    });
    console.log("🔒 Usuário Administrador (Matriz) verificado/criado.");
  } catch (e) {
    console.error("Erro ao criar usuário administrador padrão:", e);
  }
});