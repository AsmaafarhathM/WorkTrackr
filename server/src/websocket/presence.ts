/**
 * In-memory presence tracker mapping userId to a Set of active socket IDs.
 * Correctly accounts for multiple open tabs/connections for a single user.
 */
class PresenceManager {
  private userSockets: Map<string, Set<string>> = new Map();

  public addSocket(userId: string, socketId: string): boolean {
    let sockets = this.userSockets.get(userId);
    let isFirstConnection = false;

    if (!sockets) {
      sockets = new Set<string>();
      this.userSockets.set(userId, sockets);
      isFirstConnection = true;
    }

    sockets.add(socketId);
    return isFirstConnection;
  }

  public removeSocket(userId: string, socketId: string): boolean {
    const sockets = this.userSockets.get(userId);
    if (!sockets) return false;

    sockets.delete(socketId);
    if (sockets.size === 0) {
      this.userSockets.delete(userId);
      return true; // user is completely offline now
    }

    return false;
  }

  public getOnlineCount(): number {
    return this.userSockets.size;
  }

  public getOnlineUserIds(): string[] {
    return Array.from(this.userSockets.keys());
  }

  public isOnline(userId: string): boolean {
    const sockets = this.userSockets.get(userId);
    return !!sockets && sockets.size > 0;
  }
}

export const presenceManager = new PresenceManager();
