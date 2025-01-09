-- CreateTable
CREATE TABLE "Sender" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "guild_id" TEXT NOT NULL,
    "channel_id" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Receiver" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "guild_id" TEXT NOT NULL,
    "channel_id" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Sender_guild_id_key" ON "Sender"("guild_id");

-- CreateIndex
CREATE UNIQUE INDEX "Sender_channel_id_key" ON "Sender"("channel_id");

-- CreateIndex
CREATE UNIQUE INDEX "Receiver_guild_id_key" ON "Receiver"("guild_id");

-- CreateIndex
CREATE UNIQUE INDEX "Receiver_channel_id_key" ON "Receiver"("channel_id");
