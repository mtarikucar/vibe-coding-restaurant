import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { OAuthProvider } from "../entities/user.entity";

export class OAuthLoginDto {
  @IsEnum(OAuthProvider)
  provider: OAuthProvider;

  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsOptional()
  redirectUri?: string;
}

export class OAuthCallbackDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsOptional()
  state?: string;
}

export class OAuthUserInfoDto {
  id: string;
  email: string;
  name: string;
  picture?: string;
  provider: OAuthProvider;
  raw?: any;
}
