import { parse } from 'csv-parse/sync';
import * as fs from 'fs';
import pool from '../utils/getConnectionPool.ts';
import type { QueryResult, types } from 'pg';
import _ from 'lodash';
import pg from 'pg';

pg.types.setTypeParser(1114, (stringValue) => stringValue);

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

    return parse(fileContents, {
        delimiter: ',',
        columns: headers,
    });
}

async function run() {
    let patients = parseCsvToPatients();

    for(let patient of patients) {
        patient = parsePatientFields(patient);
        processPatient(patient);
    }
}

function parsePatientFields(patient: Patient): Patient {
    if (patient.dateOfBirth !== undefined) {
        const datePart = patient.dateOfBirth.toString().split(' ')[0];
        patient.dateOfBirth = new Date(datePart + 'T00:00:00.000Z');
    }
    if (patient.mobile !== undefined) {
        patient.mobile = BigInt(patient.mobile.toString());
    }
    if (patient.medicare !== undefined) {
        patient.medicare = BigInt(patient.medicare.toString());
    }
    if (patient.ihi !== undefined) {
        patient.ihi = BigInt(patient.ihi.toString());
    }
    return patient;
}

async function processPatient(currentPatient: Patient) {
    // Check if patient exists
    const retrievedPatient = await lookupPatient(currentPatient);
    if (retrievedPatient !== undefined) {
        // check if any difference
        // I believe there's an issue with this check as Date objects and the number fields of the two patients are slightly different which cause this to always be true
        if (!_.isEqual(currentPatient, retrievedPatient)) {
            // If not equal update
            updatePatient(retrievedPatient, currentPatient);
        }
    } else {
        // No patient retrieved, insert whole patient
        insertPatient(currentPatient);
    }
}

async function lookupPatient(currentPatient: Patient): Promise<Patient | undefined> {
    // Check which identifier to use, try medicare fallback to ihi
    if (currentPatient.medicare !== undefined && bigIntHasValue(currentPatient.medicare)) {
        return await medicareLookup(currentPatient)
    } else {
        return await ihiLookup(currentPatient);
    }
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
            if (typeof resultSet.dateofbirth === "string") {
                const datePart = resultSet.dateofbirth.split(' ')[0]; // strip any time portion, keep 'YYYY-MM-DD'
                returnPatient.dateOfBirth = new Date(datePart + 'T00:00:00.000Z'); // force UTC parse
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

function bigIntHasValue(bigIntToCheck: bigint): boolean {
    return bigIntToCheck !== null && bigIntToCheck > 0;
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
    if (currentPatient.dateOfBirth !== null && currentPatient.dateOfBirth !== undefined) {
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
    if (currentPatient.mobile !== undefined) {
        if(bigIntHasValue(currentPatient.mobile)) {
            query += 'mobile, '
            values.push(BigInt(currentPatient.mobile));
        }
    }
    if (currentPatient.email !== null && currentPatient.email !== '') {
        query += 'email, '
        values.push(currentPatient.email);
    }
    if (currentPatient.medicare !== undefined) {
        if (bigIntHasValue(currentPatient.medicare)) {
            query += 'medicare, '
            values.push(BigInt(currentPatient.medicare));
        }
    }
    if (currentPatient.ihi !== undefined) {
        if (bigIntHasValue(currentPatient.ihi)) {
            query += 'ihi, '
            values.push(BigInt(currentPatient.ihi));
        }
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

    console.log(query);
    console.log(values);

    await pool.query(query, values);
}

async function updatePatient(retrievedPatient: Patient, currentPatient: Patient) {
    let query: string = 'update patients set ';
    let values = [];
    let index = 1;

    if (retrievedPatient.firstName !== undefined && currentPatient.firstName !== undefined) {
        if (retrievedPatient.firstName !== currentPatient.firstName) {
            query += 'first_name = $' + index + ', ';
            index++
            values.push(currentPatient.firstName);
        }
    }

    if (retrievedPatient.lastName !== undefined && currentPatient.lastName !== undefined) {
        if (retrievedPatient.lastName !== currentPatient.lastName) {
            query += 'last_name= $' + index + ', ';
            index++
            values.push(currentPatient.lastName);
        }
    }

    if (retrievedPatient.dateOfBirth !== undefined && currentPatient.dateOfBirth !== undefined) {
        if (retrievedPatient.dateOfBirth.getTime() !== currentPatient.dateOfBirth.getTime()) {
            query += 'dob = $' + index + ', ';
            index++
            values.push(currentPatient.dateOfBirth);
        }
    }

    if (retrievedPatient.gender !== undefined && currentPatient.gender !== undefined) {
        if (retrievedPatient.gender !== currentPatient.gender) {
            query += 'gender = $' + index + ', ';
            index++
            values.push(currentPatient.gender);
        }
    }

    if (retrievedPatient.address !== undefined && currentPatient.address !== undefined) {
        if (retrievedPatient.address !== currentPatient.address) {
            query += 'address = $' + index + ', ';
            index++
            values.push(currentPatient.address);
        }
    }

    if (retrievedPatient.mobile !== undefined && currentPatient.mobile !== undefined) {
        if (retrievedPatient.mobile !== currentPatient.mobile) {
            query += 'mobile = $' + index + ', ';
            index++
            values.push(BigInt(currentPatient.mobile));
        }
    }

    if (retrievedPatient.email !== undefined && currentPatient.email !== undefined) {
        if (retrievedPatient.email !== currentPatient.email) {
            query += 'email = $' + index + ', ';
            index++
            values.push(currentPatient.email);
        }
    }

    if (retrievedPatient.medicare !== undefined && currentPatient.medicare !== undefined) {
        if (retrievedPatient.medicare !== currentPatient.medicare) {
            query += 'medicare = $' + index + ', ';
            index++
            values.push(BigInt(currentPatient.medicare));
        }
    }

    if (retrievedPatient.ihi !== undefined && currentPatient.ihi !== undefined) {
        if (retrievedPatient.ihi !== currentPatient.ihi) {
            query += 'ihi = $' + index + ', ';
            index++
            values.push(BigInt(currentPatient.ihi));
        }
    }

    let hasMedicare: boolean = false;
    
    if (currentPatient.medicare !== undefined) {
        hasMedicare = bigIntHasValue(currentPatient.medicare);
    }

    query = query.slice(0, -2);
    query += ' where ';
    query += hasMedicare ? 'medicare = $' + index : 'ihi = $' + index;
    
    if (hasMedicare) {
        values.push(currentPatient.medicare);
    } else {
        values.push(currentPatient.ihi);
    }

    console.log(query);
    console.log(values);

    await pool.query(query, values);
}

run();