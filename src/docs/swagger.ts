export const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "GearUp API Documentation",
    version: "1.0.0",
    description:
      "Comprehensive REST API documentation for GearUp - Rent Sports & Outdoor Gear Instantly backend application.",
    contact: {
      name: "GearUp Engineering Team",
    },
  },
  servers: [
    {
      url: "https://gearup-backend-q7w4.onrender.com",
      description: "Live Production Server",
    },
    {
      url: "http://localhost:5000",
      description: "Local Development Server",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Enter your JWT Bearer token to authorize requests.",
      },
    },
  },
  tags: [
    { name: "Auth", description: "Authentication and token management" },
    { name: "Users", description: "User profile management" },
    { name: "Categories", description: "Product category management" },
    { name: "Gear Items", description: "Sports & outdoor gear listings" },
    { name: "Rentals", description: "Rental orders and bookings" },
    { name: "Payments", description: "Stripe payment processing" },
    { name: "Reviews", description: "Customer ratings and reviews" },
    { name: "Admin", description: "Super Admin operations & metrics" },
  ],
  paths: {
    // ---------------- AUTH ----------------
    "/api/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register new customer or provider",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email", "password"],
                properties: {
                  name: { type: "string", example: "Sarah Jenkins" },
                  email: { type: "string", example: "sarah@example.com" },
                  password: { type: "string", example: "password123" },
                  role: {
                    type: "string",
                    enum: ["CUSTOMER", "PROVIDER"],
                    example: "CUSTOMER",
                  },
                  phone: { type: "string", example: "+1234567890" },
                  address: { type: "string", example: "123 Adventure Way" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "User registered successfully" },
          400: { description: "Validation error or email already in use" },
        },
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login and obtain JWT access & refresh tokens",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", example: "customer@gearup.com" },
                  password: { type: "string", example: "password123" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Login successful with token payload" },
          401: { description: "Invalid credentials" },
        },
      },
    },
    "/api/auth/refresh-token": {
      post: {
        tags: ["Auth"],
        summary: "Refresh access token using refreshToken cookie or payload",
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  refreshToken: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "New access token generated" },
          401: { description: "Invalid or expired refresh token" },
        },
      },
    },
    "/api/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Logout user and clear refresh token cookies",
        responses: {
          200: { description: "Logged out successfully" },
        },
      },
    },

    // ---------------- USERS ----------------
    "/api/users/profile": {
      get: {
        tags: ["Users"],
        summary: "Get current user profile",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Current user profile fetched successfully" },
          401: { description: "Unauthorized" },
        },
      },
      patch: {
        tags: ["Users"],
        summary: "Update current user profile",
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string", example: "Sarah Jenkins Updated" },
                  phone: { type: "string", example: "+1999888777" },
                  address: { type: "string", example: "456 Greenfield Ave" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Profile updated successfully" },
        },
      },
    },
    "/api/users/change-password": {
      patch: {
        tags: ["Users"],
        summary: "Change current user password",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["oldPassword", "newPassword"],
                properties: {
                  oldPassword: { type: "string", example: "password123" },
                  newPassword: { type: "string", example: "newPassword123!" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Password changed successfully" },
          400: { description: "Incorrect old password" },
        },
      },
    },

    // ---------------- CATEGORIES ----------------
    "/api/categories": {
      get: {
        tags: ["Categories"],
        summary: "Get all product categories",
        responses: {
          200: { description: "List of categories" },
        },
      },
      post: {
        tags: ["Categories"],
        summary: "Create category (Admin only)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name"],
                properties: {
                  name: { type: "string", example: "Winter Sports" },
                  description: { type: "string", example: "Skis, snowboards, warm jackets" },
                  image: { type: "string", example: "https://example.com/winter.jpg" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Category created successfully" },
          403: { description: "Admin access required" },
        },
      },
    },
    "/api/categories/{id}": {
      get: {
        tags: ["Categories"],
        summary: "Get category by ID",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          200: { description: "Category details" },
          404: { description: "Category not found" },
        },
      },
      patch: {
        tags: ["Categories"],
        summary: "Update category (Admin only)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  image: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Category updated" },
        },
      },
      delete: {
        tags: ["Categories"],
        summary: "Delete category (Admin only)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          200: { description: "Category deleted" },
        },
      },
    },

    // ---------------- GEAR ITEMS ----------------
    "/api/gear": {
      get: {
        tags: ["Gear Items"],
        summary: "Browse gear items with filters and pagination",
        parameters: [
          { name: "searchTerm", in: "query", schema: { type: "string" }, description: "Search by title, brand, description" },
          { name: "categoryId", in: "query", schema: { type: "string" } },
          { name: "minPrice", in: "query", schema: { type: "number" } },
          { name: "maxPrice", in: "query", schema: { type: "number" } },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 10 } },
        ],
        responses: {
          200: { description: "Paginated list of gear items" },
        },
      },
    },
    "/api/gear/{id}": {
      get: {
        tags: ["Gear Items"],
        summary: "Get gear item details by ID",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          200: { description: "Gear item details" },
          404: { description: "Gear not found" },
        },
      },
    },
    "/api/provider/gear": {
      get: {
        tags: ["Gear Items"],
        summary: "Get gear items posted by authenticated provider",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Provider's gear items list" },
        },
      },
      post: {
        tags: ["Gear Items"],
        summary: "Create new gear item (Provider only)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["title", "description", "brand", "categoryId", "dailyPrice"],
                properties: {
                  title: { type: "string", example: "Waterproof Dome Camping Tent" },
                  description: { type: "string", example: "High quality 4-person tent" },
                  brand: { type: "string", example: "Coleman" },
                  categoryId: { type: "string", example: "<CATEGORY_ID>" },
                  dailyPrice: { type: "number", example: 30.0 },
                  depositAmount: { type: "number", example: 50.0 },
                  totalStock: { type: "integer", example: 5 },
                  images: {
                    type: "array",
                    items: { type: "string" },
                    example: ["https://images.unsplash.com/photo-1504280390367-361c6d9f38f4"],
                  },
                  specifications: {
                    type: "object",
                    example: { capacity: "4 persons", season: "3 season" },
                  },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Gear created successfully" },
        },
      },
    },
    "/api/provider/gear/{id}": {
      patch: {
        tags: ["Gear Items"],
        summary: "Update gear item (Provider only)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  dailyPrice: { type: "number" },
                  totalStock: { type: "integer" },
                  isAvailable: { type: "boolean" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Gear updated" },
        },
      },
      delete: {
        tags: ["Gear Items"],
        summary: "Delete gear item (Provider only)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          200: { description: "Gear deleted" },
        },
      },
    },

    // ---------------- RENTALS ----------------
    "/api/rentals": {
      post: {
        tags: ["Rentals"],
        summary: "Create rental booking order (Customer only)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["gearId", "startDate", "endDate"],
                properties: {
                  gearId: { type: "string", example: "<GEAR_ID>" },
                  startDate: { type: "string", format: "date-time", example: "2026-11-01T10:00:00.000Z" },
                  endDate: { type: "string", format: "date-time", example: "2026-11-05T10:00:00.000Z" },
                  notes: { type: "string", example: "Pickup at 10 AM" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Rental order created with PLACED status" },
        },
      },
      get: {
        tags: ["Rentals"],
        summary: "Get rental order history for logged-in customer",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Customer rentals list" },
        },
      },
    },
    "/api/rentals/{id}": {
      get: {
        tags: ["Rentals"],
        summary: "Get rental order details by ID",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          200: { description: "Rental order details" },
        },
      },
    },
    "/api/rentals/{id}/cancel": {
      patch: {
        tags: ["Rentals"],
        summary: "Cancel rental order (Customer only, if status is PLACED)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          200: { description: "Rental order cancelled" },
        },
      },
    },
    "/api/provider/orders": {
      get: {
        tags: ["Rentals"],
        summary: "Get incoming orders on gears owned by provider",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Incoming provider orders" },
        },
      },
    },
    "/api/provider/orders/{id}": {
      patch: {
        tags: ["Rentals"],
        summary: "Update rental order status (Provider / Admin)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["status"],
                properties: {
                  status: {
                    type: "string",
                    enum: ["CONFIRMED", "PICKED_UP", "RETURNED", "CANCELLED"],
                    example: "CONFIRMED",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Order status updated" },
        },
      },
    },

    // ---------------- PAYMENTS ----------------
    "/api/payments/create": {
      post: {
        tags: ["Payments"],
        summary: "Create Stripe PaymentIntent for a rental order (Customer only)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["rentalOrderId"],
                properties: {
                  rentalOrderId: { type: "string", example: "<RENTAL_ORDER_ID>" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Payment intent and clientSecret generated" },
        },
      },
    },
    "/api/payments/confirm": {
      post: {
        tags: ["Payments"],
        summary: "Confirm payment and mark order as PAID (Customer only)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["rentalOrderId", "paymentIntentId"],
                properties: {
                  rentalOrderId: { type: "string", example: "<RENTAL_ORDER_ID>" },
                  paymentIntentId: { type: "string", example: "<STRIPE_PAYMENT_INTENT_ID>" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Payment verified and order status updated to PAID" },
        },
      },
    },
    "/api/payments": {
      get: {
        tags: ["Payments"],
        summary: "Get payment transaction history for customer",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Payments list" },
        },
      },
    },
    "/api/payments/{id}": {
      get: {
        tags: ["Payments"],
        summary: "Get payment transaction details by ID",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          200: { description: "Payment details" },
        },
      },
    },
    "/api/payments/webhook": {
      post: {
        tags: ["Payments"],
        summary: "Stripe Webhook handler endpoint",
        description: "Listens to Stripe asynchronous events (e.g. payment_intent.succeeded)",
        responses: {
          200: { description: "Webhook event processed" },
        },
      },
    },

    // ---------------- REVIEWS ----------------
    "/api/reviews": {
      post: {
        tags: ["Reviews"],
        summary: "Create review for a returned rental item (Customer only)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["rentalOrderId", "rating", "comment"],
                properties: {
                  rentalOrderId: { type: "string", example: "<RENTAL_ORDER_ID>" },
                  rating: { type: "integer", minimum: 1, maximum: 5, example: 5 },
                  comment: { type: "string", example: "Great tent! Kept us dry and clean." },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Review created" },
        },
      },
    },
    "/api/reviews/gear/{gearId}": {
      get: {
        tags: ["Reviews"],
        summary: "Get all customer reviews for a specific gear item",
        parameters: [
          { name: "gearId", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          200: { description: "Reviews list" },
        },
      },
    },
    "/api/reviews/{id}": {
      delete: {
        tags: ["Reviews"],
        summary: "Delete review (Customer or Admin)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          200: { description: "Review deleted" },
        },
      },
    },

    // ---------------- ADMIN ----------------
    "/api/admin/users": {
      get: {
        tags: ["Admin"],
        summary: "Get all registered users (Admin only)",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Users list" },
        },
      },
    },
    "/api/admin/users/{id}/status": {
      patch: {
        tags: ["Admin"],
        summary: "Update user account status (ACTIVE / SUSPENDED)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["status"],
                properties: {
                  status: { type: "string", enum: ["ACTIVE", "SUSPENDED"], example: "SUSPENDED" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "User status updated" },
        },
      },
    },
    "/api/admin/stats": {
      get: {
        tags: ["Admin"],
        summary: "Get platform dashboard statistics & overview",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Platform statistics summary" },
        },
      },
    },
  },
};
