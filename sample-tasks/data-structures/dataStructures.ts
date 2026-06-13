import pool from '../utils/getConnectionPool';

const query = 'select owner.ownerid, owner.ownername, pet.petid, pet.petname, pet.ownerid from "owner" cross join pet where owner.ownerid = pet.ownerid';


async function runQuery(query: string) {
    try {
        const resultSet = await pool.query(query);
        console.log(resultSet.rows[0]);
    } catch (error) {
        console.error('Error executing query:', error);
        throw error;
    }
}

runQuery(query);