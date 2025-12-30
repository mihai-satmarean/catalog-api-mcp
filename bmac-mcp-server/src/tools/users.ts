import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { db, users, roles } from '../db/connection.js';
import { eq, or, sql } from 'drizzle-orm';

export const userTools: Tool[] = [
  {
    name: 'get_users',
    description: 'Get a list of users with optional filters by email, name, or role.',
    inputSchema: {
      type: 'object',
      properties: {
        search: {
          type: 'string',
          description: 'Search term for user email or name',
        },
        roleId: {
          type: 'string',
          description: 'Filter by role ID',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of users to return',
          default: 50,
        },
      },
    },
  },
  {
    name: 'get_user_details',
    description: 'Get detailed information about a specific user including their role.',
    inputSchema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'The UUID of the user',
        },
        email: {
          type: 'string',
          description: 'The email of the user',
        },
      },
    },
  },
];

export async function handleGetUsers(args: any) {
  const { search, roleId, limit = 50 } = args;
  
  let query = db.select({
    id: users.id,
    email: users.email,
    name: users.name,
    roleId: users.roleId,
    createdAt: users.createdAt,
    updatedAt: users.updatedAt,
    role: {
      id: roles.id,
      name: roles.name,
      description: roles.description,
    },
  })
  .from(users)
  .leftJoin(roles, eq(users.roleId, roles.id));
  
  const conditions = [];
  
  if (search) {
    const searchPattern = `%${search.toLowerCase()}%`;
    conditions.push(
      or(
        sql`LOWER(${users.email}) LIKE ${searchPattern}`,
        sql`LOWER(${users.name}) LIKE ${searchPattern}`
      )!
    );
  }
  
  if (roleId) {
    conditions.push(eq(users.roleId, roleId));
  }
  
  // Note: Drizzle doesn't support conditions on joined queries easily
  // This is a simplified version
  const allUsers = await query.limit(limit);
  
  const filteredUsers = conditions.length > 0
    ? allUsers.filter(user => {
        if (search) {
          const matchesSearch = 
            user.email?.toLowerCase().includes(search.toLowerCase()) ||
            user.name?.toLowerCase().includes(search.toLowerCase());
          if (!matchesSearch) return false;
        }
        if (roleId && user.roleId !== roleId) return false;
        return true;
      })
    : allUsers;
  
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          users: filteredUsers,
          count: filteredUsers.length,
        }, null, 2),
      },
    ],
  };
}

export async function handleGetUserDetails(args: any) {
  const { userId, email } = args;
  
  if (!userId && !email) {
    throw new Error('Either userId or email must be provided');
  }
  
  let user;
  if (userId) {
    const results = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        roleId: users.roleId,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        role: {
          id: roles.id,
          name: roles.name,
          description: roles.description,
        },
      })
      .from(users)
      .leftJoin(roles, eq(users.roleId, roles.id))
      .where(eq(users.id, userId))
      .limit(1);
    user = results[0];
  } else {
    const results = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        roleId: users.roleId,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        role: {
          id: roles.id,
          name: roles.name,
          description: roles.description,
        },
      })
      .from(users)
      .leftJoin(roles, eq(users.roleId, roles.id))
      .where(eq(users.email, email))
      .limit(1);
    user = results[0];
  }
  
  if (!user) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ error: 'User not found' }, null, 2),
        },
      ],
    };
  }
  
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(user, null, 2),
      },
    ],
  };
}

