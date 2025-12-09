import { Server } from '@krmx/server';

/**
 * Kicks users who are not linked to a connection for too long.
 *
 * @param server The server to enable the unlinked kicker on.
 * @param props Additional properties to configure the unlinked kicker.
 *              - interactivitySeconds - The number of seconds a user needs to be unlinked before it is kicked (default = 60).
 *              - includeJoins - Whether to include join events in the inactivity timeout (default = false).
 * @returns A function that disables the unlinked kicker.
 */
export function enableUnlinkedKicker(server: Server, props?: {
  inactivitySeconds?: number,
  includeJoins?: boolean,
}): void {
  const inactivitySeconds = props?.inactivitySeconds ?? 60;
  const includeJoins = props?.includeJoins ?? false;

  // Keep track of all inactivity timeouts.
  const inactivityTimeouts: Map<string, ReturnType<typeof setTimeout>> = new Map();

  // Start the inactivity countdown for a user when they are offline (not linked to a connection). This happens after unlinking.
  const startInactivityCountDown = (username: string) => {
    inactivityTimeouts.set(username, setTimeout(() => {
      console.info(`kicking ${username} due to being offline for too long`);
      server.kick(username);
    }, inactivitySeconds * 1000));
  };
  server.on('unlink', startInactivityCountDown);
  // If a users joins through a connection, then a join is always directly followed by a link to that connection. However, when a user joins server
  //   side (for example: `server.join(<username>)`), then there is no link event. In the latter, starting an inactivity countdown does not make sense
  //   as you probably want to give plenty of time to a user to join the server. Which is why the `includeJoins` option is available and defaults to
  //   `false`.
  if (includeJoins) {
    server.on('join', startInactivityCountDown);
  }

  // Stop the inactivity countdown for a user when they are online (linked to a connection). This happens on link and leave.
  const stopInactivityCountDown = (username: string) => {
    if (inactivityTimeouts.has(username)) {
      clearTimeout(inactivityTimeouts.get(username)!);
      inactivityTimeouts.delete(username);
    }
  };
  server.on('link', stopInactivityCountDown);
  server.on('leave', stopInactivityCountDown);
}
