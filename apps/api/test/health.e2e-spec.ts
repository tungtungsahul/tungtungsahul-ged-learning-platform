import { Test } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "../src/app.module";

describe("health", () => {
  let app: INestApplication;
  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = module.createNestApplication();
    await app.init();
  });
  afterAll(async () => { await app.close(); });
  it("/api/health", async () => {
    const res = await request(app.getHttpServer()).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});
