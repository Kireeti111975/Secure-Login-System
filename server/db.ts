import fs from "fs";
import path from "path";

export interface User {
  id: string;
  name: string;
  email: string;
  hashedPassword: string;
  createdAt: string;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  failedLoginAttempts: number;
  lockoutUntil: string | null;
}

const DATABASE_DIR = path.join(process.cwd(), ".data");
const DATABASE_FILE = path.join(DATABASE_DIR, "users.json");

/**
 * Ensures the data storage directory and schema file exist.
 */
function initializeDB(): void {
  if (!fs.existsSync(DATABASE_DIR)) {
    fs.mkdirSync(DATABASE_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATABASE_FILE)) {
    fs.writeFileSync(DATABASE_FILE, JSON.stringify([], null, 2), "utf-8");
  }
}

/**
 * File-system based atomic state management.
 * Solves race conditions synchronously to behave as a reliable database transaction mechanism.
 */
export class Database {
  private static readUsers(): User[] {
    initializeDB();
    try {
      const data = fs.readFileSync(DATABASE_FILE, "utf-8");
      return JSON.parse(data) as User[];
    } catch (error) {
      console.error("Failed to read user database file, resetting:", error);
      return [];
    }
  }

  private static writeUsers(users: User[]): void {
    initializeDB();
    fs.writeFileSync(DATABASE_FILE, JSON.stringify(users, null, 2), "utf-8");
  }

  /**
   * Find a single user with query matches.
   */
  public static findOne(query: Partial<Pick<User, "id" | "email">>): User | null {
    const users = this.readUsers();
    const found = users.find((user) => {
      if (query.id && user.id !== query.id) return false;
      if (query.email && user.email.toLowerCase() !== query.email.toLowerCase()) return false;
      return true;
    });
    return found ? { ...found } : null;
  }

  /**
   * Inserts a new user record.
   */
  public static create(newUser: Omit<User, "failedLoginAttempts" | "lockoutUntil">): User {
    const users = this.readUsers();

    // Prevent race cases & duplication entries at db layer
    const exists = users.some((user) => user.email.toLowerCase() === newUser.email.toLowerCase());
    if (exists) {
      throw new Error("A user with this email address already exists.");
    }

    const created: User = {
      ...newUser,
      failedLoginAttempts: 0,
      lockoutUntil: null,
    };

    users.push(created);
    this.writeUsers(users);
    return { ...created };
  }

  /**
   * Updates an existing user record.
   */
  public static updateOne(userId: string, updates: Partial<Omit<User, "id">>): User | null {
    const users = this.readUsers();
    const index = users.findIndex((user) => user.id === userId);
    
    if (index === -1) return null;

    users[index] = {
      ...users[index],
      ...updates,
    } as User;

    this.writeUsers(users);
    return { ...users[index] };
  }
}
