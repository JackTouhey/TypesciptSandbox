import { parse } from 'csv-parse/sync';
import * as fs from 'fs';
import pool from '../utils/getConnectionPool.ts';
import { QueryResult } from 'pg';

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
    const headers = ['first_name', 'last_name', 'dob', 'gender', 'address', 'mobile', 'email', 'medicare_number', 'ihi'];
    const fileContents = fs.readFileSync(filePath, { encoding: 'utf-8' });

    let patientArray: Patient[] = [];

    return parse(fileContents, {
        delimiter: ',',
        columns: headers,
 
    });
}

function run() {
    const patients = parseCsvToPatients();
    console.log(patients);

    for(const patient of patients) {
        processPatient(patient);
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
            const query = 'select first_name as firstName, last_name as lastName, dob as dateOfBirth, gender, address, mobile, email, medicare, ihi from patients where medicare = $1';
            const value = [ currentPatient.medicare ]

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