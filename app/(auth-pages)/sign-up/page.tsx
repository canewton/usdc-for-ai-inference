'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { signUpAction } from '@/app/actions';
import type { Message } from '@/components/common/form-message';
import { FormMessage } from '@/components/common/form-message';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function SignUp() {
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
      console.log('signing up');
      await signUpAction(formData);
      console.log('sign up action completed');
      router.push('/');
    } catch (error) {
      console.log('Sign up submission error:', error);
      setFormMessage({
        type: 'error',
        message: 'An error occurred when signing up.',
      });
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <form className="flex flex-col w-64 mx-auto" onSubmit={handleSubmit}>
        <h1 className="text-2xl font-semibold">Sign up</h1>
        <p className="text-sm text text-foreground">
          Already have an account?{' '}
          <Link className="text-primary font-medium underline" href="/sign-in">
            Sign in
          </Link>
        </p>
        <div className="flex flex-col gap-2 [&>input]:mb-3 mt-8">
          <Label htmlFor="email">Email</Label>
          <Input name="email" placeholder="you@example.com" required />
          <Label htmlFor="password">Password</Label>
          <Input
            type="password"
            name="password"
            placeholder="Your password"
            minLength={6}
            required
          />
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Signing Up...' : 'Sign up'}
          </Button>
          <FormMessage message={formMessage} />{' '}
        </div>
      </form>
    </>
  );
}
