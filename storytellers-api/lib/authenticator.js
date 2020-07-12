const util = require('util');
const helper = require("./helper");
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

const keyClient = jwksClient({
    jwksUri: `http://${process.env.authentication_domain}/.well-known/jwks.json`
})

function getSigningKey(header, callback) {
    keyClient.getSigningKey(header.kid, function (err, key) {
        const signingKey = key.publicKey || key.rsaPublicKey;
        callback(null, signingKey);
    })
}

/**
 * Validate token, decode it, and return its payload.
 */
async function decodeToken(token) {
    const asyncVerify = util.promisify(jwt.verify);
    return await asyncVerify(token, getSigningKey);
}

exports.handler = async (headers) => {
    const token = helper.extractAuthTokenFromHeaders(headers);
    const payload = await decodeToken(token);
    return payload;
}