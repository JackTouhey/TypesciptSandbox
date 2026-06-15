import pool from '../utils/getConnectionPool.ts';
import {inspect} from 'node:util';

const sampleQuery: string = 'select owner.ownerid, owner.ownername, pet.petid, pet.petname, pet.ownerid from "owner" cross join pet where owner.ownerid = pet.ownerid';
const primaryKeyName: string = 'ownerid';

async function runQuery(query: string): Promise<Record<string, unknown>[]> {
    try {
        const resultSet = await pool.query(query);
        return resultSet.rows;
    } catch (error) {
        console.error('Error executing query:', error);
        throw error;
    }
}

function processData(resultSet: Record<string, unknown>[], primaryKeyName: string): object[] {
    if (!resultSet.length) return [];

    const keySet: string[] = extractKeys(resultSet[0] as Record<string, unknown>);
    const tableAKeys: string[] = extractTableAKeys(resultSet as Record<string, unknown>[], keySet, primaryKeyName);
    const tableBKeys: string[] = extractTableBKeys(keySet, tableAKeys);

    const constructedObjects: object[] = buildObjects(resultSet, tableAKeys, tableBKeys, primaryKeyName);
    
    return constructedObjects;
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

            // Once 2 rows from tableA are found, extract all keys that have the same value between the two rows 
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

function extractTableBKeys(keySet: string[], tableAKeys: string[]): string[] {
    const tableBKeys: string[] = [];
    for (const key of keySet) {
        if (!tableAKeys.includes(key)) {
            tableBKeys.push(key);
        }
    }
    return tableBKeys;
}

function buildObjects(resultSet: Record<string, unknown>[], tableAKeys: string[], tableBKeys: string[], primaryKey: string): object[] {
    const tableAObjects: object[] = [];
    try {
        for (let index = 0; index < resultSet.length; index++) {
            let currentRow = resultSet[index];

            if (currentRow === undefined) {
                break;
            }

            // Build TableA Object
            let tableAObject: Record<string, unknown> = {};
            for (const key of tableAKeys) {
                tableAObject[key] = currentRow[key];
            }

            // Build TableBObjects
            let currentPrimaryValue = currentRow[primaryKey];
            const tableBObjects: object[] = [];
            while (currentRow[primaryKey] === currentPrimaryValue) {
                let currentBObject: Record<string, unknown> = {};
                for (const key of tableBKeys) {
                    currentBObject[key] = currentRow[key];
                }
                tableBObjects.push(currentBObject);

                // Check if next row is from same row of TableA and move on to that row if so
                if (index + 1 < resultSet.length) {
                    const nextRow = resultSet[index + 1];
                    if (nextRow !== undefined && nextRow[primaryKey] === currentPrimaryValue) {
                        index++;
                        currentRow = nextRow;
                    } else {
                        // Exit while loop if next row not same row of TableA
                        break;
                    }
                } else {
                    // Exit while loop if no more rows
                    break;
                }
            }

            tableAObject['tableBObjects'] = tableBObjects;
            tableAObjects.push(tableAObject);
        }
    } catch (error) {
        console.error('Error building objects:', error);
        throw error;
    }
    return tableAObjects;
}

async function run() {
    const constructedObjects = processData(await runQuery(sampleQuery), primaryKeyName);
    console.log(inspect(constructedObjects, false, null, true ))
}

run();