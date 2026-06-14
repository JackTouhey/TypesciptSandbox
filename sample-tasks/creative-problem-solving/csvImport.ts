import { parse } from 'csv-parse/sync';
import * as fs from 'fs';

type Patient = {
    firstName?: string,
    lastName?: string,
    dateOfBirth?: string,
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
}

run();