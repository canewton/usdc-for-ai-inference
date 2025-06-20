'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { signInAction } from '@/app/actions';
import type { Message } from '@/components/common/form-message';
import { FormMessage } from '@/components/common/form-message';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function Login() {
  const router = useRouter();
  const [formMessage, setFormMessage] = useState<Message | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setFormMessage(null);

    const formData = new FormData(event.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password) {
      setFormMessage({
        type: 'error',
        message: 'Email and password are required.',
      });
      setIsSubmitting(false);
      return;
    }

    try {
      console.log('signing in');
      await signInAction(formData);
      console.log('sign in action completed');
      router.push('/');
    } catch (error) {
      console.log('Login submission error:', error);
      setFormMessage({
        type: 'error',
        message: 'Unable to sign in. Please check your credentials.',
      });
      setIsSubmitting(false);
    }
  };

  return (
    <form className="flex-1 flex flex-col w-64" onSubmit={handleSubmit}>
      <h1 className="text-2xl font-semibold">Sign in</h1>
      <p className="text-sm text-foreground">
        Don't have an account?{' '}
        <Link className="text-foreground font-medium underline" href="/sign-up">
          Sign up
        </Link>
      </p>
      <div className="flex flex-col gap-2 [&>input]:mb-3 mt-8">
        <Label htmlFor="email">Email</Label>
        <Input name="email" placeholder="you@example.com" required />
        <div className="flex justify-between items-center">
          <Label htmlFor="password">Password</Label>
          <Link
            className="text-xs text-foreground underline"
            href="/forgot-password"
          >
            Forgot Password?
          </Link>
        </div>
        <Input
          type="password"
          name="password"
          placeholder="Your password"
          required
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Signing In...' : 'Sign in'}
        </Button>
        <FormMessage message={formMessage} />{' '}
      </div>
    </form>
  );
}
