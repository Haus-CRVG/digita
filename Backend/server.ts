import express from "express";
import { PrismaClient } from "@prisma/client";
import cors from "cors"; // 1. Importe o cors aqui

const app = express();
const prisma = new PrismaClient();
const port = 3001;

app.use(cors()); // 2. Libere o acesso para qualquer origem
app.use(express.json());

// Rota para listar todos os clientes (Visão da Matriz PRO CIBER)
app.get("/customers", async (req, res) => {
  try {
    const customers = await prisma.customer.findMany({
      include: {
        user: {
          // Isso traz os dados da Revenda vinculada
          select: {
            nome: true,
          },
        },
      },
      orderBy: {
        razao_social: "asc",
      },
    });

    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar clientes" });
  }
});

app.post('/customers', async (req, res) => {
  try {
    // Pegamos 'email' diretamente da requisição
    const { razao_social, cnpj_cpf, email, cidade, estado, telefone } = req.body;

    // Buscamos o primeiro usuário cadastrado para vincular
    const primeiroUsuario = await prisma.user.findFirst();

    if (!primeiroUsuario) {
      return res.status(400).json({ error: 'Nenhum usuário cadastrado no sistema.' });
    }

    // Criamos o cliente com o campo unificado 'email'
    const customer = await prisma.customer.create({
      data: { 
        razao_social, 
        cnpj_cpf, 
        email, // Salvando no campo correto
        cidade, 
        estado, 
        telefone,
        userId: primeiroUsuario.id 
      }
    });
    
    res.status(201).json(customer);
  } catch (error: any) {
    console.error("Erro interno no servidor:", error);
    res.status(500).json({ error: 'Erro ao criar cliente.', details: error.message });
  }
});

app.listen(port, () => {
  console.log(`🚀 Servidor do Digita rodando em http://localhost:${port}`);
});
