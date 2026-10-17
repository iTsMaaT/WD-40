const fs = require("node:fs");

function migrateSqlite(db) {
    const migrationTableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='Migrations';");
    const result = migrationTableExists.get();
    if (result === undefined) 
        db.exec("CREATE TABLE `Migrations` (`Name` TEXT NOT NULL, `Ran` INTEGER NOT NULL);");
    

    const files = fs.readdirSync(__dirname + "/../../migrations/sqlite");
    const migrationWasRan = db.prepare("SELECT `Ran` FROM `Migrations` WHERE `Name` = @name LIMIT 1;");
    const addMigration = db.prepare("INSERT INTO `Migrations` (`Name`, `Ran`) VALUES (@name, @ran);");

    for (const f of files) {
        // eslint-disable-next-line no-shadow
        const result = migrationWasRan.get({ name: f });
        if (result === undefined) {
            const content = fs.readFileSync(__dirname + "/../../migrations/sqlite/" + f, "utf8");
            db.exec(content);
            addMigration.run({ name: f, ran: Date.now() });
        }
    }
}

async function migrateMysql(db) {
    const [countMigrationTable] = await db.query("SELECT COUNT(TABLE_NAME) AS `count` FROM information_schema.TABLES WHERE TABLE_NAME = 'Migrations';");
    if (countMigrationTable[0].count == 0) 
        await db.query("CREATE TABLE `Migrations` (`Name` VARCHAR(255) NOT NULL, `Ran` INT(11) NOT NULL) ENGINE = InnoDB COLLATE = utf8mb4_unicode_ci;");
    

    const files = fs.readdirSync(__dirname + "/../../migrations/mysql");
    const migrationWasRan = await db.prepare("SELECT `Ran` FROM `Migrations` WHERE `Name` = ? LIMIT 1;");
    const addMigration = await db.prepare("INSERT INTO `Migrations` (`Name`, `Ran`) VALUES (?, ?);");

    for (const f of files) {
        const [result] = await migrationWasRan.execute([f]);
        if (result.length == 0) {
            const content = fs.readFileSync(__dirname + "/../../migrations/mysql/" + f, "utf8");
            const queries = content.split(";").map(v => v.trim());
            for (const q of queries) {
                if (q == "") continue;
                await db.query(q);
            }
            addMigration.execute([f, Date.now()]);
        }
    }

}

module.exports = { migrateMysql, migrateSqlite };
