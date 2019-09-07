import { NowRequest, NowResponse } from '@now/node';
import Axios from 'axios';

export default async (request: NowRequest, response: NowResponse) => {

  const { term = '' } = request.query;

  const result = await Axios.get(
    'https://en.wikipedia.org/w/api.php',
    {
      params: {
        action: 'opensearch',
        format: 'json',
        origin: '*',
        search: `${term}`,
      },
    },
  );

  response.status(200).json(result.data);
};
