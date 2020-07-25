const util = require('util');
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

const keyClient = jwksClient({
    jwksUri: `http://${process.env.authentication_domain}/.well-known/jwks.json`
})

function getSigningKey(header, callback) {
    keyClient.getSigningKey(header.kid, function (err, key) {
        if(err) {
            console.error(error);
            throw err;
        }
        const signingKey = key.publicKey || key.rsaPublicKey;
        callback(null, signingKey);
    })
}

function extractAuthTokenFromHeaders(headers) {
    let authorizationHeader = headers.authorization || '';
    if (authorizationHeader.split(' ')[0] === 'Bearer') {
        authorizationHeader = authorizationHeader.split(' ')[1];
    }
    return authorizationHeader;
}

/**
 * Validate token, decode it, and return its payload.
 */
async function decodeToken(token) {
    const asyncVerify = util.promisify(jwt.verify);
    return await asyncVerify(token, getSigningKey);
}

exports.handler = async (headers) => {
    const token = extractAuthTokenFromHeaders(headers);
    const payload = await decodeToken(token);
    return payload;
}