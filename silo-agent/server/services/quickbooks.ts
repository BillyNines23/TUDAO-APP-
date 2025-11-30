import { storage } from "../storage";

interface QuickBooksConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  environment: 'sandbox' | 'production';
}

interface QuickBooksTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  x_refresh_token_expires_in: number;
}

interface QuickBooksInvoice {
  Id: string;
  DocNumber: string;
  TxnDate: string;
  CustomerRef: { value: string; name: string };
  Line: Array<{
    Description?: string;
    Amount: number;
    DetailType: string;
    SalesItemLineDetail?: {
      ItemRef: { value: string; name: string };
      Qty?: number;
    };
  }>;
  TotalAmt: number;
  Balance: number;
  CustomField?: Array<{
    Name: string;
    StringValue?: string;
  }>;
}

export class QuickBooksService {
  private config: QuickBooksConfig;
  private authBaseUrl: string;
  private apiBaseUrl: string;

  constructor() {
    this.config = {
      clientId: process.env.QB_CLIENT_ID || '',
      clientSecret: process.env.QB_CLIENT_SECRET || '',
      redirectUri: process.env.QB_REDIRECT_URI || '',
      environment: (process.env.QB_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',
    };

    this.authBaseUrl = this.config.environment === 'production'
      ? 'https://appcenter.intuit.com'
      : 'https://appcenter.intuit.com'; // Same for both

    this.apiBaseUrl = this.config.environment === 'production'
      ? 'https://quickbooks.api.intuit.com'
      : 'https://sandbox-quickbooks.api.intuit.com';
  }

  isConfigured(): boolean {
    return !!(this.config.clientId && this.config.clientSecret && this.config.redirectUri);
  }

  generateAuthUrl(state: string): string {
    const scopes = [
      'com.intuit.quickbooks.accounting',
    ].join(' ');

    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: scopes,
      state,
    });

    return `${this.authBaseUrl}/connect/oauth2?${params.toString()}`;
  }

  async exchangeCodeForTokens(code: string): Promise<QuickBooksTokens> {
    const auth = Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64');

    const response = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${auth}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.config.redirectUri,
      }).toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to exchange code for tokens: ${error}`);
    }

    return response.json();
  }

  async refreshAccessToken(refreshToken: string): Promise<QuickBooksTokens> {
    const auth = Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64');

    const response = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${auth}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }).toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to refresh token: ${error}`);
    }

    return response.json();
  }

  async getValidAccessToken(userId: string): Promise<string> {
    const connection = await storage.getQuickbooksConnectionByUserId(userId);
    
    if (!connection) {
      throw new Error('No QuickBooks connection found');
    }

    // Check if token is expired (with 5 minute buffer)
    const now = new Date();
    const expiresAt = new Date(connection.expiresAt);
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

    if (expiresAt > fiveMinutesFromNow) {
      return connection.accessToken;
    }

    // Token expired or expiring soon, refresh it
    console.log(`Refreshing QuickBooks token for user ${userId}`);
    const tokens = await this.refreshAccessToken(connection.refreshToken);

    // Update connection with new tokens
    await storage.updateQuickbooksConnection(connection.id, {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
    });

    return tokens.access_token;
  }

  async fetchInvoices(userId: string, startDate?: string): Promise<QuickBooksInvoice[]> {
    const connection = await storage.getQuickbooksConnectionByUserId(userId);
    
    if (!connection) {
      throw new Error('No QuickBooks connection found');
    }

    const accessToken = await this.getValidAccessToken(userId);

    // Build query - fetch paid/closed invoices only
    let query = "SELECT * FROM Invoice WHERE Balance = 0";
    if (startDate) {
      query += ` AND TxnDate >= '${startDate}'`;
    }
    query += " MAXRESULTS 100";

    const response = await fetch(
      `${this.apiBaseUrl}/v3/company/${connection.realmId}/query?query=${encodeURIComponent(query)}`,
      {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to fetch invoices: ${error}`);
    }

    const data = await response.json();
    return data.QueryResponse?.Invoice || [];
  }

  async revokeConnection(userId: string): Promise<void> {
    const connection = await storage.getQuickbooksConnectionByUserId(userId);
    
    if (!connection) {
      return;
    }

    try {
      const auth = Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64');

      await fetch('https://developer.api.intuit.com/v2/oauth2/tokens/revoke', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Basic ${auth}`,
        },
        body: JSON.stringify({
          token: connection.refreshToken,
        }),
      });
    } catch (error) {
      console.error('Error revoking QuickBooks token:', error);
      // Continue to delete connection even if revoke fails
    }

    await storage.deleteQuickbooksConnection(connection.id);
  }
}

export const quickbooksService = new QuickBooksService();
