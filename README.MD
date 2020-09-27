# Storytellers

Storytellers is a game based on a popular technique known as [Exquisite Corpse](https://en.wikipedia.org/wiki/Exquisite_corpse). Players take turns to write a story, using the last words of the previous participant as the only context. And once all rounds are finished, the results are finally exposed to writers.

## Stack

Storytellers frontend is written in **Angular**, and the backend uses **Node.js** + **Typescript**. Game data is stored in [Firebase Realtime Database](https://firebase.google.com/docs/database).

## Hosting

Both the frontend and backend are hosted on [Vercel](https://vercel.com/docs) infrastructure.

## Authentication

Storytellers users are authenticated and authorized via [Auth0](https://auth0.com/). 

## Notifications

### Email
Storytellers sends invitations and game notifications via email. Users can opt out of these notifications, but that means they won't be able to participate in games created by others.

### Web push
Web push notifications are also available for users that want to be informed of game updates.

## Websockets

In order to provide real-time capabilities, Storytellers relies on [Pusher Channels](https://pusher.com/channels). This allows all components to be updated instantly without adding overhead to the backend.

## Demo application

The Storytellers application can be found here: https://storytellers.vercel.app/.

Please take into account that this is a hobby project hosted on free infrastructure. For that reason, if usage quotas are exceeded, then some (or all) of the features might stop working for a while. If that's the case, please try again at a later time. And if the problem still persists and you think this might be an actual bug, then feel free to reach out to me and I will do my best to address the situation.

Storytellers only stores minimal user information for the application to function. The site does not use cookies, and I do not sell or share its data with anyone. I do not profit from the application in any other way either, since its only purpose is the amusement of its users.

I did my best to capture these conditions  in the [Privacy Policy](https://storytellers.vercel.app/legal/privacy-policy). However, if you still have questions or concerns, please feel free to reach out to me.