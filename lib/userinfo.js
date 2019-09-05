const helper = require("./helper");
const axios = require('axios');

exports.retrieve = async (headers) => {
    const token = helper.extractAuthTokenFromHeaders(headers);
    const userinfo = await axios.get(
        `${process.env.AUTHENTICATION_SERVER}/userinfo`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return userinfo.data;
}