import { NowRequest, NowResponse } from '@now/node';
import { AppMetadata, ManagementClient, User, UserMetadata } from 'auth0';

export default async (request: NowRequest, response: NowResponse) => {

  const managementClient: ManagementClient = new ManagementClient({
    clientId: `${process.env.authentication_mgmt_api_clientId}`,
    clientSecret: `${process.env.authentication_mgmt_api_secret}`,
    domain: `${process.env.authentication_domain}`,
  });

  const users: Array<User<AppMetadata, UserMetadata>> = await managementClient.getUsers();

  response.status(200).json(users);
};
