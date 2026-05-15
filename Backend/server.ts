import express from 'express';
import { PrismaClient } from '@prisma/client';
import cors from 'cors'; // 1. Importe o cors aqui

const app = express();
const prisma = new PrismaClient();
const port = 3001;

app.use(cors()); // 2. Libere o acesso para qualquer origem
app.use(express.json());


// Rota para listar todos os clientes (Visão da Matriz PRO CIBER)
app.get('/customers', async (req, res) => {
  try {
    const customers = await prisma.customer.findMany({
      include: {
        user: { // Isso traz os dados da Revenda vinculada
          select: {
            nome: true
          }
        }
      },
      orderBy: {
        razao_social: 'asc'
      }
    });
    
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar clientes' });
  }
});

app.listen(port, () => {
  console.log(`🚀 Servidor do Digita rodando em http://localhost:${port}`);
});