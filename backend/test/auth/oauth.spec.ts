import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { AuthService } from '../../src/auth/auth.service';
import { Repository } from 'typeorm';
import { User, OAuthProvider } from '../../src/auth/entities/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';

// Mock the HttpService
class MockHttpService {
  post = jest.fn();
  get = jest.fn();
}

describe('OAuth Authentication (e2e)', () => {
  let app: INestApplication;
  let authService: AuthService;
  let userRepository: Repository<User>;
  let httpService: MockHttpService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
    .overrideProvider(HttpService)
    .useClass(MockHttpService)
    .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    authService = moduleFixture.get<AuthService>(AuthService);
    userRepository = moduleFixture.get<Repository<User>>(getRepositoryToken(User));
    httpService = moduleFixture.get<MockHttpService>(HttpService);
  });

  afterAll(async () => {
    // Clean up
    await userRepository.delete({ provider: OAuthProvider.GOOGLE });
    await app.close();
  });

  it('should redirect to Google OAuth page', async () => {
    // Mock the config service to return a client ID
    jest.spyOn(authService, 'getConfig').mockImplementation((key) => {
      if (key === 'GOOGLE_CLIENT_ID') return 'test-client-id';
      return null;
    });

    const response = await request(app.getHttpServer())
      .get('/auth/oauth/google')
      .expect(302); // Redirect status code

    expect(response.header.location).toContain('accounts.google.com/o/oauth2/v2/auth');
    expect(response.header.location).toContain('client_id=test-client-id');
  });

  it('should authenticate with Google OAuth', async () => {
    // Mock the token exchange response
    httpService.post.mockReturnValue(
      of({
        data: {
          access_token: 'mock-access-token',
          token_type: 'Bearer',
          expires_in: 3600,
        },
      })
    );

    // Mock the user info response
    httpService.get.mockReturnValue(
      of({
        data: {
          sub: 'google-user-id',
          email: 'google-user@example.com',
          name: 'Google User',
          picture: 'https://example.com/profile.jpg',
        },
      })
    );

    const response = await request(app.getHttpServer())
      .post('/auth/oauth/login')
      .send({
        provider: OAuthProvider.GOOGLE,
        code: 'mock-auth-code',
        redirectUri: 'http://localhost:5173/oauth/callback',
      })
      .expect(201);

    expect(response.body).toHaveProperty('accessToken');
    expect(response.body).toHaveProperty('refreshToken');
    expect(response.body).toHaveProperty('expiresIn');
    expect(response.body).toHaveProperty('tokenType', 'Bearer');

    // Verify the user was created
    const user = await userRepository.findOne({
      where: {
        email: 'google-user@example.com',
        provider: OAuthProvider.GOOGLE,
      },
    });

    expect(user).toBeDefined();
    expect(user.providerId).toBe('google-user-id');
    expect(user.fullName).toBe('Google User');
  });

  it('should handle OAuth errors', async () => {
    // Mock an error response
    httpService.post.mockImplementation(() => {
      throw new Error('OAuth server error');
    });

    await request(app.getHttpServer())
      .post('/auth/oauth/login')
      .send({
        provider: OAuthProvider.GOOGLE,
        code: 'invalid-code',
        redirectUri: 'http://localhost:5173/oauth/callback',
      })
      .expect(401);
  });
});
