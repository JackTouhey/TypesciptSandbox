import { Pool } from "pg";

// Understanding this is a very very rough database connection
const HOST = 'localhost';
const USER = 'root';
const PASSWORD = 'root';
const DBNAME = 'compound_direct';
const PORT = 42069;

const pool = new Pool({
    user: USER,
    host: HOST,
    database: DBNAME,
    password: PASSWORD,
    port: PORT,
});

export default pool;