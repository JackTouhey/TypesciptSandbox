import pool from '../utils/getConnectionPool';

const query: string = 'select owner.ownerid, owner.ownername, pet.petid, pet.petname, pet.ownerid from "owner" cross join pet where owner.ownerid = pet.ownerid';


async function runQuery(query: string): Promise<object[]> {
    try {
        const resultSet = await pool.query(query);
        console.log(resultSet.rows[0]);
        console.log(Object.keys(resultSet.rows[0]));
        return resultSet.rows;
    } catch (error) {
        console.error('Error executing query:', error);
        throw error;
    }
}

const resultSet = runQuery(query);

// console.log(resultSet[0]);

function processData(resultSet: object, primaryKeyName: string | number) {
    const keySet = Object.keys(resultSet);
    console.log(keySet);
}


// processData(runQuery(query), 'pk');