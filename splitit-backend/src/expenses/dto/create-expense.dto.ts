export class CreateExpenseDto {
  title: string;   
  amount: number;  
  groupId: string; 
  payerId: string; 
  splits?: {       
    userId: string;
    amount: number;
    description?: string; 
  }[];
}