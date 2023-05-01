/*
  Warnings:

  - The primary key for the `logs` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Added the required column `ID` to the `Logs` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `GuildSettings` ADD COLUMN `Responses` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `Logs` DROP PRIMARY KEY,
    ADD COLUMN `ID` BIGINT NOT NULL AUTO_INCREMENT,
    ADD PRIMARY KEY (`ID`);
