importScripts('./ngsw-worker.js');

/* Custom service worker that overrides the click() behavior of a notification.
Currently, the Angular SW does not support link navigation, so we extended it. */
(function () {
  'use strict';

  self.addEventListener('notificationclick', (event) => {
    event.waitUntil(async function () {
      // Check if the notification includes a url
      if (!event.notification.data.url) {
        return;
      }

      const allClients = await clients.matchAll({
        includeUncontrolled: true
      });

      /* Let's see if there's a client that we can reuse.
      The only condition is that they are not currently playing
      a game, since we don't want to interrupt that. */
      for (const client of allClients) {
        const url = new URL(client.url);
        if (!url.pathname || !url.pathname.startsWith('/games/play')) {
          await client.focus();
          await client.navigate(event.notification.data.url)
          return;
        }
      }

      // If there's no client we can reuse, then open a new window
      await clients.openWindow(event.notification.data.url);
    }());
  });
}());
