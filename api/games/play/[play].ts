import { NowRequest, NowResponse } from '@now/node';

export default (request: NowRequest, response: NowResponse) => {
    const {
        query: { play },
    } = request;
    response.status(200).send(`Hello ${play}!`);
};
