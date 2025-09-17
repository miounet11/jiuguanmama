interface VerificationCode {
    code: string;
    email: string;
    purpose: 'email_verification' | 'password_reset' | 'two_factor';
    expiresAt: Date;
    attempts: number;
}
declare class EmailService {
    private transporter;
    private verificationCodes;
    private readonly MAX_ATTEMPTS;
    private readonly CODE_LENGTH;
    private readonly EXPIRY_MINUTES;
    constructor();
    private initializeTransporter;
    private getEmailConfig;
    generateVerificationCode(length?: number): string;
    private generateKey;
    storeVerificationCode(email: string, code: string, purpose?: VerificationCode['purpose']): void;
    verifyCode(email: string, code: string, purpose?: VerificationCode['purpose']): boolean;
    private cleanupExpiredCodes;
    sendVerificationEmail(email: string, username: string): Promise<boolean>;
    sendPasswordResetEmail(email: string, username: string): Promise<boolean>;
    sendWelcomeEmail(email: string, username: string): Promise<boolean>;
    sendInvoiceEmail(email: string, username: string, amount: number, description: string, transactionId: string): Promise<boolean>;
}
export declare const emailService: EmailService;
export {};
//# sourceMappingURL=email.d.ts.map