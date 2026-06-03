export default interface UserType {
  id: string;
  email: string;
  name: string;
  profileImage?: string;
  createdAt: Date;
  updatedAt: Date;
}