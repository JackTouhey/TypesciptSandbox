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
const certificateBag = p12.getBags({ bagType: forge.pki.oids.certBag })[forge.pki.oids.certBag][0];

// I Was able to achieve the above with node-forge docs, however I was unable to fully extract the data without further assistance.
// No google AI answers were used, predominantly stack-overflow threads.
const certificate = certificateBag.cert;
const expirationDate = certificate.validity.notAfter;
const publicKey = certificate.publicKey;
console.log("Certificate Contents:", certificate);
console.log('');
console.log("Expiration Date", expirationDate);
console.log('');
console.log("Public Key", publicKey);

// I nearly got the privateKey from purely node-forge docs which used bagType: forge.pki.oids.keyBag 
// After going in circles trying to make that work I caved an used google, learning of bagType: forge.pki.oids.pkcs8ShroudedKeyBag
const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
const keyBag = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag][0];
const privateKey = keyBag.key;

console.log('');
console.log("Private Key", privateKey);
