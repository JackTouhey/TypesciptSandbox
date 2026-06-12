import * as fs from 'fs';
const forge = require('node-forge');

// Input
const filePath: string = 'sample-tasks\\p12-conversion\\CompoundDirectTest1.p12';
const fileContents = fs.readFileSync(filePath);
const fileContentsString: string = fileContents.toString('binary');
const password: string = 'test';

// Convert
const p12Asn1 = forge.asn1.fromDer(fileContentsString);
const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password);

// Extract

// Certificate + expiration + publicKey
const certificateBag = p12.getBags({ bagType: forge.pki.oids.certBag })[forge.pki.oids.certBag][0];
const certificate = certificateBag.cert;
const expirationDate = certificate.validity.notAfter;
const publicKey = certificate.publicKey;
console.log("Certificate Contents:", certificate);
console.log('');
console.log("Expiration Date", expirationDate);
console.log('');
console.log("Public Key", publicKey);

