export function extractAuthTokenFromHeaders(headers) {
    let authorizationHeader = headers.authorization || '';
    if (authorizationHeader.split(' ')[0] === 'Bearer') {
        authorizationHeader = authorizationHeader.split(' ')[1];
    }
    return authorizationHeader;
}