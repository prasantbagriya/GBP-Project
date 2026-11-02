<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ExportSqlDump extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:export-sql {--file= : Destination file path}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Export full database schema and data into a standard .sql script file';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $targetFile = $this->option('file') ?: database_path('database.sql');
        $mysqlFile = database_path('mysql_import.sql');
        $this->info('Exporting MySQL-compatible SQL dump...');

        $tables = DB::connection('sqlite')->select("SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY CASE WHEN name = 'users' THEN 0 WHEN name = 'chat_widgets' THEN 1 WHEN name = 'chat_conversations' THEN 2 WHEN name = 'review_reports' THEN 3 ELSE 4 END, name ASC");

        $sql = "-- ==========================================================\n";
        $sql .= "-- GBP Application MySQL Database Dump for cPanel / phpMyAdmin\n";
        $sql .= "-- Database: coachtim_lara757\n";
        $sql .= '-- Generated: '.date('Y-m-d H:i:s')."\n";
        $sql .= "-- ==========================================================\n\n";
        $sql .= "SET FOREIGN_KEY_CHECKS = 0;\n";
        $sql .= "SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';\n";
        $sql .= "SET time_zone = '+00:00';\n\n";

        foreach ($tables as $table) {
            $tableName = $table->name;
            $this->line("Processing table: {$tableName}...");

            $sql .= "-- ----------------------------------------------------------\n";
            $sql .= "-- Table structure for `{$tableName}`\n";
            $sql .= "-- ----------------------------------------------------------\n";
            $sql .= "DROP TABLE IF EXISTS `{$tableName}`;\n";

            $mysqlDdl = $this->convertSqliteDdlToMysql($tableName, $table->sql);
            $sql .= $mysqlDdl."\n\n";

            $rows = DB::connection('sqlite')->table($tableName)->get();
            if ($rows->count() > 0) {
                $sql .= "-- Dumping data for table `{$tableName}` (".$rows->count()." rows)\n";
                foreach ($rows as $row) {
                    $arr = (array) $row;
                    $cols = array_keys($arr);
                    $escapedCols = array_map(fn ($c) => "`{$c}`", $cols);

                    $vals = array_map(function ($val) {
                        if ($val === null) {
                            return 'NULL';
                        }

                        return "'".str_replace("'", "''", (string) $val)."'";
                    }, array_values($arr));

                    $sql .= "INSERT INTO `{$tableName}` (".implode(', ', $escapedCols).') VALUES ('.implode(', ', $vals).");\n";
                }
                $sql .= "\n";
            }
        }

        $sql .= "SET FOREIGN_KEY_CHECKS = 1;\n";

        file_put_contents($targetFile, $sql);
        file_put_contents($mysqlFile, $sql);

        $sizeKb = round(filesize($targetFile) / 1024, 2);
        $this->info("MySQL Dump successfully exported to: {$targetFile} ({$sizeKb} KB)");

        return Command::SUCCESS;
    }

    /**
     * Convert SQLite CREATE TABLE DDL to standard MySQL 8+ syntax.
     */
    protected function convertSqliteDdlToMysql(string $tableName, string $sqliteSql): string
    {
        $ddl = preg_replace('/"([^"]+)"/', '`$1`', $sqliteSql);

        $ddl = preg_replace('/`id`\s+integer\s+primary\s+key\s+autoincrement\s+not\s+null/i', '`id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY', $ddl);
        $ddl = preg_replace('/`id`\s+integer\s+primary\s+key\s+autoincrement/i', '`id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY', $ddl);
        $ddl = preg_replace('/integer\s+primary\s+key\s+autoincrement/i', 'BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY', $ddl);

        $ddl = preg_replace('/\bvarchar\b(?!\s*\()/i', 'VARCHAR(255)', $ddl);
        $ddl = preg_replace('/\binteger\b/i', 'BIGINT', $ddl);

        // Ensure foreign key referencing columns ending in _id match parent BIGINT UNSIGNED
        $ddl = preg_replace('/(`[a-zA-Z0-9_]+_id`)\s+BIGINT\b/i', '$1 BIGINT UNSIGNED', $ddl);
        $ddl = preg_replace('/(`user_id`)\s+BIGINT\b/i', '$1 BIGINT UNSIGNED', $ddl);

        $ddl = rtrim(trim($ddl), ';');
        $ddl .= ' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;';

        return $ddl;
    }
}
