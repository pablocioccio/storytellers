const util = require('util');
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
const axios = require('axios');
const AUTH_SERVER = 'https://dev--cxipk7a.auth0.com';

const keyClient = jwksClient({
    jwksUri: `${AUTH_SERVER}/.well-known/jwks.json`
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
    await asyncVerify(token, getSigningKey);
    const userinfo = await axios.get(`${AUTH_SERVER}/userinfo`, { headers: { Authorization: `Bearer ${token}` } });
    return userinfo.data;
}
exports.handler = async (headers) => {
    const token = extractTokenFromHeaders(headers);
    const payload = await decodeToken(token);
    return payload;
}