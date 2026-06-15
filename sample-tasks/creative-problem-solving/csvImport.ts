import { parse } from 'csv-parse/sync';
import * as fs from 'fs';
import pool from '../utils/getConnectionPool.ts';
import type { QueryResult } from 'pg';

type Patient = {
    firstName?: string,
    lastName?: string,
    dateOfBirth?: Date,
    gender?: string,
    address?: string,
    mobile?: number,
    email?: string,
    medicare?: number,
    ihi?: number
}

function parseCsvToPatients(): Patient[] {
    const filePath = 'sample-tasks\\creative-problem-solving\\patients_import_sample.csv';
    const headers = ['firstName', 'lastName', 'dateOfBirth', 'gender', 'address', 'mobile', 'email', 'medicare', 'ihi'];
    const fileContents = fs.readFileSync(filePath, { encoding: 'utf-8' });

    let patientArray: Patient[] = [];

    return parse(fileContents, {
        delimiter: ',',
        columns: headers,
    });
}

async function run() {
    const patients = parseCsvToPatients();

    if (patients[0] !== undefined) {
        await medicareLookup(patients[0]);
    }

    for(const patient of patients) {
        // processPatient(patient);
        // Check if already in database
    }

}

function processPatient(currentPatient: Patient) {
    // Check if patient exists
    
}

async function lookupPatient(currentPatient: Patient): Promise<Patient | undefined> {
    // Check which identifier to use
    return currentPatient.medicare !== undefined ? await medicareLookup(currentPatient) : await ihiLookup(currentPatient);
}

async function medicareLookup(currentPatient: Patient): Promise<Patient | undefined> {
    if (currentPatient.medicare !== undefined) {
        try {
            const query = 'select first_name as firstname, last_name as lastname, dob as dateofbirth, gender, address, mobile, email, medicare, ihi from patients where medicare = $1';
            const value = [ currentPatient.medicare ]

            // I was not able to 
            const resultSet: QueryResult<Record<string, unknown>> = await pool.query(query, value);
            const retrievedPatient = buildPatientFromRecord(resultSet.rows[0]);
            return retrievedPatient;
        } catch (error) {
            console.log('Error performing medicareLookup: ', error);
            return undefined;
        }
    } else {
        return undefined;
    }
}

function buildPatientFromRecord(resultSet: Record<string, unknown> | undefined): Patient | undefined {
    if (resultSet !== undefined) {
        let returnPatient: Patient = {};
        const fieldsPresent: string[] = Object.keys(resultSet);
        if (fieldsPresent.includes('firstname')) {
            if (typeof resultSet.firstname === "string") {
                returnPatient.firstName = resultSet.firstname;
            }
        }
        if (fieldsPresent.includes('lastname')) {
            if (typeof resultSet.lastname === "string") {
                returnPatient.lastName = resultSet.lastname;
            }
        }
        if (fieldsPresent.includes('dateofbirth')) {
            if (resultSet.dateofbirth instanceof Date) {
                returnPatient.dateOfBirth = resultSet.dateofbirth;
            }
        }
        if (fieldsPresent.includes('gender')) {
            if (typeof resultSet.gender === "string") {
                returnPatient.gender = resultSet.gender;
            }
        }
        if (fieldsPresent.includes('address')) {
            if (typeof resultSet.address === "string") {
                returnPatient.address = resultSet.address;
            }
        }
        if (fieldsPresent.includes('mobile')) {
            if (typeof resultSet.mobile === "number") {
                returnPatient.mobile = resultSet.mobile;
            }
        }
        if (fieldsPresent.includes('email')) {
            if (typeof resultSet.email === "string") {
                returnPatient.email = resultSet.email;
            }
        }
        if (fieldsPresent.includes('medicare')) {
            if (typeof resultSet.medicare === "string" || typeof resultSet.medicare === "number") {
                returnPatient.medicare = Number(resultSet.medicare);
            }
        }
        if (fieldsPresent.includes('ihi')) {
            if (typeof resultSet.ihi === "string" || typeof resultSet.ihi === "number") {
                returnPatient.ihi = Number(resultSet.ihi);
            }
        }

        return returnPatient;
    } else {
        return undefined;
    }
}

async function ihiLookup(currentPatient: Patient): Promise<Patient | undefined> {
    if (currentPatient.medicare !== undefined) {
        try {
            const query = 'select first_name as firstName, last_name as lastName, dob as dateOfBirth, gender, address, mobile, email, medicare, ihi from patients where ihi = $1';
            const value = [ currentPatient.ihi ]

            const resultPatient: QueryResult<Patient> = await pool.query(query, value);
            return resultPatient.rows[0];
        } catch (error) {
            console.log('Error performing medicareLookup: ', error);
            return undefined;
        }
    } else {
        return undefined;
    }
}

run();