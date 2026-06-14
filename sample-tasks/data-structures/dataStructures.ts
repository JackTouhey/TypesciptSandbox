import pool from '../utils/getConnectionPool';

const sampleQuery: string = 'select owner.ownerid, owner.ownername, pet.petid, pet.petname, pet.ownerid from "owner" cross join pet where owner.ownerid = pet.ownerid';
const primaryKeyName: string = 'ownerid';

async function runQuery(query: string): Promise<Record<string, unknown>[]> {
    try {
        const resultSet = await pool.query(query);
        console.log(resultSet.rows[0]);
        return resultSet.rows;
    } catch (error) {
        console.error('Error executing query:', error);
        throw error;
    }
}

function processData(resultSet: Record<string, unknown>[], primaryKeyName: string) {
    if (!resultSet.length) return;

    const keySet: string[] = extractKeys(resultSet[0] as Record<string, unknown>);
    const tableAKeys: string[] = extractTableAKeys(resultSet as Record<string, unknown>[], keySet, primaryKeyName);
    console.log(keySet);
    console.log(tableAKeys);
}

function extractKeys(resultSet: Record<string, unknown>): string[] {
    return Object.keys(resultSet); 
}

function extractTableAKeys(resultSet: Record<string, unknown>[], keySet: string[], primaryKeyName: string): string[] {
    let tableAKeys: string[] = [];
    for (let index = 1; index < resultSet.length; index++) {
        const previousRow = resultSet[index - 1];
        const currentRow = resultSet[index];

        if (previousRow !== undefined && currentRow !== undefined) {
            const previousPrimaryValue = previousRow[primaryKeyName];
            const currentRowPrimaryValue = currentRow[primaryKeyName];

            if (previousPrimaryValue === currentRowPrimaryValue) {
                for (const key of keySet) {
                    if (previousRow[key] === currentRow[key]) {
                        tableAKeys.push(key);
                    }
                }
                if (tableAKeys.length > 0) {
                    break;
                }
            }       
        }
    }
    return tableAKeys;
}

async function run() {
    processData(await runQuery(sampleQuery), 'ownerid');
}

run();