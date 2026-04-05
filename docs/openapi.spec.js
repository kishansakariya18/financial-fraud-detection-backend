/**
 * OpenAPI 3.0 specification for Fraud Detection API.
 * Served at /api-docs (Swagger UI) and /api-docs.json.
 */

const tags = [
  { name: 'Health', description: 'Service health' },
  { name: 'Auth', description: 'Registration, login, tokens, password reset' },
  { name: 'Transactions', description: 'User transactions and fraud pipeline' },
  { name: 'Categories', description: 'User category list (system + custom) for transactions' },
  { name: 'Budgets', description: 'Budget limits' },
  { name: 'Notifications', description: 'In-app notifications' },
  { name: 'Analytics', description: 'Reports and dashboards' },
  { name: 'Admin', description: 'Admin panel (role ADMIN)' }
];

const components = {
  securitySchemes: {
    bearerAuth: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: 'JWT from POST /api/v1/auth/login (field `token`)'
    }
  },
  schemas: {
    Error: {
      type: 'object',
      properties: {
        error: { type: 'string' },
        message: { type: 'string' },
        stack: { type: 'string', description: 'Present in development only' }
      }
    },
    Unauthorized: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Unauthorized' }
      }
    },
    RegisterRequest: {
      type: 'object',
      required: ['name', 'email', 'password'],
      properties: {
        name: { type: 'string' },
        email: { type: 'string', format: 'email' },
        password: { type: 'string', format: 'password' },
        role: { type: 'string', enum: ['USER', 'AUDITOR', 'ADMIN'], default: 'USER' },
        organizationId: { type: 'string', description: 'MongoDB ObjectId' }
      }
    },
    User: {
      type: 'object',
      properties: {
        _id: { type: 'string' },
        name: { type: 'string' },
        email: { type: 'string' },
        role: { type: 'string' },
        organizationId: { type: 'string', nullable: true },
        isActive: { type: 'boolean' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    },
    LoginRequest: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email: { type: 'string', format: 'email' },
        password: { type: 'string', format: 'password' }
      }
    },
    LoginResponse: {
      type: 'object',
      properties: {
        user: { $ref: '#/components/schemas/User' },
        token: { type: 'string', description: 'JWT access token' }
      }
    },
    LogoutRequest: {
      type: 'object',
      required: ['_id'],
      properties: {
        _id: { type: 'string', description: 'User MongoDB ObjectId' }
      }
    },
    RefreshRequest: {
      type: 'object',
      required: ['refreshToken'],
      properties: {
        refreshToken: { type: 'string', description: 'JWT returned as token from login' }
      }
    },
    ForgotPasswordRequest: {
      type: 'object',
      required: ['email'],
      properties: {
        email: { type: 'string', format: 'email' }
      }
    },
    ForgotPasswordResponse: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        resetToken: { type: 'string' },
        email: { type: 'string' }
      }
    },
    ResetPasswordRequest: {
      type: 'object',
      required: ['resetToken', 'password'],
      properties: {
        resetToken: { type: 'string' },
        password: { type: 'string', format: 'password' }
      }
    },
    MessageResponse: {
      type: 'object',
      properties: {
        message: { type: 'string' }
      }
    },
    TokenResponse: {
      type: 'object',
      properties: {
        token: { type: 'string' }
      }
    },
    Transaction: {
      type: 'object',
      properties: {
        _id: { type: 'string' },
        userId: { type: 'string' },
        amount: { type: 'number', minimum: 0 },
        type: { type: 'string', enum: ['INCOME', 'EXPENSE'] },
        categoryId: { type: 'string', description: 'Category ObjectId from GET /categories' },
        paymentMethod: {
          type: 'string',
          enum: ['UPI', 'CARD', 'CASH', 'NET_BANKING', 'WALLET']
        },
        description: { type: 'string' },
        transactionDate: { type: 'string', format: 'date-time' },
        location: {
          type: 'object',
          properties: {
            city: { type: 'string' },
            country: { type: 'string' }
          }
        },
        fraudStatus: {
          type: 'string',
          enum: ['PENDING', 'SAFE', 'FLAGGED', 'CONFIRMED_FRAUD']
        },
        fraudScore: { type: 'number' },
        mlModelVersion: { type: 'string' },
        isDeleted: { type: 'boolean' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    },
    CreateTransactionRequest: {
      type: 'object',
      required: ['amount', 'type', 'categoryId', 'transactionDate'],
      properties: {
        amount: { type: 'number', minimum: 0 },
        type: { type: 'string', enum: ['INCOME', 'EXPENSE'] },
        categoryId: { type: 'string', description: 'Must be linked to the user (UserCategory)' },
        paymentMethod: {
          type: 'string',
          enum: ['UPI', 'CARD', 'CASH', 'NET_BANKING', 'WALLET']
        },
        description: { type: 'string' },
        transactionDate: { type: 'string', format: 'date-time' },
        location: {
          type: 'object',
          properties: {
            city: { type: 'string' },
            country: { type: 'string' }
          }
        }
      }
    },
    PaginatedTransactions: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/Transaction' }
        },
        pagination: {
          type: 'object',
          properties: {
            total: { type: 'integer' },
            page: { type: 'integer' },
            limit: { type: 'integer' },
            totalPages: { type: 'integer' }
          }
        }
      }
    },
    UserCategoryRow: {
      type: 'object',
      properties: {
        userCategoryId: { type: 'string' },
        categoryId: { type: 'string' },
        name: { type: 'string' },
        type: { type: 'string', enum: ['INCOME', 'EXPENSE'] },
        icon: { type: 'string', nullable: true },
        isSystem: { type: 'boolean' }
      }
    },
    CategoriesListResponse: {
      type: 'object',
      properties: {
        categories: {
          type: 'array',
          items: { $ref: '#/components/schemas/UserCategoryRow' }
        }
      }
    },
    CreateCategoryRequest: {
      type: 'object',
      required: ['name', 'type'],
      properties: {
        name: { type: 'string' },
        type: { type: 'string', enum: ['INCOME', 'EXPENSE', 'Income', 'Expense'] },
        icon: { type: 'string' }
      }
    },
    Category: {
      type: 'object',
      properties: {
        _id: { type: 'string' },
        name: { type: 'string' },
        type: { type: 'string', enum: ['INCOME', 'EXPENSE'] },
        icon: { type: 'string' },
        isSystem: { type: 'boolean' },
        createdBy: { type: 'string', nullable: true },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    },
    UpdateCategoryRequest: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        type: { type: 'string', enum: ['INCOME', 'EXPENSE', 'Income', 'Expense'] },
        icon: { type: 'string' }
      }
    },
    Budget: {
      type: 'object',
      properties: {
        _id: { type: 'string' },
        userId: { type: 'string' },
        categoryId: { type: 'string', nullable: true },
        monthlyLimit: { type: 'number' },
        alertThreshold: { type: 'number', default: 80 },
        month: { type: 'integer' },
        year: { type: 'integer' },
        isDeleted: { type: 'boolean' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    },
    CreateBudgetRequest: {
      type: 'object',
      required: ['monthlyLimit'],
      properties: {
        categoryId: { type: 'string' },
        monthlyLimit: { type: 'number' },
        alertThreshold: { type: 'number', default: 80 },
        month: { type: 'integer' },
        year: { type: 'integer' }
      }
    },
    Notification: {
      type: 'object',
      properties: {
        _id: { type: 'string' },
        userId: { type: 'string' },
        title: { type: 'string' },
        message: { type: 'string' },
        type: { type: 'string', enum: ['FRAUD_ALERT', 'BUDGET_ALERT', 'SYSTEM'] },
        isRead: { type: 'boolean' },
        referenceId: { type: 'string' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    }
  }
};

const paths = {
  '/health': {
    get: {
      tags: ['Health'],
      summary: 'Health check',
      operationId: 'healthCheck',
      responses: {
        200: {
          description: 'API is running',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'string', example: 'OK' },
                  message: { type: 'string' },
                  timestamp: { type: 'string', format: 'date-time' }
                }
              }
            }
          }
        }
      }
    }
  },
  '/api/v1/auth/register': {
    post: {
      tags: ['Auth'],
      summary: 'Register a new user',
      operationId: 'register',
      requestBody: {
        required: true,
        content: {
          'application/json': { schema: { $ref: '#/components/schemas/RegisterRequest' } }
        }
      },
      responses: {
        201: {
          description: 'Created user document (includes password hash in some setups; clients should ignore)',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/User' }
            }
          }
        },
        500: {
          description: 'Server error',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/Error' } }
          }
        }
      }
    }
  },
  '/api/v1/auth/login': {
    post: {
      tags: ['Auth'],
      summary: 'Login',
      operationId: 'login',
      requestBody: {
        required: true,
        content: {
          'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } }
        }
      },
      responses: {
        200: {
          description: 'JWT and user profile',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/LoginResponse' } }
          }
        },
        500: {
          description: 'Invalid credentials or server error',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/Error' } }
          }
        }
      }
    }
  },
  '/api/v1/auth/logout': {
    post: {
      tags: ['Auth'],
      summary: 'Logout (clears refresh token server-side)',
      operationId: 'logout',
      requestBody: {
        required: true,
        content: {
          'application/json': { schema: { $ref: '#/components/schemas/LogoutRequest' } }
        }
      },
      responses: {
        200: {
          description: 'Success',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/MessageResponse' } }
          }
        },
        500: {
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/Error' } }
          }
        }
      }
    }
  },
  '/api/v1/auth/refresh': {
    post: {
      tags: ['Auth'],
      summary: 'Refresh access token',
      operationId: 'refreshToken',
      requestBody: {
        required: true,
        content: {
          'application/json': { schema: { $ref: '#/components/schemas/RefreshRequest' } }
        }
      },
      responses: {
        200: {
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/TokenResponse' } }
          }
        },
        500: {
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/Error' } }
          }
        }
      }
    }
  },
  '/api/v1/auth/forgot-password': {
    post: {
      tags: ['Auth'],
      summary: 'Request password reset token',
      operationId: 'forgotPassword',
      requestBody: {
        required: true,
        content: {
          'application/json': { schema: { $ref: '#/components/schemas/ForgotPasswordRequest' } }
        }
      },
      responses: {
        200: {
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/ForgotPasswordResponse' } }
          }
        },
        500: {
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/Error' } }
          }
        }
      }
    }
  },
  '/api/v1/auth/reset-password': {
    post: {
      tags: ['Auth'],
      summary: 'Reset password with token',
      operationId: 'resetPassword',
      requestBody: {
        required: true,
        content: {
          'application/json': { schema: { $ref: '#/components/schemas/ResetPasswordRequest' } }
        }
      },
      responses: {
        200: {
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/MessageResponse' } }
          }
        },
        500: {
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/Error' } }
          }
        }
      }
    }
  },
  '/api/v1/transactions': {
    post: {
      tags: ['Transactions'],
      summary: 'Create transaction',
      description:
        'Queues fraud scoring. `categoryId` must belong to the user (see GET /api/v1/categories).',
      operationId: 'createTransaction',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': { schema: { $ref: '#/components/schemas/CreateTransactionRequest' } }
        }
      },
      responses: {
        201: {
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/Transaction' } }
          }
        },
        400: {
          description: 'Invalid category or validation error',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/Error' } }
          }
        },
        401: {
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/Unauthorized' } }
          }
        },
        500: {
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/Error' } }
          }
        }
      }
    },
    get: {
      tags: ['Transactions'],
      summary: 'List transactions for current user',
      operationId: 'listTransactions',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
        { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
        { name: 'sortBy', in: 'query', schema: { type: 'string', default: 'transactionDate' } },
        {
          name: 'sortOrder',
          in: 'query',
          schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' }
        },
        { name: 'startDate', in: 'query', schema: { type: 'string' } },
        { name: 'endDate', in: 'query', schema: { type: 'string' } },
        { name: 'minAmount', in: 'query', schema: { type: 'number' } },
        { name: 'maxAmount', in: 'query', schema: { type: 'number' } },
        {
          name: 'type',
          in: 'query',
          schema: { type: 'string', enum: ['INCOME', 'EXPENSE'] }
        },
        { name: 'categoryId', in: 'query', schema: { type: 'string' } },
        {
          name: 'paymentMethod',
          in: 'query',
          schema: { type: 'string', enum: ['UPI', 'CARD', 'CASH', 'NET_BANKING', 'WALLET'] }
        },
        { name: 'city', in: 'query', schema: { type: 'string' } },
        { name: 'country', in: 'query', schema: { type: 'string' } }
      ],
      responses: {
        200: {
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/PaginatedTransactions' } }
          }
        },
        401: {
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/Unauthorized' } }
          }
        },
        500: {
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/Error' } }
          }
        }
      }
    }
  },
  '/api/v1/transactions/user': {
    get: {
      tags: ['Transactions'],
      summary: 'Get transactions for user (placeholder)',
      description: 'Currently returns 500 — not implemented in service layer.',
      operationId: 'getTransactionsByUser',
      security: [{ bearerAuth: [] }],
      responses: {
        401: {
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/Unauthorized' } }
          }
        },
        500: {
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/Error' } }
          }
        }
      }
    }
  },
  '/api/v1/transactions/{id}': {
    get: {
      tags: ['Transactions'],
      summary: 'Get transaction by ID',
      operationId: 'getTransactionById',
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
      ],
      responses: {
        200: {
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/Transaction' } }
          }
        },
        500: {
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/Error' } }
          }
        }
      }
    },
    put: {
      tags: ['Transactions'],
      summary: 'Update transaction',
      description: 'Currently not implemented in service layer.',
      operationId: 'updateTransaction',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
      ],
      requestBody: {
        content: {
          'application/json': {
            schema: { type: 'object', additionalProperties: true }
          }
        }
      },
      responses: {
        401: {
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/Unauthorized' } }
          }
        },
        500: {
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/Error' } }
          }
        }
      }
    }
  },
  '/api/v1/categories': {
    get: {
      tags: ['Categories'],
      summary: 'List categories for current user',
      operationId: 'getCategories',
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/CategoriesListResponse' } }
          }
        },
        401: {
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/Unauthorized' } }
          }
        },
        500: {
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/Error' } }
          }
        }
      }
    },
    post: {
      tags: ['Categories'],
      summary: 'Create custom category',
      operationId: 'createCategory',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': { schema: { $ref: '#/components/schemas/CreateCategoryRequest' } }
        }
      },
      responses: {
        201: {
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/Category' } }
          }
        },
        400: {
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/Error' } }
          }
        },
        401: {
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/Unauthorized' } }
          }
        },
        500: {
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/Error' } }
          }
        }
      }
    }
  },
  '/api/v1/categories/{id}': {
    put: {
      tags: ['Categories'],
      summary: 'Update custom category',
      description: 'System categories cannot be updated.',
      operationId: 'updateCategory',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
      ],
      requestBody: {
        content: {
          'application/json': { schema: { $ref: '#/components/schemas/UpdateCategoryRequest' } }
        }
      },
      responses: {
        200: {
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/Category' } }
          }
        },
        403: {
          description: 'System category',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/Error' } }
          }
        },
        404: {
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/Error' } }
          }
        },
        401: {
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/Unauthorized' } }
          }
        },
        500: {
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/Error' } }
          }
        }
      }
    }
  },
  '/api/v1/budgets': {
    post: {
      tags: ['Budgets'],
      summary: 'Create budget',
      description:
        'Route expects `req.user.id` from auth; add `isValidUser` middleware if missing in your deployment.',
      operationId: 'createBudget',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': { schema: { $ref: '#/components/schemas/CreateBudgetRequest' } }
        }
      },
      responses: {
        200: {
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/Budget' } }
          }
        },
        401: {
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/Unauthorized' } }
          }
        },
        500: {
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/Error' } }
          }
        }
      }
    }
  },
  '/api/v1/notifications': {
    get: {
      tags: ['Notifications'],
      summary: 'List notifications',
      description:
        'Uses authenticated user from JWT. Ensure `isValidUser` middleware is mounted on this route in production.',
      operationId: 'getUserNotifications',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'page',
          in: 'query',
          schema: { type: 'integer' },
          description: 'If supported by service implementation'
        },
        {
          name: 'limit',
          in: 'query',
          schema: { type: 'integer' }
        }
      ],
      responses: {
        200: {
          description: 'Shape depends on notification service implementation',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                additionalProperties: true
              }
            }
          }
        },
        401: {
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/Unauthorized' } }
          }
        },
        500: {
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/Error' } }
          }
        }
      }
    }
  },
  '/api/v1/notifications/unread-count': {
    get: {
      tags: ['Notifications'],
      summary: 'Unread notification count',
      operationId: 'getUnreadCount',
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          content: {
            'application/json': {
              schema: { type: 'object', additionalProperties: true }
            }
          }
        },
        401: {
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/Unauthorized' } }
          }
        },
        500: {
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/Error' } }
          }
        }
      }
    }
  },
  '/api/v1/notifications/{id}/read': {
    put: {
      tags: ['Notifications'],
      summary: 'Mark notification as read',
      operationId: 'markNotificationRead',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
      ],
      responses: {
        200: {
          content: {
            'application/json': {
              schema: { type: 'object', additionalProperties: true }
            }
          }
        },
        401: {
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/Unauthorized' } }
          }
        },
        500: {
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/Error' } }
          }
        }
      }
    }
  },
  '/api/v1/notifications/read-all': {
    put: {
      tags: ['Notifications'],
      summary: 'Mark all notifications as read',
      operationId: 'markAllNotificationsRead',
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          content: {
            'application/json': {
              schema: { type: 'object', additionalProperties: true }
            }
          }
        },
        401: {
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/Unauthorized' } }
          }
        },
        500: {
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/Error' } }
          }
        }
      }
    }
  },
  '/api/v1/notifications/{id}': {
    delete: {
      tags: ['Notifications'],
      summary: 'Delete notification',
      operationId: 'deleteNotification',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
      ],
      responses: {
        200: {
          content: {
            'application/json': {
              schema: { type: 'object', additionalProperties: true }
            }
          }
        },
        401: {
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/Unauthorized' } }
          }
        },
        500: {
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/Error' } }
          }
        }
      }
    }
  },
  '/api/v1/analytics/income-vs-expense': {
    get: {
      tags: ['Analytics'],
      summary: 'Income vs expense analytics',
      description:
        'Chart-ready series (labels + datasets) for line/bar charts. Query: optional startDate, endDate (ISO), granularity day|week|month.',
      operationId: 'getIncomeVsExpenseAnalytics',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'startDate', in: 'query', schema: { type: 'string' } },
        { name: 'endDate', in: 'query', schema: { type: 'string' } },
        {
          name: 'granularity',
          in: 'query',
          schema: { type: 'string', enum: ['day', 'week', 'month'] }
        }
      ],
      responses: {
        200: {
          content: {
            'application/json': {
              schema: { type: 'object', additionalProperties: true }
            }
          }
        },
        401: {
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/Unauthorized' } }
          }
        },
        500: {
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/Error' } }
          }
        }
      }
    }
  },
  '/api/v1/analytics/transactions': {
    get: {
      tags: ['Analytics'],
      summary: 'Transaction analytics',
      description:
        'Volume over time, payment method and category breakdowns. Chart-ready labels/datasets. Optional startDate, endDate, granularity.',
      operationId: 'getTransactionAnalytics',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'startDate', in: 'query', schema: { type: 'string' } },
        { name: 'endDate', in: 'query', schema: { type: 'string' } },
        {
          name: 'granularity',
          in: 'query',
          schema: { type: 'string', enum: ['day', 'week', 'month'] }
        }
      ],
      responses: {
        200: {
          content: {
            'application/json': {
              schema: { type: 'object', additionalProperties: true }
            }
          }
        },
        401: {
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/Unauthorized' } }
          }
        },
        500: {
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/Error' } }
          }
        }
      }
    }
  },
  '/api/v1/analytics/fraud': {
    get: {
      tags: ['Analytics'],
      summary: 'Fraud score analytics',
      description:
        'Fraud status distribution, score histogram, scores over time, fraud log counts. Optional startDate, endDate, granularity.',
      operationId: 'getFraudAnalytics',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'startDate', in: 'query', schema: { type: 'string' } },
        { name: 'endDate', in: 'query', schema: { type: 'string' } },
        {
          name: 'granularity',
          in: 'query',
          schema: { type: 'string', enum: ['day', 'week', 'month'] }
        }
      ],
      responses: {
        200: {
          content: {
            'application/json': {
              schema: { type: 'object', additionalProperties: true }
            }
          }
        },
        401: {
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/Unauthorized' } }
          }
        },
        500: {
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/Error' } }
          }
        }
      }
    }
  },
  '/api/v1/analytics/users': {
    get: {
      tags: ['Analytics'],
      summary: 'Platform analytics (admin only)',
      description: 'Aggregated metrics across all users. Requires role ADMIN.',
      operationId: 'getUserAnalytics',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'startDate', in: 'query', schema: { type: 'string' } },
        { name: 'endDate', in: 'query', schema: { type: 'string' } }
      ],
      responses: {
        200: {
          content: {
            'application/json': {
              schema: { type: 'object', additionalProperties: true }
            }
          }
        },
        401: {
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/Unauthorized' } }
          }
        },
        403: {
          description: 'Non-admin user',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/Error' } }
          }
        },
        500: {
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/Error' } }
          }
        }
      }
    }
  },
  '/api/v1/analytics/dashboard': {
    get: {
      tags: ['Analytics'],
      summary: 'Dashboard statistics',
      description: 'KPI cards and sparkline-friendly volume series. Optional startDate, endDate, granularity.',
      operationId: 'getDashboardStats',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'startDate', in: 'query', schema: { type: 'string' } },
        { name: 'endDate', in: 'query', schema: { type: 'string' } },
        {
          name: 'granularity',
          in: 'query',
          schema: { type: 'string', enum: ['day', 'week', 'month'] }
        }
      ],
      responses: {
        200: {
          content: {
            'application/json': {
              schema: { type: 'object', additionalProperties: true }
            }
          }
        },
        401: {
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/Unauthorized' } }
          }
        },
        500: {
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/Error' } }
          }
        }
      }
    }
  },
  '/api/v1/analytics/report': {
    post: {
      tags: ['Analytics'],
      summary: 'Bundled analytics report',
      description:
        'Optional body: startDate, endDate, granularity, sections (array: incomeVsExpense, transactions, fraud, dashboard, platform). Defaults to first four; platform only for ADMIN.',
      operationId: 'generateReport',
      security: [{ bearerAuth: [] }],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                startDate: { type: 'string' },
                endDate: { type: 'string' },
                granularity: { type: 'string', enum: ['day', 'week', 'month'] },
                sections: {
                  type: 'array',
                  items: {
                    type: 'string',
                    enum: [
                      'incomeVsExpense',
                      'transactions',
                      'fraud',
                      'dashboard',
                      'platform'
                    ]
                  }
                }
              }
            }
          }
        }
      },
      responses: {
        200: {
          content: {
            'application/json': {
              schema: { type: 'object', additionalProperties: true }
            }
          }
        },
        401: {
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/Unauthorized' } }
          }
        },
        500: {
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/Error' } }
          }
        }
      }
    }
  },
  '/api/v1/admin/dashboard': {
    get: {
      tags: ['Admin'],
      summary: 'Admin home dashboard',
      description:
        'First-screen KPIs (users, transactions, fraud cases, volume) and Chart.js-style series: transactions per day, volume per day, fraud trends, active users. Requires role ADMIN. Query: optional startDate, endDate (ISO); default last 30 UTC days.',
      operationId: 'getAdminDashboard',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'startDate', in: 'query', schema: { type: 'string' } },
        { name: 'endDate', in: 'query', schema: { type: 'string' } }
      ],
      responses: {
        200: {
          content: {
            'application/json': {
              schema: { type: 'object', additionalProperties: true }
            }
          }
        },
        401: {
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/Unauthorized' } }
          }
        },
        403: {
          description: 'User is not ADMIN',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/Error' } }
          }
        },
        500: {
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/Error' } }
          }
        }
      }
    }
  }
};

/**
 * @param {{ port?: number | string }} [options]
 */
function buildOpenApiSpec(options = {}) {
  const port = options.port || process.env.PORT || 3000;
  const baseUrl =
    process.env.SWAGGER_SERVER_URL || `http://localhost:${port}`;

  return {
    openapi: '3.0.3',
    info: {
      title: 'Fraud Detection API',
      version: '1.0.0',
      description:
        'REST API for fraud detection, transactions, budgets, categories, notifications, and analytics. Base path for versioned resources is `/api/v1`.'
    },
    servers: [{ url: baseUrl, description: 'API server (override with SWAGGER_SERVER_URL)' }],
    tags,
    paths,
    components
  };
}

module.exports = buildOpenApiSpec;
