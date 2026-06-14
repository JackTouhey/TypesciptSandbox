import { parse } from 'csv-parse';
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