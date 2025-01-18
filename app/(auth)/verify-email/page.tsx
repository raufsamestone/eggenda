'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function VerifyEmail() {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Check your email</h1>
        <p className="text-muted-foreground">
          We've sent you a verification link. Please check your email to verify your account.
        </p>
      </div>

      <div className="text-center">
        <Link href="/sign-in">
          <Button variant="link">
            Back to sign in
          </Button>
        </Link>
      </div>
    </div>
  );
} 