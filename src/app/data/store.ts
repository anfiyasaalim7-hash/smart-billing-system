// Store data management

export interface Agent {
  id: string;
  password: string;
  name: string;
}

export interface Customer {
  name: string;
  phone: string;
  loyaltyPoints: number;
}

export interface TransactionItem {
  barcode: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Transaction {
  id: string;
  customerName: string;
  customerPhone: string;
  items: TransactionItem[];
  subtotal: number;
  discount: number;
  pointsRedeemed: number;
  total: number;
  paymentMethod: 'cash' | 'upi';
  timestamp: number;
  agentId: string;
  pointsEarned: number;
}

// Default agent
const defaultAgent: Agent = {
  id: '7777',
  password: '12345678',
  name: 'Team coders'
};

// Store management
class Store {
  private agents: Agent[] = [defaultAgent];
  private customers: Map<string, Customer> = new Map();
  private transactions: Transaction[] = [];
  private upiId: string = 'merchant@upi';

  // Agent Management
  getAgent(id: string, password: string): Agent | undefined {
    return this.agents.find(a => a.id === id && a.password === password);
  }

  addAgent(agent: Agent): void {
    this.agents.push(agent);
  }

  getAllAgents(): Agent[] {
    return this.agents;
  }

  // Customer Management
  getCustomer(phone: string): Customer | undefined {
    return this.customers.get(phone);
  }

  upsertCustomer(name: string, phone: string): Customer {
    const existing = this.customers.get(phone);
    if (existing) {
      existing.name = name;
      return existing;
    }
    const newCustomer: Customer = { name, phone, loyaltyPoints: 0 };
    this.customers.set(phone, newCustomer);
    return newCustomer;
  }

  addLoyaltyPoints(phone: string, points: number): void {
    const customer = this.customers.get(phone);
    if (customer) {
      customer.loyaltyPoints += points;
    }
  }

  redeemLoyaltyPoints(phone: string, points: number): boolean {
    const customer = this.customers.get(phone);
    if (customer && customer.loyaltyPoints >= points) {
      customer.loyaltyPoints -= points;
      return true;
    }
    return false;
  }

  // Transaction Management
  addTransaction(transaction: Transaction): void {
    this.transactions.push(transaction);
    
    // Update customer loyalty points
    const pointsEarned = Math.floor(transaction.total / 100);
    this.addLoyaltyPoints(transaction.customerPhone, pointsEarned);
  }

  getAllTransactions(): Transaction[] {
    return this.transactions;
  }

  getTransactionsByPhone(phone: string): Transaction[] {
    return this.transactions.filter(t => t.customerPhone === phone);
  }

  // UPI Management
  getUpiId(): string {
    return this.upiId;
  }

  setUpiId(upiId: string): void {
    this.upiId = upiId;
  }
}

export const store = new Store();
