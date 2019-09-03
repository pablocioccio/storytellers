const util = require('util');
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

const keyClient = jwksClient({
    jwksUri: 'https://dev--cxipk7a.auth0.com/.well-known/jwks.json'
})

function getSigningKey(header, callback) {
    keyClient.getSigningKey(header.kid, function (err, key) {
        const signingKey = key.publicKey || key.rsaPublicKey;
        callback(null, signingKey);
    })
}
function extractTokenFromHeaders(headers) {
    let authorizationHeader = headers.authorization || '';
    if (authorizationHeader.split(' ')[0] === 'Bearer') {
        authorizationHeader = authorizationHeader.split(' ')[1];
    }
    return authorizationHeader;
}
/**
 * Validate and decode token, returning its payload.
 */
async function decodeToken(token) {
    const asyncVerify = util.promisify(jwt.verify);
    return await asyncVerify(token, getSigningKey);
}
exports.handler = async (headers) => {
    const token = extractTokenFromHeaders(headers);
    const payload = await decodeToken(token);
    return payload;
}