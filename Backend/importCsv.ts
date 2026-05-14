import fs from 'fs';
import csv from 'csv-parser';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const results: any[] = [];
  console.log('--- Iniciando Leitura do CSV (Modo Diagnóstico) ---');

  fs.createReadStream('clientesExportar (2).csv')
    .pipe(csv({
      mapHeaders: ({ header }) => header.trim().replace(/^\uFEFF/, '') // Remove o lixo do Excel (BOM)
    })) 
    .on('data', (data) => results.push(data))
    .on('end', async () => {
      console.log(`${results.length} linhas lidas.`);

      if (results.length > 0) {
        console.log('Exemplo da primeira linha lida:', results[0]);
      }

      for (const row of results) {
        try {
          // Mapeamento direto conforme o seu arquivo enviado
          const nomeCliente = row['Cliente'] || row['cliente'];
          const documento = row['CPF/CNPJ'] || row['cpf/cnpj'];

          // Se não encontrar o nome, tenta ver se as chaves do objeto estão estranhas
          if (!nomeCliente) {
             // Log apenas para a primeira falha para não inundar o terminal
             continue; 
          }

          const emailFinanceiro = row['E-mail'] || row['email'] || 'pendente@email.com';
          const revendaNome = row['Revenda'] || 'PRO CIBER';

          // 1. Upsert da Revenda
          const emailRevenda = `${revendaNome.toLowerCase().replace(/\s/g, '')}@digita.com`;
          const revenda = await prisma.user.upsert({
            where: { email: emailRevenda },
            update: {},
            create: {
              nome: revendaNome,
              email: emailRevenda,
              senha: 'mudar123',
              role: 'REVENDA'
            }
          });

          // 2. Upsert do Cliente
          await prisma.customer.upsert({
            where: { cnpj_cpf: documento.trim() },
            update: {
              razao_social: nomeCliente.trim(),
              email_financeiro: emailFinanceiro.trim(),
              cidade: row['Cidade'] || '',
              estado: row['Estado'] || '',
            },
            create: {
              razao_social: nomeCliente.trim(),
              cnpj_cpf: documento.trim(),
              email_financeiro: emailFinanceiro.trim(),
              cidade: row['Cidade'] || '',
              estado: row['Estado'] || '',
              status_cadastro: 'PENDENTE',
              user_id: revenda.id
            }
          });

          console.log(`✅ Gravado: ${nomeCliente}`);
        } catch (err) {
          console.error(`❌ Erro no processamento:`, err);
        }
      }

      console.log('--- Importação Concluída no Railway! ---');
      await prisma.$disconnect();
    });
}

main().catch(console.error);