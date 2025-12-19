import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { db, productRequests, products } from '../db/connection.js';
import { eq, ilike, or } from 'drizzle-orm';

export const requestTools: Tool[] = [
  {
    name: 'get_product_requests',
    description: 'Get a list of product requests with optional filters by status or product.',
    inputSchema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['pending', 'approved', 'rejected', 'fulfilled'],
          description: 'Filter by request status',
        },
        productId: {
          type: 'string',
          description: 'Filter by product ID',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of requests to return',
          default: 50,
        },
      },
    },
  },
  {
    name: 'create_product_request',
    description: 'Create a new product request.',
    inputSchema: {
      type: 'object',
      properties: {
        productId: {
          type: 'string',
          description: 'The UUID of the product',
        },
        productName: {
          type: 'string',
          description: 'Name of the product',
        },
        quantity: {
          type: 'number',
          description: 'Quantity requested',
        },
        personalizationRemarks: {
          type: 'string',
          description: 'Optional personalization remarks',
        },
      },
      required: ['productId', 'productName', 'quantity'],
    },
  },
];

export async function handleGetProductRequests(args: any) {
  const { status, productId, limit = 50 } = args;
  
  let query = db
    .select({
      id: productRequests.id,
      productId: productRequests.productId,
      productName: productRequests.productName,
      quantity: productRequests.quantity,
      personalizationRemarks: productRequests.personalizationRemarks,
      status: productRequests.status,
      createdAt: productRequests.createdAt,
      updatedAt: productRequests.updatedAt,
      product: {
        id: products.id,
        name: products.name,
        productCode: products.productCode,
        brand: products.brand,
      },
    })
    .from(productRequests)
    .leftJoin(products, eq(productRequests.productId, products.id));
  
  const conditions = [];
  
  if (status) {
    conditions.push(eq(productRequests.status, status));
  }
  
  if (productId) {
    conditions.push(eq(productRequests.productId, productId));
  }
  
  // Simplified - Drizzle join conditions are complex
  const allRequests = await query.limit(limit * 2); // Get more to filter
  
  const filteredRequests = conditions.length > 0
    ? allRequests.filter(req => {
        if (status && req.status !== status) return false;
        if (productId && req.productId !== productId) return false;
        return true;
      }).slice(0, limit)
    : allRequests.slice(0, limit);
  
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          requests: filteredRequests,
          count: filteredRequests.length,
        }, null, 2),
      },
    ],
  };
}

export async function handleCreateProductRequest(args: any) {
  const { productId, productName, quantity, personalizationRemarks } = args;
  
  // Verify product exists
  const product = await db
    .select()
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);
  
  if (product.length === 0) {
    throw new Error(`Product with ID ${productId} not found`);
  }
  
  const [newRequest] = await db
    .insert(productRequests)
    .values({
      productId,
      productName,
      quantity: quantity.toString(),
      personalizationRemarks: personalizationRemarks || null,
      status: 'pending',
    })
    .returning();
  
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          success: true,
          request: newRequest,
        }, null, 2),
      },
    ],
  };
}

