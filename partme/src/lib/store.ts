// Simple in-memory store for demo purposes.
// In production, swap this out for a database (e.g. Turso, D1, Postgres).

interface User {
  email: string;
  username: string;
  passwordHash: string;
  verified: boolean;
}

interface PendingVerification {
  email: string;
  username: string;
  passwordHash: string;
  code: string;
  expiresAt: number;
}

class Store {
  private users: Map<string, User> = new Map();
  private pending: Map<string, PendingVerification> = new Map();

  addPending(data: PendingVerification): void {
    this.pending.set(data.email, data);
  }

  getPending(email: string): PendingVerification | undefined {
    return this.pending.get(email);
  }

  removePending(email: string): void {
    this.pending.delete(email);
  }

  addUser(user: User): void {
    this.users.set(user.email, user);
  }

  getUser(email: string): User | undefined {
    return this.users.get(email);
  }

  getUserByUsername(username: string): User | undefined {
    for (const user of this.users.values()) {
      if (user.username === username) return user;
    }
    return undefined;
  }
}

// Singleton
export const store = new Store();
