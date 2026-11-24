import path from 'node:path';
import { fileURLToPath } from 'node:url';
import swaggerJSDoc from 'swagger-jsdoc';
import { env } from './env.ts';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

export const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'O-Rion API',
      version: '1.0.0',
      description: 'Campus recommerce: certified listings, safe chat, escrow offers and hub handovers.',
    },
    servers: [{ url: `${env.publicUrl}/api` }],
    components: {
      securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string' },
            campus: { type: 'string' },
            department: { type: 'string' },
            avatarUrl: { type: 'string' },
            verified: { type: 'boolean' },
            rating: { type: 'number' },
            tradesCount: { type: 'integer' },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: { token: { type: 'string' }, user: { $ref: '#/components/schemas/User' } },
        },
        ListingInput: {
          type: 'object',
          required: ['title', 'category', 'condition', 'price'],
          properties: {
            title: { type: 'string', example: 'Sony WH-1000XM4 Headphones' },
            description: { type: 'string' },
            category: { type: 'string', example: 'audio' },
            condition: { type: 'string', example: 'certified_refurbished' },
            grade: { type: 'string', example: 'A+' },
            price: { type: 'integer', example: 98000 },
            originalPrice: { type: 'integer', example: 180000 },
            negotiable: { type: 'boolean' },
            images: { type: 'array', items: { type: 'string' } },
            tags: { type: 'array', items: { type: 'string' } },
            checks: { type: 'object' },
            warrantyMonths: { type: 'integer' },
            location: { type: 'string' },
            hubId: { type: 'string' },
          },
        },
      },
    },
  },
  apis: [path.join(root, 'route', '*.ts')],
});
