import fs from "fs";
import csv from "csv-parser";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const results: any[] = [];
  console.log(
    "--- Iniciando Leitura do CSV (Modo Diagnóstico Inteligente) ---",
  );

  // Certifique-se de que o arquivo .csv está na raiz da pasta Backend com este nome exato
  fs.createReadStream("clientesExportar (2).csv")
    .pipe(
      csv({
        mapHeaders: ({ header }) => header.trim().replace(/^\uFEFF/, ""), // Remove caracteres invisíveis do Excel (BOM)
      }),
    )
    .on("data", (data) => results.push(data))
    .on("end", async () => {
      console.log(`${results.length} linhas lidas.`);

      for (const row of results) {
        try {
          const nomeCliente = row["Cliente"] || row["cliente"];
          const documento = row["CPF/CNPJ"] || row["cpf/cnpj"];

          if (!nomeCliente || !documento) {
            continue;
          }

          const emailCliente =
            row["E-mail"] || row["email"] || "comercial@prociber.com.br";
          const revendaNome = row["Revenda"] || "PRO CIBER";

          // Mapeamento de status baseado na planilha ou definindo 'Ativo' como padrão inicial
          const statusPlanilha = row["Status"] || row["status"] || "Ativo";

          // 1. Garante que a revenda exista para não quebrar a chave estrangeira
          const emailRevenda = `${revendaNome.toLowerCase().replace(/\s/g, "")}@digita.com`;
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

          // 2. IMPORTAÇÃO INTELIGENTE: Atualiza dados e status mantendo as observações a salvo
          await prisma.customer.upsert({
            where: { cnpj_cpf: documento.trim() },
            update: {
              razao_social: nomeCliente.trim(),
              email: emailCliente.trim(),
              cidade: row["Cidade"] || "",
              estado: row["Estado"] || "",
              status_cadastro: statusPlanilha.trim(),
              // O campo 'observacoes' fica de fora do update para o CSV não apagar o que você digitou na tela!
            },
            create: {
              razao_social: nomeCliente.trim(),
              cnpj_cpf: documento.trim(),
              email: emailCliente.trim(),
              cidade: row["Cidade"] || "",
              estado: row["Estado"] || "",
              status_cadastro: statusPlanilha.trim(),
              observacoes: "", // Nasce vazio se for um cliente inédito
              user_id: revenda.id,
            },
          });

          console.log(`✅ Processado com Sucesso: ${nomeCliente}`);
        } catch (err) {
          console.error(`❌ Erro no processamento desta linha:`, err);
        }
      }

      console.log("--- Importação e Sincronização Concluídas com Sucesso! ---");
      await prisma.$disconnect();
    });
}

main().catch(console.error);
