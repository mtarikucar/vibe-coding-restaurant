import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { AuthService } from '../../src/auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { User } from '../../src/auth/entities/user.entity';
import { RefreshToken } from '../../src/auth/entities/refresh-token.entity';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('RefreshToken (e2e)', () => {
  let app: INestApplication;
  let authService: AuthService;
  let jwtService: JwtService;
  let userRepository: Repository<User>;
  let refreshTokenRepository: Repository<RefreshToken>;
  let testUser: User;
  let refreshToken: string;
  let accessToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    authService = moduleFixture.get<AuthService>(AuthService);
    jwtService = moduleFixture.get<JwtService>(JwtService);
    userRepository = moduleFixture.get<Repository<User>>(getRepositoryToken(User));
    refreshTokenRepository = moduleFixture.get<Repository<RefreshToken>>(getRepositoryToken(RefreshToken));

    // Create a test user
    testUser = await userRepository.save({
      username: 'refreshtestuser',
      password: await authService.hashPassword('password123'),
      fullName: 'Refresh Test User',
      email: 'refresh@test.com',
      role: 'waiter',
    });

    // Generate tokens for the test user
    const loginResponse = await authService.login(testUser, 'test-agent', '127.0.0.1');
    accessToken = loginResponse.accessToken;
    refreshToken = loginResponse.refreshToken;
  });

  afterAll(async () => {
    // Clean up
    await refreshTokenRepository.delete({ userId: testUser.id });
    await userRepository.delete({ id: testUser.id });
    await app.close();
  });

  it('should refresh tokens with a valid refresh token', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken })
      .expect(201);

    expect(response.body).toHaveProperty('accessToken');
    expect(response.body).toHaveProperty('refreshToken');
    expect(response.body).toHaveProperty('expiresIn');
    expect(response.body).toHaveProperty('tokenType', 'Bearer');

    // Verify the old refresh token is revoked
    const oldToken = await refreshTokenRepository.findOne({
      where: { token: refreshToken },
    });
    expect(oldToken.isRevoked).toBe(true);

    // Update the refresh token for subsequent tests
    refreshToken = response.body.refreshToken;
  });

  it('should reject an invalid refresh token', async () => {
    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: 'invalid-token' })
      .expect(401);
  });

  it('should reject a revoked refresh token', async () => {
    // Revoke the token
    const token = await refreshTokenRepository.findOne({
      where: { token: refreshToken },
    });
    token.isRevoked = true;
    await refreshTokenRepository.save(token);

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken })
      .expect(403);
  });

  it('should logout and revoke all refresh tokens', async () => {
    // Generate a new token first
    const loginResponse = await authService.login(testUser, 'test-agent', '127.0.0.1');
    const newAccessToken = loginResponse.accessToken;
    const newRefreshToken = loginResponse.refreshToken;

    await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Authorization', `Bearer ${newAccessToken}`)
      .expect(201);

    // Verify all tokens for the user are revoked
    const tokens = await refreshTokenRepository.find({
      where: { userId: testUser.id },
    });
    
    expect(tokens.length).toBeGreaterThan(0);
    expect(tokens.every(token => token.isRevoked)).toBe(true);
  });
});
