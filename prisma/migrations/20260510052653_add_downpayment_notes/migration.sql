-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT
);

-- CreateTable
CREATE TABLE "Quotation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nomorSurat" TEXT NOT NULL,
    "nomorUrut" INTEGER NOT NULL,
    "tanggal" TEXT NOT NULL,
    "namaKlien" TEXT NOT NULL,
    "up" TEXT,
    "lokasi" TEXT,
    "namaPenandatangan" TEXT NOT NULL,
    "jabatanPenandatangan" TEXT NOT NULL,
    "phonePenandatangan" TEXT,
    "ttdStempelUrl" TEXT,
    "logoUrl" TEXT,
    "showLingkupKerja" BOOLEAN NOT NULL DEFAULT true,
    "showSyaratGaransi" BOOLEAN NOT NULL DEFAULT true,
    "isHargaSatuanMode" BOOLEAN NOT NULL DEFAULT false,
    "isJasaBahanMode" BOOLEAN NOT NULL DEFAULT false,
    "isMaterialOnlyMode" BOOLEAN NOT NULL DEFAULT false,
    "kenakanPPN" BOOLEAN NOT NULL DEFAULT false,
    "diskon" REAL NOT NULL DEFAULT 0,
    "totalHarga" REAL NOT NULL DEFAULT 0,
    "termin" TEXT NOT NULL,
    "lingkupKerja" TEXT NOT NULL,
    "syaratGaransi" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "QuotationItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quotationId" TEXT NOT NULL,
    "deskripsi" TEXT NOT NULL,
    "bahan" TEXT,
    "volume" REAL NOT NULL DEFAULT 0,
    "satuan" TEXT NOT NULL DEFAULT 'm²',
    "harga" REAL NOT NULL DEFAULT 0,
    "hargaBahan" REAL NOT NULL DEFAULT 0,
    "hargaJasa" REAL NOT NULL DEFAULT 0,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "QuotationItem_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MasterItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deskripsi" TEXT NOT NULL,
    "bahan" TEXT,
    "satuan" TEXT NOT NULL DEFAULT 'm²',
    "harga" REAL NOT NULL DEFAULT 0,
    "hargaBahan" REAL NOT NULL DEFAULT 0,
    "hargaJasa" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "GlobalSetting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Signatory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nama" TEXT NOT NULL,
    "jabatan" TEXT NOT NULL,
    "phone" TEXT,
    "ttdUrl" TEXT,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceNumber" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" DATETIME,
    "clientName" TEXT NOT NULL,
    "clientAddress" TEXT NOT NULL,
    "subtotal" DECIMAL NOT NULL DEFAULT 0,
    "taxRate" DECIMAL NOT NULL DEFAULT 0.11,
    "taxApplied" BOOLEAN NOT NULL DEFAULT false,
    "taxAmount" DECIMAL NOT NULL DEFAULT 0,
    "discountAmount" DECIMAL NOT NULL DEFAULT 0,
    "downPayment" DECIMAL NOT NULL DEFAULT 0,
    "notes" TEXT,
    "total" DECIMAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "InvoiceItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL NOT NULL,
    "lineTotal" DECIMAL NOT NULL DEFAULT 0,
    "invoiceId" TEXT NOT NULL,
    CONSTRAINT "InvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "MasterItem_deskripsi_key" ON "MasterItem"("deskripsi");

-- CreateIndex
CREATE UNIQUE INDEX "Signatory_nama_key" ON "Signatory"("nama");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");
