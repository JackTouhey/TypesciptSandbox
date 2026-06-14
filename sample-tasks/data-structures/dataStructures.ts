import pool from '../utils/getConnectionPool';

const query: string = 'select owner.ownerid, owner.ownername, pet.petid, pet.petname, pet.ownerid from "owner" cross join pet where owner.ownerid = pet.ownerid';


async function runQuery(query: string): Promise<object[]> {
    try {
        const resultSet = await pool.query(query);
        return resultSet.rows;
    } catch (error) {
        console.error('Error executing query:', error);
        throw error;
    }
}

async function extractKeys(): Promise<string[]> {
    const resultSet = await runQuery(query);
    // Check if array exists and is not empty, then return keyset
    return (!Array.isArray(resultSet) || !resultSet.length) ? [] : Object.keys(resultSet[0] as string[]); 
}

async function printKeys(){
    console.log(await extractKeys())
}

async function processData(resultSet: object, primaryKeyName: string | number) {
    const keySet = Object.keys(resultSet);
    console.log(keySet);
}


printKeys();