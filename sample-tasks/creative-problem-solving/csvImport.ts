import { parse } from 'csv-parse/sync';
import * as fs from 'fs';
import pool from '../utils/getConnectionPool.ts';
import type { QueryResult } from 'pg';
import _ from 'lodash';

type Patient = {
    firstName?: string,
    lastName?: string,
    dateOfBirth?: Date,
    gender?: string,
    address?: string,
    mobile?: bigint,
    email?: string,
    medicare?: bigint,
    ihi?: bigint
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

    for(const patient of patients) {
        // processPatient(patient);
        // Check if already in database
        insertPatient(patient);
    }

}

async function processPatient(currentPatient: Patient) {
    // Check if patient exists
    const retrievedPatient = await lookupPatient(currentPatient);
    if (retrievedPatient !== undefined) {
        // check if any difference
        if (!_.isEqual(currentPatient, retrievedPatient)) {
            // If not equal update
        }
    } else {
        // No patient retrieved, insert whole patient

    }
}

async function lookupPatient(currentPatient: Patient): Promise<Patient | undefined> {
    // Check which identifier to use, try medicare fallback to ihi
    return currentPatient.medicare !== undefined ? await medicareLookup(currentPatient) : await ihiLookup(currentPatient);
}

async function medicareLookup(currentPatient: Patient): Promise<Patient | undefined> {
    if (currentPatient.medicare !== undefined) {
        try {
            const query = 'select first_name as firstname, last_name as lastname, dob as dateofbirth, gender, address, mobile, email, medicare, ihi from patients where medicare = $1';
            const value = [ currentPatient.medicare ]
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

async function ihiLookup(currentPatient: Patient): Promise<Patient | undefined> {
    if (currentPatient.medicare !== undefined) {
        try {
            const query = 'select first_name as firstName, last_name as lastName, dob as dateOfBirth, gender, address, mobile, email, medicare, ihi from patients where ihi = $1';
            const value = [ currentPatient.ihi ]

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
                returnPatient.mobile = BigInt(resultSet.mobile);
            }
        }
        if (fieldsPresent.includes('email')) {
            if (typeof resultSet.email === "string") {
                returnPatient.email = resultSet.email;
            }
        }
        if (fieldsPresent.includes('medicare')) {
            if (typeof resultSet.medicare === "string") {
                returnPatient.medicare = BigInt(resultSet.medicare);
            }
        }
        if (fieldsPresent.includes('ihi')) {
            if (typeof resultSet.ihi === "string") {
                returnPatient.ihi = BigInt(resultSet.ihi);
            }
        }

        return returnPatient;
    } else {
        return undefined;
    }
}

async function insertPatient(currentPatient: Patient) {

    let query: string = 'insert into patients ('
    let values = [];

    if (currentPatient.firstName !== null && currentPatient.firstName !== '') {
        query += 'first_name, '
        values.push(currentPatient.firstName);
    }
    if (currentPatient.lastName !== null && currentPatient.lastName !== '') {
        query += 'last_name, '
        values.push(currentPatient.lastName);
    }
    if (currentPatient.dateOfBirth !== null) {
        query += 'dob, '
        values.push(currentPatient.dateOfBirth);
    }
    if (currentPatient.gender !== null && currentPatient.gender !== '') {
        query += 'gender, '
        values.push(currentPatient.gender);
    }
    if (currentPatient.address !== null && currentPatient.address !== '') {
        query += 'address, '
        values.push(currentPatient.address);
    }
    if (currentPatient.mobile !== null && currentPatient.mobile !== undefined && currentPatient.mobile > 0) {
        query += 'mobile, '
        values.push(BigInt(currentPatient.mobile));
    }
    if (currentPatient.email !== null && currentPatient.email !== '') {
        query += 'email, '
        values.push(currentPatient.email);
    }
    if (currentPatient.medicare !== null && currentPatient.medicare !== undefined && currentPatient.medicare > 0) {
        query += 'medicare, '
        values.push(BigInt(currentPatient.medicare));
    }
    // I wasn't able to get the check here or on the other numbers to skip over blank fields
    if (currentPatient.ihi !== null && currentPatient.ihi !== undefined && currentPatient.ihi > 0) {
        query += 'ihi, '
        values.push(BigInt(currentPatient.ihi));
    }

    // Cut off trailing , 
    query = query.slice(0, -2);
    query += ') values (';

    for (let index = 1; index <= values.length; index++) {
        if (index < values.length) {
            query += '$' + index + ', ';
        } else {
            query += '$' + index.toString() + ')';
        }
    }

    await pool.query(query, values);

    console.log(query);
    console.log(values);

}

run();