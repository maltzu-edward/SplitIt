import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateGroupDto {
  @IsString()
  @IsNotEmpty({ message: 'Group name must not be empty' })
  name: string; 

  @IsString()
  @IsNotEmpty({ message: 'Creator ID must not be empty' })
  creatorId: string; 

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  memberIds?: string[]; 

  @IsOptional()
  @IsString()
  groupImage?: string; 
}