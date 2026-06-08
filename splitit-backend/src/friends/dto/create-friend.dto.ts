import { IsIn, IsNotEmpty, IsString } from 'class-validator';


export class AddFriendDto {
  @IsString()
  @IsNotEmpty({ message: 'Requester ID cannot be empty' })
  requesterId: string; 

  @IsString()
  @IsNotEmpty({ message: 'Friend name or email cannot be empty' })
  friendEmailOrName: string; 
}


export class RespondFriendDto {
  @IsString()
  @IsNotEmpty({ message: 'User ID cannot be empty' })
  userId: string; 

  @IsString()
  @IsNotEmpty({ message: 'Friendship ID cannot be empty' })
  friendshipId: string; 

  @IsString()
  @IsIn(['ACCEPTED', 'DECLINED'], { message: 'Status must be ACCEPTED or DECLINED' })
  status: 'ACCEPTED' | 'DECLINED'; 
}