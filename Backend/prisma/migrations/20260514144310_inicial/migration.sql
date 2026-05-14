-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'REVENDA',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "empresa" TEXT NOT NULL,
    "contato" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'LEAD',
    "data_criacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "razao_social" TEXT NOT NULL,
    "cnpj_cpf" TEXT NOT NULL,
    "email_financeiro" TEXT NOT NULL,
    "telefone" TEXT,
    "cidade" TEXT,
    "estado" TEXT,
    "status_cadastro" TEXT NOT NULL DEFAULT 'PENDENTE',
    "user_id" TEXT NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contract" (
    "id" TEXT NOT NULL,
    "valor" DECIMAL(65,30) NOT NULL,
    "periodicidade" TEXT NOT NULL,
    "dia_vencimento" INTEGER NOT NULL,
    "customer_id" TEXT NOT NULL,

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_cnpj_cpf_key" ON "Customer"("cnpj_cpf");

-- CreateIndex
CREATE UNIQUE INDEX "Contract_customer_id_key" ON "Contract"("customer_id");

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
