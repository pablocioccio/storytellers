const helper = require("./helper");
const axios = require('axios');

exports.retrieve = async (headers) => {
    const token = helper.extractAuthTokenFromHeaders(headers);
    const userinfo = await axios.get(
        `https://${process.env.authentication_domain}/userinfo`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return userinfo.data;
}