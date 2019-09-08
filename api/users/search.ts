import { NowRequest, NowResponse } from '@now/node';
import { AppMetadata, ManagementClient, User, UserMetadata } from 'auth0';

/**
 * Search users by name an email
 */
export default async (request: NowRequest, response: NowResponse) => {

  let { term = '' } = request.query;
  term = Array.isArray(term) ? term.join(' ').trim() : term.trim();

  if (term === '') {
    response.status(400).json({ error: 'Missing or empty \'term\' parameter' });
    return;
  }

  const query = term.split(' ')
    .filter((word: string) => word !== '')
    .map((word: string) => `(name:${word}* OR email:${word}*)`)
    .join(' AND ');

  const managementClient: ManagementClient = new ManagementClient({
    clientId: `${process.env.authentication_mgmt_api_clientid}`,
    clientSecret: `${process.env.authentication_mgmt_api_secret}`,
    domain: `${process.env.authentication_domain}`,
  });

  const users: Array<User<AppMetadata, UserMetadata>> = await managementClient.getUsers({
    fields: 'name,email,picture',
    include_fields: true,
    q: query,
    search_engine: 'v3',
  });

  response.status(200).json(users);
};
