import request from "supertest";
import app from "../src/utils/app.js";
import { prisma } from "../src/utils/prismaClient.js";

function randomEmail() {
  return `testuser_${Math.floor(Math.random() * 999999)}@email.com`;
}

function randomUsername() {
  return `user_${Math.floor(Math.random() * 999999)}`;
}

describe("Orders Tests", () => {
  let token;
  let userEmail;

  beforeEach(async () => {
    // Create a new user and login to get a fresh token before each test.
    userEmail = randomEmail();
    const username = randomUsername();
    const registerRes = await request(app).post("/auth/register").send({
      username,
      email: userEmail,
      password: "test123",
    });
    expect(registerRes.statusCode).toBe(201);

    const loginRes = await request(app).post("/auth/login").send({
      email: userEmail,
      password: "test123",
    });
    expect(loginRes.statusCode).toBe(200);
    expect(loginRes.body).toHaveProperty("token");

    token = loginRes.body.token;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("should create an order with valid items", async () => {
    const product = await prisma.product.findFirst();
    expect(product).toBeTruthy();

    const res = await request(app)
      .post("/orders")
      .set("Authorization", `Bearer ${token}`)
      .send({
        items: [
          {
            productId: product.id,
            quantity: 2,
          },
        ],
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.OrderItem.length).toBeGreaterThan(0);
  });

  it("should fail to create an order without items", async () => {
    const res = await request(app)
      .post("/orders")
      .set("Authorization", `Bearer ${token}`)
      .send({ items: [] });
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("error", "No items provided");
  });
});
