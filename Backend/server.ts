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
// ROTAS DE CLIENTES (CUSTOMERS)
// ==========================================

// Listar todos os clientes
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

// Criar um cliente individualmente
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
    } = req.body;

    // Vincula a uma revenda padrão temporária caso não venha informada
    let usuarioVinculo = await prisma.user.findFirst({
      where: { email: "haus@prociber.com.br" }
    });

    if (!usuarioVinculo) {
      usuarioVinculo = await prisma.user.create({
        data: {
          nome: "PRO CIBER MATRIZ",
          email: "haus@prociber.com.br",
          senha: "mudar123",
          role: "REVENDA"
        }
      });
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
        user_id: usuarioVinculo.id,
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
        })
      )
      .on("data", (data) => results.push(data))
      .on("end", async () => {
        let inseridos = 0;
        let atualizados = 0;
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
          atualizados,
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

// Listar todas as revendas
app.get("/users/revendas", async (req, res) => {
  try {
    const revendas = await prisma.user.findMany({
      where: { role: "REVENDA" },
      orderBy: { nome: "asc" }
    });
    // Força mapeamento caso o schema use 'role' mas o front espere propriedades adicionais
    const mapped = revendas.map((r: any) => ({
      id: r.id,
      nome: r.nome,
      cnpj: r.cnpj || "00.000.000/0001-00", // fallback se campo opcional não existir
      email: r.email,
      telefone: r.telefone || "",
      cidade: r.cidade || "Cascavel",
      estado: r.estado || "PR",
      status: r.status || "Ativo",
      senha: r.senha
    }));
    res.json(mapped);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar revendas" });
  }
});

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
        // Se seu schema estendeu o User com esses campos adicionais, eles serão salvos:
        ...(cnpj && { cnpj }),
        ...(telefone && { telefone }),
        ...(cidade && { cidade }),
        ...(estado && { estado }),
        ...(status && { status })
      } as any
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
        ...(status && { status })
      } as any
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
      .pipe(csv({ mapHeaders: ({ header }) => header.trim().replace(/^\uFEFF/, "") }))
      .on("data", (data) => results.push(data))
      .on("end", async () => {
        let inseridos = 0;
        let ignorados = 0;

        for (const row of results) {
          const nomeRevenda = row["Revenda"] || row["revenda"];
          const emailRevenda = row["E-mail"] || row["email"];
          if (!nomeRevenda || !emailRevenda) { ignorados++; continue; }

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
              status: row["Status"] || "Ativo"
            } as any
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
// ROTAS DE GERENCIAMENTO DE INTEGRANTES (SUBUSERS)
// ==========================================

// Listar sub-usuários de uma revenda específica
app.get("/users/revendas/:revendaId/subusers", async (req, res) => {
  try {
    const { revendaId } = req.params;
    // Caso use uma tabela dedicada SubUser ou filtre por uma relação no User:
    // Se estiver usando uma tabela dedicada 'subUser' no prisma:
    const subUsers = await (prisma as any).subUser.findMany({
      where: { revendaId: revendaId }
    });
    res.json(subUsers);
  } catch (error) {
    // Se o modelo dinâmico falhar ou não estiver migrado, retorna array vazio para não quebrar o front
    res.json([]);
  }
});

// Adicionar um novo funcionário à revenda
app.post("/users/revendas/:revendaId/subusers", async (req, res) => {
  try {
    const { revendaId } = req.params;
    const { nome, email, telefone, senha } = req.body;

    const newSub = await (prisma as any).subUser.create({
      data: {
        nome,
        email,
        telefone,
        senha,
        status: "Ativo",
        revendaId: revendaId
      }
    });
    res.status(201).json(newSub);
  } catch (error) {
    res.status(500).json({ error: "Erro ao criar integrante da equipe." });
  }
});

// Atualizar um funcionário da revenda (Ativar/Inativar/Editar)
app.put("/users/revendas/:revendaId/subusers/:subUserId", async (req, res) => {
  try {
    const { subUserId } = req.params;
    const { nome, email, telefone, senha, status } = req.body;

    const updatedSubUser = await (prisma as any).subUser.update({
      where: { id: subUserId },
      data: { nome, email, telefone, senha, status: status || "Ativo" }
    });

    res.json(updatedSubUser);
  } catch (error: any) {
    res.status(500).json({ error: "Erro ao atualizar dados do funcionário." });
  }
});

// Remover um funcionário da revenda
app.delete("/users/revendas/:revendaId/subusers/:subUserId", async (req, res) => {
  try {
    const { subUserId } = req.params;
    await (prisma as any).subUser.delete({
      where: { id: subUserId }
    });
    res.json({ message: "Funcionário removido com sucesso!" });
  } catch (error: any) {
    res.status(500).json({ error: "Erro ao remover funcionário." });
  }
});


app.listen(port, async () => {
  console.log(`🚀 Servidor rodando em http://localhost:${port}`);
  try {
    await prisma.user.upsert({
      where: { email: "haus@prociber.com.br" },
      update: {},
      create: {
        nome: "PRO CIBER",
        email: "haus@prociber.com.br",
        senha: "mudar123",
        role: "REVENDA",
      },
    });
  } catch (e) {}
});