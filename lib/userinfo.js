const helper = require("./helper");
const axios = require('axios');

exports.retrieve = async (headers) => {
    const token = helper.extractAuthTokenFromHeaders(headers);
    const userinfo = await axios.get(
        `https://${process.env.authentication_domain}/userinfo`,
        { headers: { Authorization: `Bearer ${token}` } }
    );

    // The return type must match the IPlayer interface
    return {
        user_id: userinfo.data.sub,
        name: userinfo.data.name,
        email: userinfo.data.email,
        picture: userinfo.data.picture
    };

}